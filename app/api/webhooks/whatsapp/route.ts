// Webhook WhatsApp Business Cloud API — messages entrants + statuts de livraison
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN ?? "axso_meta_2026";

// ── GET : vérification Meta ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const p = new URL(req.url).searchParams;
  if (p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === VERIFY_TOKEN) {
    return new NextResponse(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return NextResponse.json({ error: "Token invalide" }, { status: 403 });
}

// ── POST : traitement des messages + statuts ─────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ received: true });
    }

    for (const entry of (body.entry ?? [])) {
      for (const change of (entry.changes ?? [])) {
        if (change.field !== "messages") continue;
        const val = change.value;

        // Trouver le tenant via le phone_number_id
        const phoneId = val?.metadata?.phone_number_id;
        const config = phoneId
          ? await prisma.connecteurConfig.findFirst({
              where: { type: "whatsapp", config: { path: ["phone_number_id"], equals: phoneId } },
              select: { tenantId: true },
            })
          : null;
        const tenantId = config?.tenantId;

        // ── Messages entrants ────────────────────────────────────────────────
        for (const msg of (val.messages ?? [])) {
          const de = msg.from;
          const corps = extraireCorps(msg);
          if (!corps) continue;

          const nom = val.contacts?.find((c: any) => c.wa_id === de)?.profile?.name ?? undefined;

          if (tenantId) {
            // Éviter les doublons via waMessageId
            const existant = msg.id
              ? await prisma.messageRecu.findFirst({ where: { waMessageId: msg.id } })
              : null;

            if (!existant) {
              // Détecter la commande liée (par numéro de téléphone)
              const telephone = de.replace(/\D/g, "").slice(-8);
              const commandeLiee = await prisma.commande.findFirst({
                where: { tenantId, clientTelephone: { contains: telephone } },
                orderBy: { createdAt: "desc" },
                select: { id: true, numero: true, statut: true },
              }).catch(() => null);

              await prisma.messageRecu.create({
                data: {
                  tenantId,
                  source: "whatsapp",
                  de,
                  nom,
                  corps,
                  waMessageId: msg.id ?? null,
                  commandeId: commandeLiee?.id ?? null,
                  payload: msg,
                },
              }).catch(() => {});

              // Auto-confirmation de commande sur mots-clés
              await detecterEtConfirmerCommande(tenantId, de, corps, commandeLiee, phoneId).catch(() => {});

              // Auto-réponse chatbot IA (best-effort)
              autoRepondre(tenantId, de, corps, phoneId).catch(() => {});
            }
          }

          // Marquer comme lu côté Meta (best-effort)
          await marquerLu(phoneId, msg.id, val.metadata?.display_phone_number).catch(() => {});
        }

        // ── Statuts de livraison ─────────────────────────────────────────────
        for (const status of (val.statuses ?? [])) {
          // Les statuts (sent/delivered/read/failed) sont loggés — utile pour analytics
          if (status.status === "failed" && tenantId) {
            console.warn(`[webhook/whatsapp] Message ${status.id} échoué pour tenant ${tenantId}:`, status.errors);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook/whatsapp]", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

const MOTS_CONFIRMATION = ["oui", "confirmer", "confirme", "ok", "1", "yes", "valider", "valide", "d'accord", "accord", "c'est bon", "cest bon"];

async function detecterEtConfirmerCommande(
  tenantId: string,
  de: string,
  message: string,
  commande: { id: string; numero: string; statut: string } | null,
  phoneId: string
) {
  if (!commande || commande.statut !== "en_attente") return;

  const texte = message.toLowerCase().trim();
  const estConfirmation = MOTS_CONFIRMATION.some(m => texte === m || texte.startsWith(m + " ") || texte.endsWith(" " + m));
  if (!estConfirmation) return;

  // Confirmer la commande
  await prisma.commande.update({ where: { id: commande.id }, data: { statut: "confirmee" } });

  // Envoyer confirmation WhatsApp au client
  const { notifierClientWhatsApp } = await import("@/lib/whatsapp");
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { nomBoutique: true, slug: true } });
  if (tenant) {
    const numero = de.startsWith("+") ? de : `+${de}`;
    await notifierClientWhatsApp({
      telephone: numero,
      statut: "confirmee",
      numero: commande.numero,
      boutique: tenant.nomBoutique,
      slug: tenant.slug,
      commandeId: commande.id,
    });
  }
}

async function autoRepondre(tenantId: string, de: string, messageRecu: string, phoneId: string) {
  // Vérifier si le chatbot est actif pour ce tenant
  const chatbotConfig = await prisma.connecteurConfig.findFirst({
    where: { tenantId, type: "chatbot_whatsapp", statut: "actif" },
  });
  if (!chatbotConfig) return;

  const cfg = chatbotConfig.config as any;

  // Vérifier mots-clés exclus
  const exclure = (cfg.motsClesExclus ?? []) as string[];
  if (exclure.some((mc: string) => messageRecu.toLowerCase().includes(mc.toLowerCase()))) return;

  // Vérifier horaires
  if (cfg.horaires?.actif) {
    const now = new Date();
    const [hDeb, mDeb] = (cfg.horaires.debut ?? "08:00").split(":").map(Number);
    const [hFin, mFin] = (cfg.horaires.fin ?? "20:00").split(":").map(Number);
    const totalNow = now.getHours() * 60 + now.getMinutes();
    const totalDeb = hDeb * 60 + mDeb;
    const totalFin = hFin * 60 + mFin;
    if (totalNow < totalDeb || totalNow > totalFin) return;
  }

  // Délai naturel avant réponse
  const delai = (cfg.delaiReponse ?? 0) * 1000;
  if (delai > 0) await new Promise(r => setTimeout(r, delai));

  // Récupérer contexte boutique
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { nomBoutique: true } }).catch(() => null);

  // Appel IA via AXIA
  const { executerOutilMcp } = await import("@/lib/mcp/executor");
  const personnalite = cfg.personnalite ?? "professionnel";
  const langue = cfg.langue ?? "fr";
  const instructionsSupp = cfg.instructionsSupp ?? "";

  const systeme = `Tu es AXIA, l'assistante IA de la boutique "${tenant?.nomBoutique ?? "cette boutique"}".
Style de réponse: ${personnalite === "professionnel" ? "Formel, courtois, centré sur le service client" : personnalite === "chaleureux" ? "Amical, enthousiaste, proche des clients" : personnalite === "concis" ? "Réponses courtes et directes" : "Commercial, met en avant les produits"}.
Langue: ${langue}.
Réponds UNIQUEMENT au message du client, de façon naturelle et utile.
${instructionsSupp ? `Instructions supplémentaires: ${instructionsSupp}` : ""}
Ne mentionne jamais que tu es un bot. Réponds en 2-3 phrases maximum.`;

  const result = await executerOutilMcp("claude_generer_texte", {
    instruction: systeme,
    contenu: messageRecu,
  }, tenantId);

  if (!result.succes || !result.resultat) return;

  // Envoyer la réponse via WhatsApp
  const waConfig = await prisma.connecteurConfig.findFirst({ where: { tenantId, type: "whatsapp" } });
  const token = waConfig?.accessToken ?? process.env.WHATSAPP_TOKEN;
  if (!token || !phoneId) return;

  await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: de,
      type: "text",
      text: { body: result.resultat },
    }),
  });
}

function extraireCorps(msg: any): string {
  if (msg.type === "text") return msg.text?.body ?? "";
  if (msg.type === "image") return `[Image] ${msg.image?.caption ?? ""}`;
  if (msg.type === "audio") return "[Message vocal]";
  if (msg.type === "video") return `[Vidéo] ${msg.video?.caption ?? ""}`;
  if (msg.type === "document") return `[Document] ${msg.document?.filename ?? ""}`;
  if (msg.type === "location") return `[Position] lat:${msg.location?.latitude} lng:${msg.location?.longitude}`;
  if (msg.type === "button") return `[Bouton cliqué] ${msg.button?.text ?? ""}`;
  if (msg.type === "interactive") return `[Réponse] ${msg.interactive?.button_reply?.title ?? msg.interactive?.list_reply?.title ?? ""}`;
  return "";
}

async function marquerLu(phoneNumberId: string, messageId: string, _displayPhone?: string) {
  const token = process.env.WHATSAPP_TOKEN;
  if (!token || !phoneNumberId || !messageId) return;
  await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messaging_product: "whatsapp", status: "read", message_id: messageId }),
  });
}
