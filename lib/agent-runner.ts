/**
 * Agent AXIA — Gemini en priorité absolue
 *
 * Phase 1 — Tool execution : Gemini → Groq → NVIDIA → …
 * Phase 2 — Streaming réponse : Gemini streaming → Groq → Claude (dernier recours)
 */
import Anthropic from "@anthropic-ai/sdk";
import {
  hasOpenAI,
  completionWithToolsOpenAI,
  hasAnthropic,
  hasGemini,
  hasGroq,
  completionWithToolsAuto,
  type ToolDefinition,
  type ToolCall,
} from "./llm-client";

export type AgentTool = ToolDefinition;
export interface AgentResult { reponse: string; actions: string[]; }
export type ToolExecutor = (
  name: string,
  args: Record<string, any>,
  tenantId: string
) => Promise<{ succes: boolean; resultat: string }>;

function toAnthropicTools(tools: AgentTool[]): Anthropic.Tool[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters as Anthropic.Tool["input_schema"],
  }));
}

const CLAUDE_MODELS = [
  "claude-sonnet-4-6",
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022",
];

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function buildSynthesisUserMessage(originalQuestion: string, toolResults: string[]): string {
  if (toolResults.length === 0) return originalQuestion;
  const ctx = toolResults.join("\n\n");
  return `${originalQuestion}\n\n---\nContexte (utilise-le pour répondre, ne le répète pas) :\n${ctx}`;
}

// ─── Gemini streaming natif (Phase 2 — priorité) ─────────────────────────────

async function geminiSynthesisStream(
  send: (data: object) => void,
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY manquante");

  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gemini-2.0-flash",
      max_tokens: 4000,
      stream: true,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Gemini synthesis HTTP ${res.status}: ${txt.slice(0, 120)}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return;
      try {
        const chunk = JSON.parse(payload);
        const text = chunk.choices?.[0]?.delta?.content;
        if (text) send({ type: "token", text });
      } catch {}
    }
  }
}

// ─── Groq streaming (Phase 2 — fallback 1) ───────────────────────────────────

async function groqSynthesisStream(
  send: (data: object) => void,
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<void> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY manquante");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 4000,
      stream: true,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Groq synthesis HTTP ${res.status}: ${txt.slice(0, 120)}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return;
      try {
        const chunk = JSON.parse(payload);
        const text = chunk.choices?.[0]?.delta?.content;
        if (text) send({ type: "token", text });
      } catch {}
    }
  }
}

// ─── Claude streaming natif (Phase 2 — dernier recours) ──────────────────────

async function claudeSynthesisStream(
  send: (data: object) => void,
  systemPrompt: string,
  claudeMessages: Anthropic.MessageParam[],
): Promise<void> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  for (const model of CLAUDE_MODELS) {
    try {
      const runner = client.messages.stream({
        model,
        max_tokens: 4000,
        system: systemPrompt,
        messages: claudeMessages,
      });
      runner.on("text", (text: string) => send({ type: "token", text }));
      await runner.finalMessage();
      return;
    } catch (e: any) {
      const msg = (e?.message ?? "").toLowerCase();
      if (msg.includes("model") || msg.includes("not_found") || msg.includes("404") || e?.status === 404) {
        console.warn(`[claude-stream] ${model} indisponible`);
        continue;
      }
      throw e;
    }
  }
  throw new Error("Aucun modèle Claude disponible");
}

// ─── runAgent (non-streaming) ─────────────────────────────────────────────────

export async function runAgent(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  tools: AgentTool[],
  tenantId: string,
  executeOutil: ToolExecutor,
  maxIterations = 8,
  _fast = false
): Promise<AgentResult> {
  const actionsEffectuees: string[] = [];
  const toolResults: string[] = [];

  try {
    const conversation: any[] = [{ role: "system", content: systemPrompt }, ...messages];
    let toolsUsed = false;

    for (let i = 0; i < maxIterations; i++) {
      const result = await completionWithToolsAuto(conversation, tools, 4000, false);
      if (result.stopReason === "end_turn") {
        if (!toolsUsed) return { reponse: result.text ?? "", actions: actionsEffectuees };
        break;
      }
      if (result.stopReason === "tool_use" && result.toolCalls?.length) {
        toolsUsed = true;
        conversation.push({ role: "assistant", content: null, tool_calls: result.toolCalls.map(tc => ({ id: tc.id, type: "function", function: { name: tc.name, arguments: JSON.stringify(tc.arguments) } })) });
        for (const tc of result.toolCalls) {
          const { resultat } = await executeOutil(tc.name, tc.arguments, tenantId);
          actionsEffectuees.push(resultat);
          toolResults.push(resultat);
          conversation.push({ role: "tool", tool_call_id: tc.id, content: resultat });
        }
        continue;
      }
      break;
    }
  } catch (err: any) {
    console.warn("[agent] phase1:", err?.message?.slice(0, 80));
  }

  const originalQ = messages[messages.length - 1]?.content ?? "";
  const synthMsg = buildSynthesisUserMessage(originalQ, toolResults);
  const prevMessages = messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
  const synthMessages = [...prevMessages, { role: "user" as const, content: synthMsg }];

  // Gemini (priorité)
  if (hasGemini()) {
    try {
      const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GEMINI_API_KEY}` },
        body: JSON.stringify({ model: "gemini-2.0-flash", max_tokens: 4000, messages: [{ role: "system", content: systemPrompt }, ...synthMessages] }),
      });
      if (res.ok) {
        const data = await res.json();
        return { reponse: data.choices?.[0]?.message?.content ?? "", actions: actionsEffectuees };
      }
    } catch (err: any) {
      console.warn("[agent] gemini synthesis:", err?.message?.slice(0, 80));
    }
  }

  // Claude (dernier recours)
  if (hasAnthropic()) {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    for (const model of CLAUDE_MODELS) {
      try {
        const response = await (client.messages.create as any)({
          model, max_tokens: 4000, system: systemPrompt,
          messages: synthMessages,
        });
        const t = response.content?.find((b: any) => b.type === "text");
        return { reponse: t?.text ?? "", actions: actionsEffectuees };
      } catch (err: any) {
        const msg = (err?.message ?? "").toLowerCase();
        if (msg.includes("model") || msg.includes("not_found") || err?.status === 404) continue;
        break;
      }
    }
  }

  return { reponse: "", actions: actionsEffectuees };
}

// ─── runAgentStream (SSE streaming) ──────────────────────────────────────────

export function runAgentStream(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string | any[] }>,
  tools: AgentTool[],
  tenantId: string,
  executeOutil: ToolExecutor,
  maxIterations = 8
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (data: object) => {
        if (closed) return;
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch {}
      };
      const finish = (actions: string[]) => {
        if (closed) return;
        closed = true;
        try { send({ type: "done", actions }); } catch {}
        try { controller.close(); } catch {}
      };

      const actionsEffectuees: string[] = [];
      const toolResults: string[] = [];
      let phase1Text = "";

      // ── Phase 1 : Tool execution (Gemini → Groq → …) ────────────────────────
      try {
        const conversation: any[] = [
          { role: "system", content: systemPrompt },
          ...messages.map(m => ({
            role: m.role,
            content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
          })),
        ];

        for (let iter = 0; iter < maxIterations; iter++) {
          const result = await completionWithToolsAuto(conversation, tools, 4000);

          if (result.stopReason === "end_turn") {
            phase1Text = result.text ?? "";
            break;
          }

          if (result.stopReason === "tool_use" && result.toolCalls?.length) {
            conversation.push({
              role: "assistant", content: null,
              tool_calls: result.toolCalls.map(tc => ({ id: tc.id, type: "function", function: { name: tc.name, arguments: JSON.stringify(tc.arguments) } })),
            });
            for (const tc of result.toolCalls) {
              const { succes, resultat } = await executeOutil(tc.name, tc.arguments, tenantId);
              actionsEffectuees.push(resultat);
              toolResults.push(resultat);
              conversation.push({ role: "tool", tool_call_id: tc.id, content: resultat });
            }
            const origQ = messages[messages.length - 1];
            if (origQ) {
              const q = typeof origQ.content === "string" ? origQ.content : JSON.stringify(origQ.content);
              conversation.push({ role: "user", content: `Réponds directement à ma question : "${q}"` });
            }
            continue;
          }
          break;
        }
      } catch (err: any) {
        console.warn("[stream] phase1 failed:", err?.message?.slice(0, 100));
      }

      // ── Phase 2 : Streaming synthèse (Gemini → Groq → Claude) ───────────────
      const originalQuestion = (() => {
        const last = messages[messages.length - 1];
        if (!last) return "";
        return typeof last.content === "string" ? last.content : JSON.stringify(last.content);
      })();

      const prevMessages = messages.slice(0, -1)
        .filter(m => m.role !== ("system" as any))
        .map(m => ({
          role: m.role as "user" | "assistant",
          content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
        }));

      const synthesisMsg = buildSynthesisUserMessage(originalQuestion, toolResults);
      const synthMessages: Array<{ role: "user" | "assistant"; content: string }> = [
        ...prevMessages,
        { role: "user", content: synthesisMsg },
      ];

      // Gemini streaming (priorité)
      if (hasGemini()) {
        try {
          await geminiSynthesisStream(send, systemPrompt, synthMessages);
          finish(actionsEffectuees);
          return;
        } catch (err: any) {
          console.warn("[stream] gemini synthesis failed:", err?.message?.slice(0, 100));
        }
      }

      // Groq streaming (fallback 1)
      if (hasGroq()) {
        try {
          await groqSynthesisStream(send, systemPrompt, synthMessages);
          finish(actionsEffectuees);
          return;
        } catch (err: any) {
          console.warn("[stream] groq synthesis failed:", err?.message?.slice(0, 100));
        }
      }

      // Claude streaming (dernier recours)
      if (hasAnthropic()) {
        try {
          await claudeSynthesisStream(send, systemPrompt, synthMessages);
          finish(actionsEffectuees);
          return;
        } catch (err: any) {
          console.warn("[stream] claude synthesis failed:", err?.message?.slice(0, 100));
        }
      }

      // Fallback : texte phase 1 mot par mot
      if (phase1Text) {
        const chunks = phase1Text.match(/\S+\s*/g) ?? [];
        for (const chunk of chunks) { send({ type: "token", text: chunk }); await sleep(5); }
        finish(actionsEffectuees);
        return;
      }

      send({ type: "token", text: "Service IA momentanément indisponible. Réessaie dans quelques secondes." });
      finish(actionsEffectuees);
    },
  });
}
