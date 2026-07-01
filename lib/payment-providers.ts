/**
 * AXSO — Routage intelligent des paiements par pays et méthode
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  FLUX COMPLET DU PAIEMENT                                           │
 * │                                                                     │
 * │  Client paie                                                        │
 * │      ↓                                                              │
 * │  Provider (Flutterwave / CinetPay / Campay)                         │
 * │      ↓  webhook confirme                                            │
 * │  Escrow Axso (bloqué 48h — protection acheteur)                     │
 * │      ↓  livraison confirmée OU délai expiré                         │
 * │  Wallet Axso du vendeur (crédité net, commission 3% déduite)        │
 * │      ↓  vendeur demande un retrait                                  │
 * │  Payout : Mobile Money / Virement bancaire / Carte virtuelle        │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * APIS UTILISÉES PAR MÉTHODE :
 *
 * ── COLLECTE (paiements entrants) ──────────────────────────────────────
 *  Carte Visa/Mastercard/Verve   → Flutterwave   (mondial)
 *  Mobile Money Afrique de l'Ouest (SN, CI, ML, BF, TG, BJ, GN, NE, GW)
 *                                → CinetPay      (Orange, Wave, MTN, Moov)
 *  Mobile Money Cameroun (CM)    → Campay        (MTN, Orange) + Flutterwave
 *  Mobile Money Nigeria (NG)     → Flutterwave   (MTN MoMo, Airtel)
 *  Mobile Money Ghana (GH)       → Flutterwave   (MTN MoMo, Vodafone, AirtelTigo)
 *  Mobile Money Kenya (KE)       → Flutterwave   (M-Pesa, Airtel)
 *  Virement bancaire             → Flutterwave   (compte virtuel généré)
 *
 * ── DÉCAISSEMENT (virements sortants vers vendeurs) ────────────────────
 *  Mobile Money                  → Flutterwave Transfers API
 *  Virement bancaire             → Flutterwave Transfers API
 *  Carte virtuelle               → Flutterwave Virtual Cards API
 */

export type PaymentProvider = "flutterwave" | "cinetpay" | "campay";
export type PaymentMethod   = "card" | "mobilemoney" | "banktransfer";

// ─── Pays servis par CinetPay (Afrique de l'Ouest francophone) ───────────────
export const CINETPAY_COUNTRIES = new Set([
  "SN", "CI", "ML", "BF", "TG", "BJ", "GN", "NE", "TD", "GW", "CF", "CG",
]);

// ─── Pays servis par Campay (Cameroun surtout) ───────────────────────────────
export const CAMPAY_COUNTRIES = new Set(["CM"]);

// ─── Correspondance nom de pays → code ISO 2 (couverture mondiale) ───────────
export const PAYS_ISO: Record<string, string> = {
  // Afrique de l'Ouest
  "Sénégal": "SN", "Côte d'Ivoire": "CI", "Mali": "ML", "Burkina Faso": "BF",
  "Guinée": "GN", "Niger": "NE", "Togo": "TG", "Bénin": "BJ", "Mauritanie": "MR",
  "Guinea-Bissau": "GW", "Sierra Leone": "SL", "Liberia": "LR",
  // Afrique Centrale
  "Cameroun": "CM", "Gabon": "GA", "Congo": "CG", "RDC": "CD", "Tchad": "TD",
  "Centrafrique": "CF", "Guinée Équatoriale": "GQ",
  // Afrique de l'Est
  "Kenya": "KE", "Ouganda": "UG", "Tanzanie": "TZ", "Rwanda": "RW",
  "Éthiopie": "ET", "Mozambique": "MZ", "Zambie": "ZM", "Zimbabwe": "ZW",
  // Afrique du Nord
  "Maroc": "MA", "Algérie": "DZ", "Tunisie": "TN", "Égypte": "EG", "Libye": "LY",
  // Afrique subsaharienne
  "Nigeria": "NG", "Ghana": "GH", "Afrique du Sud": "ZA", "Angola": "AO",
  // Europe
  "France": "FR", "Allemagne": "DE", "Espagne": "ES", "Italie": "IT",
  "Portugal": "PT", "Belgique": "BE", "Suisse": "CH", "Pays-Bas": "NL",
  "Royaume-Uni": "GB", "Suède": "SE", "Norvège": "NO", "Danemark": "DK",
  "Pologne": "PL",
  // Amérique du Nord
  "États-Unis": "US", "Canada": "CA", "Mexique": "MX",
  // Amérique Latine
  "Brésil": "BR", "Argentine": "AR", "Colombie": "CO", "Chili": "CL", "Pérou": "PE",
  // Asie
  "Chine": "CN", "Japon": "JP", "Inde": "IN", "Indonésie": "ID",
  "Philippines": "PH", "Thaïlande": "TH", "Vietnam": "VN", "Singapour": "SG",
  "Malaisie": "MY", "Corée du Sud": "KR", "Pakistan": "PK", "Bangladesh": "BD",
  // Moyen-Orient
  "Émirats arabes unis": "AE", "Arabie saoudite": "SA", "Qatar": "QA",
  "Koweït": "KW", "Bahreïn": "BH", "Oman": "OM", "Turquie": "TR", "Israël": "IL",
  // Océanie
  "Australie": "AU", "Nouvelle-Zélande": "NZ",
};

// ─── Opérateurs Mobile Money par pays ────────────────────────────────────────
export const OPERATEURS: Record<string, { id: string; label: string; logo: string; provider: PaymentProvider }[]> = {
  SN: [
    { id: "WAVE",   label: "Wave",         logo: "🌊", provider: "cinetpay" },
    { id: "ORANGE", label: "Orange Money", logo: "🟠", provider: "cinetpay" },
    { id: "FREE",   label: "Free Money",   logo: "🟣", provider: "cinetpay" },
  ],
  CI: [
    { id: "MTN",    label: "MTN MoMo",     logo: "🟡", provider: "cinetpay" },
    { id: "ORANGE", label: "Orange Money", logo: "🟠", provider: "cinetpay" },
    { id: "WAVE",   label: "Wave",         logo: "🌊", provider: "cinetpay" },
    { id: "MOOV",   label: "Moov Money",   logo: "🔵", provider: "cinetpay" },
  ],
  CM: [
    { id: "MTN",    label: "MTN MoMo",     logo: "🟡", provider: "campay" },
    { id: "ORANGE", label: "Orange Money", logo: "🟠", provider: "campay" },
  ],
  ML: [
    { id: "ORANGE", label: "Orange Money", logo: "🟠", provider: "cinetpay" },
    { id: "MOOV",   label: "Moov Money",   logo: "🔵", provider: "cinetpay" },
  ],
  BF: [
    { id: "ORANGE", label: "Orange Money", logo: "🟠", provider: "cinetpay" },
    { id: "MOOV",   label: "Moov Money",   logo: "🔵", provider: "cinetpay" },
  ],
  TG: [
    { id: "TMONEY", label: "T-Money",      logo: "💙", provider: "cinetpay" },
    { id: "FLOOZ",  label: "Flooz",        logo: "🟠", provider: "cinetpay" },
  ],
  BJ: [
    { id: "MTN",    label: "MTN MoMo",     logo: "🟡", provider: "cinetpay" },
    { id: "MOOV",   label: "Moov Money",   logo: "🔵", provider: "cinetpay" },
  ],
  GN: [
    { id: "MTN",    label: "MTN MoMo",     logo: "🟡", provider: "cinetpay" },
    { id: "ORANGE", label: "Orange Money", logo: "🟠", provider: "cinetpay" },
  ],
  NG: [
    { id: "MTN",    label: "MTN MoMo NG",  logo: "🟡", provider: "flutterwave" },
    { id: "AIRTEL", label: "Airtel Money", logo: "🔴", provider: "flutterwave" },
  ],
  GH: [
    { id: "MTN",      label: "MTN MoMo GH", logo: "🟡", provider: "flutterwave" },
    { id: "VODAFONE", label: "Vodafone Cash",logo: "🔴", provider: "flutterwave" },
    { id: "AIRTEL",   label: "AirtelTigo",  logo: "🔴", provider: "flutterwave" },
  ],
  KE: [
    { id: "MPESA",  label: "M-Pesa",       logo: "🟢", provider: "flutterwave" },
    { id: "AIRTEL", label: "Airtel Money", logo: "🔴", provider: "flutterwave" },
  ],
  MA: [
    { id: "CIH",    label: "CIH Bank",     logo: "🏦", provider: "flutterwave" },
    { id: "MAROC",  label: "Maroc Telecom",logo: "🟦", provider: "flutterwave" },
  ],
};

// ─── Décider quel provider utiliser ─────────────────────────────────────────
export function choisirProvider(
  pays: string,
  methode: PaymentMethod,
  operateur?: string
): PaymentProvider {
  const iso = PAYS_ISO[pays] ?? pays.toUpperCase().slice(0, 2);

  // Carte → toujours Flutterwave
  if (methode === "card") return "flutterwave";

  // Virement → toujours Flutterwave (comptes virtuels)
  if (methode === "banktransfer") return "flutterwave";

  // Mobile Money → selon l'opérateur et le pays
  if (methode === "mobilemoney") {
    if (operateur) {
      const ops = OPERATEURS[iso] || [];
      const op  = ops.find(o => o.id === operateur);
      if (op) return op.provider;
    }
    if (CAMPAY_COUNTRIES.has(iso))    return "campay";
    if (CINETPAY_COUNTRIES.has(iso))  return "cinetpay";
  }

  return "flutterwave";
}

// ─── CinetPay — initier un paiement ──────────────────────────────────────────
export async function initierCinetPay(params: {
  commandeId: string;
  montant: number;
  devise: string;
  nom: string;
  email: string;
  telephone: string;
  pays: string;
  description: string;
  notifyUrl: string;
  returnUrl: string;
}) {
  const apiKey  = process.env.CINETPAY_API_KEY;
  const siteId  = process.env.CINETPAY_SITE_ID;
  if (!apiKey || !siteId) throw new Error("Clés CinetPay manquantes");

  const iso = PAYS_ISO[params.pays] ?? "SN";

  const res = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey:                  apiKey,
      site_id:                 siteId,
      transaction_id:          params.commandeId,
      amount:                  params.montant,
      currency:                params.devise,
      description:             params.description,
      customer_name:           params.nom.split(" ")[0] || params.nom,
      customer_surname:        params.nom.split(" ").slice(1).join(" ") || "",
      customer_email:          params.email,
      customer_phone_number:   params.telephone,
      customer_country:        iso,
      customer_city:           "",
      customer_address:        "",
      customer_zip_code:       "",
      notify_url:              params.notifyUrl,
      return_url:              params.returnUrl,
      channels:                "ALL",
      metadata:                params.commandeId,
      lang:                    "FR",
      alternative_currency:    "",
    }),
  });

  if (!res.ok) throw new Error(`CinetPay HTTP ${res.status}`);
  const data = await res.json();

  if (data.code !== "201") {
    throw new Error(data.message || "Erreur CinetPay");
  }

  return { paymentUrl: data.data?.payment_url as string, txRef: params.commandeId };
}

// ─── CinetPay — vérifier un paiement ─────────────────────────────────────────
export async function verifierCinetPay(transactionId: string) {
  const apiKey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;
  if (!apiKey || !siteId) throw new Error("Clés CinetPay manquantes");

  const res = await fetch("https://api-checkout.cinetpay.com/v2/payment/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey:         apiKey,
      site_id:        siteId,
      transaction_id: transactionId,
    }),
  });

  if (!res.ok) throw new Error(`CinetPay vérif HTTP ${res.status}`);
  return res.json();
}

// ─── Campay (Cameroun) — initier un paiement ─────────────────────────────────
export async function initierCampay(params: {
  commandeId: string;
  montant: number;
  telephone: string;
  description: string;
  notifyUrl: string;
  returnUrl: string;
}) {
  const username = process.env.CAMPAY_USERNAME;
  const password = process.env.CAMPAY_PASSWORD;
  if (!username || !password) throw new Error("Clés Campay manquantes");

  // 1. Obtenir token
  const tokenRes = await fetch("https://demo.campay.net/api/token/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.token;
  if (!token) throw new Error("Token Campay introuvable");

  // 2. Initier la collecte
  const res = await fetch("https://demo.campay.net/api/collect/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({
      amount:        String(params.montant),
      currency:      "XAF",
      from:          params.telephone,
      description:   params.description,
      external_reference: params.commandeId,
      redirect_url:  params.returnUrl,
    }),
  });

  if (!res.ok) throw new Error(`Campay HTTP ${res.status}`);
  const data = await res.json();
  return { reference: data.reference as string, ussd_code: data.ussd_code };
}

// ─── Flutterwave — créer un lien de paiement standard (redirect) ─────────────
export async function creerLienFlutterwave(params: {
  commandeId: string;
  montant: number;
  devise: string;
  email: string;
  telephone: string;
  nom: string;
  nomBoutique: string;
  logoUrl?: string;
  methodePaiement: string; // "card" | "mobilemoney" | "banktransfer" | "all"
  paysIso: string;
  notifyUrl: string;
  returnUrl: string;
}) {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) throw new Error("FLUTTERWAVE_SECRET_KEY manquante");

  const paymentOptions =
    params.methodePaiement === "card"        ? "card" :
    params.methodePaiement === "banktransfer"? "banktransfer" :
    params.methodePaiement === "mobilemoney" ? "mobilemoney,ussd" :
    "card,mobilemoney,banktransfer,ussd";

  const res = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey}`,
    },
    body: JSON.stringify({
      tx_ref:          params.commandeId,
      amount:          params.montant,
      currency:        params.devise,
      redirect_url:    params.returnUrl,
      payment_options: paymentOptions,
      country:         params.paysIso,
      customer: {
        email:        params.email || `${params.telephone.replace(/\D/g,"")}@axso.client`,
        phone_number: params.telephone,
        name:         params.nom,
      },
      customizations: {
        title:       params.nomBoutique,
        description: `Commande · ${params.nomBoutique}`,
        logo:        params.logoUrl ?? "",
      },
      meta: { source: "axso" },
    }),
  });

  if (!res.ok) throw new Error(`Flutterwave lien HTTP ${res.status}`);
  const data = await res.json();

  if (data.status !== "success") throw new Error(data.message || "Erreur Flutterwave");
  return { paymentUrl: data.data?.link as string };
}

// ─── Flutterwave — virement vers vendeur ─────────────────────────────────────
export async function virerVendeurFlutterwave(params: {
  retraitId: string;
  montant: number;
  devise: string;
  methode: "mobile_money" | "virement_bancaire";
  destinataire: string;  // phone or bank account
  operateur?: string;    // e.g. "MTN", "ORANGE", "UBA"
  nomBeneficiaire?: string;
}) {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) throw new Error("FLUTTERWAVE_SECRET_KEY manquante");

  const body: Record<string, any> = {
    amount:    params.montant,
    currency:  params.devise,
    reference: `AXSO-${params.retraitId}`,
    narration: "Retrait Axso Wallet",
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/wallet/retrait/callback`,
    debit_currency: params.devise,
  };

  if (params.methode === "mobile_money") {
    body.account_bank   = params.operateur ?? "MPS";
    body.account_number = params.destinataire;
    body.beneficiary_name = params.nomBeneficiaire ?? "Vendeur Axso";
    body.meta = [{ mobile_number: params.destinataire }];
  } else {
    const [bank, accountNum] = params.destinataire.includes("|")
      ? params.destinataire.split("|")
      : [params.operateur ?? "UBA", params.destinataire];
    body.account_bank   = bank;
    body.account_number = accountNum;
    body.beneficiary_name = params.nomBeneficiaire ?? "Vendeur Axso";
  }

  const res = await fetch("https://api.flutterwave.com/v3/transfers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Flutterwave transfer HTTP ${res.status}`);
  const data = await res.json();
  return data;
}

// ─── Flutterwave — créer/recharger carte virtuelle vendeur ───────────────────
export async function creerCarteVirtuelleFlutterwave(params: {
  nom: string;
  prenom: string;
  email: string;
  montant: number;     // montant initial à charger
  devise?: string;
}) {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) throw new Error("FLUTTERWAVE_SECRET_KEY manquante");

  const res = await fetch("https://api.flutterwave.com/v3/virtual-cards", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey}`,
    },
    body: JSON.stringify({
      currency:       params.devise ?? "USD",
      amount:         params.montant,
      billing_name:   `${params.prenom} ${params.nom}`,
      billing_customer_email: params.email,
      first_name:     params.prenom,
      last_name:      params.nom,
      date_of_birth:  "1990-01-01",
      billing_address:"Dakar",
      billing_city:   "Dakar",
      billing_country:"SN",
      billing_postal_code: "00000",
      callback_url:   `${process.env.NEXT_PUBLIC_APP_URL}/api/wallet/carte-virtuelle/callback`,
    }),
  });

  if (!res.ok) throw new Error(`Flutterwave virtual card HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== "success") throw new Error(data.message || "Erreur carte virtuelle");
  return data.data;
}

export async function rechargerCarteVirtuelle(cardId: string, montant: number, devise = "USD") {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) throw new Error("FLUTTERWAVE_SECRET_KEY manquante");

  const res = await fetch(`https://api.flutterwave.com/v3/virtual-cards/${cardId}/fund`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey}`,
    },
    body: JSON.stringify({ amount: montant, debit_currency: devise }),
  });

  if (!res.ok) throw new Error(`Flutterwave fund card HTTP ${res.status}`);
  return res.json();
}
