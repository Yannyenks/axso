// Boucle agentique partagée — NVIDIA prioritaire (Nemotron 120B / DeepSeek V4), Claude en fallback
// Utilisée par tous les agents spécialisés d'Axso

import Anthropic from "@anthropic-ai/sdk";
import {
  hasFreeLLM,
  completionWithToolsFreeLLM,
  hasNVIDIA,
  completionWithToolsNVIDIA,
  hasPollinations,
  completionWithToolsPollinations,
  type ToolDefinition,
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
  // Priorité 1 : NVIDIA NIM — timeout automatique avec fallback
  if (hasNVIDIA()) {
    const timeoutMs = fast ? 9000 : 28000;
    try {
      return await raceTimeout(
        runViaNVIDIA(systemPrompt, messages, tools, tenantId, executeOutil, maxIterations, fast),
        timeoutMs
      );
    } catch (err: any) {
      if (!err?.message?.startsWith("timeout:")) throw err;
      // NVIDIA trop lent → fallback transparent
      console.warn(`[runAgent] NVIDIA timeout (${timeoutMs}ms), fallback activé`);
    }
  }
  // Priorité 2 : Pollinations
  if (hasPollinations()) {
    return runViaPollinations(systemPrompt, messages, tools, tenantId, executeOutil, maxIterations);
  }
  // Priorité 3 : freellmapi
  if (hasFreeLLM()) {
    return runViaFreeLLM(systemPrompt, messages, tools, tenantId, executeOutil, maxIterations);
  }
  // Priorité 4 : Claude Anthropic
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    return runViaClaude(systemPrompt, messages, tools, tenantId, executeOutil, apiKey, maxIterations);
  }
  return {
    reponse: "Aucun fournisseur IA configuré. Ajoute NVIDIA_KEY_NEMOTRON, POLLINATIONS_API_KEY ou ANTHROPIC_API_KEY dans .env.local.",
    actions: [],
  };
}

async function runViaPollinations(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  tools: AgentTool[],
  tenantId: string,
  executeOutil: ToolExecutor,
  maxIterations: number
): Promise<AgentResult> {
  const actionsEffectuees: string[] = [];
  const conversation: any[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  for (let i = 0; i < maxIterations; i++) {
    const result = await completionWithToolsPollinations(conversation, tools, 2000);

    if (result.stopReason === "end_turn") {
      return { reponse: result.text ?? "Terminé.", actions: actionsEffectuees };
    }

    if (result.stopReason === "tool_use" && result.toolCalls?.length) {
      conversation.push({
        role: "assistant",
        content: null,
        tool_calls: result.toolCalls.map((tc) => ({
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
      continue;
    }

    break;
  }

  return { reponse: "Terminé.", actions: actionsEffectuees };
}

async function runViaFreeLLM(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  tools: AgentTool[],
  tenantId: string,
  executeOutil: ToolExecutor,
  maxIterations: number
): Promise<AgentResult> {
  const actionsEffectuees: string[] = [];
  const conversation: any[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  for (let i = 0; i < maxIterations; i++) {
    const result = await completionWithToolsFreeLLM(conversation, tools, 2000);

    if (result.stopReason === "end_turn") {
      return { reponse: result.text ?? "Terminé.", actions: actionsEffectuees };
    }

    if (result.stopReason === "tool_use" && result.toolCalls?.length) {
      conversation.push({
        role: "assistant",
        content: null,
        tool_calls: result.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
        })),
      });

      for (const tc of result.toolCalls) {
        const { succes, resultat } = await executeOutil(tc.name, tc.arguments, tenantId);
        actionsEffectuees.push(resultat);
        conversation.push({
          role: "tool",
          tool_call_id: tc.id,
          content: resultat,
        });
      }
      continue;
    }

    break;
  }

  return { reponse: "Terminé.", actions: actionsEffectuees };
}

async function runViaNVIDIA(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  tools: AgentTool[],
  tenantId: string,
  executeOutil: ToolExecutor,
  maxIterations: number,
  fast = false
): Promise<AgentResult> {
  const actionsEffectuees: string[] = [];
  const conversation: any[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  for (let i = 0; i < maxIterations; i++) {
    const result = await completionWithToolsNVIDIA(conversation, tools, 2000, undefined, fast);

    if (result.stopReason === "end_turn") {
      return { reponse: result.text ?? "Terminé.", actions: actionsEffectuees };
    }

    if (result.stopReason === "tool_use" && result.toolCalls?.length) {
      conversation.push({
        role: "assistant",
        content: null,
        tool_calls: result.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
        })),
      });

      for (const tc of result.toolCalls) {
        const { succes, resultat } = await executeOutil(tc.name, tc.arguments, tenantId);
        actionsEffectuees.push(resultat);
        conversation.push({
          role: "tool",
          tool_call_id: tc.id,
          content: resultat,
        });
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
