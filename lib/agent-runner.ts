// Agent AXIA — Claude natif prioritaire, multi-provider fallback
import Anthropic from "@anthropic-ai/sdk";
import {
  hasOpenAI,
  completionWithToolsOpenAI,
  hasAnthropic,
  completionWithToolsAuto,
  type ToolDefinition,
  type ToolCall,
  type ChatMessage,
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

// Modèles Claude disponibles par ordre de préférence
const CLAUDE_MODELS = [
  "claude-opus-4-8",
  "claude-sonnet-4-6",
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022",
];

async function callClaudeCreate(client: Anthropic, params: any): Promise<any> {
  for (const model of CLAUDE_MODELS) {
    try {
      return await (client.messages.create as any)({ ...params, model });
    } catch (err: any) {
      const msg = err?.message ?? "";
      // Erreur de modèle → essayer le suivant
      if (msg.includes("model") || msg.includes("404") || msg.includes("not_found")) {
        console.warn(`[claude] model ${model} unavailable, trying next`);
        continue;
      }
      throw err; // Autre erreur (auth, rate limit...) → propager
    }
  }
  throw new Error("Aucun modèle Claude disponible");
}

// ─── Claude direct (non-streaming) — fiable, multi-turn ──────────────────────
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

  let conversation: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  for (let i = 0; i < maxIterations; i++) {
    const response = await callClaudeCreate(client, {
      max_tokens: 8000,
      system: systemPrompt,
      tools: anthropicTools,
      messages: conversation,
    });

    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((b: any) => b.type === "text");
      return {
        reponse: textBlock ? (textBlock as any).text : "",
        actions: actionsEffectuees,
      };
    }

    if (response.stop_reason === "tool_use") {
      conversation.push({ role: "assistant", content: response.content });
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if ((block as any).type === "tool_use") {
          const { succes, resultat } = await executeOutil(
            (block as any).name,
            (block as any).input as Record<string, any>,
            tenantId
          );
          actionsEffectuees.push(resultat);
          toolResults.push({
            type: "tool_result",
            tool_use_id: (block as any).id,
            content: resultat,
            is_error: !succes,
          });
        }
      }
      conversation.push({ role: "user", content: toolResults });
      continue;
    }
    break;
  }
  return { reponse: "", actions: actionsEffectuees };
}

// ─── Claude streaming natif (essaie chaque modèle) ──────────────────────────
async function runClaudeStream(
  send: (data: object) => void,
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string | any[] }>,
  tools: AgentTool[],
  tenantId: string,
  executeOutil: ToolExecutor,
  maxIterations: number,
  actionsEffectuees: string[]
): Promise<void> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const anthropicTools = toAnthropicTools(tools);
  let conversation: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: typeof m.content === "string" ? m.content : (m.content as any),
  }));

  const activeModel = CLAUDE_MODELS[0];

  for (let iter = 0; iter < maxIterations; iter++) {
    const runner = client.messages.stream({
      model: activeModel,
      max_tokens: 8000,
      system: systemPrompt,
      tools: anthropicTools,
      messages: conversation,
    });

    runner.on("text", (text: string) => send({ type: "token", text }));

    const finalMsg = await runner.finalMessage();
    const stopReason = finalMsg.stop_reason;

    if (stopReason === "end_turn") break;

    if (stopReason === "tool_use") {
      conversation.push({ role: "assistant", content: finalMsg.content });
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of finalMsg.content) {
        if ((block as any).type === "tool_use") {
          const { succes, resultat } = await executeOutil(
            (block as any).name,
            (block as any).input ?? {},
            tenantId
          );
          actionsEffectuees.push(resultat);
          toolResults.push({
            type: "tool_result",
            tool_use_id: (block as any).id,
            content: resultat,
            is_error: !succes,
          });
        }
      }
      conversation.push({ role: "user", content: toolResults });
      continue;
    }
    break;
  }
}

// ─── Fallback OpenAI (non-streaming) ─────────────────────────────────────────
async function runViaOpenAI(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  tools: AgentTool[],
  tenantId: string,
  executeOutil: ToolExecutor,
  maxIterations: number
): Promise<AgentResult> {
  const actionsEffectuees: string[] = [];
  const conversation: any[] = [{ role: "system", content: systemPrompt }, ...messages];
  for (let i = 0; i < maxIterations; i++) {
    const result = await completionWithToolsOpenAI(conversation, tools, 4000);
    if (result.stopReason === "end_turn") return { reponse: result.text ?? "", actions: actionsEffectuees };
    if (result.stopReason === "tool_use" && result.toolCalls?.length) {
      conversation.push({
        role: "assistant", content: null,
        tool_calls: result.toolCalls.map((tc) => ({ id: tc.id, type: "function", function: { name: tc.name, arguments: JSON.stringify(tc.arguments) } })),
      });
      for (const tc of result.toolCalls) {
        const { resultat } = await executeOutil(tc.name, tc.arguments, tenantId);
        actionsEffectuees.push(resultat);
        conversation.push({ role: "tool", tool_call_id: tc.id, content: resultat });
      }
      continue;
    }
    break;
  }
  return { reponse: "", actions: actionsEffectuees };
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
  // Auto-chain first (Gemini → Groq → NVIDIA → ... → Pollinations)
  try {
    const conversation: any[] = [{ role: "system", content: systemPrompt }, ...messages];
    const actionsEffectuees: string[] = [];
    for (let i = 0; i < maxIterations; i++) {
      const result = await completionWithToolsAuto(conversation, tools, 4000, false);
      if (result.stopReason === "end_turn") return { reponse: result.text ?? "", actions: actionsEffectuees };
      if (result.stopReason === "tool_use" && result.toolCalls?.length) {
        conversation.push({ role: "assistant", content: null, tool_calls: result.toolCalls.map(tc => ({ id: tc.id, type: "function", function: { name: tc.name, arguments: JSON.stringify(tc.arguments) } })) });
        for (const tc of result.toolCalls) {
          const { resultat } = await executeOutil(tc.name, tc.arguments, tenantId);
          actionsEffectuees.push(resultat);
          conversation.push({ role: "tool", tool_call_id: tc.id, content: resultat });
        }
        const originalQ = messages.find(m => m.role === "user");
        if (originalQ) conversation.push({ role: "user", content: `Tu as les informations nécessaires. Réponds maintenant directement à ma question : "${originalQ.content}"` });
        continue;
      }
      break;
    }
    // Boucle épuisée — demander résumé si des outils ont été utilisés
    if (actionsEffectuees.length > 0) {
      conversation.push({ role: "user", content: "Résume brièvement ce que tu viens d'accomplir." });
      try {
        const s = await completionWithToolsAuto(conversation, [], 800);
        return { reponse: s.text ?? "Actions effectuées avec succès.", actions: actionsEffectuees };
      } catch {}
    }
    return { reponse: "", actions: actionsEffectuees };
  } catch (err: any) {
    console.warn("[agent] auto-chain:", err?.message?.slice(0, 80));
  }
  if (hasOpenAI()) {
    try { return await runViaOpenAI(systemPrompt, messages, tools, tenantId, executeOutil, maxIterations); }
    catch (err: any) { console.warn("[agent] OpenAI:", err?.message?.slice(0, 80)); }
  }
  // Anthropic en dernier recours
  if (hasAnthropic()) {
    try {
      return await runViaClaude(systemPrompt, messages, tools, tenantId, executeOutil, process.env.ANTHROPIC_API_KEY!, maxIterations);
    } catch (err: any) {
      console.warn("[agent] Claude:", err?.message?.slice(0, 80));
    }
  }
  return { reponse: "", actions: [] };
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

      // ── 1. completionWithToolsAuto multi-turn (Gemini → Groq → NVIDIA → … → Anthropic) ──
      // Gère le tool use complet + simule le streaming mot par mot
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
            const text = result.text ?? "";
            if (text) {
              const chunks = text.match(/\S+\s*/g) ?? [];
              for (const chunk of chunks) {
                send({ type: "token", text: chunk });
                await new Promise(r => setTimeout(r, 5));
              }
            }
            finish(actionsEffectuees);
            return;
          }

          if (result.stopReason === "tool_use" && result.toolCalls?.length) {
            conversation.push({
              role: "assistant",
              content: null,
              tool_calls: result.toolCalls.map(tc => ({
                id: tc.id,
                type: "function",
                function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
              })),
            });
            for (const tc of result.toolCalls) {
              const { succes, resultat } = await executeOutil(tc.name, tc.arguments, tenantId);
              actionsEffectuees.push(resultat);
              conversation.push({ role: "tool", tool_call_id: tc.id, content: resultat });
            }
            // Re-ancrage : force le modèle à revenir sur la question originale
            // sans ce message, Gemini/Groq répètent les données de l'outil au lieu de répondre
            const originalQuestion = messages.find(m => m.role === "user");
            if (originalQuestion) {
              conversation.push({
                role: "user",
                content: `Tu as les informations nécessaires. Réponds maintenant directement à ma question : "${typeof originalQuestion.content === "string" ? originalQuestion.content : "ma demande"}"`,
              });
            }
            continue;
          }
          break;
        }

        // Boucle épuisée sans end_turn — demander un résumé final
        if (actionsEffectuees.length > 0) {
          conversation.push({ role: "user", content: "Résume brièvement ce que tu viens d'accomplir." });
          try {
            const summary = await completionWithToolsAuto(conversation, [], 1000);
            const text = summary.text ?? "";
            if (text) {
              const chunks = text.match(/\S+\s*/g) ?? [];
              for (const chunk of chunks) { send({ type: "token", text: chunk }); await new Promise(r => setTimeout(r, 5)); }
            }
          } catch {}
        }
        finish(actionsEffectuees);
        return;

      } catch (primaryErr: any) {
        console.warn("[stream] primary chain failed:", primaryErr?.message?.slice(0, 100));
      }

      // ── 2. Claude natif streaming (dernier recours absolu) ────────────────
      if (hasAnthropic()) {
        try {
          await runClaudeStream(send, systemPrompt, messages, tools, tenantId, executeOutil, maxIterations, actionsEffectuees);
          finish(actionsEffectuees);
          return;
        } catch (claudeErr: any) {
          console.error("[stream] Claude also failed:", (claudeErr as any)?.message?.slice(0, 100));
        }
      }

      // ── 3. Réponse de secours — jamais de silence total ───────────────────
      send({ type: "token", text: "Service IA momentanément indisponible. Réessaie dans quelques secondes." });
      finish([]);
    },
  });
}
