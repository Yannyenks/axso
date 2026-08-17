// Service d'envoi d'emails avec Resend
import { Resend } from "resend";

export function hasResend(): boolean {
  return !!process.env.RESEND_API_KEY;
}

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

// Code de double authentification (connexion)
export async function envoyerCodeVerification(email: string, code: string, nom?: string) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("Resend non configuré — code 2FA non envoyé");
    return;
  }
  await resend.emails.send({
    from: "Axso <noreply@axso.com>",
    to: email,
    subject: `${code} — Ton code de connexion Axso`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Code de connexion</h2>
        <p>Bonjour ${nom || ""},</p>
        <p>Voici ton code de vérification pour te connecter à Axso :</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 16px; background: #f5f5f5; border-radius: 12px;">${code}</p>
        <p style="color: #666; font-size: 13px;">Ce code expire dans 10 minutes. Si tu n'es pas à l'origine de cette tentative de connexion, ignore cet email.</p>
      </div>
    `,
  });
}

// Code de réinitialisation de mot de passe
export async function envoyerCodeReinitialisation(email: string, code: string, nom?: string) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("Resend non configuré — code de réinitialisation non envoyé");
    return;
  }
  await resend.emails.send({
    from: "Axso <noreply@axso.com>",
    to: email,
    subject: `${code} — Réinitialisation de ton mot de passe Axso`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Réinitialisation de mot de passe</h2>
        <p>Bonjour ${nom || ""},</p>
        <p>Voici ton code pour réinitialiser ton mot de passe Axso :</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 16px; background: #f5f5f5; border-radius: 12px;">${code}</p>
        <p style="color: #666; font-size: 13px;">Ce code expire dans 10 minutes. Si tu n'es pas à l'origine de cette demande, ignore cet email — ton mot de passe actuel reste inchangé.</p>
      </div>
    `,
  });
}

// Alerte nouvelle commande envoyée au marchand
export async function envoyerAlerteNouvelleCommande(params: {
  email: string;
  numeroCommande: string;
  montantTotal: number;
  devise: string;
  clientNom: string;
  boutique: string;
  lien: string;
}) {
  const resend = getResendClient();
  if (!resend) return;
  await resend.emails.send({
    from: "Axso <noreply@axso.com>",
    to: params.email,
    subject: `Nouvelle commande ${params.numeroCommande} — ${params.montantTotal} ${params.devise}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Nouvelle commande reçue 🎉</h2>
        <p>Bonjour,</p>
        <p><strong>${params.clientNom}</strong> vient de passer une commande sur <strong>${params.boutique}</strong>.</p>
        <p>Commande <strong>${params.numeroCommande}</strong> — <strong>${params.montantTotal} ${params.devise}</strong></p>
        <p><a href="${params.lien}" style="display:inline-block;padding:10px 20px;background:#F5A623;color:#111;border-radius:8px;text-decoration:none;font-weight:bold;">Voir la commande</a></p>
      </div>
    `,
  });
}

// Email de confirmation de commande
export async function envoyerConfirmationCommande(params: {
  email: string;
  nom: string;
  numeroCommande: string;
  montantTotal: number;
  devise: string;
  produits: Array<{ nom: string; quantite: number; prix: number }>;
  boutique: string;
}) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("Resend non configuré — email non envoyé");
    return;
  }

  const lignesProduits = params.produits
    .map((p) => `- ${p.nom} x${p.quantite} : ${p.prix * p.quantite} ${params.devise}`)
    .join("\n");

  await resend.emails.send({
    from: "Axso <noreply@axso.com>",
    to: params.email,
    subject: `Confirmation commande ${params.numeroCommande} — ${params.boutique}`,
    html: `
      <h2>Merci pour votre commande !</h2>
      <p>Bonjour ${params.nom},</p>
      <p>Votre commande <strong>${params.numeroCommande}</strong> a bien été reçue.</p>
      <h3>Récapitulatif :</h3>
      <pre>${lignesProduits}</pre>
      <p><strong>Total : ${params.montantTotal} ${params.devise}</strong></p>
      <p>Vous recevrez une notification dès que votre commande est expédiée.</p>
      <br/>
      <p>L'équipe ${params.boutique} via Axso</p>
    `,
  });
}

// Email de newsletter marketing
export async function envoyerNewsletter(params: {
  emails: string[];
  sujet: string;
  contenu: string;
  boutique: string;
}) {
  const resend = getResendClient();
  if (!resend) return;

  // Envoi par lots de 50 (limite Resend)
  const lots = [];
  for (let i = 0; i < params.emails.length; i += 50) {
    lots.push(params.emails.slice(i, i + 50));
  }

  for (const lot of lots) {
    await resend.emails.send({
      from: `${params.boutique} <noreply@axso.com>`,
      to: lot,
      subject: params.sujet,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${params.contenu}
          <hr/>
          <p style="font-size:12px;color:#666;">
            Envoyé par ${params.boutique} via Axso.
            <a href="#">Se désabonner</a>
          </p>
        </div>
      `,
    });
  }
}
