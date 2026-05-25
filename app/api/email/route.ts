// API — Email marketing via Resend
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const tenantId = (session.user as any)?.tenantId;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });

  const { sujet, corps, segment } = await req.json();

  const where: any = { tenantId };
  if (segment === "nouveaux") where.commandes = { some: {}, none: { createdAt: { lt: new Date(Date.now() - 86400000 * 30) } } };

  const clients = await prisma.client.findMany({ where, select: { email: true, nom: true } });
  const clientsAvecEmail = clients.filter((c) => c.email);

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ success: true, envoyes: clientsAvecEmail.length, mode: "simulation" });
  }

  let envoyes = 0;
  for (const client of clientsAvecEmail.slice(0, 50)) {
    const corpsFinal = corps
      .replace("{prenom}", client.nom.split(" ")[0])
      .replace("{boutique}", tenant.nomBoutique);
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `${tenant.nomBoutique} <noreply@axso.com>`,
          to: [client.email!],
          subject: sujet,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px"><h2 style="color:#F5A623">${tenant.nomBoutique}</h2><p>${corpsFinal.replace(/\n/g, "<br>")}</p><hr style="border-color:#eee;margin:24px 0"><p style="color:#999;font-size:12px">Vous recevez cet email car vous êtes client de ${tenant.nomBoutique}.<br>Powered by <a href="https://axso.com" style="color:#F5A623">Axso</a></p></div>`,
        }),
      });
      envoyes++;
    } catch {}
  }

  return NextResponse.json({ success: true, envoyes });
}
