// API Génération Vidéo IA — fal.ai
// Docs : https://fal.ai/models/fal-ai/wan-video
// Clé gratuite : https://fal.ai → Dashboard → API Keys (crédits offerts à l'inscription)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const FAL_BASE = "https://queue.fal.run";

const schemaGenerer = z.object({
  prompt: z.string().min(5),
  style: z.enum(["product", "ugc", "ad", "demo"]).default("product"),
  duree: z.enum(["5s", "10s"]).default("5s"),
  ratio: z.enum(["16:9", "9:16", "1:1"]).default("16:9"),
});

// Enrichit le prompt selon le style
function enrichirPrompt(prompt: string, style: string): string {
  const enrichissements: Record<string, string> = {
    product: `${prompt}, professional product video, clean studio background, smooth camera movement, 4K cinematic quality, African e-commerce style`,
    ugc: `${prompt}, authentic UGC style video, natural lighting, real person holding product, casual African lifestyle, Instagram Reels format`,
    ad: `${prompt}, professional advertisement video, dynamic cuts, text overlays ready, high energy, African market targeted, conversion optimized`,
    demo: `${prompt}, detailed product demonstration video, close-up shots, feature highlight, educational style, clear and professional`,
  };
  return enrichissements[style] || prompt;
}

// POST /api/ai/video — Lancer la génération
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    const tenantId = (session.user as any)?.tenantId;

    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      return NextResponse.json({
        message: "FAL_KEY manquante dans .env.local. Créez un compte sur fal.ai pour obtenir votre clé gratuite.",
        signup: "https://fal.ai",
      }, { status: 503 });
    }

    const body = await req.json();
    const { prompt, style, duree, ratio } = schemaGenerer.parse(body);
    const promptEnrichi = enrichirPrompt(prompt, style);

    // Créer l'entrée en DB avec statut "en_cours"
    const video = await prisma.videoGeneree.create({
      data: { tenantId, prompt: promptEnrichi, style, statut: "en_cours" },
    });

    // Lancer la génération sur fal.ai (async queue)
    const falRes = await fetch(`${FAL_BASE}/fal-ai/wan-video`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${falKey}`,
      },
      body: JSON.stringify({
        prompt: promptEnrichi,
        num_frames: duree === "10s" ? 81 : 49,
        fps: 8,
        aspect_ratio: ratio,
        negative_prompt: "blurry, low quality, watermark, text overlay, distorted",
      }),
    });

    if (!falRes.ok) {
      const err = await falRes.text();
      await prisma.videoGeneree.update({ where: { id: video.id }, data: { statut: "erreur", erreur: err } });
      return NextResponse.json({ message: `fal.ai erreur: ${err}` }, { status: 500 });
    }

    const falData = await falRes.json();
    const requestId = falData.request_id || falData.id;

    // Sauvegarder le requestId pour polling
    await prisma.videoGeneree.update({ where: { id: video.id }, data: { requestId } });

    return NextResponse.json({ videoId: video.id, requestId, statut: "en_cours" });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ message: "Données invalides" }, { status: 400 });
    console.error("[API/VIDEO]", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

// GET /api/ai/video?videoId=xxx — Vérifier le statut
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

    const videoId = req.nextUrl.searchParams.get("videoId");
    if (!videoId) return NextResponse.json({ message: "videoId requis" }, { status: 400 });

    const video = await prisma.videoGeneree.findUnique({ where: { id: videoId } });
    if (!video) return NextResponse.json({ message: "Vidéo introuvable" }, { status: 404 });

    // Si déjà terminée ou en erreur, retourner directement
    if (video.statut !== "en_cours") {
      return NextResponse.json(video);
    }

    // Checker le statut chez fal.ai
    const falKey = process.env.FAL_KEY;
    if (!falKey || !video.requestId) {
      return NextResponse.json(video);
    }

    const statusRes = await fetch(`${FAL_BASE}/fal-ai/wan-video/requests/${video.requestId}/status`, {
      headers: { Authorization: `Key ${falKey}` },
    });

    if (!statusRes.ok) return NextResponse.json(video);

    const statusData = await statusRes.json();

    if (statusData.status === "COMPLETED") {
      // Récupérer le résultat
      const resultRes = await fetch(`${FAL_BASE}/fal-ai/wan-video/requests/${video.requestId}`, {
        headers: { Authorization: `Key ${falKey}` },
      });
      const result = await resultRes.json();
      const videoUrl = result.video?.url || result.output?.video?.url;
      const thumbnailUrl = result.thumbnail?.url;

      const updated = await prisma.videoGeneree.update({
        where: { id: videoId },
        data: { videoUrl, thumbnailUrl, statut: "pret", duree: statusData.duration },
      });
      return NextResponse.json(updated);
    }

    if (statusData.status === "FAILED") {
      const updated = await prisma.videoGeneree.update({
        where: { id: videoId },
        data: { statut: "erreur", erreur: statusData.error || "Génération échouée" },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ ...video, progress: statusData.progress });
  } catch (err) {
    console.error("[API/VIDEO/STATUS]", err);
    return NextResponse.json({ message: "Erreur" }, { status: 500 });
  }
}
