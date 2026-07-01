// API Voix Off IA — ElevenLabs TTS
// Clé gratuite : https://elevenlabs.io → 10 000 caractères/mois offerts
// Docs : https://elevenlabs.io/docs/api-reference/text-to-speech

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

// Voix disponibles (multilingues, adaptées au marché africain)
export const VOIX_DISPONIBLES = [
  { id: "EXAVITQu4vr4xnSDxMaL", nom: "Sarah", langue: "fr", genre: "F", style: "Pro" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", nom: "Liam", langue: "fr", genre: "M", style: "Chaleureux" },
  { id: "pFZP5JQG7iQjIQuC4Bku", nom: "Lily", langue: "fr", genre: "F", style: "Doux" },
  { id: "onwK4e9ZLuTAKqWW03F9", nom: "Daniel", langue: "fr", genre: "M", style: "Autoritaire" },
  { id: "XB0fDUnXU5powFXDhCwa", nom: "Charlotte", langue: "fr", genre: "F", style: "Jeune" },
  { id: "nPczCjzI2devNBz1zQrb", nom: "Brian", langue: "en", genre: "M", style: "Américain" },
  { id: "N2lVS1w4EtoT3dr4eOWO", nom: "Callum", langue: "en", genre: "M", style: "Britannique" },
];

const schema = z.object({
  texte: z.string().min(1).max(5000),
  voixId: z.string().default("EXAVITQu4vr4xnSDxMaL"),
  stabilite: z.number().min(0).max(1).default(0.5),
  similarite: z.number().min(0).max(1).default(0.8),
  style: z.number().min(0).max(1).default(0.3),
});

// POST /api/ai/voix-off — Générer une voix off
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    const tenantId = (session.user as any)?.tenantId;

    const elevenKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenKey) {
      return NextResponse.json({
        message: "ELEVENLABS_API_KEY manquante dans .env.local. Créez un compte gratuit sur elevenlabs.io",
        signup: "https://elevenlabs.io",
      }, { status: 503 });
    }

    const body = await req.json();
    const { texte, voixId, stabilite, similarite, style } = schema.parse(body);

    // Créer l'entrée en DB
    const voixOff = await prisma.voixOff.create({
      data: { tenantId, texte, voixId, statut: "en_cours" },
    });

    // Appel ElevenLabs
    const elRes = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voixId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": elevenKey,
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: texte,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: stabilite,
          similarity_boost: similarite,
          style,
          use_speaker_boost: true,
        },
      }),
    });

    if (!elRes.ok) {
      const erreur = await elRes.text();
      await prisma.voixOff.update({ where: { id: voixOff.id }, data: { statut: "erreur" } });
      return NextResponse.json({ message: `ElevenLabs erreur: ${erreur}` }, { status: 500 });
    }

    // Retourner l'audio en base64 pour le player côté client
    const audioBuffer = await elRes.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");
    const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`;

    // Mettre à jour en DB
    await prisma.voixOff.update({
      where: { id: voixOff.id },
      data: { statut: "pret", audioUrl: audioDataUrl },
    });

    return NextResponse.json({
      voixOffId: voixOff.id,
      audioUrl: audioDataUrl,
      statut: "pret",
      caracteres: texte.length,
    });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ message: "Données invalides" }, { status: 400 });
    console.error("[API/VOIX-OFF]", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

// GET /api/ai/voix-off — Liste des voix disponibles
export async function GET() {
  return NextResponse.json({ voix: VOIX_DISPONIBLES });
}
