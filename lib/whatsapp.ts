// WhatsApp Business notifications — Cloud API (si configurée) ou lien wa.me fallback

const MESSAGES: Record<string, (params: { numero: string; boutique: string; lien: string }) => string> = {
  confirmee: ({ numero, boutique, lien }) =>
    `✅ *Bonne nouvelle !*\n\nVotre commande *#${numero}* a bien été confirmée par *${boutique}*.\n\nNous préparons vos articles avec soin.\n\n🔍 Suivre ma commande : ${lien}`,

  en_preparation: ({ numero, boutique }) =>
    `📦 *Votre commande est en cours de préparation !*\n\nCommande *#${numero}* — *${boutique}*\n\nNos équipes s'occupent de vos articles. Vous serez notifié dès l'expédition.`,

  expediee: ({ numero, boutique, lien }) =>
    `🚚 *Votre commande est en route !*\n\nCommande *#${numero}* — *${boutique}*\n\nVotre colis a été expédié et est en chemin.\n\n🔍 Suivre ma commande : ${lien}`,

  livree: ({ numero, boutique, lien }) =>
    `🎉 *Votre commande est arrivée !*\n\nCommande *#${numero}* — *${boutique}*\n\nVotre colis a été livré. Confirmez la réception pour finaliser la transaction.\n\n✅ Confirmer : ${lien}`,

  annulee: ({ numero, boutique }) =>
    `❌ *Commande annulée*\n\nVotre commande *#${numero}* — *${boutique}* a été annulée.\n\nContactez la boutique pour plus d'informations.`,
};

export function buildWhatsAppMessage(params: {
  statut: string;
  numero: string;
  boutique: string;
  lien: string;
}): string | null {
  const template = MESSAGES[params.statut];
  if (!template) return null;
  return template(params);
}

// Envoie via WhatsApp Business Cloud API (Meta)
async function envoyerViaCloudAPI(telephone: string, message: string): Promise<boolean> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return false;

  const numero = telephone.replace(/\D/g, "");
  if (!numero || numero.length < 8) return false;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: numero,
          type: "text",
          text: { body: message, preview_url: true },
        }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

// Construit un lien wa.me cliquable pour le marchand (fallback sans API)
export function buildWhatsAppLink(telephone: string, message: string): string | null {
  const numero = telephone.replace(/\D/g, "");
  if (!numero || numero.length < 8) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(message)}`;
}

// Point d'entrée principal — tente Cloud API, retourne lien fallback si échec
export async function notifierClientWhatsApp(params: {
  telephone: string | null | undefined;
  statut: string;
  numero: string;
  boutique: string;
  slug: string;
  commandeId: string;
}): Promise<{ envoyeAuto: boolean; whatsappUrl: string | null }> {
  if (!params.telephone) return { envoyeAuto: false, whatsappUrl: null };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://axso.vercel.app";
  const lien = `${appUrl}/${params.slug}/suivi/${params.commandeId}`;
  const message = buildWhatsAppMessage({ statut: params.statut, numero: params.numero, boutique: params.boutique, lien });
  if (!message) return { envoyeAuto: false, whatsappUrl: null };

  // Tente envoi automatique via Cloud API
  const envoyeAuto = await envoyerViaCloudAPI(params.telephone, message);
  if (envoyeAuto) return { envoyeAuto: true, whatsappUrl: null };

  // Fallback : lien wa.me que le marchand peut cliquer
  const whatsappUrl = buildWhatsAppLink(params.telephone, message);
  return { envoyeAuto: false, whatsappUrl };
}
