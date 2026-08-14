// Xia — voix off éphémère pour le mode vocal (pas de persistance, contrairement à /api/ai/voix-off)
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";
const VOIX_XIA = "EXAVITQu4vr4xnSDxMaL"; // Sarah — voix française pro, chaleureuse

const schema = z.object({
  texte: z.string().min(1).max(1000),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

    const elevenKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenKey) return NextResponse.json({ message: "TTS premium indisponible" }, { status: 503 });

    const { texte } = schema.parse(await req.json());
    const texteClean = texte.replace(/[*_`#>]/g, "").replace(/\[IMAGE:[^\]]+\]|\[VIDEO:[^\]]+\]|\[AUDIO:[^\]]+\]/gi, "").slice(0, 800);
    if (!texteClean.trim()) return NextResponse.json({ message: "Texte vide" }, { status: 400 });

    const elRes = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${VOIX_XIA}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "xi-api-key": elevenKey, Accept: "audio/mpeg" },
      body: JSON.stringify({
        text: texteClean,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
      }),
    });

    if (!elRes.ok) return NextResponse.json({ message: "Erreur TTS" }, { status: 502 });

    const buf = await elRes.arrayBuffer();
    return new Response(buf, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ message: "Format invalide" }, { status: 400 });
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
