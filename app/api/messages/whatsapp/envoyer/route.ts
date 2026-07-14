import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const tenantId = (session.user as any)?.tenantId;

  const { contact, message } = await req.json();
  if (!contact || !message?.trim()) {
    return NextResponse.json({ error: "contact et message requis" }, { status: 400 });
  }

  // Récupérer la config WhatsApp du tenant
  const waConfig = await prisma.connecteurConfig.findFirst({
    where: { tenantId, type: "whatsapp" },
  });
  const token = (waConfig?.accessToken) ?? process.env.WHATSAPP_TOKEN;
  const phoneId = ((waConfig?.config as any)?.phone_number_id) ?? process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    return NextResponse.json({ error: "WhatsApp Business non configuré" }, { status: 503 });
  }

  const numero = contact.replace(/\D/g, "");

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: numero,
      type: "text",
      text: { body: message },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data.error?.message ?? "Erreur envoi WhatsApp" }, { status: 502 });
  }

  // Sauvegarder le message sortant dans la DB
  await prisma.messageRecu.create({
    data: {
      tenantId,
      source: "whatsapp",
      de: contact,
      corps: message,
      direction: "sortant",
      lu: true,
      repondu: true,
      waMessageId: data.messages?.[0]?.id ?? null,
      payload: data,
    },
  });

  // Marquer les entrants de ce contact comme répondus
  await prisma.messageRecu.updateMany({
    where: { tenantId, source: "whatsapp", de: contact, direction: "entrant", repondu: false },
    data: { repondu: true },
  });

  return NextResponse.json({ success: true, waMessageId: data.messages?.[0]?.id });
}
