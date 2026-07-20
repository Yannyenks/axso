/**
 * Agent AXIA — Architecture split-inference
 *
 * Phase 1 — Tool execution : Gemini → Groq → NVIDIA → … (rapide, gratuit)
 *   Les modèles bon marché excellent à appeler des fonctions structurées.
 *
 * Phase 2 — Response generation : Claude streaming natif (qualité maximale)
 *   Claude reçoit le contexte des outils et génère la réponse finale.
 *   Si Claude est indisponible → fallback sur le texte de Phase 1.
 */
import Anthropic from "@anthropic-ai/sdk";
import {
  hasOpenAI,
  completionWithToolsOpenAI,
  hasAnthropic,
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
  "claude-opus-4-8",
  "claude-sonnet-4-6",
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

/** Construit le message de synthèse final pour Claude à partir du contexte outil */
function buildSynthesisUserMessage(
  originalQuestion: string,
  toolResults: string[]
): string {
  if (toolResults.length === 0) return originalQuestion;
  const ctx = toolResults.join("\n\n");
  return `${originalQuestion}\n\n---\nContexte obtenu (utilise-le pour répondre, ne le répète pas) :\n${ctx}`;
}

// ─── Claude direct (non-streaming) ───────────────────────────────────────────

async function runViaClaude(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  tools: AgentTool[],
  tenantId: string,
  executeOutil: ToolExecutor,
  apiKey: string,
  maxIterations: number
): Promise<AgentResult> {
  const client = new Anthropic({ apiKey });
  const actionsEffectuees: string[] = [];
  const anthropicTools = toAnthropicTools(tools);
  let conversation: Anthropic.MessageParam[] = messages.map((m) => ({ role: m.role, content: m.content }));

  for (let i = 0; i < maxIterations; i++) {
    const response = await (client.messages.create as any)({ model: CLAUDE_MODELS[0], max_tokens: 8000, system: systemPrompt, tools: anthropicTools, messages: conversation });
    if (response.stop_reason === "end_turn") {
      const t = response.content.find((b: any) => b.type === "text");
      return { reponse: t ? (t as any).text : "", actions: actionsEffectuees };
    }
    if (response.stop_reason === "tool_use") {
      conversation.push({ role: "assistant", content: response.content });
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if ((block as any).type === "tool_use") {
          const { succes, resultat } = await executeOutil((block as any).name, (block as any).input ?? {}, tenantId);
          actionsEffectuees.push(resultat);
          toolResults.push({ type: "tool_result", tool_use_id: (block as any).id, content: resultat, is_error: !succes });
        }
      }
      conversation.push({ role: "user", content: toolResults });
      continue;
    }
    break;
  }
  return { reponse: "", actions: actionsEffectuees };
}

// ─── Claude streaming natif (Phase 2 de runAgentStream) ──────────────────────

async function claudeSynthesisStream(
  send: (data: object) => void,
  systemPrompt: string,
  claudeMessages: Anthropic.MessageParam[],
  tools: AgentTool[],
  tenantId: string,
  executeOutil: ToolExecutor,
  actionsEffectuees: string[]
): Promise<void> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const anthropicTools = toAnthropicTools(tools);

  // Essaie chaque modèle Claude dans l'ordre jusqu'au succès
  for (const model of CLAUDE_MODELS) {
    let conversation = [...claudeMessages];
    try {
      for (let iter = 0; iter < 8; iter++) {
        const params: any = {
          model,
          max_tokens: 4000,
          system: systemPrompt,
          messages: conversation,
        };
        if (anthropicTools.length > 0) params.tools = anthropicTools;

        const runner = client.messages.stream(params);
        runner.on("text", (text: string) => send({ type: "token", text }));
        const finalMsg = await runner.finalMessage();

        if (finalMsg.stop_reason === "end_turn") return;

        if (finalMsg.stop_reason === "tool_use") {
          conversation.push({ role: "assistant", content: finalMsg.content });
          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const block of finalMsg.content) {
            if ((block as any).type === "tool_use") {
              const { succes, resultat } = await executeOutil((block as any).name, (block as any).input ?? {}, tenantId);
              actionsEffectuees.push(resultat);
              toolResults.push({ type: "tool_result", tool_use_id: (block as any).id, content: resultat, is_error: !succes });
            }
          }
          conversation.push({ role: "user", content: toolResults });
          continue;
        }
        return;
      }
      return; // succès avec ce modèle
    } catch (e: any) {
      const msg = (e?.message ?? "").toLowerCase();
      if (msg.includes("model") || msg.includes("not_found") || msg.includes("404") || e?.status === 404) {
        console.warn(`[claude-stream] model ${model} indisponible, essai suivant`);
        continue;
      }
      throw e; // erreur auth/quota → propager
    }
  }
  throw new Error("Aucun modèle Claude disponible pour la synthèse");
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

  // Phase 1 — Tool execution (cheap models)
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

  // Phase 2 — Synthesis with Claude (essaie chaque modèle dans l'ordre)
  const originalQ = messages[messages.length - 1]?.content ?? "";
  if (hasAnthropic()) {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const synthMsg = buildSynthesisUserMessage(originalQ, toolResults);
    const prevMessages: Anthropic.MessageParam[] = messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
    for (const model of CLAUDE_MODELS) {
      try {
        const response = await (client.messages.create as any)({
          model,
          max_tokens: 4000,
          system: systemPrompt,
          messages: [...prevMessages, { role: "user", content: synthMsg }],
        });
        const t = response.content?.find((b: any) => b.type === "text");
        return { reponse: t?.text ?? "", actions: actionsEffectuees };
      } catch (err: any) {
        const msg = (err?.message ?? "").toLowerCase();
        if (msg.includes("model") || msg.includes("not_found") || err?.status === 404) continue;
        console.warn("[agent] claude:", err?.message?.slice(0, 80));
        break;
      }
    }
  }

  // Fallback — OpenAI
  if (hasOpenAI()) {
    try {
      const conv: any[] = [{ role: "system", content: systemPrompt }, ...messages];
      const r = await completionWithToolsOpenAI(conv, [], 2000);
      return { reponse: r.text ?? "", actions: actionsEffectuees };
    } catch {}
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
      let toolsWereUsed = false;
      let phase1Text = "";

      // ── Phase 1 : Tool execution (Gemini → Groq → NVIDIA → …) ──────────────
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
            toolsWereUsed = true;
            conversation.push({
              role: "assistant",
              content: null,
              tool_calls: result.toolCalls.map(tc => ({
                id: tc.id, type: "function",
                function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
              })),
            });
            for (const tc of result.toolCalls) {
              const { succes, resultat } = await executeOutil(tc.name, tc.arguments, tenantId);
              actionsEffectuees.push(resultat);
              toolResults.push(resultat);
              conversation.push({ role: "tool", tool_call_id: tc.id, content: resultat });
            }
            // Re-ancrage de sécurité : si Claude synthesis échoue et qu'on tombe
            // sur le texte de phase 1, il sera au moins ancré sur la vraie question
            const origQ = messages[messages.length - 1];
            if (origQ) {
              const q = typeof origQ.content === "string" ? origQ.content : JSON.stringify(origQ.content);
              conversation.push({ role: "user", content: `Réponds maintenant directement à ma question : "${q}"` });
            }
            continue;
          }
          break;
        }
      } catch (err: any) {
        console.warn("[stream] phase1 failed:", err?.message?.slice(0, 100));
      }

      // ── Phase 2 : Réponse finale avec Claude (streaming natif) ───────────────
      if (hasAnthropic()) {
        try {
          const originalQuestion = (() => {
            const last = messages[messages.length - 1];
            if (!last) return "";
            return typeof last.content === "string" ? last.content : JSON.stringify(last.content);
          })();

          // Conversation propre pour Claude : historique + question enrichie du contexte outil
          const prevMessages: Anthropic.MessageParam[] = messages.slice(0, -1)
            .filter(m => m.role !== "system" as any)
            .map(m => ({
              role: m.role as "user" | "assistant",
              content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
            }));

          const synthesisMsg = buildSynthesisUserMessage(originalQuestion, toolResults);
          const claudeMessages: Anthropic.MessageParam[] = [
            ...prevMessages,
            { role: "user", content: synthesisMsg },
          ];

          await claudeSynthesisStream(send, systemPrompt, claudeMessages, [], tenantId, executeOutil, actionsEffectuees);
          finish(actionsEffectuees);
          return;
        } catch (err: any) {
          console.warn("[stream] claude synthesis failed:", err?.message?.slice(0, 100));
        }
      }

      // ── Fallback : streamer le résultat de Phase 1 mot par mot ───────────────
      if (phase1Text) {
        const chunks = phase1Text.match(/\S+\s*/g) ?? [];
        for (const chunk of chunks) { send({ type: "token", text: chunk }); await sleep(5); }
        finish(actionsEffectuees);
        return;
      }

      // ── Dernier recours : résumé des actions ou message d'erreur ─────────────
      if (actionsEffectuees.length > 0) {
        send({ type: "token", text: "Actions effectuées avec succès." });
      } else {
        send({ type: "token", text: "Service IA momentanément indisponible. Réessaie dans quelques secondes." });
      }
      finish(actionsEffectuees);
    },
  });
}
