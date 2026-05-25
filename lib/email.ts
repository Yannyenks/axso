// Service d'envoi d'emails avec Resend
import { Resend } from "resend";

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
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
