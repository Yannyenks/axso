"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Store, Palette, Globe, Link2, Truck, Save, Loader2,
  ExternalLink, Copy, Check,
} from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";

const THEMES = [
  { id: "noir-obsidien",      nom: "Noir Obsidien",       desc: "Luxe & Mode",               fond: "#0a0a0a", accent: "#1B4FD8", texte: "#F5F5F0", badge: "✦ Premium" },
  { id: "violet-cosmos",      nom: "Violet Cosmos",       desc: "Beauté & Art",              fond: "#1a0a2e", accent: "#7c3aed", texte: "#f0eaff", badge: "✦ Premium" },
  { id: "terre-et-or",        nom: "Terre & Or",          desc: "Artisanat & Culture",       fond: "#fff8f0", accent: "#c2622d", texte: "#2c1503", badge: null },
  { id: "ocean-atlantique",   nom: "Océan Atlantique",    desc: "Luxe Côtier & Marine",      fond: "#010d1f", accent: "#00b4d8", texte: "#e0f4ff", badge: "🌊 3D" },
  { id: "kente-royal",        nom: "Kente Royal",         desc: "Artisanat Africain Premium",fond: "#1a0e00", accent: "#1b4fd8", texte: "#fff8e8", badge: "👑 3D" },
  { id: "bwiti-forest",       nom: "Bwiti Forest",        desc: "Nature & Bien-être Bio",    fond: "#071a0b", accent: "#4ade80", texte: "#e8ffe0", badge: "🌿 3D" },
];

const PAYS = [
  { code: "SN", nom: "Sénégal" }, { code: "CM", nom: "Cameroun" }, { code: "CI", nom: "Côte d'Ivoire" },
  { code: "GH", nom: "Ghana" }, { code: "NG", nom: "Nigeria" }, { code: "KE", nom: "Kenya" },
  { code: "MA", nom: "Maroc" }, { code: "TG", nom: "Togo" }, { code: "BJ", nom: "Bénin" },
];

const inputCls = "w-full bg-white border border-[#E8E8E8] rounded-2xl px-4 py-3 text-[#111111] text-[13px] outline-none focus:border-[#F5A623]/50 focus:ring-2 focus:ring-[#F5A623]/8 transition-all placeholder:text-[#CCCCCC]";
const labelCls = "block mb-1.5 ax-label";

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

  const SECTIONS: { id: Section; label: string; Icon: any }[] = [
    { id: "infos",    label: "Infos",     Icon: Store   },
    { id: "apparence",label: "Apparence", Icon: Palette },
    { id: "seo",      label: "SEO",       Icon: Globe   },
    { id: "reseaux",  label: "Sociaux",   Icon: Link2   },
    { id: "livraison",label: "Livraison", Icon: Truck   },
  ];

  return (
    <div className="max-w-2xl space-y-5"
      style={{ fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif" }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap pt-1">
        <div>
          <h1 className="text-[20px] font-bold text-[#111111] tracking-tight">Ma Boutique</h1>
          <p className="text-[12.5px] text-[#AAAAAA] mt-0.5">Configurez chaque aspect de votre boutique en ligne</p>
        </div>
        {tenant && (
          <div className="flex items-center gap-2">
            <a href={`/${tenant.slug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[12px] font-medium text-[#D97706] border border-[#FDE68A] px-3 py-1.5 rounded-2xl hover:bg-[#FFFBEB] transition-all">
              <ExternalLink size={12} /> Voir la boutique
            </a>
            <button onClick={() => { navigator.clipboard.writeText(urlProd); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="flex items-center gap-1.5 text-[12px] font-medium text-[#888888] border border-[#E8E8E8] px-3 py-1.5 rounded-2xl hover:border-[#CCCCCC] hover:text-[#111111] transition-all">
              {copied ? <Check size={12} className="text-[#16A34A]" /> : <Copy size={12} />}
              {copied ? "Copié !" : urlProd}
            </button>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
        {SECTIONS.map(s => {
          const Icon = s.Icon;
          const active = section === s.id;
          return (
            <button key={s.id} onClick={() => setSection(s.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all flex-shrink-0"
              style={active
                ? { background: "#111111", color: "#FFFFFF", border: "1px solid #111111" }
                : { background: "#FFFFFF", color: "#888888", border: "1px solid #E8E8E8" }}>
              <Icon size={12} /> {s.label}
            </button>
          );
        })}
      </div>

      {/* ── Infos générales ── */}
      {section === "infos" && (
        <div className="ax-card p-6 space-y-5">
          <h2 className="text-[13px] font-semibold text-[#111111]">Informations générales</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { key: "nomBoutique", label: "Nom de la boutique *", placeholder: "Mode Aminata" },
              { key: "email",       label: "Email professionnel",   placeholder: "contact@maboutique.com", type: "email" },
              { key: "whatsapp",    label: "WhatsApp Business",     placeholder: "+221 77 000 00 00" },
              { key: "telephone",   label: "Téléphone",             placeholder: "+221 33 000 00 00" },
              { key: "adresse",     label: "Adresse physique",      placeholder: "Rue 10, Dakar" },
            ].map(f => (
              <div key={f.key}>
                <label className={labelCls}>{f.label}</label>
                <input type={f.type || "text"} value={(form as any)[f.key]} placeholder={f.placeholder}
                  onChange={e => set(f.key, e.target.value)} className={inputCls} />
              </div>
            ))}
            <div>
              <label className={labelCls}>Pays</label>
              <select value={form.pays} onChange={e => set("pays", e.target.value)}
                className={inputCls} style={{ appearance: "none" }}>
                <option value="">Sélectionner…</option>
                {PAYS.map(p => <option key={p.code} value={p.code}>{p.nom}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Description de la boutique</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4}
              placeholder="Décrivez votre boutique, vos produits, votre histoire…"
              className={`${inputCls} resize-none`} />
          </div>
        </div>
      )}

      {/* ── Apparence ── */}
      {section === "apparence" && (
        <div className="space-y-4">
          <div className="ax-card p-6 space-y-4">
            <h2 className="text-[13px] font-semibold text-[#111111]">Médias de la boutique</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <ImageUpload label="Logo (400×400px)" value={form.logoUrl}
                onChange={url => set("logoUrl", url)} onRemove={() => set("logoUrl", "")}
                aspectRatio="square" hint="PNG transparent recommandé" />
              <ImageUpload label="Bannière d'accueil (1200×400px)" value={form.bannerUrl}
                onChange={url => set("bannerUrl", url)} onRemove={() => set("bannerUrl", "")}
                aspectRatio="banner" hint="Format large recommandé" />
            </div>
          </div>
          <div className="ax-card p-6 space-y-3">
            <h2 className="text-[13px] font-semibold text-[#111111]">Thème visuel</h2>
            <div className="space-y-2.5">
              {THEMES.map(t => (
                <button key={t.id} type="button" onClick={() => set("themeId", t.id)}
                  className="w-full text-left rounded-2xl border-2 overflow-hidden transition-all"
                  style={form.themeId === t.id
                    ? { borderColor: "#F5A623", boxShadow: "0 0 0 4px rgba(245,166,35,0.08)" }
                    : { borderColor: "#EBEBEB" }}>
                  <div className="h-12 flex items-center justify-center relative" style={{ backgroundColor: t.fond }}>
                    <p className="font-bold text-[13px]" style={{ color: t.accent, fontFamily: "'Poppins',sans-serif" }}>
                      {form.nomBoutique || "Ma Boutique"}
                    </p>
                    {form.themeId === t.id && (
                      <div className="absolute top-2 right-2.5 w-5 h-5 rounded-full bg-[#F5A623] flex items-center justify-center text-white text-[10px] font-bold">✓</div>
                    )}
                  </div>
                  <div className="bg-white px-4 py-2.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[#111111] font-semibold text-[12.5px]">{t.nom}</p>
                        {t.badge && (
                          <span className="text-[9.5px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: `${t.accent}18`, color: t.accent }}>{t.badge}</span>
                        )}
                      </div>
                      <p className="text-[#AAAAAA] text-[11px]">{t.desc}</p>
                    </div>
                    <div className="flex gap-1.5">
                      {[t.fond, t.accent, t.texte].map((c, i) => (
                        <div key={i} className="w-4 h-4 rounded-full border border-[#E8E8E8]" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SEO ── */}
      {section === "seo" && (
        <div className="ax-card p-6 space-y-4">
          <h2 className="text-[13px] font-semibold text-[#111111]">Référencement naturel (SEO)</h2>
          <div>
            <label className={labelCls}>Titre méta (60 car. max)</label>
            <input value={form.metaTitle} onChange={e => set("metaTitle", e.target.value)} maxLength={60}
              placeholder="Ex: Mode Aminata - Prêt-à-porter africain" className={inputCls} />
            <p className="text-[11px] text-[#CCCCCC] mt-1">{form.metaTitle.length}/60</p>
          </div>
          <div>
            <label className={labelCls}>Description méta (160 car. max)</label>
            <textarea value={form.metaDescription} onChange={e => set("metaDescription", e.target.value)} rows={3} maxLength={160}
              placeholder="Description visible dans les résultats Google…"
              className={`${inputCls} resize-none`} />
            <p className="text-[11px] text-[#CCCCCC] mt-1">{form.metaDescription.length}/160</p>
          </div>
          {(form.metaTitle || form.metaDescription) && (
            <div className="border border-[#E8E8E8] rounded-2xl p-4 bg-[#FAFAFA] space-y-1.5">
              <p className="ax-label mb-2">Aperçu Google</p>
              <p className="text-blue-500 text-[13.5px] font-medium">{form.metaTitle || form.nomBoutique}</p>
              <p className="text-green-600 text-[11.5px]">{tenant?.slug}.axso.com</p>
              <p className="text-[#888888] text-[12px]">{form.metaDescription || form.description?.slice(0, 160)}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Réseaux sociaux ── */}
      {section === "reseaux" && (
        <div className="ax-card p-6 space-y-4">
          <h2 className="text-[13px] font-semibold text-[#111111]">Vos liens sociaux</h2>
          {[
            { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/votre_boutique", emoji: "📸" },
            { key: "facebook",  label: "Facebook",  placeholder: "https://facebook.com/votre_boutique", emoji: "👍" },
            { key: "tiktok",    label: "TikTok",    placeholder: "https://tiktok.com/@votre_boutique", emoji: "🎵" },
            { key: "twitter",   label: "X / Twitter", placeholder: "https://twitter.com/votre_boutique", emoji: "🐦" },
          ].map(s => (
            <div key={s.key}>
              <label className={labelCls}>{s.emoji} {s.label}</label>
              <input value={(form as any)[s.key]} onChange={e => set(s.key, e.target.value)}
                placeholder={s.placeholder} className={inputCls} />
            </div>
          ))}
        </div>
      )}

      {/* ── Livraison ── */}
      {section === "livraison" && (
        <div className="ax-card p-6 space-y-5">
          <h2 className="text-[13px] font-semibold text-[#111111]">Paramètres de livraison</h2>
          <div className="flex items-center justify-between p-4 bg-[#FAFAFA] border border-[#F0F0F0] rounded-2xl">
            <div>
              <p className="text-[13px] font-semibold text-[#111111]">Livraison gratuite pour tous</p>
              <p className="text-[11.5px] text-[#AAAAAA]">Offrir la livraison à tous vos clients</p>
            </div>
            <button onClick={() => set("livraisonGratuite", !form.livraisonGratuite)}
              className="w-11 h-6 rounded-full transition-all relative flex-shrink-0"
              style={{ background: form.livraisonGratuite ? "#F5A623" : "#E8E8E8" }}>
              <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all"
                style={{ left: form.livraisonGratuite ? "calc(100% - 22px)" : "2px" }} />
            </button>
          </div>
          {!form.livraisonGratuite && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Frais de livraison</label>
                <input type="number" value={form.fraisLivraison} onChange={e => set("fraisLivraison", e.target.value)}
                  min="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Minimum pour livraison gratuite (0 = désactivé)</label>
                <input type="number" value={form.livraisonMin} onChange={e => set("livraisonMin", e.target.value)}
                  min="0" className={inputCls} />
              </div>
            </div>
          )}
          <div>
            <label className={labelCls}>Zones de livraison (séparées par des virgules)</label>
            <input value={form.zonesLivraison} onChange={e => set("zonesLivraison", e.target.value)}
              placeholder="Ex: Dakar, Thiès, Saint-Louis, Toute la ville" className={inputCls} />
          </div>
          <div className="flex items-start gap-3 bg-[#FFFBEB] border border-[#FDE68A]/60 rounded-2xl p-4">
            <span className="text-[16px]">🔒</span>
            <p className="text-[12px] text-[#92400E] leading-relaxed">
              <strong>Système escrow :</strong> Le paiement client est sécurisé pendant 48h. Les fonds sont versés après confirmation de livraison. Axso prélève <strong>3%</strong> de commission sur chaque vente confirmée.
            </p>
          </div>
        </div>
      )}

      {/* ── Save button ── */}
      <button onClick={sauvegarder} disabled={saving}
        className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-2xl transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
        style={{ background: "linear-gradient(135deg, #F5A623, #D4911A)", boxShadow: "0 4px 20px rgba(245,166,35,0.28)" }}>
        {saving ? <><Loader2 size={15} className="animate-spin" /> Sauvegarde en cours…</> : <><Save size={15} /> Enregistrer les modifications</>}
      </button>
    </div>
  );
}
