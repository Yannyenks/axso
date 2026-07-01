// Boucle agentique partagée — freellmapi prioritaire, Claude en fallback
// Utilisée par tous les agents spécialisés d'Axso

import Anthropic from "@anthropic-ai/sdk";
import {
  hasFreeLLM,
  completionWithToolsFreeLLM,
  hasNVIDIA,
  completionWithToolsNVIDIA,
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

export async function runAgent(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  tools: AgentTool[],
  tenantId: string,
  executeOutil: ToolExecutor,
  maxIterations = 6
): Promise<AgentResult> {
  if (hasFreeLLM()) {
    return runViaFreeLLM(systemPrompt, messages, tools, tenantId, executeOutil, maxIterations);
  }
  if (hasNVIDIA()) {
    return runViaNVIDIA(systemPrompt, messages, tools, tenantId, executeOutil, maxIterations);
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    return runViaClaude(systemPrompt, messages, tools, tenantId, executeOutil, apiKey, maxIterations);
  }
  return {
    reponse: "Aucun fournisseur IA configuré. Ajoute FREELLMAPI_KEY, NVIDIA_KEY_NEMOTRON ou ANTHROPIC_API_KEY dans .env.local.",
    actions: [],
  };
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
  maxIterations: number
): Promise<AgentResult> {
  const actionsEffectuees: string[] = [];
  const conversation: any[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  for (let i = 0; i < maxIterations; i++) {
    const result = await completionWithToolsNVIDIA(conversation, tools, 2000);

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
