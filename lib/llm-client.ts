// Client freellmapi — proxy OpenAI-compatible, aucun SDK requis (fetch natif)
// Docs : https://github.com/tashfeenahmed/freellmapi

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionResult {
  text: string;
  provider?: string; // en-tête x-routed-via retourné par freellmapi
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface CompletionWithToolsResult {
  text?: string;
  toolCalls?: ToolCall[];
  stopReason: "end_turn" | "tool_use";
  provider?: string;
}

export function hasFreeLLM(): boolean {
  return !!(process.env.FREELLMAPI_URL && process.env.FREELLMAPI_KEY);
}

export function hasNVIDIA(): boolean {
  return !!(
    process.env.NVIDIA_BASE_URL &&
    (process.env.NVIDIA_KEY_NEMOTRON || process.env.NVIDIA_KEY_DEEPSEEK)
  );
}

function getNvidiaKey(model: string): string {
  const key = model.includes("deepseek")
    ? process.env.NVIDIA_KEY_DEEPSEEK
    : process.env.NVIDIA_KEY_NEMOTRON;
  if (!key) throw new Error(`Clé NVIDIA manquante pour le modèle ${model}`);
  return key;
}

// Paramètres de raisonnement selon le modèle NVIDIA
// - DeepSeek V4 Flash : thinking=true + reasoning_effort="high"
// - Nemotron 3 Super  : enable_thinking=true + reasoning_budget=16384
function getNvidiaThinkingParams(model: string): Record<string, unknown> {
  if (model.includes("deepseek")) {
    return { chat_template_kwargs: { thinking: true, reasoning_effort: "high" } };
  }
  return {
    chat_template_kwargs: { enable_thinking: true },
    reasoning_budget: 16384,
  };
}

// Completion simple via NVIDIA NIM (OpenAI-compatible)
// Utilise Nemotron 3 Super 120B par défaut (raisonnement profond)
export async function completionNVIDIA(
  messages: ChatMessage[],
  maxTokens = 600,
  model?: string
): Promise<CompletionResult> {
  const baseURL = process.env.NVIDIA_BASE_URL?.replace(/\/$/, "");
  const selectedModel =
    model ?? process.env.NVIDIA_MODEL_NEMOTRON ?? "nvidia/nemotron-3-super-120b-a12b";
  if (!baseURL) throw new Error("NVIDIA_BASE_URL manquante dans .env.local");
  const apiKey = getNvidiaKey(selectedModel);

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: selectedModel,
      max_tokens: maxTokens,
      temperature: 1,
      top_p: 0.95,
      messages,
      ...getNvidiaThinkingParams(selectedModel),
    }),
  });

  if (!response.ok) {
    const erreur = await response.text().catch(() => response.statusText);
    throw new Error(`NVIDIA NIM ${response.status}: ${erreur}`);
  }

  const data = await response.json();
  const msg = data.choices?.[0]?.message;
  const text = msg?.content ?? "";
  return { text, provider: `nvidia:${selectedModel}` };
}

// Tool use via NVIDIA NIM (format OpenAI)
// Utilise DeepSeek V4 Flash par défaut (plus rapide pour les boucles agentiques)
export async function completionWithToolsNVIDIA(
  messages: any[],
  tools: ToolDefinition[],
  maxTokens = 1500,
  model?: string
): Promise<CompletionWithToolsResult> {
  const baseURL = process.env.NVIDIA_BASE_URL?.replace(/\/$/, "");
  const selectedModel =
    model ?? process.env.NVIDIA_MODEL_DEEPSEEK ?? "deepseek-ai/deepseek-v4-flash";
  if (!baseURL) throw new Error("NVIDIA_BASE_URL manquante dans .env.local");
  const apiKey = getNvidiaKey(selectedModel);

  const openaiTools = tools.map((t) => ({
    type: "function",
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: selectedModel,
      max_tokens: maxTokens,
      temperature: 1,
      top_p: 0.95,
      messages,
      tools: openaiTools,
      tool_choice: "auto",
      ...getNvidiaThinkingParams(selectedModel),
    }),
  });

  if (!response.ok) {
    const erreur = await response.text().catch(() => response.statusText);
    throw new Error(`NVIDIA NIM ${response.status}: ${erreur}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];

  if (choice?.finish_reason === "tool_calls" && choice.message?.tool_calls?.length) {
    const toolCalls: ToolCall[] = choice.message.tool_calls.map((tc: any) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments || "{}"),
    }));
    return { toolCalls, stopReason: "tool_use", provider: `nvidia:${selectedModel}` };
  }

  return {
    text: choice?.message?.content ?? "",
    stopReason: "end_turn",
    provider: `nvidia:${selectedModel}`,
  };
}

export async function completionFreeLLM(
  messages: ChatMessage[],
  maxTokens = 600
): Promise<CompletionResult> {
  const baseURL = process.env.FREELLMAPI_URL?.replace(/\/$/, "");
  const apiKey = process.env.FREELLMAPI_KEY;

  if (!baseURL || !apiKey) {
    throw new Error("FREELLMAPI_URL ou FREELLMAPI_KEY manquante dans .env.local");
  }

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "auto", // freellmapi sélectionne le meilleur provider disponible
      max_tokens: maxTokens,
      messages,
    }),
  });

  if (!response.ok) {
    const erreur = await response.text().catch(() => response.statusText);
    throw new Error(`freellmapi ${response.status}: ${erreur}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  const provider = response.headers.get("x-routed-via") ?? undefined;

  return { text, provider };
}

// Appel avec tool use (format OpenAI — compatible freellmapi)
// messages accepte any[] car la conversation tool calling inclut des rôles "tool" et "assistant" avec tool_calls
export async function completionWithToolsFreeLLM(
  messages: any[],
  tools: ToolDefinition[],
  maxTokens = 1500
): Promise<CompletionWithToolsResult> {
  const baseURL = process.env.FREELLMAPI_URL?.replace(/\/$/, "");
  const apiKey = process.env.FREELLMAPI_KEY;
  if (!baseURL || !apiKey) throw new Error("FREELLMAPI_URL ou FREELLMAPI_KEY manquante");

  const openaiTools = tools.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "auto",
      max_tokens: maxTokens,
      messages,
      tools: openaiTools,
      tool_choice: "auto",
    }),
  });

  if (!response.ok) {
    const erreur = await response.text().catch(() => response.statusText);
    throw new Error(`freellmapi ${response.status}: ${erreur}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const provider = response.headers.get("x-routed-via") ?? undefined;

  if (choice?.finish_reason === "tool_calls" && choice.message?.tool_calls?.length) {
    const toolCalls: ToolCall[] = choice.message.tool_calls.map((tc: any) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments || "{}"),
    }));
    return { toolCalls, stopReason: "tool_use", provider };
  }

  return {
    text: choice?.message?.content ?? "",
    stopReason: "end_turn",
    provider,
  };
}
