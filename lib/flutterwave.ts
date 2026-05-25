// Intégration Flutterwave pour les paiements africains
import Flutterwave from "flutterwave-node-v3";

// Initialiser le SDK Flutterwave (côté serveur uniquement)
function getFlutterwaveClient() {
  const publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY;
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

  if (!publicKey || !secretKey) {
    throw new Error("Clés Flutterwave manquantes dans les variables d'environnement");
  }

  return new Flutterwave(publicKey, secretKey);
}

export interface ParamsPaiement {
  txRef: string;
  montant: number;
  devise: string;
  email: string;
  telephone: string;
  nom: string;
  description: string;
  redirectUrl: string;
  metadata?: Record<string, string>;
}

// Initier un paiement Flutterwave
export async function initierPaiement(params: ParamsPaiement) {
  const flw = getFlutterwaveClient();

  const payload = {
    tx_ref: params.txRef,
    amount: params.montant,
    currency: params.devise,
    redirect_url: params.redirectUrl,
    customer: {
      email: params.email,
      phone_number: params.telephone,
      name: params.nom,
    },
    customizations: {
      title: "Axso Paiement",
      description: params.description,
      logo: "https://axso.com/logo.png",
    },
    meta: params.metadata || {},
  };

  return (flw as any).Payment.initiate(payload);
}

// Vérifier un paiement après redirection
export async function verifierPaiement(transactionId: string) {
  const flw = getFlutterwaveClient();
  return (flw as any).Transaction.verify({ id: transactionId });
}

// Méthodes de paiement disponibles par pays
export const methodesParPays: Record<string, string[]> = {
  CM: ["Mobile Money MTN", "Mobile Money Orange", "Visa/Mastercard"],
  SN: ["Wave", "Orange Money", "Free Money", "Visa/Mastercard"],
  CI: ["MTN MoMo", "Orange Money", "Wave", "Visa/Mastercard"],
  GH: ["MTN MoMo Ghana", "Vodafone Cash", "Visa/Mastercard"],
  NG: ["Bank Transfer", "Visa/Mastercard", "USSD"],
  KE: ["M-Pesa", "Airtel Money", "Visa/Mastercard"],
  MA: ["CIH Bank", "Maroc Telecom Money", "Visa/Mastercard"],
};
