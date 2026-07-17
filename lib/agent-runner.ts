// Agent AXIA — Claude natif prioritaire, multi-provider fallback
import Anthropic from "@anthropic-ai/sdk";
import {
  hasOpenAI,
  completionWithToolsOpenAI,
  streamWithOpenAI,
  hasAnthropic,
  completionWithToolsAuto,
  completionAuto,
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
  "claude-sonnet-4-6",
  "claude-opus-4-8",
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

// ─── Claude streaming natif ───────────────────────────────────────────────────
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

  for (let iter = 0; iter < maxIterations; iter++) {
    const runner = client.messages.stream({
      model: CLAUDE_MODELS[0],
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
  if (hasAnthropic()) {
    try {
      return await runViaClaude(systemPrompt, messages, tools, tenantId, executeOutil, process.env.ANTHROPIC_API_KEY!, maxIterations);
    } catch (err: any) {
      console.warn("[agent] Claude:", err?.message?.slice(0, 80));
    }
  }
  if (hasOpenAI()) {
    try { return await runViaOpenAI(systemPrompt, messages, tools, tenantId, executeOutil, maxIterations); }
    catch (err: any) { console.warn("[agent] OpenAI:", err?.message?.slice(0, 80)); }
  }
  // Auto-chain fallback
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
      continue;
    }
    break;
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
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      const finish = (actions: string[]) => {
        try { send({ type: "done", actions }); } catch {}
        try { controller.close(); } catch {}
      };

      try {
        const actionsEffectuees: string[] = [];

        // ── 1. Claude natif streaming ─────────────────────────────────────
        if (hasAnthropic()) {
          let tokensSent = false;
          const sendTracked = (data: object) => {
            if ((data as any).type === "token") tokensSent = true;
            send(data);
          };

          try {
            await runClaudeStream(sendTracked, systemPrompt, messages, tools, tenantId, executeOutil, maxIterations, actionsEffectuees);
            finish(actionsEffectuees);
            return;
          } catch (streamErr: any) {
            console.warn("[stream] Claude streaming:", streamErr?.message?.slice(0, 80));

            if (tokensSent) {
              // Des tokens ont déjà été envoyés — terminer proprement
              finish(actionsEffectuees);
              return;
            }

            // Aucun token envoyé — fallback Claude non-streaming + simulation
            try {
              const msgList = messages.map((m) => ({
                role: m.role as "user" | "assistant",
                content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
              }));
              const result = await runViaClaude(systemPrompt, msgList, tools, tenantId, executeOutil, process.env.ANTHROPIC_API_KEY!, maxIterations);

              if (result.reponse) {
                const words = result.reponse.match(/\S+\s*/g) ?? [];
                for (const w of words) {
                  send({ type: "token", text: w });
                  await new Promise((r) => setTimeout(r, 8));
                }
              }
              actionsEffectuees.push(...result.actions);
              finish(actionsEffectuees);
              return;
            } catch (nonStreamErr: any) {
              const errMsg = (nonStreamErr?.message ?? "").slice(0, 200);
              const errStatus = (nonStreamErr as any)?.status ?? 0;
              console.error("[AXIA Claude error]", errStatus, errMsg);
              // Injecter le code d'erreur dans le prompt de fallback
              (globalThis as any).__axiaClaudeError = `${errStatus}: ${errMsg}`;
            }
          }
        }

        // ── 2. OpenAI streaming natif ─────────────────────────────────────
        if (hasOpenAI()) {
          const conversation: any[] = [{ role: "system", content: systemPrompt }, ...messages];
          for (let iter = 0; iter < maxIterations; iter++) {
            const openAIRes = await streamWithOpenAI(conversation, tools, 4000);
            if (!openAIRes.ok) throw new Error(`OpenAI ${openAIRes.status}`);
            const reader = openAIRes.body!.getReader();
            const decoder = new TextDecoder();
            let buf = "";
            const tcAcc: Record<number, { id: string; name: string; args: string }> = {};
            let hasTC = false;
            const pendingTC: ToolCall[] = [];

            outer: while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += decoder.decode(value, { stream: true });
              const lines = buf.split("\n"); buf = lines.pop() ?? "";
              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const raw = line.slice(6).trim();
                if (raw === "[DONE]") break outer;
                let chunk: any; try { chunk = JSON.parse(raw); } catch { continue; }
                const delta = chunk.choices?.[0]?.delta;
                const finishReason = chunk.choices?.[0]?.finish_reason;
                if (delta?.content) send({ type: "token", text: delta.content });
                if (delta?.tool_calls) {
                  hasTC = true;
                  for (const tc of delta.tool_calls) {
                    const idx = tc.index ?? 0;
                    if (!tcAcc[idx]) tcAcc[idx] = { id: "", name: "", args: "" };
                    if (tc.id) tcAcc[idx].id = tc.id;
                    if (tc.function?.name) tcAcc[idx].name += tc.function.name;
                    if (tc.function?.arguments) tcAcc[idx].args += tc.function.arguments;
                  }
                }
                if (finishReason === "tool_calls") {
                  for (const tc of Object.values(tcAcc)) {
                    let args: Record<string, any> = {}; try { args = JSON.parse(tc.args); } catch {}
                    pendingTC.push({ id: tc.id, name: tc.name, arguments: args });
                  }
                  break outer;
                }
                if (finishReason === "stop") break outer;
              }
            }

            if (!hasTC) break;
            conversation.push({ role: "assistant", content: null, tool_calls: pendingTC.map((tc) => ({ id: tc.id, type: "function", function: { name: tc.name, arguments: JSON.stringify(tc.arguments) } })) });
            for (const tc of pendingTC) {
              const { resultat } = await executeOutil(tc.name, tc.arguments, tenantId);
              actionsEffectuees.push(resultat);
              conversation.push({ role: "tool", tool_call_id: tc.id, content: resultat });
            }
          }
          finish(actionsEffectuees);
          return;
        }

        // ── 3. Fallback conversationnel simple (completionAuto = sans tools, clean) ─
        const fallbackMsgs: ChatMessage[] = [
          { role: "system", content: "Tu es AXIA, l'assistant IA d'Axso. Réponds naturellement, avec intelligence et profondeur, dans la langue de l'utilisateur." },
          ...messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
          })),
        ];
        const fallbackResult = await completionAuto(fallbackMsgs, 2000);
        if (fallbackResult.text) {
          const words = fallbackResult.text.match(/\S+\s*/g) ?? [];
          for (const w of words) { send({ type: "token", text: w }); await new Promise((r) => setTimeout(r, 12)); }
        }
        finish(actionsEffectuees);

      } catch (err: any) {
        try { send({ type: "error", text: err?.message ?? "Erreur AXIA" }); } catch {}
        try { controller.close(); } catch {}
      }
    },
  });
}
