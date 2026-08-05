// Chariow — helper pour l'API de paiement (produits digitaux & abonnements AXSO)
const CHARIOW_API_URL = "https://api.chariow.com/v1";

export function getChariowKey() {
  return process.env.CHARIOW_API_KEY ?? null;
}

export interface ChariowCheckoutParams {
  productId: string;       // ID du produit Chariow (prd_xxx)
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  countryCode: string;     // ex: "CI", "SN", "CM", "FR"
  redirectUrl?: string;
  customMetadata?: Record<string, string>;
  discountCode?: string;
  customerIp?: string;
}

export interface ChariowCheckoutResult {
  step: "payment" | "completed" | "already_purchased";
  checkoutUrl?: string;
  transactionId?: string;
  purchaseId?: string;
}

export async function initierChariowCheckout(params: ChariowCheckoutParams): Promise<ChariowCheckoutResult> {
  const apiKey = getChariowKey();
  if (!apiKey) throw new Error("CHARIOW_API_KEY non configurée");

  const nameParts = params.firstName.split(" ");
  const body: Record<string, any> = {
    product_id: params.productId,
    email: params.email,
    first_name: nameParts[0] ?? params.firstName,
    last_name: nameParts.slice(1).join(" ") || params.lastName,
    phone: { number: params.phone.replace(/\D/g, ""), country_code: params.countryCode },
    ...(params.redirectUrl ? { redirect_url: params.redirectUrl } : {}),
    ...(params.discountCode ? { discount_code: params.discountCode } : {}),
    ...(params.customMetadata ? { custom_metadata: params.customMetadata } : {}),
    ...(params.customerIp ? { customer_ip: params.customerIp } : {}),
  };

  const res = await fetch(`${CHARIOW_API_URL}/checkout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Chariow error ${res.status}`);
  }

  const json = await res.json();
  const data = json.data;

  return {
    step: data.step,
    checkoutUrl: data.payment?.checkout_url ?? undefined,
    transactionId: data.payment?.transaction_id ?? undefined,
    purchaseId: data.purchase?.id ?? undefined,
  };
}

// Identifiants des produits Chariow pour les plans AXSO
export const CHARIOW_PLAN_IDS: Record<string, string | undefined> = {
  starter:  process.env.CHARIOW_PLAN_STARTER_ID,
  pro:      process.env.CHARIOW_PLAN_PRO_ID,
  business: process.env.CHARIOW_PLAN_BUSINESS_ID,
};
