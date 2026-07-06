// Clients LLM multi-providers — OpenAI-compatible (fetch natif, aucun SDK)
// Priorité : NVIDIA NIM → Pollinations → freellmapi → Claude Anthropic

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
  model?: string,
  fast = false
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
      // fast mode: skip deep thinking to cut latency from ~20s to ~3s
      ...(!fast ? getNvidiaThinkingParams(selectedModel) : {}),
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

// ─── POLLINATIONS ──────────────────────────────────────────────────────────────
// Base : https://gen.pollinations.ai/v1 (OpenAI-compatible)
// Modèles texte : claude-sonnet-5, openai-large (GPT-4o), grok-4-20-reasoning, gemini, deepseek-pro…
// Modèles image : gptimage, seedream-pro, flux, ideogram-v4-quality…
// Vidéo : veo, seedance-2.0, wan-pro-1080p | Audio : elevenlabs, eleven-multilingual-v2

const POLLINATIONS_BASE = "https://gen.pollinations.ai";

export function hasPollinations(): boolean {
  return !!process.env.POLLINATIONS_API_KEY;
}

export async function completionPollinations(
  messages: ChatMessage[],
  maxTokens = 800,
  model = "claude-sonnet-5"
): Promise<CompletionResult> {
  const apiKey = process.env.POLLINATIONS_API_KEY;
  if (!apiKey) throw new Error("POLLINATIONS_API_KEY manquante");

  const res = await fetch(`${POLLINATIONS_BASE}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, messages }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Pollinations ${res.status}: ${err}`);
  }

  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content ?? "",
    provider: `pollinations:${model}`,
  };
}

export async function completionWithToolsPollinations(
  messages: any[],
  tools: ToolDefinition[],
  maxTokens = 2000,
  model = "openai-large"  // GPT-4o — meilleure compatibilité tool_calls OpenAI
): Promise<CompletionWithToolsResult> {
  const apiKey = process.env.POLLINATIONS_API_KEY;
  if (!apiKey) throw new Error("POLLINATIONS_API_KEY manquante");

  const openaiTools = tools.map((t) => ({
    type: "function",
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));

  const res = await fetch(`${POLLINATIONS_BASE}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages,
      tools: openaiTools,
      tool_choice: "auto",
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Pollinations ${res.status}: ${err}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];

  if (choice?.finish_reason === "tool_calls" && choice.message?.tool_calls?.length) {
    const toolCalls: ToolCall[] = choice.message.tool_calls.map((tc: any) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments || "{}"),
    }));
    return { toolCalls, stopReason: "tool_use", provider: `pollinations:${model}` };
  }

  return {
    text: choice?.message?.content ?? "",
    stopReason: "end_turn",
    provider: `pollinations:${model}`,
  };
}

// ─── POLLINATIONS IMAGE ─────────────────────────────────────────────────────
// Retourne une URL Pollinations avec le modèle choisi
export function pollinationsImageUrl(
  prompt: string,
  model: "gptimage" | "seedream-pro" | "flux" | "ideogram-v4-quality" = "gptimage",
  seed?: number
): string {
  const s = seed ?? Math.floor(Math.random() * 999999);
  const encoded = encodeURIComponent(prompt);
  const apiKey = process.env.POLLINATIONS_API_KEY;
  const keyParam = apiKey ? `&key=${apiKey}` : "";
  return `${POLLINATIONS_BASE}/image/${encoded}?model=${model}&width=1024&height=1024&nologo=true&enhance=true&seed=${s}${keyParam}`;
}

// ─── POLLINATIONS VIDÉO ────────────────────────────────────────────────────
export function pollinationsVideoUrl(
  prompt: string,
  model: "seedance-2.0" | "veo" | "wan-pro-1080p" | "wan" = "seedance-2.0",
  duration = 5
): string {
  const encoded = encodeURIComponent(prompt);
  const apiKey = process.env.POLLINATIONS_API_KEY;
  const keyParam = apiKey ? `&key=${apiKey}` : "";
  return `${POLLINATIONS_BASE}/video/${encoded}?model=${model}&duration=${duration}&nologo=true${keyParam}`;
}

// ─── POLLINATIONS AUDIO/TTS ────────────────────────────────────────────────
// Voix disponibles : nova, alloy, echo, onyx, shimmer, rachel, bella, charlotte…
export function pollinationsAudioUrl(
  text: string,
  voice = "nova",
  model: "elevenlabs" | "eleven-multilingual-v2" | "qwen-tts" = "eleven-multilingual-v2"
): string {
  const encoded = encodeURIComponent(text);
  const apiKey = process.env.POLLINATIONS_API_KEY;
  const keyParam = apiKey ? `&key=${apiKey}` : "";
  return `${POLLINATIONS_BASE}/audio/${encoded}?voice=${voice}&model=${model}&nologo=true${keyParam}`;
}

// ─── FREELLMAPI ────────────────────────────────────────────────────────────
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
