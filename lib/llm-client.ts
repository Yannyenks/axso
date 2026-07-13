/**
 * LLM Client — Multi-provider avec fallback automatique
 *
 * Chaîne de priorité (court-circuite au premier succès) :
 *   1. NVIDIA NIM      — DeepSeek V4 Flash / Nemotron 120B  (raisonnement profond)
 *   2. Groq            — Llama 3.3 70B                      (ultra rapide, 14 400 req/j)
 *   3. Google Gemini   — Gemini 2.0 Flash                   (1 500 req/j, multimodal)
 *   4. Cerebras        — Llama 3.3 70B                      (wafer-scale, très rapide)
 *   5. Together AI     — Llama 3.1 70B                      ($25 crédit offert)
 *   6. SambaNova       — Llama 3.3 70B                      (rapide, gratuit)
 *   7. OpenRouter      — Llama 3.1 70B free                 (agrégateur multi-provider)
 *   8. Pollinations    — GPT-4o / Claude Sonnet             (sans clé, toujours dispo)
 *   9. Claude Anthropic — claude-sonnet-4-6                 (premium, payant)
 *  10. OpenAI          — gpt-4o-mini                        (payant)
 *
 * Basculement automatique : si un provider retourne 429 / 401 / 5xx → provider suivant.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionResult {
  text: string;
  provider?: string;
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toOpenAITools(tools: ToolDefinition[]) {
  return tools.map((t) => ({
    type: "function",
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

function parseToolCalls(toolCalls: any[]): ToolCall[] {
  return toolCalls.map((tc: any) => ({
    id: tc.id ?? `tc-${Math.random().toString(36).slice(2)}`,
    name: tc.function.name,
    arguments: (() => {
      try { return JSON.parse(tc.function.arguments || "{}"); }
      catch { return {}; }
    })(),
  }));
}

// Retourne true si l'erreur signale des crédits épuisés / quota dépassé → on skip ce provider
function isQuotaError(err: any): boolean {
  const msg = String(err?.message ?? "").toLowerCase();
  const status = err?.status ?? 0;
  return (
    status === 429 || status === 402 || status === 401 ||
    msg.includes("quota") || msg.includes("rate limit") ||
    msg.includes("insufficient") || msg.includes("billing") ||
    msg.includes("credit") || msg.includes("exceeded")
  );
}

// ─── Générique OpenAI-compatible ──────────────────────────────────────────────

async function _openAICompat(
  messages: any[],
  tools: ToolDefinition[],
  cfg: { baseUrl: string; apiKey?: string; model: string; maxTokens?: number; extraHeaders?: Record<string, string> }
): Promise<CompletionWithToolsResult> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...cfg.extraHeaders };
  if (cfg.apiKey) headers["Authorization"] = `Bearer ${cfg.apiKey}`;

  const res = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: cfg.maxTokens ?? 2000,
      messages,
      tools: toOpenAITools(tools),
      tool_choice: "auto",
    }),
  });

  if (!res.ok) {
    const errTxt = await res.text().catch(() => res.statusText);
    const err = new Error(`[${cfg.model}] HTTP ${res.status}: ${errTxt.slice(0, 200)}`);
    (err as any).status = res.status;
    throw err;
  }

  const data = await res.json();
  const choice = data.choices?.[0];

  if (choice?.finish_reason === "tool_calls" && choice.message?.tool_calls?.length) {
    return {
      toolCalls: parseToolCalls(choice.message.tool_calls),
      stopReason: "tool_use",
      provider: cfg.model,
    };
  }

  return {
    text: choice?.message?.content ?? "",
    stopReason: "end_turn",
    provider: cfg.model,
  };
}

async function _openAICompatCompletion(
  messages: ChatMessage[],
  cfg: { baseUrl: string; apiKey?: string; model: string; maxTokens?: number; extraHeaders?: Record<string, string> }
): Promise<CompletionResult> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...cfg.extraHeaders };
  if (cfg.apiKey) headers["Authorization"] = `Bearer ${cfg.apiKey}`;

  const res = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ model: cfg.model, max_tokens: cfg.maxTokens ?? 800, messages }),
  });

  if (!res.ok) {
    const errTxt = await res.text().catch(() => res.statusText);
    const err = new Error(`[${cfg.model}] HTTP ${res.status}: ${errTxt.slice(0, 200)}`);
    (err as any).status = res.status;
    throw err;
  }

  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content ?? "",
    provider: cfg.model,
  };
}

// ─── 1. NVIDIA NIM ────────────────────────────────────────────────────────────

export function hasNVIDIA(): boolean {
  return !!(process.env.NVIDIA_BASE_URL && (process.env.NVIDIA_KEY_NEMOTRON || process.env.NVIDIA_KEY_DEEPSEEK));
}

function _nvidiaCfg(model?: string, fast = false) {
  const base = process.env.NVIDIA_BASE_URL?.replace(/\/$/, "") ?? "https://integrate.api.nvidia.com/v1";
  const selectedModel = model ?? process.env.NVIDIA_MODEL_DEEPSEEK ?? "deepseek-ai/deepseek-v4-flash";
  const apiKey = selectedModel.includes("deepseek")
    ? process.env.NVIDIA_KEY_DEEPSEEK
    : process.env.NVIDIA_KEY_NEMOTRON;
  if (!apiKey) throw new Error(`Clé NVIDIA manquante pour ${selectedModel}`);
  const thinking = fast ? {} : selectedModel.includes("deepseek")
    ? { chat_template_kwargs: { thinking: true, reasoning_effort: "high" } }
    : { chat_template_kwargs: { enable_thinking: true }, reasoning_budget: 16384 };
  return { base, selectedModel, apiKey, thinking };
}

export async function completionNVIDIA(messages: ChatMessage[], maxTokens = 600, model?: string): Promise<CompletionResult> {
  const { base, selectedModel, apiKey, thinking } = _nvidiaCfg(model);
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: selectedModel, max_tokens: maxTokens, temperature: 1, top_p: 0.95, messages, ...thinking }),
  });
  if (!res.ok) { const e = new Error(`NVIDIA ${res.status}`); (e as any).status = res.status; throw e; }
  const data = await res.json();
  return { text: data.choices?.[0]?.message?.content ?? "", provider: `nvidia:${selectedModel}` };
}

export async function completionWithToolsNVIDIA(
  messages: any[], tools: ToolDefinition[], maxTokens = 2000, model?: string, fast = false
): Promise<CompletionWithToolsResult> {
  const { base, selectedModel, apiKey, thinking } = _nvidiaCfg(model, fast);
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: selectedModel, max_tokens: maxTokens, temperature: 1, top_p: 0.95,
      messages, tools: toOpenAITools(tools), tool_choice: "auto", ...thinking,
    }),
  });
  if (!res.ok) { const txt = await res.text().catch(() => ""); const e = new Error(`NVIDIA ${res.status}: ${txt.slice(0,100)}`); (e as any).status = res.status; throw e; }
  const data = await res.json();
  const choice = data.choices?.[0];
  if (choice?.finish_reason === "tool_calls" && choice.message?.tool_calls?.length) {
    return { toolCalls: parseToolCalls(choice.message.tool_calls), stopReason: "tool_use", provider: `nvidia:${selectedModel}` };
  }
  return { text: choice?.message?.content ?? "", stopReason: "end_turn", provider: `nvidia:${selectedModel}` };
}

// ─── 1b. NVIDIA NIM — Z-AI GLM-5.2 ──────────────────────────────────────────

export function hasGLM(): boolean {
  return !!(process.env.NVIDIA_BASE_URL && process.env.NVIDIA_KEY_GLM);
}

export async function completionWithToolsGLM(messages: any[], tools: ToolDefinition[], maxTokens = 2000): Promise<CompletionWithToolsResult> {
  const base = process.env.NVIDIA_BASE_URL?.replace(/\/$/, "") ?? "https://integrate.api.nvidia.com/v1";
  const apiKey = process.env.NVIDIA_KEY_GLM;
  if (!apiKey) throw new Error("NVIDIA_KEY_GLM manquante");

  return _openAICompat(messages, tools, {
    baseUrl: base,
    apiKey,
    model: "z-ai/glm-5.2",
    maxTokens,
  });
}

export async function completionGLM(messages: ChatMessage[], maxTokens = 800): Promise<CompletionResult> {
  const base = process.env.NVIDIA_BASE_URL?.replace(/\/$/, "") ?? "https://integrate.api.nvidia.com/v1";
  const apiKey = process.env.NVIDIA_KEY_GLM;
  if (!apiKey) throw new Error("NVIDIA_KEY_GLM manquante");

  return _openAICompatCompletion(messages, {
    baseUrl: base,
    apiKey,
    model: "z-ai/glm-5.2",
    maxTokens,
  });
}

// ─── 2. Groq ─────────────────────────────────────────────────────────────────

export function hasGroq(): boolean { return !!process.env.GROQ_API_KEY; }

export async function completionWithToolsGroq(messages: any[], tools: ToolDefinition[], maxTokens = 2000): Promise<CompletionWithToolsResult> {
  return _openAICompat(messages, tools, {
    baseUrl: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
    maxTokens,
  });
}

export async function completionGroq(messages: ChatMessage[], maxTokens = 800): Promise<CompletionResult> {
  return _openAICompatCompletion(messages, {
    baseUrl: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
    maxTokens,
  });
}

// ─── 3. Google Gemini ─────────────────────────────────────────────────────────

export function hasGemini(): boolean { return !!process.env.GEMINI_API_KEY; }

export async function completionWithToolsGemini(messages: any[], tools: ToolDefinition[], maxTokens = 2000): Promise<CompletionWithToolsResult> {
  return _openAICompat(messages, tools, {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-2.0-flash",
    maxTokens,
  });
}

export async function completionGemini(messages: ChatMessage[], maxTokens = 800): Promise<CompletionResult> {
  return _openAICompatCompletion(messages, {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-2.0-flash",
    maxTokens,
  });
}

// ─── 4. Cerebras ─────────────────────────────────────────────────────────────

export function hasCerebras(): boolean { return !!process.env.CEREBRAS_API_KEY; }

export async function completionWithToolsCerebras(messages: any[], tools: ToolDefinition[], maxTokens = 2000): Promise<CompletionWithToolsResult> {
  return _openAICompat(messages, tools, {
    baseUrl: "https://api.cerebras.ai/v1",
    apiKey: process.env.CEREBRAS_API_KEY,
    model: "llama-3.3-70b",
    maxTokens,
  });
}

// ─── 5. Together AI ──────────────────────────────────────────────────────────

export function hasTogether(): boolean { return !!process.env.TOGETHER_API_KEY; }

export async function completionWithToolsTogether(messages: any[], tools: ToolDefinition[], maxTokens = 2000): Promise<CompletionWithToolsResult> {
  return _openAICompat(messages, tools, {
    baseUrl: "https://api.together.xyz/v1",
    apiKey: process.env.TOGETHER_API_KEY,
    model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
    maxTokens,
  });
}

// ─── 6. SambaNova ────────────────────────────────────────────────────────────

export function hasSambaNova(): boolean { return !!process.env.SAMBANOVA_API_KEY; }

export async function completionWithToolsSambaNova(messages: any[], tools: ToolDefinition[], maxTokens = 2000): Promise<CompletionWithToolsResult> {
  return _openAICompat(messages, tools, {
    baseUrl: "https://api.sambanova.ai/v1",
    apiKey: process.env.SAMBANOVA_API_KEY,
    model: "Meta-Llama-3.3-70B-Instruct",
    maxTokens,
  });
}

// ─── 7. OpenRouter ───────────────────────────────────────────────────────────

export function hasOpenRouter(): boolean { return !!process.env.OPENROUTER_API_KEY; }

export async function completionWithToolsOpenRouter(messages: any[], tools: ToolDefinition[], maxTokens = 2000): Promise<CompletionWithToolsResult> {
  return _openAICompat(messages, tools, {
    baseUrl: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    model: "meta-llama/llama-3.1-70b-instruct:free",
    maxTokens,
    extraHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://axso.app",
      "X-Title": "Axso",
    },
  });
}

// ─── 8. Pollinations ─────────────────────────────────────────────────────────

const POLLINATIONS_BASE = "https://gen.pollinations.ai";
export function hasPollinations(): boolean { return true; }

export async function completionWithToolsPollinations(messages: any[], tools: ToolDefinition[], maxTokens = 2000): Promise<CompletionWithToolsResult> {
  return _openAICompat(messages, tools, {
    baseUrl: `${POLLINATIONS_BASE}/v1`,
    apiKey: process.env.POLLINATIONS_API_KEY,
    model: "openai-large",
    maxTokens,
  });
}

export async function completionPollinations(messages: ChatMessage[], maxTokens = 800, model = "claude-sonnet-5"): Promise<CompletionResult> {
  return _openAICompatCompletion(messages, {
    baseUrl: `${POLLINATIONS_BASE}/v1`,
    apiKey: process.env.POLLINATIONS_API_KEY,
    model,
    maxTokens,
  });
}

export function pollinationsImageUrl(prompt: string, model: "gptimage" | "seedream-pro" | "flux" | "ideogram-v4-quality" = "flux", seed?: number): string {
  const s = seed ?? Math.floor(Math.random() * 999999);
  const keyParam = process.env.POLLINATIONS_API_KEY ? `&key=${process.env.POLLINATIONS_API_KEY}` : "";
  return `${POLLINATIONS_BASE}/image/${encodeURIComponent(prompt)}?model=${model}&width=1024&height=1024&nologo=true&enhance=true&seed=${s}${keyParam}`;
}

export function pollinationsVideoUrl(prompt: string, model: "seedance-2.0" | "veo" | "wan-pro-1080p" | "wan" = "seedance-2.0", duration = 5): string {
  const keyParam = process.env.POLLINATIONS_API_KEY ? `&key=${process.env.POLLINATIONS_API_KEY}` : "";
  return `${POLLINATIONS_BASE}/video/${encodeURIComponent(prompt)}?model=${model}&duration=${duration}&nologo=true${keyParam}`;
}

export function pollinationsAudioUrl(text: string, voice = "nova", model: "elevenlabs" | "eleven-multilingual-v2" | "qwen-tts" = "eleven-multilingual-v2"): string {
  const keyParam = process.env.POLLINATIONS_API_KEY ? `&key=${process.env.POLLINATIONS_API_KEY}` : "";
  return `${POLLINATIONS_BASE}/audio/${encodeURIComponent(text)}?voice=${voice}&model=${model}&nologo=true${keyParam}`;
}

// ─── 9. Claude Anthropic ─────────────────────────────────────────────────────

export function hasAnthropic(): boolean { return !!process.env.ANTHROPIC_API_KEY; }

// ─── 10. OpenAI ──────────────────────────────────────────────────────────────

export function hasOpenAI(): boolean { return !!process.env.OPENAI_API_KEY; }
export function hasFreeLLM(): boolean { return !!(process.env.FREELLMAPI_URL && process.env.FREELLMAPI_KEY); }

export async function completionWithToolsOpenAI(messages: any[], tools: ToolDefinition[], maxTokens = 2000, model = "gpt-4o-mini"): Promise<CompletionWithToolsResult> {
  return _openAICompat(messages, tools, {
    baseUrl: "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY,
    model,
    maxTokens,
  });
}

export async function completionWithToolsFreeLLM(messages: any[], tools: ToolDefinition[], maxTokens = 2000): Promise<CompletionWithToolsResult> {
  const baseURL = process.env.FREELLMAPI_URL?.replace(/\/$/, "");
  const apiKey = process.env.FREELLMAPI_KEY;
  if (!baseURL || !apiKey) throw new Error("FREELLMAPI non configuré");
  return _openAICompat(messages, tools, { baseUrl: baseURL, apiKey, model: "auto", maxTokens });
}

export async function completionFreeLLM(messages: ChatMessage[], maxTokens = 800): Promise<CompletionResult> {
  const baseURL = process.env.FREELLMAPI_URL?.replace(/\/$/, "");
  const apiKey = process.env.FREELLMAPI_KEY;
  if (!baseURL || !apiKey) throw new Error("FREELLMAPI non configuré");
  return _openAICompatCompletion(messages, { baseUrl: baseURL, apiKey, model: "gpt-4o-mini", maxTokens });
}

export async function streamWithOpenAI(messages: any[], tools: ToolDefinition[], maxTokens = 1500, model = "gpt-4o-mini"): Promise<globalThis.Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY manquante");
  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, max_tokens: maxTokens, messages, tools: toOpenAITools(tools), tool_choice: "auto", stream: true }),
  });
}

// ─── AUTO FALLBACK ────────────────────────────────────────────────────────────

type ProviderFn = () => Promise<CompletionWithToolsResult>;
type SimpleProviderFn = () => Promise<CompletionResult>;

// Construit la chaîne de providers disponibles selon les clés .env
function buildChain(messages: any[], tools: ToolDefinition[], maxTokens: number, fast = false): Array<{ name: string; fn: ProviderFn }> {
  const chain: Array<{ name: string; fn: ProviderFn }> = [];

  if (hasNVIDIA()) chain.push({ name: "nvidia", fn: () => completionWithToolsNVIDIA(messages, tools, maxTokens, undefined, fast) });
  if (hasGLM()) chain.push({ name: "glm-5.2", fn: () => completionWithToolsGLM(messages, tools, maxTokens) });
  if (hasGroq()) chain.push({ name: "groq", fn: () => completionWithToolsGroq(messages, tools, maxTokens) });
  if (hasGemini()) chain.push({ name: "gemini", fn: () => completionWithToolsGemini(messages, tools, maxTokens) });
  if (hasCerebras()) chain.push({ name: "cerebras", fn: () => completionWithToolsCerebras(messages, tools, maxTokens) });
  if (hasTogether()) chain.push({ name: "together", fn: () => completionWithToolsTogether(messages, tools, maxTokens) });
  if (hasSambaNova()) chain.push({ name: "sambanova", fn: () => completionWithToolsSambaNova(messages, tools, maxTokens) });
  if (hasOpenRouter()) chain.push({ name: "openrouter", fn: () => completionWithToolsOpenRouter(messages, tools, maxTokens) });
  if (hasFreeLLM()) chain.push({ name: "freellm", fn: () => completionWithToolsFreeLLM(messages, tools, maxTokens) });
  // Pollinations toujours en dernier recours (sans clé)
  chain.push({ name: "pollinations", fn: () => completionWithToolsPollinations(messages, tools, maxTokens) });

  return chain;
}

function buildSimpleChain(messages: ChatMessage[], maxTokens: number): Array<{ name: string; fn: SimpleProviderFn }> {
  const chain: Array<{ name: string; fn: SimpleProviderFn }> = [];
  if (hasNVIDIA()) chain.push({ name: "nvidia", fn: () => completionNVIDIA(messages, maxTokens) });
  if (hasGLM()) chain.push({ name: "glm-5.2", fn: () => completionGLM(messages, maxTokens) });
  if (hasGroq()) chain.push({ name: "groq", fn: () => completionGroq(messages, maxTokens) });
  if (hasGemini()) chain.push({ name: "gemini", fn: () => completionGemini(messages, maxTokens) });
  chain.push({ name: "pollinations", fn: () => completionPollinations(messages, maxTokens) });
  return chain;
}

/**
 * Appel avec tool use — essaie chaque provider dans l'ordre, bascule automatiquement
 * si crédits épuisés, quota dépassé, ou erreur réseau.
 */
export async function completionWithToolsAuto(
  messages: any[],
  tools: ToolDefinition[],
  maxTokens = 2000,
  fast = false
): Promise<CompletionWithToolsResult> {
  const chain = buildChain(messages, tools, maxTokens, fast);
  const errors: string[] = [];

  for (const { name, fn } of chain) {
    try {
      const result = await fn();
      if (result.provider && !result.provider.includes(name)) {
        result.provider = `${name}:${result.provider}`;
      }
      if (errors.length > 0) {
        console.log(`[llm-auto] Succès via ${name} (après ${errors.length} échec(s): ${errors.join(", ")})`);
      }
      return result;
    } catch (err: any) {
      const msg = `${name}: ${err?.message?.slice(0, 80) ?? "erreur"}`;
      errors.push(msg);
      console.warn(`[llm-auto] ${msg} — bascule vers le provider suivant`);
    }
  }

  throw new Error(`Tous les providers IA ont échoué:\n${errors.join("\n")}`);
}

/**
 * Completion simple (sans tool use) avec fallback automatique.
 */
export async function completionAuto(
  messages: ChatMessage[],
  maxTokens = 800
): Promise<CompletionResult> {
  const chain = buildSimpleChain(messages, maxTokens);
  const errors: string[] = [];

  for (const { name, fn } of chain) {
    try {
      return await fn();
    } catch (err: any) {
      errors.push(`${name}: ${err?.message?.slice(0, 60) ?? "erreur"}`);
      console.warn(`[llm-auto] ${name} indisponible, bascule suivante`);
    }
  }

  throw new Error(`Tous les providers IA ont échoué: ${errors.join(", ")}`);
}
