import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";

const TYPES_AUTORISES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const TAILLE_MAX = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
    if (!TYPES_AUTORISES.includes(file.type)) {
      return NextResponse.json({ error: "Format non supporté (JPEG, PNG, WebP, GIF)" }, { status: 400 });
    }
    if (file.size > TAILLE_MAX) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 5 MB)" }, { status: 400 });
    }

    const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const filename = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const blob = await put(filename, file, { access: "public" });

    return NextResponse.json({ url: blob.url, filename: blob.pathname });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
