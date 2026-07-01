"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Store, Palette, Globe, Link2, Truck, Save, Loader2, ExternalLink, Copy, Check } from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";

const THEMES = [
  { id: "noir-obsidien", nom: "Noir Obsidien", desc: "Luxe & Mode", fond: "#0a0a0a", accent: "#1B4FD8", texte: "#F5F5F0", badge: "✦ Premium" },
  { id: "violet-cosmos", nom: "Violet Cosmos", desc: "Beauté & Art", fond: "#1a0a2e", accent: "#7c3aed", texte: "#f0eaff", badge: "✦ Premium" },
  { id: "terre-et-or", nom: "Terre & Or", desc: "Artisanat & Culture", fond: "#fff8f0", accent: "#c2622d", texte: "#2c1503", badge: null },
  { id: "ocean-atlantique", nom: "Océan Atlantique", desc: "Luxe Côtier & Marine", fond: "#010d1f", accent: "#00b4d8", texte: "#e0f4ff", badge: "🌊 3D" },
  { id: "kente-royal", nom: "Kente Royal", desc: "Artisanat Africain Premium", fond: "#1a0e00", accent: "#1b4fd8", texte: "#fff8e8", badge: "👑 3D" },
  { id: "bwiti-forest", nom: "Bwiti Forest", desc: "Nature & Bien-être Bio", fond: "#071a0b", accent: "#4ade80", texte: "#e8ffe0", badge: "🌿 3D" },
];

const PAYS = [
  { code: "SN", nom: "Sénégal" }, { code: "CM", nom: "Cameroun" }, { code: "CI", nom: "Côte d'Ivoire" },
  { code: "GH", nom: "Ghana" }, { code: "NG", nom: "Nigeria" }, { code: "KE", nom: "Kenya" },
  { code: "MA", nom: "Maroc" }, { code: "TG", nom: "Togo" }, { code: "BJ", nom: "Bénin" },
];

const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/10 transition-all placeholder:text-gray-400";

type Section = "infos" | "apparence" | "seo" | "reseaux" | "livraison";

export default function BoutiquePage() {
  const router = useRouter();
  const [section, setSection] = useState<Section>("infos");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tenant, setTenant] = useState<any>(null);
  const [form, setForm] = useState({
    nomBoutique: "", description: "", pays: "", whatsapp: "", email: "", telephone: "", adresse: "",
    logoUrl: "", bannerUrl: "", themeId: "terre-et-or",
    metaTitle: "", metaDescription: "",
    facebook: "", instagram: "", tiktok: "", twitter: "",
    livraisonGratuite: false, fraisLivraison: "0", livraisonMin: "0", zonesLivraison: "",
  });

  useEffect(() => {
    fetch("/api/tenants/moi").then(r => r.json()).then(d => {
      if (d.tenant) {
        const t = d.tenant;
        setTenant(t);
        const social = t.socialLinks || {};
        const livraison = t.parametresLivraison || {};
        setForm({
          nomBoutique: t.nomBoutique || "", description: t.description || "",
          pays: t.pays || "", whatsapp: t.whatsapp || "", email: t.email || "",
          telephone: t.telephone || "", adresse: t.adresse || "",
          logoUrl: t.logoUrl || "", bannerUrl: t.bannerUrl || "", themeId: t.themeId || "terre-et-or",
          metaTitle: t.metaTitle || "", metaDescription: t.metaDescription || "",
          facebook: social.facebook || "", instagram: social.instagram || "",
          tiktok: social.tiktok || "", twitter: social.twitter || "",
          livraisonGratuite: livraison.gratuite || false,
          fraisLivraison: String(livraison.frais || 0), livraisonMin: String(livraison.minimum || 0),
          zonesLivraison: (livraison.zones || []).join(", "),
        });
      }
    });
  }, []);

  function set(field: string, value: any) { setForm(f => ({ ...f, [field]: value })); }

  async function sauvegarder() {
    setSaving(true);
    try {
      const res = await fetch("/api/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomBoutique: form.nomBoutique, description: form.description,
          pays: form.pays, whatsapp: form.whatsapp, email: form.email,
          telephone: form.telephone, adresse: form.adresse,
          logoUrl: form.logoUrl, bannerUrl: form.bannerUrl, themeId: form.themeId,
          metaTitle: form.metaTitle, metaDescription: form.metaDescription,
          socialLinks: { facebook: form.facebook, instagram: form.instagram, tiktok: form.tiktok, twitter: form.twitter },
          parametresLivraison: {
            gratuite: form.livraisonGratuite,
            frais: parseFloat(form.fraisLivraison) || 0,
            minimum: parseFloat(form.livraisonMin) || 0,
            zones: form.zonesLivraison.split(",").map((z: string) => z.trim()).filter(Boolean),
          },
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Boutique mise à jour !");
      router.refresh();
    } catch { toast.error("Erreur lors de la sauvegarde"); }
    finally { setSaving(false); }
  }

  const urlProd = tenant ? `${tenant.slug}.axso.com` : "";

  const SECTIONS: { id: Section; label: string; icon: any }[] = [
    { id: "infos", label: "Infos générales", icon: Store },
    { id: "apparence", label: "Apparence", icon: Palette },
    { id: "seo", label: "SEO", icon: Globe },
    { id: "reseaux", label: "Réseaux sociaux", icon: Link2 },
    { id: "livraison", label: "Livraison", icon: Truck },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-poppins">Ma Boutique</h1>
          <p className="text-gray-400 text-sm mt-1">Configurez chaque aspect de votre boutique</p>
        </div>
        {tenant && (
          <div className="flex items-center gap-2">
            <a href={`/${tenant.slug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[#d4820a] border border-[#F5A623]/30 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-all">
              <ExternalLink size={12} /> Voir la boutique
            </a>
            <button onClick={() => { navigator.clipboard.writeText(urlProd); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-[#F5A623]/30 transition-all">
              {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              {copied ? "Copié !" : urlProd}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1 overflow-x-auto">
        {SECTIONS.map(s => {
          const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${section === s.id ? "bg-[#F5A623] text-white font-semibold shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>
              <Icon size={13} />{s.label}
            </button>
          );
        })}
      </div>

      {/* Infos générales */}
      {section === "infos" && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { key: "nomBoutique", label: "Nom de la boutique *", placeholder: "Mode Aminata" },
              { key: "email", label: "Email professionnel", placeholder: "contact@maboutique.com", type: "email" },
              { key: "whatsapp", label: "WhatsApp Business", placeholder: "+221 77 000 00 00" },
              { key: "telephone", label: "Téléphone", placeholder: "+221 33 000 00 00" },
              { key: "adresse", label: "Adresse physique", placeholder: "Rue 10, Dakar" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-gray-500 text-xs font-medium block mb-1.5">{f.label}</label>
                <input type={f.type || "text"} value={(form as any)[f.key]} placeholder={f.placeholder}
                  onChange={e => set(f.key, e.target.value)} className={inputCls} />
              </div>
            ))}
            <div>
              <label className="text-gray-500 text-xs font-medium block mb-1.5">Pays</label>
              <select value={form.pays} onChange={e => set("pays", e.target.value)} className={inputCls}>
                <option value="">Sélectionner...</option>
                {PAYS.map(p => <option key={p.code} value={p.code}>{p.nom}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-gray-500 text-xs font-medium block mb-1.5">Description de la boutique</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4}
              placeholder="Décrivez votre boutique, vos produits, votre histoire..."
              className={`${inputCls} resize-none`} />
          </div>
        </div>
      )}

      {/* Apparence */}
      {section === "apparence" && (
        <div className="space-y-5">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5 shadow-sm">
            <h2 className="text-gray-800 font-semibold text-sm">Médias de la boutique</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <ImageUpload label="Logo (400×400px)" value={form.logoUrl}
                onChange={url => set("logoUrl", url)} onRemove={() => set("logoUrl", "")}
                aspectRatio="square" hint="PNG transparent recommandé" />
              <ImageUpload label="Bannière d'accueil (1200×400px)" value={form.bannerUrl}
                onChange={url => set("bannerUrl", url)} onRemove={() => set("bannerUrl", "")}
                aspectRatio="banner" hint="Format large recommandé" />
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
            <h2 className="text-gray-800 font-semibold text-sm">Thème visuel</h2>
            <div className="space-y-3">
              {THEMES.map(t => (
                <button key={t.id} type="button" onClick={() => set("themeId", t.id)}
                  className={`w-full text-left rounded-2xl border-2 overflow-hidden transition-all ${form.themeId === t.id ? "border-[#F5A623] shadow-lg shadow-[#F5A623]/10" : "border-gray-100 hover:border-gray-200"}`}>
                  <div className="h-14 flex items-center justify-center relative" style={{ backgroundColor: t.fond }}>
                    <p className="font-poppins font-bold" style={{ color: t.accent }}>{form.nomBoutique || "Ma Boutique"}</p>
                    {form.themeId === t.id && (
                      <div className="absolute top-2 right-3 w-5 h-5 rounded-full bg-[#F5A623] flex items-center justify-center text-white text-xs font-bold">✓</div>
                    )}
                  </div>
                  <div className="bg-white px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-800 font-semibold text-sm">{t.nom}</p>
                        {t.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: `${t.accent}20`, color: t.accent }}>{t.badge}</span>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs">{t.desc}</p>
                    </div>
                    <div className="flex gap-1.5">
                      {[t.fond, t.accent, t.texte].map((c, i) => (
                        <div key={i} className="w-4 h-4 rounded-full border border-gray-100 shadow-sm" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SEO */}
      {section === "seo" && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-gray-800 font-semibold text-sm mb-2">Référencement naturel (SEO)</h2>
          <div>
            <label className="text-gray-500 text-xs font-medium block mb-1.5">Titre méta (60 car. max)</label>
            <input value={form.metaTitle} onChange={e => set("metaTitle", e.target.value)} maxLength={60}
              placeholder="Ex: Mode Aminata - Prêt-à-porter africain" className={inputCls} />
            <p className="text-gray-400 text-xs mt-1">{form.metaTitle.length}/60</p>
          </div>
          <div>
            <label className="text-gray-500 text-xs font-medium block mb-1.5">Description méta (160 car. max)</label>
            <textarea value={form.metaDescription} onChange={e => set("metaDescription", e.target.value)} rows={3} maxLength={160}
              placeholder="Description visible dans les résultats Google..."
              className={`${inputCls} resize-none`} />
            <p className="text-gray-400 text-xs mt-1">{form.metaDescription.length}/160</p>
          </div>
          {(form.metaTitle || form.metaDescription) && (
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-1">
              <p className="text-gray-400 text-xs mb-2">Aperçu Google</p>
              <p className="text-blue-500 text-sm">{form.metaTitle || form.nomBoutique}</p>
              <p className="text-green-600 text-xs">{tenant?.slug}.axso.com</p>
              <p className="text-gray-500 text-xs">{form.metaDescription || form.description?.slice(0, 160)}</p>
            </div>
          )}
        </div>
      )}

      {/* Réseaux sociaux */}
      {section === "reseaux" && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-gray-800 font-semibold text-sm mb-2">Vos liens sociaux</h2>
          {[
            { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/votre_boutique", emoji: "📸" },
            { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/votre_boutique", emoji: "👍" },
            { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@votre_boutique", emoji: "🎵" },
            { key: "twitter", label: "X / Twitter", placeholder: "https://twitter.com/votre_boutique", emoji: "🐦" },
          ].map(s => (
            <div key={s.key}>
              <label className="text-gray-500 text-xs font-medium block mb-1.5">{s.emoji} {s.label}</label>
              <input value={(form as any)[s.key]} onChange={e => set(s.key, e.target.value)} placeholder={s.placeholder}
                className={inputCls} />
            </div>
          ))}
        </div>
      )}

      {/* Livraison */}
      {section === "livraison" && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5 shadow-sm">
          <h2 className="text-gray-800 font-semibold text-sm">Paramètres de livraison</h2>
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
            <div>
              <p className="text-gray-800 text-sm font-medium">Livraison gratuite pour tous</p>
              <p className="text-gray-400 text-xs">Offrir la livraison à tous vos clients</p>
            </div>
            <button onClick={() => set("livraisonGratuite", !form.livraisonGratuite)}
              className={`w-11 h-6 rounded-full transition-all relative ${form.livraisonGratuite ? "bg-[#F5A623]" : "bg-gray-200"}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${form.livraisonGratuite ? "left-5" : "left-0.5"}`} />
            </button>
          </div>
          {!form.livraisonGratuite && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-500 text-xs font-medium block mb-1.5">Frais de livraison</label>
                <input type="number" value={form.fraisLivraison} onChange={e => set("fraisLivraison", e.target.value)} min="0"
                  className={inputCls} />
              </div>
              <div>
                <label className="text-gray-500 text-xs font-medium block mb-1.5">Minimum pour livraison gratuite (0 = désactivé)</label>
                <input type="number" value={form.livraisonMin} onChange={e => set("livraisonMin", e.target.value)} min="0"
                  className={inputCls} />
              </div>
            </div>
          )}
          <div>
            <label className="text-gray-500 text-xs font-medium block mb-1.5">Zones de livraison (séparées par des virgules)</label>
            <input value={form.zonesLivraison} onChange={e => set("zonesLivraison", e.target.value)}
              placeholder="Ex: Dakar, Thiès, Saint-Louis, Toute la ville" className={inputCls} />
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-amber-700 text-xs leading-relaxed">
              <strong>Système escrow :</strong> Le paiement client est sécurisé pendant 48h. Les fonds vous sont versés automatiquement après confirmation de livraison. Axso prélève 3% de commission sur chaque vente confirmée.
            </p>
          </div>
        </div>
      )}

      <button onClick={sauvegarder} disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-[#F5A623] text-white font-bold py-4 rounded-xl hover:bg-[#d4820a] transition-all disabled:opacity-50 shadow-lg shadow-[#F5A623]/25 hover:scale-[1.01] active:scale-95">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saving ? "Sauvegarde en cours..." : "Enregistrer les modifications"}
      </button>
    </div>
  );
}
