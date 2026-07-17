import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: "ANTHROPIC_API_KEY manquante dans les env vars" }, { status: 500 });

  const keyPreview = key.slice(0, 20) + "..." + key.slice(-6);

  try {
    const client = new Anthropic({ apiKey: key });
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 50,
      messages: [{ role: "user", content: "Dis juste: OK" }],
    });
    const text = (response.content as any[]).find((b: any) => b.type === "text")?.text ?? "";
    return NextResponse.json({
      status: "OK",
      model: "claude-opus-4-8",
      key: keyPreview,
      response: text,
      usage: response.usage,
    });
  } catch (err: any) {
    return NextResponse.json({
      status: "ERREUR",
      key: keyPreview,
      error: err?.message ?? String(err),
      httpStatus: err?.status ?? null,
      type: err?.error?.type ?? null,
    }, { status: 200 });
  }
}
