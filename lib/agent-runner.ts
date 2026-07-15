// Boucle agentique partagée — fallback automatique 8 providers
// Utilisée par tous les agents spécialisés d'Axso

import Anthropic from "@anthropic-ai/sdk";
import {
  hasOpenAI,
  completionWithToolsOpenAI,
  streamWithOpenAI,
  hasAnthropic,
  completionWithToolsAuto,
  type ToolDefinition,
  type ToolCall,
} from "./llm-client";

export type AgentTool = ToolDefinition;

export interface AgentResult {
  reponse: string;
  actions: string[];
}

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

function raceTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`timeout:${ms}`)), ms)
    ),
  ]);
}

export async function runAgent(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  tools: AgentTool[],
  tenantId: string,
  executeOutil: ToolExecutor,
  maxIterations = 6,
  fast = false
): Promise<AgentResult> {
  // OpenAI streaming (si dispo) → runner dédié
  if (hasOpenAI()) {
    try {
      return await runViaOpenAI(systemPrompt, messages, tools, tenantId, executeOutil, maxIterations);
    } catch (err: any) {
      console.warn("[agent] OpenAI error, fallback auto:", err?.message?.slice(0, 80));
    }
  }
  // Claude Anthropic — avec fallback vers chaîne auto si la clé/crédits ont un problème
  if (hasAnthropic()) {
    try {
      const key = process.env.ANTHROPIC_API_KEY!;
      return await runViaClaude(systemPrompt, messages, tools, tenantId, executeOutil, key, maxIterations);
    } catch (err: any) {
      console.warn("[agent] Claude API error, fallback auto:", err?.message?.slice(0, 80));
      // fall through to auto chain
    }
  }
  // Chaîne de fallback automatique (NVIDIA → GLM → Groq → Gemini → Cerebras → SambaNova → Pollinations)
  return runViaAuto(systemPrompt, messages, tools, tenantId, executeOutil, maxIterations, fast);
}

// ── Runner générique avec fallback automatique ────────────────────────────────
async function runViaAuto(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  tools: AgentTool[],
  tenantId: string,
  executeOutil: ToolExecutor,
  maxIterations: number,
  fast = false
): Promise<AgentResult> {
  const actionsEffectuees: string[] = [];
  const conversation: any[] = [{ role: "system", content: systemPrompt }, ...messages];

  for (let i = 0; i < maxIterations; i++) {
    const result = await completionWithToolsAuto(conversation, tools, 2000, fast);

    if (result.stopReason === "end_turn") {
      return { reponse: result.text ?? "Terminé.", actions: actionsEffectuees };
    }

    if (result.stopReason === "tool_use" && result.toolCalls?.length) {
      conversation.push({
        role: "assistant", content: null,
        tool_calls: result.toolCalls.map((tc) => ({
          id: tc.id, type: "function",
          function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
        })),
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

  return { reponse: "Terminé.", actions: actionsEffectuees };
}

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
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: systemPrompt,
      tools: anthropicTools,
      messages: conversation,
    });

    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((b) => b.type === "text");
      return {
        reponse: textBlock ? (textBlock as any).text : "Terminé.",
        actions: actionsEffectuees,
      };
    }

    if (response.stop_reason === "tool_use") {
      conversation.push({ role: "assistant", content: response.content });
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type === "tool_use") {
          const { succes, resultat } = await executeOutil(
            block.name,
            block.input as Record<string, any>,
            tenantId
          );
          actionsEffectuees.push(resultat);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
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

  return { reponse: "Terminé.", actions: actionsEffectuees };
}

// ── OpenAI runner (non-streaming, pour runAgent) ──────────────────────────
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
    const result = await completionWithToolsOpenAI(conversation, tools, 2000);
    if (result.stopReason === "end_turn") {
      return { reponse: result.text ?? "Terminé.", actions: actionsEffectuees };
    }
    if (result.stopReason === "tool_use" && result.toolCalls?.length) {
      conversation.push({
        role: "assistant", content: null,
        tool_calls: result.toolCalls.map((tc) => ({
          id: tc.id, type: "function",
          function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
        })),
      });
      for (const tc of result.toolCalls) {
        const { succes, resultat } = await executeOutil(tc.name, tc.arguments, tenantId);
        actionsEffectuees.push(resultat);
        conversation.push({ role: "tool", tool_call_id: tc.id, content: resultat });
      }
      continue;
    }
    break;
  }
  return { reponse: "Terminé.", actions: actionsEffectuees };
}

// ── Streaming agent — SSE avec vrai streaming OpenAI ─────────────────────
export function runAgentStream(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string | any[] }>,
  tools: AgentTool[],
  tenantId: string,
  executeOutil: ToolExecutor,
  maxIterations = 4
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        const actionsEffectuees: string[] = [];
        const conversation: any[] = [{ role: "system", content: systemPrompt }, ...messages];

        for (let iter = 0; iter < maxIterations; iter++) {
          // ── Vrai streaming OpenAI ──────────────────────────────────────
          if (hasOpenAI()) {
            const openAIRes = await streamWithOpenAI(conversation, tools);
            if (!openAIRes.ok) throw new Error(`OpenAI ${openAIRes.status}`);

            const reader = openAIRes.body!.getReader();
            const decoder = new TextDecoder();
            let buf = "";
            const tcAcc: Record<number, { id: string; name: string; args: string }> = {};
            let hasToolCalls = false;
            const pendingToolCalls: ToolCall[] = [];

            outer: while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += decoder.decode(value, { stream: true });
              const lines = buf.split("\n");
              buf = lines.pop() ?? "";

              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const raw = line.slice(6).trim();
                if (raw === "[DONE]") break outer;
                let chunk: any;
                try { chunk = JSON.parse(raw); } catch { continue; }

                const delta = chunk.choices?.[0]?.delta;
                const finishReason = chunk.choices?.[0]?.finish_reason;

                if (delta?.content) send({ type: "token", text: delta.content });

                if (delta?.tool_calls) {
                  hasToolCalls = true;
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
                    let args: Record<string, any> = {};
                    try { args = JSON.parse(tc.args); } catch {}
                    pendingToolCalls.push({ id: tc.id, name: tc.name, arguments: args });
                  }
                  break outer;
                }
                if (finishReason === "stop") break outer;
              }
            }

            if (!hasToolCalls) break;

            conversation.push({
              role: "assistant", content: null,
              tool_calls: pendingToolCalls.map((tc) => ({
                id: tc.id, type: "function",
                function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
              })),
            });
            for (const tc of pendingToolCalls) {
              const { resultat } = await executeOutil(tc.name, tc.arguments, tenantId);
              actionsEffectuees.push(resultat);
              conversation.push({ role: "tool", tool_call_id: tc.id, content: resultat });
            }
            continue;
          }

          // ── Fallback non-streaming — chaîne auto ───────────────────────
          const result = await completionWithToolsAuto(conversation, tools, 2000, true);

          if (result.stopReason === "end_turn") {
            const words = (result.text ?? "").match(/\S+\s*/g) ?? [];
            for (const w of words) {
              send({ type: "token", text: w });
              await new Promise((r) => setTimeout(r, 18));
            }
            break;
          }

          if (result.stopReason === "tool_use" && result.toolCalls?.length) {
            conversation.push({
              role: "assistant", content: null,
              tool_calls: result.toolCalls.map((tc) => ({
                id: tc.id, type: "function",
                function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
              })),
            });
            for (const tc of result.toolCalls) {
              const { resultat } = await executeOutil(tc.name, tc.arguments, tenantId);
              actionsEffectuees.push(resultat);
              conversation.push({ role: "tool", tool_call_id: tc.id, content: resultat });
            }
          } else {
            break;
          }
        }

        send({ type: "done", actions: actionsEffectuees });
      } catch (err: any) {
        send({ type: "error", text: err?.message ?? "Erreur AXIA" });
      }

      controller.close();
    },
  });
}
