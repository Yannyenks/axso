"use client";
import { useState, useEffect } from "react";
import Script from "next/script";
import { useCartStore } from "@/store/cartStore";
import { formatMontant } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CreditCard, Smartphone, Shield, Lock } from "lucide-react";

interface Props {
  theme: { fond: string; accent: string; texte: string; surface: string };
  slug: string;
  devise: string;
  tenantId: string;
  nomBoutique: string;
  logoUrl?: string;
}

const PAYS_AFRIQUE = [
  "Sénégal", "Côte d'Ivoire", "Cameroun", "Mali", "Burkina Faso",
  "Guinée", "Niger", "Togo", "Bénin", "Mauritanie",
  "Nigeria", "Ghana", "Kenya", "Maroc", "Tunisie",
];

const METHODES = [
  { id: "card", label: "Carte bancaire", desc: "Visa, Mastercard, Verve", icon: CreditCard },
  { id: "mobilemoney", label: "Mobile Money", desc: "Orange, Wave, MTN, Moov, M-Pesa", icon: Smartphone },
];


export function CheckoutForm({ theme, slug, devise, tenantId, nomBoutique, logoUrl }: Props) {
  const router = useRouter();
  const { items, totalAvecReduction, viderPanier, codePromo } = useCartStore();
  const [processing, setProcessing] = useState(false);
  const [flwReady, setFlwReady] = useState(false);
  const [methodePaiement, setMethodePaiement] = useState<"card" | "mobilemoney">("mobilemoney");
  const [form, setForm] = useState({
    nom: "", email: "", telephone: "", adresse: "", ville: "", pays: "Sénégal",
  });

  const total = totalAvecReduction();
  const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;

  useEffect(() => {
    if (typeof window !== "undefined" && window.FlutterwaveCheckout) {
      setFlwReady(true);
    }
  }, []);

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="opacity-60">Votre panier est vide</p>
        <a href={`/${slug}/produits`} className="text-sm mt-3 inline-block" style={{ color: theme.accent }}>
          ← Voir les produits
        </a>
      </div>
    );
  }

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function passerCommande() {
    if (!form.nom || !form.telephone) {
      toast.error("Nom et téléphone obligatoires");
      return;
    }
    if (publicKey && !flwReady) {
      toast.error("Système de paiement en cours de chargement, réessayez dans un instant");
      return;
    }
    setProcessing(true);

    try {
      const res = await fetch("/api/paiements/initier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId, slug,
          client: form,
          items: items.map((i) => ({
            produitId: i.produitId, quantite: i.quantite,
            prix: i.prix, nom: i.nom, variante: i.variante, imageUrl: i.imageUrl,
          })),
          total, devise, codePromo,
          methodePaiement,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");

      if (data.mode === "demo" || !publicKey) {
        // Mode démo — pas de clé Flutterwave
        viderPanier();
        router.push(`/${slug}/confirmation/${data.commandeId}`);
        return;
      }

      // Mode réel — ouvrir la modal Flutterwave inline
      const commandeId = data.commandeId;
      viderPanier();

      window.FlutterwaveCheckout({
        public_key: publicKey,
        tx_ref: commandeId,
        amount: total,
        currency: devise,
        payment_options: methodePaiement === "card" ? "card" : "mobilemoney,ussd",
        customer: {
          email: form.email || `${form.telephone.replace(/\D/g, "")}@axso.client`,
          phone_number: form.telephone,
          name: form.nom,
        },
        customizations: {
          title: nomBoutique,
          description: `Commande sur ${nomBoutique}`,
          logo: logoUrl || "",
        },
        meta: { slug, tenantId },
        callback: function (paymentData: any) {
          if (paymentData.status === "successful" || paymentData.status === "completed") {
            window.location.href = `/${slug}/confirmation/${commandeId}?transaction_id=${paymentData.transaction_id}&status=successful`;
          } else {
            setProcessing(false);
            toast.error("Le paiement a échoué. Veuillez réessayer.");
          }
        },
        onclose: function () {
          setProcessing(false);
          toast("Paiement annulé. Votre commande est sauvegardée.", { icon: "ℹ️" });
          router.push(`/${slug}/confirmation/${commandeId}`);
        },
      });

    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la commande");
      setProcessing(false);
    }
  }

  const inputStyle = {
    backgroundColor: theme.surface,
    borderColor: `${theme.accent}30`,
    color: theme.texte,
    outline: "none",
  };

  const labelStyle = { color: theme.texte, opacity: 0.6 };

  return (
    <>
      {/* Chargement du SDK Flutterwave */}
      {publicKey && (
        <Script
          src="https://checkout.flutterwave.com/v3.js"
          onLoad={() => setFlwReady(true)}
          strategy="afterInteractive"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Formulaire */}
        <div className="lg:col-span-3 space-y-5">

          {/* Infos livraison */}
          <div className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: theme.surface, borderColor: `${theme.accent}20` }}>
            <h2 className="font-bold font-playfair text-base">Informations de livraison</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs block mb-1.5" style={labelStyle}>Nom complet *</label>
                <input value={form.nom} onChange={(e) => set("nom", e.target.value)}
                  placeholder="Aminata Diallo"
                  className="w-full px-4 py-3 rounded-xl border text-sm transition-all focus:ring-2"
                  style={{ ...inputStyle, ["--tw-ring-color" as any]: `${theme.accent}40` }} />
              </div>
              <div>
                <label className="text-xs block mb-1.5" style={labelStyle}>Email</label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                  placeholder="email@exemple.com"
                  className="w-full px-4 py-3 rounded-xl border text-sm"
                  style={inputStyle} />
              </div>
              <div>
                <label className="text-xs block mb-1.5" style={labelStyle}>Téléphone *</label>
                <input type="tel" value={form.telephone} onChange={(e) => set("telephone", e.target.value)}
                  placeholder="+221 77 000 00 00"
                  className="w-full px-4 py-3 rounded-xl border text-sm"
                  style={inputStyle} />
              </div>
              <div className="col-span-2">
                <label className="text-xs block mb-1.5" style={labelStyle}>Adresse de livraison</label>
                <input value={form.adresse} onChange={(e) => set("adresse", e.target.value)}
                  placeholder="Rue, numéro, quartier"
                  className="w-full px-4 py-3 rounded-xl border text-sm"
                  style={inputStyle} />
              </div>
              <div>
                <label className="text-xs block mb-1.5" style={labelStyle}>Ville</label>
                <input value={form.ville} onChange={(e) => set("ville", e.target.value)}
                  placeholder="Dakar"
                  className="w-full px-4 py-3 rounded-xl border text-sm"
                  style={inputStyle} />
              </div>
              <div>
                <label className="text-xs block mb-1.5" style={labelStyle}>Pays</label>
                <select value={form.pays} onChange={(e) => set("pays", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm"
                  style={inputStyle}>
                  {PAYS_AFRIQUE.map((p) => <option key={p} style={{ backgroundColor: theme.surface }}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Méthode paiement */}
          <div className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: theme.surface, borderColor: `${theme.accent}20` }}>
            <h2 className="font-bold font-playfair text-base">Méthode de paiement</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {METHODES.map((m) => {
                const Icon = m.icon;
                const actif = methodePaiement === m.id;
                return (
                  <button key={m.id} type="button" onClick={() => setMethodePaiement(m.id as any)}
                    className="flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all"
                    style={{
                      borderColor: actif ? theme.accent : `${theme.accent}25`,
                      backgroundColor: actif ? `${theme.accent}10` : "transparent",
                    }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${theme.accent}20` }}>
                      <Icon size={18} style={{ color: theme.accent }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{m.label}</p>
                      <p className="text-xs opacity-50 mt-0.5">{m.desc}</p>
                    </div>
                    {actif && (
                      <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: theme.accent }}>
                        <span className="text-white text-[10px] font-bold">✓</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Badge sécurité */}
            <div className="flex items-center gap-2 pt-1">
              <Lock size={11} style={{ color: theme.accent }} />
              <p className="text-xs opacity-40">Paiement 100% sécurisé · Chiffrement SSL · Propulsé par Flutterwave</p>
            </div>
          </div>
        </div>

        {/* Récapitulatif */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-2xl border p-6 space-y-4" style={{ backgroundColor: theme.surface, borderColor: `${theme.accent}20` }}>
            <h2 className="font-bold font-playfair text-base">Récapitulatif</h2>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={`${item.produitId}-${item.variante}`} className="flex items-center gap-3">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.nom} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: `${theme.accent}15` }}>📦</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.nom}</p>
                    {item.variante && <p className="text-xs opacity-40">{item.variante}</p>}
                    <p className="text-xs opacity-50">×{item.quantite}</p>
                  </div>
                  <span className="text-sm font-semibold flex-shrink-0" style={{ color: theme.accent }}>
                    {formatMontant(item.prix * item.quantite, devise)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2 text-sm" style={{ borderColor: `${theme.accent}20` }}>
              {codePromo && (
                <div className="flex justify-between" style={{ color: "#4ade80" }}>
                  <span>Code : {codePromo}</span>
                  <span>Remise appliquée</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span style={{ color: theme.accent }}>{formatMontant(total, devise)}</span>
              </div>
            </div>

            <button
              onClick={passerCommande}
              disabled={processing}
              className="w-full py-4 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: theme.accent, color: theme.fond }}
            >
              {processing ? (
                <><Loader2 size={16} className="animate-spin" /> Traitement...</>
              ) : (
                <><Shield size={15} /> Payer {formatMontant(total, devise)}</>
              )}
            </button>

            {!publicKey && (
              <p className="text-center text-xs opacity-30">Mode démo — configurez NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY pour les paiements réels</p>
            )}

            <p className="text-center text-xs opacity-30">
              En passant commande, vous acceptez nos conditions générales de vente
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
