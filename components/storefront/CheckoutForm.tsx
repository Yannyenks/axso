"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useCartStore } from "@/store/cartStore";
import { formatMontant } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2, CreditCard, Shield, Lock,
  CheckCircle2, AlertCircle, MessageCircle, Download,
  Package, Zap, Phone, MapPin, User, Mail, ArrowLeft
} from "lucide-react";
import { StripeCheckout } from "./StripeCheckout";

interface Props {
  theme: { fond: string; accent: string; texte: string; surface: string };
  slug: string; devise: string; tenantId: string; nomBoutique: string; logoUrl?: string;
}

// ─── Config opérateurs ───────────────────────────────────────────────────────
const PAYS_CONFIG: Record<string, { code: string; operateurs: { id: string; label: string; logo: string }[] }> = {
  "Sénégal":       { code: "SN", operateurs: [{ id: "WAVE", label: "Wave", logo: "🌊" }, { id: "ORANGE", label: "Orange Money", logo: "🟠" }, { id: "FREE", label: "Free Money", logo: "🟣" }] },
  "Côte d'Ivoire": { code: "CI", operateurs: [{ id: "MTN", label: "MTN MoMo", logo: "🟡" }, { id: "ORANGE", label: "Orange Money", logo: "🟠" }, { id: "WAVE", label: "Wave", logo: "🌊" }, { id: "MOOV", label: "Moov Money", logo: "🔵" }] },
  "Cameroun":      { code: "CM", operateurs: [{ id: "MTN", label: "MTN MoMo", logo: "🟡" }, { id: "ORANGE", label: "Orange Money", logo: "🟠" }] },
  "Mali":          { code: "ML", operateurs: [{ id: "ORANGE", label: "Orange Money", logo: "🟠" }, { id: "MOOV", label: "Moov Money", logo: "🔵" }] },
  "Burkina Faso":  { code: "BF", operateurs: [{ id: "ORANGE", label: "Orange Money", logo: "🟠" }, { id: "MOOV", label: "Moov Money", logo: "🔵" }] },
  "Guinée":        { code: "GN", operateurs: [{ id: "MTN", label: "MTN MoMo", logo: "🟡" }, { id: "ORANGE", label: "Orange Money", logo: "🟠" }] },
  "Togo":          { code: "TG", operateurs: [{ id: "MOOV", label: "Moov Money", logo: "🔵" }, { id: "TMONEY", label: "T-Money", logo: "💙" }] },
  "Bénin":         { code: "BJ", operateurs: [{ id: "MTN", label: "MTN MoMo", logo: "🟡" }, { id: "MOOV", label: "Moov Money", logo: "🔵" }] },
  "Nigeria":       { code: "NG", operateurs: [{ id: "MTN", label: "MTN MoMo", logo: "🟡" }, { id: "AIRTEL", label: "Airtel Money", logo: "🔴" }] },
  "Ghana":         { code: "GH", operateurs: [{ id: "MTN", label: "MTN MoMo GH", logo: "🟡" }, { id: "VODAFONE", label: "Vodafone Cash", logo: "🔴" }] },
  "Kenya":         { code: "KE", operateurs: [{ id: "MPESA", label: "M-Pesa", logo: "🟢" }] },
  "Maroc":         { code: "MA", operateurs: [{ id: "MAROC_TELECOM", label: "Maroc Telecom", logo: "🟦" }] },
};
const PAYS_AFRIQUE = Object.keys(PAYS_CONFIG).concat(["Niger","Mauritanie","Tunisie","Algérie","Gabon","Congo","RDC"]);

// ─── Récapitulatif commande ───────────────────────────────────────────────────
function Recap({ theme, devise, items, total, codePromo, label }: any) {
  return (
    <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: theme.surface, borderColor: `${theme.accent}20` }}>
      <h2 className="font-bold font-playfair text-base">🧾 {label || "Récapitulatif"}</h2>
      <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
        {items.map((item: any) => (
          <div key={`${item.produitId}-${item.variante}`} className="flex items-center gap-3">
            {item.imageUrl
              ? <img src={item.imageUrl} alt={item.nom} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
              : <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: `${theme.accent}15` }}>{item.type === "digital" ? "💾" : "📦"}</div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.nom}</p>
              {item.variante && <p className="text-xs opacity-40">{item.variante}</p>}
              <p className="text-xs opacity-45">×{item.quantite}</p>
            </div>
            <span className="text-sm font-semibold flex-shrink-0" style={{ color: theme.accent }}>{formatMontant(item.prix * item.quantite, devise)}</span>
          </div>
        ))}
      </div>
      <div className="border-t pt-3 text-sm" style={{ borderColor: `${theme.accent}18` }}>
        {codePromo && <div className="flex justify-between text-green-500 mb-1"><span>Code : {codePromo}</span><span>✓</span></div>}
        <div className="flex justify-between font-bold text-base">
          <span>Total</span>
          <span style={{ color: theme.accent }}>{formatMontant(total, devise)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Input stylisé ────────────────────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs block mb-1.5 font-medium opacity-60">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECKOUT PHYSIQUE — Paiement à la livraison → WhatsApp
// ═══════════════════════════════════════════════════════════════════════════════
function CheckoutPhysique({ theme, slug, devise, tenantId, items, total, codePromo, viderPanier }: any) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ commandeId: string; numero: string; whatsappUrl: string | null } | null>(null);
  const [form, setForm] = useState({ nom: "", telephone: "", adresse: "", ville: "", pays: "Sénégal", email: "" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const inp = "w-full px-4 py-3 rounded-xl border text-sm transition-all focus:ring-2 focus:outline-none";
  const inpStyle = { backgroundColor: theme.surface, borderColor: `${theme.accent}30`, color: theme.texte, ["--tw-ring-color" as any]: `${theme.accent}40` };

  async function commander() {
    if (!form.nom.trim() || !form.telephone.trim()) { toast.error("Nom et téléphone obligatoires"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/commandes/whatsapp-creer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, slug, client: form, items: items.map((i: any) => ({ produitId: i.produitId, nom: i.nom, prix: i.prix, quantite: i.quantite, variante: i.variante, imageUrl: i.imageUrl })), total, devise, codePromo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      viderPanier();
      setDone(data);
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  // Succès
  if (done) {
    return (
      <div className="text-center py-12 space-y-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: `${theme.accent}20`, border: `2px solid ${theme.accent}` }}>
          <CheckCircle2 size={36} style={{ color: theme.accent }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-playfair mb-2" style={{ color: theme.accent }}>Commande #{done.numero} créée !</h2>
          <p className="text-sm opacity-60 mb-2">Votre commande est enregistrée. Le vendeur vous contactera pour la livraison.</p>
          <p className="text-sm opacity-50 font-medium">💳 Vous paierez à la livraison.</p>
        </div>
        {done.whatsappUrl ? (
          <a href={done.whatsappUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:opacity-90"
            style={{ background: "#25D366", color: "#fff", boxShadow: "0 4px 20px rgba(37,211,102,0.4)" }}>
            <MessageCircle size={18} /> Confirmer via WhatsApp
          </a>
        ) : (
          <p className="text-sm opacity-50">Le vendeur a reçu votre commande et vous contactera bientôt.</p>
        )}
        <div className="pt-2">
          <button onClick={() => router.push(`/${slug}/suivi/${done.commandeId}`)} className="text-sm underline opacity-50 hover:opacity-80">
            Suivre ma commande →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
      <div className="lg:col-span-3 space-y-5">
        {/* Bandeau info */}
        <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <Package size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-green-600">Paiement à la livraison</p>
            <p className="text-xs text-green-700 opacity-75 mt-0.5 leading-relaxed">
              Vous ne payez rien maintenant. Le paiement se fait en espèces ou mobile money à la réception de votre colis.
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: theme.surface, borderColor: `${theme.accent}20` }}>
          <h2 className="font-bold font-playfair text-base">📋 Vos informations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Field label="Nom complet" required>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                  <input value={form.nom} onChange={e => set("nom", e.target.value)} placeholder="Ex: Aminata Diallo" className={inp} style={{ ...inpStyle, paddingLeft: "2.25rem" }} />
                </div>
              </Field>
            </div>
            <Field label="Téléphone (WhatsApp de préférence)" required>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                <input type="tel" value={form.telephone} onChange={e => set("telephone", e.target.value)} placeholder="+221 77 000 00 00" className={inp} style={{ ...inpStyle, paddingLeft: "2.25rem" }} />
              </div>
            </Field>
            <Field label="Email (optionnel)">
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@exemple.com" className={inp} style={{ ...inpStyle, paddingLeft: "2.25rem" }} />
              </div>
            </Field>
          </div>
        </div>

        {/* Adresse livraison */}
        <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: theme.surface, borderColor: `${theme.accent}20` }}>
          <h2 className="font-bold font-playfair text-base">📦 Adresse de livraison</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Field label="Adresse">
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                  <input value={form.adresse} onChange={e => set("adresse", e.target.value)} placeholder="Rue, quartier, numéro" className={inp} style={{ ...inpStyle, paddingLeft: "2.25rem" }} />
                </div>
              </Field>
            </div>
            <Field label="Ville">
              <input value={form.ville} onChange={e => set("ville", e.target.value)} placeholder="Dakar" className={inp} style={inpStyle} />
            </Field>
            <Field label="Pays">
              <select value={form.pays} onChange={e => set("pays", e.target.value)} className={inp} style={inpStyle}>
                {PAYS_AFRIQUE.map(p => <option key={p} style={{ backgroundColor: theme.surface }}>{p}</option>)}
              </select>
            </Field>
          </div>
        </div>
      </div>

      {/* Récap + CTA */}
      <div className="lg:col-span-2">
        <div className="lg:sticky lg:top-24 space-y-4">
          <Recap theme={theme} devise={devise} items={items} total={total} codePromo={codePromo} label="Votre commande" />

          <button onClick={commander} disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg"
            style={{ background: "#25D366", color: "#fff", boxShadow: "0 4px 20px rgba(37,211,102,0.4)" }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />}
            {loading ? "Création de la commande…" : "Commander via WhatsApp"}
          </button>

          <div className="flex items-center gap-2 text-xs opacity-40 justify-center">
            <Lock size={10} /> Commande sécurisée · Paiement à la livraison
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECKOUT DIGITAL — Paiement Stripe · Wallet Axso · Livraison instantanée
// ═══════════════════════════════════════════════════════════════════════════════
function CheckoutDigital({ theme, slug, devise, tenantId, items, total, codePromo, viderPanier }: any) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phase, setPhase] = useState<"form" | "paiement">("form");
  const [loading, setLoading] = useState(false);
  const [commandeId, setCommandeId] = useState<string | null>(null);
  const [form, setForm] = useState({ nom: "", email: "", telephone: "", pays: "Sénégal" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Code d'affiliation depuis l'URL (?ref=CODE) ou localStorage
  const codeRef = useMemo(() => {
    const fromUrl = searchParams?.get("ref") ?? null;
    if (fromUrl) {
      try { localStorage.setItem("axso_ref", fromUrl); } catch {}
      return fromUrl;
    }
    try { return localStorage.getItem("axso_ref"); } catch { return null; }
  }, [searchParams]);

  const inp = "w-full px-4 py-3 rounded-xl border text-sm transition-all focus:ring-2 focus:outline-none";
  const inpStyle = { backgroundColor: theme.surface, borderColor: `${theme.accent}30`, color: theme.texte, ["--tw-ring-color" as any]: `${theme.accent}40` };

  async function creerCommande() {
    if (!form.nom.trim() || !form.email.trim()) {
      toast.error("Nom et email obligatoires pour les produits digitaux");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/commandes/digital-creer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          client: { ...form },
          items: items.map((i: any) => ({ produitId: i.produitId, nom: i.nom, prix: i.prix, quantite: i.quantite, variante: i.variante, imageUrl: i.imageUrl })),
          total, devise, codePromo,
          codeAffiliation: codeRef || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCommandeId(data.commandeId);
      setPhase("paiement");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la création de la commande");
    } finally {
      setLoading(false);
    }
  }

  function onPaiementSucces() {
    try { localStorage.removeItem("axso_ref"); } catch {}
    viderPanier();
    router.push(`/${slug}/confirmation/${commandeId}`);
  }

  const inp2 = inp; // alias pour lisibilité dans le bloc paiement

  // ── Phase 2 : paiement Stripe ──────────────────────────────────────────────
  if (phase === "paiement" && commandeId) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
        <div className="lg:col-span-3 space-y-5">
          <button onClick={() => setPhase("form")}
            className="flex items-center gap-1.5 text-sm opacity-50 hover:opacity-80 transition-opacity">
            <ArrowLeft size={14} /> Modifier mes informations
          </button>

          {/* Bandeau digital */}
          <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: `${theme.accent}10`, border: `1px solid ${theme.accent}30` }}>
            <Zap size={18} style={{ color: theme.accent }} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold" style={{ color: theme.accent }}>Livraison instantanée</p>
              <p className="text-xs opacity-70 mt-0.5 leading-relaxed">
                Vos fichiers seront disponibles immédiatement après le paiement.
              </p>
            </div>
          </div>

          {/* Stripe checkout */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: theme.surface, borderColor: `${theme.accent}20` }}>
            <h2 className="font-bold font-playfair text-base mb-4">💳 Paiement sécurisé</h2>
            <StripeCheckout
              commandeId={commandeId}
              montant={total}
              devise={devise}
              clientEmail={form.email}
              clientNom={form.nom}
              codeAffiliation={codeRef ?? undefined}
              onSuccess={onPaiementSucces}
              onError={(msg) => toast.error(msg)}
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-24 space-y-4">
            <Recap theme={theme} devise={devise} items={items} total={total} codePromo={codePromo} label="Produits digitaux" />
            {codeRef && (
              <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl" style={{ background: `${theme.accent}10`, color: theme.accent }}>
                <CheckCircle2 size={12} /> Code affiliation <span className="font-mono font-bold">{codeRef}</span> appliqué
              </div>
            )}
            <div className="flex items-center gap-2 text-xs opacity-40 justify-center">
              <Download size={10} /> Téléchargement disponible immédiatement après paiement
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Phase 1 : formulaire ───────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
      <div className="lg:col-span-3 space-y-5">
        {/* Bandeau digital */}
        <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: `${theme.accent}10`, border: `1px solid ${theme.accent}30` }}>
          <Zap size={18} style={{ color: theme.accent }} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold" style={{ color: theme.accent }}>Livraison instantanée</p>
            <p className="text-xs opacity-70 mt-0.5 leading-relaxed">
              Votre fichier sera disponible immédiatement après la confirmation du paiement. Un lien de téléchargement vous sera envoyé par email.
            </p>
          </div>
        </div>

        {/* Infos client */}
        <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: theme.surface, borderColor: `${theme.accent}20` }}>
          <h2 className="font-bold font-playfair text-base">👤 Vos informations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Field label="Nom complet" required>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                  <input value={form.nom} onChange={e => set("nom", e.target.value)} placeholder="Ex: Aminata Diallo" className={inp} style={{ ...inpStyle, paddingLeft: "2.25rem" }} />
                </div>
              </Field>
            </div>
            <Field label="Email (recevez votre fichier ici)" required>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@exemple.com" className={inp} style={{ ...inpStyle, paddingLeft: "2.25rem" }} />
              </div>
            </Field>
            <Field label="Téléphone (optionnel)">
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                <input type="tel" value={form.telephone} onChange={e => set("telephone", e.target.value)} placeholder="+221 77 000 00 00" className={inp} style={{ ...inpStyle, paddingLeft: "2.25rem" }} />
              </div>
            </Field>
            <Field label="Pays">
              <select value={form.pays} onChange={e => set("pays", e.target.value)} className={inp} style={inpStyle}>
                {PAYS_AFRIQUE.map(p => <option key={p} style={{ backgroundColor: theme.surface }}>{p}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* Info paiement */}
        <div className="flex items-center gap-3 p-4 rounded-2xl border" style={{ borderColor: `${theme.accent}15`, background: `${theme.accent}05` }}>
          <CreditCard size={16} style={{ color: theme.accent }} className="flex-shrink-0" />
          <p className="text-xs opacity-60 leading-relaxed">
            Paiement sécurisé par <span className="font-bold" style={{ color: "#635BFF" }}>Stripe</span> · Visa, Mastercard, American Express · Chiffrement SSL 256-bit
          </p>
        </div>
      </div>

      {/* Récap + CTA */}
      <div className="lg:col-span-2">
        <div className="lg:sticky lg:top-24 space-y-4">
          <Recap theme={theme} devise={devise} items={items} total={total} codePromo={codePromo} label="Produits digitaux" />

          {codeRef && (
            <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl" style={{ background: `${theme.accent}10`, color: theme.accent }}>
              <CheckCircle2 size={12} /> Code affiliation <span className="font-mono font-bold">{codeRef}</span> appliqué
            </div>
          )}

          <button onClick={creerCommande} disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg"
            style={{ backgroundColor: "#635BFF", color: "#fff", boxShadow: "0 4px 20px rgba(99,91,255,0.4)" }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Shield size={16} />}
            {loading ? "Préparation du paiement…" : `Payer ${formatMontant(total, devise)}`}
          </button>

          <div className="flex items-center gap-2 text-xs opacity-40 justify-center">
            <Download size={10} /> Téléchargement disponible immédiatement après paiement
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECKOUT MIXTE — Avertissement + deux sections
// ═══════════════════════════════════════════════════════════════════════════════
function CheckoutMixte({ theme, slug, devise, tenantId, nomBoutique, logoUrl, items, total, codePromo, viderPanier }: any) {
  const itemsPhysiques = items.filter((i: any) => i.type === "physique");
  const itemsDigitaux  = items.filter((i: any) => i.type === "digital" || i.type === "dropshipping");
  const totalPhysique  = itemsPhysiques.reduce((s: number, i: any) => s + i.prix * i.quantite, 0);
  const totalDigital   = itemsDigitaux.reduce((s: number, i: any) => s + i.prix * i.quantite, 0);
  const [section, setSection] = useState<"physique" | "digital">("physique");

  return (
    <div className="space-y-6">
      {/* Bandeau mixte */}
      <div className="flex items-start gap-3 p-4 rounded-2xl border" style={{ background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.3)" }}>
        <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-600">Panier mixte détecté</p>
          <p className="text-xs text-amber-700 opacity-80 mt-0.5 leading-relaxed">
            Votre panier contient des produits physiques et des produits digitaux. Ils nécessitent deux processus distincts.
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex rounded-2xl border p-1 gap-1" style={{ borderColor: `${theme.accent}20`, backgroundColor: theme.surface }}>
        <button onClick={() => setSection("physique")}
          className="flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
          style={{ background: section === "physique" ? theme.accent : "transparent", color: section === "physique" ? theme.fond : theme.texte, opacity: section === "physique" ? 1 : 0.6 }}>
          <Package size={14} /> Physiques ({itemsPhysiques.length})
        </button>
        <button onClick={() => setSection("digital")}
          className="flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
          style={{ background: section === "digital" ? theme.accent : "transparent", color: section === "digital" ? theme.fond : theme.texte, opacity: section === "digital" ? 1 : 0.6 }}>
          <Zap size={14} /> Digitaux ({itemsDigitaux.length})
        </button>
      </div>

      {section === "physique" && itemsPhysiques.length > 0 && (
        <CheckoutPhysique theme={theme} slug={slug} devise={devise} tenantId={tenantId} items={itemsPhysiques} total={totalPhysique} codePromo={null} viderPanier={() => {}} />
      )}
      {section === "digital" && itemsDigitaux.length > 0 && (
        <CheckoutDigital theme={theme} slug={slug} devise={devise} tenantId={tenantId} nomBoutique={nomBoutique} logoUrl={logoUrl} items={itemsDigitaux} total={totalDigital} codePromo={null} viderPanier={() => {}} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export function CheckoutForm({ theme, slug, devise, tenantId, nomBoutique, logoUrl }: Props) {
  const { items, totalAvecReduction, viderPanier, codePromo } = useCartStore();
  const total = totalAvecReduction();

  // Détecter le type du panier
  // digital + dropshipping → paiement en ligne Stripe
  // physique → COD livraison
  const typePanier = useMemo(() => {
    if (items.length === 0) return "vide";
    const aEnLigne  = items.some(i => i.type === "digital" || i.type === "dropshipping");
    const aPhysique = items.some(i => i.type === "physique");
    if (aEnLigne && aPhysique) return "mixte";
    if (aEnLigne) return "digital"; // même flow Stripe pour digital + dropshipping
    return "physique";
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="opacity-60">Votre panier est vide</p>
        <a href={`/${slug}/produits`} className="text-sm mt-3 inline-block" style={{ color: theme.accent }}>← Voir les produits</a>
      </div>
    );
  }

  const commonProps = { theme, slug, devise, tenantId, nomBoutique, logoUrl, items, total, codePromo, viderPanier };

  return (
    <>
      {/* Badge type en haut */}
      <div className="mb-6">
        {typePanier === "physique" && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)" }}>
            <Package size={14} /> Commande physique · Paiement à la livraison
          </div>
        )}
        {typePanier === "digital" && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style={{ background: `${theme.accent}15`, color: theme.accent, border: `1px solid ${theme.accent}30` }}>
            <Zap size={14} /> {items.some((i:any) => i.type === "dropshipping") ? "Expédition directe · Paiement en ligne sécurisé" : "Livraison instantanée · Paiement en ligne sécurisé"}
          </div>
        )}
        {typePanier === "mixte" && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "rgba(245,158,11,0.1)", color: "#D97706", border: "1px solid rgba(245,158,11,0.3)" }}>
            <AlertCircle size={14} /> Panier mixte · Deux processus distincts
          </div>
        )}
      </div>

      {typePanier === "physique" && <CheckoutPhysique {...commonProps} />}
      {typePanier === "digital"  && <CheckoutDigital {...commonProps} />}
      {typePanier === "mixte"    && <CheckoutMixte {...commonProps} />}
    </>
  );
}
