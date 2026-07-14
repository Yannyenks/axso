import Stripe from "stripe";

// Singleton serveur
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY manquante");
    _stripe = new Stripe(key, { apiVersion: "2025-06-30.basil" });
  }
  return _stripe;
}

export function hasStripe(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

// Convertit un montant en unité Stripe (centimes/sous-unités)
export function toStripeAmount(montant: number, devise: string): number {
  // Devises sans décimales (CFA, etc.)
  const zerodecimal = ["XOF", "XAF", "GNF", "KMF", "MGA", "PYG", "VND", "JPY", "KRW"];
  if (zerodecimal.includes(devise.toUpperCase())) return Math.round(montant);
  return Math.round(montant * 100);
}

// Devise → code Stripe lowercase
export function toStripeCurrency(devise: string): string {
  return devise.toLowerCase();
}
