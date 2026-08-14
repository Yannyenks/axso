/**
 * LLM Client — Gemini only, via le SDK officiel @google/genai
 *
 * Toute la solution Axso tourne exclusivement sur Google Gemini pour le
 * raisonnement/texte. Aucun autre fournisseur (Claude, GPT, Groq, NVIDIA,
 * Cerebras, Together, SambaNova, OpenRouter...) n'est utilisé pour la génération
 * de texte ou l'exécution d'outils.
 *
 * La génération média (images/vidéo/audio) reste un sujet distinct — voir
 * pollinationsImageUrl / pollinationsVideoUrl / pollinationsAudioUrl ci-dessous,
 * ainsi que lib/image-gen.ts.
 */
import { GoogleGenAI } from "@google/genai";

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
  /** Signature opaque Gemini à ré-échoïr telle quelle sur le tour suivant (requis par l'API même thinking désactivé) */
  signature?: string;
}

export interface CompletionWithToolsResult {
  text?: string;
  toolCalls?: ToolCall[];
  stopReason: "end_turn" | "tool_use";
  provider?: string;
}

const GEMINI_MODEL = "gemini-3.1-flash-lite";

// ─── Client Gemini (singleton) ────────────────────────────────────────────────

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY manquante");
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

export function hasGemini(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Supprime les balises de raisonnement interne que le modèle peut inclure dans ses réponses */
function cleanModelResponse(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
    .replace(/RÈGLES ABSOLUES\s*:[\s\S]*?(?=\n\n|$)/gm, "")
    .replace(/OUTILS DISPONIBLES[\s\S]*?(?=\n\n|$)/gm, "")
    .replace(/BOUTIQUE ACTIVE\s*:.*$/gm, "")
    .trim();
}

/** Convertit un schéma JSON (type: "object"/"string"/...) au format attendu par Gemini (Type: "OBJECT"/"STRING"/...) */
function toGeminiSchema(schema: any): any {
  if (!schema || typeof schema !== "object") return schema;
  const out: any = Array.isArray(schema) ? [...schema] : { ...schema };
  if (typeof out.type === "string") out.type = out.type.toUpperCase();
  if (out.properties) {
    out.properties = Object.fromEntries(
      Object.entries(out.properties).map(([k, v]) => [k, toGeminiSchema(v)])
    );
  }
  if (out.items) out.items = toGeminiSchema(out.items);
  return out;
}

function toGeminiTools(tools: ToolDefinition[]) {
  if (!tools.length) return undefined;
  return [
    {
      functionDeclarations: tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: toGeminiSchema(t.parameters),
      })),
    },
  ];
}

/** Convertit un contenu utilisateur (string, ou tableau de blocs OpenAI-style text/image_url) en parts Gemini */
async function toGeminiParts(content: any): Promise<any[]> {
  if (typeof content === "string" || content == null) {
    return [{ text: String(content ?? "") }];
  }
  if (!Array.isArray(content)) {
    return [{ text: String(content) }];
  }

  const parts: any[] = [];
  for (const block of content) {
    if (block?.type === "text") {
      parts.push({ text: block.text ?? "" });
      continue;
    }
    if (block?.type === "image_url") {
      const url = block.image_url?.url ?? block.image_url;
      if (typeof url === "string" && url.startsWith("data:")) {
        const [meta, data] = url.split(",");
        const mimeType = meta.match(/data:(.*?);base64/)?.[1] ?? "image/jpeg";
        parts.push({ inlineData: { mimeType, data } });
      } else if (typeof url === "string") {
        try {
          const res = await fetch(url);
          const buf = await res.arrayBuffer();
          const mimeType = res.headers.get("content-type") ?? "image/jpeg";
          parts.push({ inlineData: { mimeType, data: Buffer.from(buf).toString("base64") } });
        } catch {
          // Image inaccessible — on l'ignore plutôt que de faire échouer toute la requête
        }
      }
      continue;
    }
  }
  return parts.length ? parts : [{ text: "" }];
}

async function toGeminiContents(messages: any[]): Promise<{ systemInstruction: string; contents: any[] }> {
  let systemInstruction = "";
  const contents: any[] = [];
  const idToName: Record<string, string> = {};

  for (const m of messages) {
    if (!m) continue;

    if (m.role === "system") {
      systemInstruction += (systemInstruction ? "\n\n" : "") + (m.content ?? "");
      continue;
    }

    if (m.role === "user") {
      contents.push({ role: "user", parts: await toGeminiParts(m.content) });
      continue;
    }

    if (m.role === "assistant") {
      if (m.tool_calls?.length) {
        const parts = m.tool_calls.map((tc: any) => {
          const name = tc.function?.name ?? tc.name;
          const args = (() => {
            try { return JSON.parse(tc.function?.arguments ?? "{}"); }
            catch { return {}; }
          })();
          idToName[tc.id] = name;
          const part: any = { functionCall: { id: tc.id, name, args } };
          if (tc.signature) part.thoughtSignature = tc.signature;
          return part;
        });
        contents.push({ role: "model", parts });
      } else {
        contents.push({ role: "model", parts: [{ text: String(m.content ?? "") }] });
      }
      continue;
    }

    if (m.role === "tool") {
      const name = idToName[m.tool_call_id] ?? "unknown";
      contents.push({
        role: "user",
        parts: [{ functionResponse: { id: m.tool_call_id, name, response: { result: String(m.content ?? "") } } }],
      });
      continue;
    }
  }

  return { systemInstruction, contents };
}

// ─── Complétion simple (sans tool use) ────────────────────────────────────────

export async function completionGemini(messages: ChatMessage[], maxTokens = 800): Promise<CompletionResult> {
  const client = getGeminiClient();
  const { systemInstruction, contents } = await toGeminiContents(messages);

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: {
      ...(systemInstruction ? { systemInstruction } : {}),
      maxOutputTokens: maxTokens,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  return { text: cleanModelResponse(response.text ?? ""), provider: GEMINI_MODEL };
}

// ─── Complétion avec tool use ─────────────────────────────────────────────────

export async function completionWithToolsGemini(
  messages: any[],
  tools: ToolDefinition[],
  maxTokens = 2000
): Promise<CompletionWithToolsResult> {
  const client = getGeminiClient();
  const { systemInstruction, contents } = await toGeminiContents(messages);

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: {
      ...(systemInstruction ? { systemInstruction } : {}),
      ...(tools.length ? { tools: toGeminiTools(tools) } : {}),
      maxOutputTokens: maxTokens,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  // On relit les parts brutes (pas le getter response.functionCalls) pour récupérer le
  // thoughtSignature attaché à chaque part — l'API l'exige en écho sur le tour suivant,
  // même thinking désactivé, sous peine de 400 "missing a thought_signature".
  const rawParts = response.candidates?.[0]?.content?.parts ?? [];
  const functionCallParts = rawParts.filter((p) => p.functionCall);
  if (functionCallParts.length > 0) {
    const toolCalls: ToolCall[] = functionCallParts.map((p) => ({
      id: p.functionCall!.id ?? `tc-${Math.random().toString(36).slice(2)}`,
      name: p.functionCall!.name ?? "",
      arguments: (p.functionCall!.args as Record<string, any>) ?? {},
      signature: p.thoughtSignature,
    }));
    return { toolCalls, stopReason: "tool_use", provider: GEMINI_MODEL };
  }

  return { text: cleanModelResponse(response.text ?? ""), stopReason: "end_turn", provider: GEMINI_MODEL };
}

// ─── Streaming (synthèse de réponse) ──────────────────────────────────────────

/** Stream Gemini natif — utilisé par lib/agent-runner.ts pour la synthèse SSE */
export async function* streamGemini(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  maxTokens = 4000
): AsyncGenerator<string> {
  const client = getGeminiClient();
  const { contents } = await toGeminiContents(messages);

  const stream = await client.models.generateContentStream({
    model: GEMINI_MODEL,
    contents,
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: maxTokens,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) yield text;
  }
}

// ─── Points d'entrée génériques (compat des appelants existants) ─────────────

export async function completionAuto(messages: ChatMessage[], maxTokens = 800): Promise<CompletionResult> {
  return completionGemini(messages, maxTokens);
}

export async function completionWithToolsAuto(
  messages: any[],
  tools: ToolDefinition[],
  maxTokens = 2000,
  _fast = false
): Promise<CompletionWithToolsResult> {
  return completionWithToolsGemini(messages, tools, maxTokens);
}

// ─── Génération média (Pollinations — hors périmètre du moteur de raisonnement) ─

const POLLINATIONS_BASE = "https://gen.pollinations.ai";

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
