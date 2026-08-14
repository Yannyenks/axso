"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Store, Palette, Globe, Link2, Truck, Save, Loader2,
  ExternalLink, Copy, Check, Camera, Users, Music, MessageCircle,
  Mail, Phone, MapPin, CheckCircle2, Plus, X, Sparkles,
} from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";

const THEMES = [
  { id: "noir-obsidien",      nom: "Noir Obsidien",       desc: "Luxe & Mode",               fond: "#0a0a0a", accent: "#1B4FD8", texte: "#F5F5F0", badge: "✦ Premium" },
  { id: "violet-cosmos",      nom: "Violet Cosmos",       desc: "Beauté & Art",              fond: "#1a0a2e", accent: "#1B2A4A", texte: "#f0eaff", badge: "✦ Premium" },
  { id: "terre-et-or",        nom: "Terre & Or",          desc: "Artisanat & Culture",       fond: "#fff8f0", accent: "#c2622d", texte: "#2c1503", badge: null },
  { id: "ocean-atlantique",   nom: "Océan Atlantique",    desc: "Luxe Côtier & Marine",      fond: "#010d1f", accent: "#00b4d8", texte: "#e0f4ff", badge: "~ 3D" },
  { id: "kente-royal",        nom: "Kente Royal",         desc: "Artisanat Africain Premium",fond: "#1a0e00", accent: "#1b4fd8", texte: "#fff8e8", badge: "♦ 3D" },
  { id: "bwiti-forest",       nom: "Bwiti Forest",        desc: "Nature & Bien-être Bio",    fond: "#071a0b", accent: "#4ade80", texte: "#e8ffe0", badge: "* 3D" },
];

const PAYS = [
  { code: "SN", nom: "Sénégal" }, { code: "CM", nom: "Cameroun" }, { code: "CI", nom: "Côte d'Ivoire" },
  { code: "GH", nom: "Ghana" }, { code: "NG", nom: "Nigeria" }, { code: "KE", nom: "Kenya" },
  { code: "MA", nom: "Maroc" }, { code: "TG", nom: "Togo" }, { code: "BJ", nom: "Bénin" },
];

const inputCls = "w-full bg-white border border-[#E8E8E8] rounded-2xl px-4 py-3 text-[#111111] text-[13px] outline-none focus:border-[#F5A623]/50 focus:ring-2 focus:ring-[#F5A623]/8 transition-all placeholder:text-[#CCCCCC]";
const labelCls = "flex items-center gap-1.5 mb-1.5 ax-label";

type Section = "infos" | "apparence" | "seo" | "reseaux" | "livraison";

const SECTIONS: { id: Section; label: string; desc: string; Icon: any }[] = [
  { id: "infos",     label: "Informations",  desc: "Identité & contact",   Icon: Store   },
  { id: "apparence", label: "Apparence",     desc: "Logo, bannière, thème", Icon: Palette },
  { id: "seo",       label: "Référencement", desc: "Visibilité Google",     Icon: Globe   },
  { id: "reseaux",   label: "Réseaux",       desc: "Réseaux sociaux",       Icon: Link2   },
  { id: "livraison", label: "Livraison",     desc: "Frais & zones",         Icon: Truck   },
];

const CHAMPS_INFOS = [
  { key: "nomBoutique", label: "Nom de la boutique *", placeholder: "Mode Aminata",           Icon: Store },
  { key: "email",       label: "Email professionnel",  placeholder: "contact@maboutique.com", type: "email", Icon: Mail },
  { key: "whatsapp",    label: "WhatsApp Business",    placeholder: "+221 77 000 00 00",      Icon: MessageCircle },
  { key: "telephone",   label: "Téléphone",            placeholder: "+221 33 000 00 00",      Icon: Phone },
  { key: "adresse",     label: "Adresse physique",     placeholder: "Rue 10, Dakar",           Icon: MapPin },
];

const CHAMPS_RESEAUX = [
  { key: "instagram", label: "Instagram",   placeholder: "https://instagram.com/votre_boutique", Icon: Camera,        color: "#E1306C" },
  { key: "facebook",  label: "Facebook",    placeholder: "https://facebook.com/votre_boutique",  Icon: Users,         color: "#1877F2" },
  { key: "tiktok",    label: "TikTok",      placeholder: "https://tiktok.com/@votre_boutique",   Icon: Music,         color: "#111111" },
  { key: "twitter",   label: "X / Twitter", placeholder: "https://twitter.com/votre_boutique",   Icon: MessageCircle, color: "#0F1419" },
];

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
  const [savedForm, setSavedForm] = useState<typeof form | null>(null);

  useEffect(() => {
    fetch("/api/tenants/moi").then(r => r.json()).then(d => {
      if (d.tenant) {
        const t = d.tenant;
        setTenant(t);
        const social = t.socialLinks || {};
        const livraison = t.parametresLivraison || {};
        const loaded = {
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
        };
        setForm(loaded);
        setSavedForm(loaded);
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
      setSavedForm(form);
      router.refresh();
    } catch { toast.error("Erreur lors de la sauvegarde"); }
    finally { setSaving(false); }
  }

  const urlProd = tenant ? `${tenant.slug}.axso.com` : "";
  const theme = THEMES.find(t => t.id === form.themeId) || THEMES[2];
  const dirty = !!savedForm && JSON.stringify(form) !== JSON.stringify(savedForm);

  const completion = useMemo(() => {
    const checks = [
      !!form.nomBoutique,
      !!form.description && form.description.length > 20,
      !!form.logoUrl,
      !!form.bannerUrl,
      !!(form.whatsapp || form.telephone),
      !!form.pays,
      !!(form.facebook || form.instagram || form.tiktok || form.twitter),
      !!(form.metaTitle && form.metaDescription),
      !!form.zonesLivraison,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form]);

  const sectionDone: Record<Section, boolean> = {
    infos: !!form.nomBoutique && !!form.description,
    apparence: !!form.logoUrl && !!form.bannerUrl,
    seo: !!form.metaTitle && !!form.metaDescription,
    reseaux: !!(form.facebook || form.instagram || form.tiktok || form.twitter),
    livraison: !!form.zonesLivraison,
  };

  return (
    <div className="space-y-5 pb-24" style={{ fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif" }}>

      {/* ── Hero identité ── */}
      <div className="ax-card overflow-hidden">
        <div className="h-36 sm:h-44 relative" style={{ background: form.bannerUrl ? undefined : `linear-gradient(135deg, ${theme.accent}, ${theme.fond})` }}>
          {form.bannerUrl && <img src={form.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/10" />
          {tenant && (
            <div className="absolute top-3.5 right-3.5 flex items-center gap-2">
              <a href={`/${tenant.slug}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11.5px] font-semibold text-white bg-black/35 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full hover:bg-black/50 transition-all">
                <ExternalLink size={11} /> Voir la boutique
              </a>
              <button onClick={() => { navigator.clipboard.writeText(urlProd); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex items-center gap-1.5 text-[11.5px] font-semibold text-white bg-black/35 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full hover:bg-black/50 transition-all">
                {copied ? <Check size={11} className="text-[#4ade80]" /> : <Copy size={11} />}
                {copied ? "Copié" : "Copier le lien"}
              </button>
            </div>
          )}
        </div>
        <div className="px-5 sm:px-7 pb-5">
          <div className="flex items-end gap-4 -mt-10 sm:-mt-12">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden ring-4 ring-white shadow-lg flex-shrink-0 flex items-center justify-center"
              style={{ background: form.logoUrl ? "#fff" : theme.fond }}>
              {form.logoUrl
                ? <img src={form.logoUrl} alt="" className="w-full h-full object-cover" />
                : <Store size={26} style={{ color: theme.accent }} />}
            </div>
            <div className="flex-1 min-w-0 flex items-end justify-between gap-4 pb-1 flex-wrap">
              <div className="min-w-0">
                <h1 className="text-[19px] sm:text-[21px] font-bold text-[#111111] tracking-tight truncate">
                  {form.nomBoutique || "Ma Boutique"}
                </h1>
                <div className="flex items-center gap-1.5 mt-1 text-[12px] text-[#AAAAAA]">
                  <Globe size={11} />
                  <span className="truncate">{urlProd || "votre-boutique.axso.com"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <ProgressRing pct={completion} />
                <div className="leading-tight">
                  <p className="text-[11.5px] font-bold text-[#111111]">Profil {completion}%</p>
                  <p className="text-[10.5px] text-[#AAAAAA]">{completion === 100 ? "Boutique complète" : "à compléter"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Corps : nav + contenu + preview ── */}
      <div className="grid lg:grid-cols-[220px_1fr] xl:grid-cols-[220px_1fr_340px] gap-5 items-start">

        {/* Nav rail */}
        <nav className="ax-card p-2 space-y-1 lg:sticky lg:top-5 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible" style={{ scrollbarWidth: "none" }}>
          {SECTIONS.map(s => {
            const Icon = s.Icon;
            const active = section === s.id;
            const done = sectionDone[s.id];
            return (
              <button key={s.id} onClick={() => setSection(s.id)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl transition-all text-left flex-shrink-0 lg:flex-shrink"
                style={active ? { background: "#111111" } : { background: "transparent" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={active ? { background: "rgba(245,166,35,0.18)" } : { background: "#F5F5F5" }}>
                  <Icon size={14} style={{ color: active ? "#F5A623" : "#888888" }} />
                </div>
                <div className="min-w-0 hidden sm:block lg:block">
                  <p className="text-[12.5px] font-semibold truncate" style={{ color: active ? "#FFFFFF" : "#111111" }}>{s.label}</p>
                  <p className="text-[10.5px] truncate" style={{ color: active ? "rgba(255,255,255,0.5)" : "#AAAAAA" }}>{s.desc}</p>
                </div>
                {done
                  ? <CheckCircle2 size={13} className="ml-auto flex-shrink-0 hidden lg:block" style={{ color: active ? "#4ade80" : "#16A34A" }} />
                  : <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0 hidden lg:block" style={{ background: active ? "rgba(255,255,255,0.25)" : "#E8E8E8" }} />}
              </button>
            );
          })}
        </nav>

        {/* Contenu de la section */}
        <div className="min-w-0 space-y-4">
          {section === "infos" && (
            <div className="ax-card p-6 space-y-5">
              <div>
                <h2 className="text-[14px] font-bold text-[#111111]">Informations générales</h2>
                <p className="text-[11.5px] text-[#AAAAAA] mt-0.5">L'identité et les coordonnées de votre boutique</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {CHAMPS_INFOS.map(f => (
                  <div key={f.key}>
                    <label className={labelCls}><f.Icon size={11} /> {f.label}</label>
                    <input type={f.type || "text"} value={(form as any)[f.key]} placeholder={f.placeholder}
                      onChange={e => set(f.key, e.target.value)} className={inputCls} />
                  </div>
                ))}
                <div>
                  <label className={labelCls}><Globe size={11} /> Pays</label>
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
                <p className="text-[10.5px] text-[#CCCCCC] mt-1">{form.description.length} caractères — visible sur votre page d'accueil</p>
              </div>
            </div>
          )}

          {section === "apparence" && (
            <div className="space-y-4">
              <div className="ax-card p-6 space-y-4">
                <div>
                  <h2 className="text-[14px] font-bold text-[#111111]">Médias de la boutique</h2>
                  <p className="text-[11.5px] text-[#AAAAAA] mt-0.5">Le logo et la bannière apparaissent sur votre vitrine</p>
                </div>
                <div className="grid sm:grid-cols-[160px_1fr] gap-6">
                  <ImageUpload label="Logo" value={form.logoUrl} aspectRatio="circle"
                    onChange={url => set("logoUrl", url)} onRemove={() => set("logoUrl", "")}
                    hint="Carré, PNG transparent" />
                  <ImageUpload label="Bannière d'accueil" value={form.bannerUrl} aspectRatio="banner"
                    onChange={url => set("bannerUrl", url)} onRemove={() => set("bannerUrl", "")}
                    hint="Format large — 1200×400px recommandé" />
                </div>
              </div>
              <div className="ax-card p-6 space-y-3">
                <div>
                  <h2 className="text-[14px] font-bold text-[#111111]">Thème visuel</h2>
                  <p className="text-[11.5px] text-[#AAAAAA] mt-0.5">Choisissez l'ambiance de votre vitrine</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {THEMES.map(t => (
                    <button key={t.id} type="button" onClick={() => set("themeId", t.id)}
                      className="text-left rounded-2xl border-2 overflow-hidden transition-all"
                      style={form.themeId === t.id
                        ? { borderColor: "#F5A623", boxShadow: "0 0 0 4px rgba(245,166,35,0.08)" }
                        : { borderColor: "#EBEBEB" }}>
                      <div className="relative">
                        <ThemeMockup t={t} nom={form.nomBoutique} />
                        {form.themeId === t.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#F5A623] flex items-center justify-center text-white shadow-sm"><Check size={10} /></div>
                        )}
                      </div>
                      <div className="bg-white px-3.5 py-2.5 flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[#111111] font-semibold text-[12px] truncate">{t.nom}</p>
                            {t.badge && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                                style={{ background: `${t.accent}18`, color: t.accent }}>{t.badge}</span>
                            )}
                          </div>
                          <p className="text-[#AAAAAA] text-[10.5px] truncate">{t.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {section === "seo" && (
            <div className="ax-card p-6 space-y-4">
              <div>
                <h2 className="text-[14px] font-bold text-[#111111]">Référencement naturel (SEO)</h2>
                <p className="text-[11.5px] text-[#AAAAAA] mt-0.5">Comment votre boutique apparaît sur Google</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="ax-label">Titre méta</label>
                  <LongueurBadge n={form.metaTitle.length} min={30} max={60} />
                </div>
                <input value={form.metaTitle} onChange={e => set("metaTitle", e.target.value)} maxLength={70}
                  placeholder="Ex: Mode Aminata - Prêt-à-porter africain" className={inputCls} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="ax-label">Description méta</label>
                  <LongueurBadge n={form.metaDescription.length} min={120} max={160} />
                </div>
                <textarea value={form.metaDescription} onChange={e => set("metaDescription", e.target.value)} rows={3} maxLength={180}
                  placeholder="Description visible dans les résultats Google…"
                  className={`${inputCls} resize-none`} />
              </div>
              <div className="border border-[#E8E8E8] rounded-2xl p-4 bg-[#FAFAFA] space-y-1.5">
                <p className="ax-label mb-2 flex items-center gap-1.5"><Sparkles size={10} /> Aperçu Google</p>
                <p className="text-blue-600 text-[15px] leading-tight">{form.metaTitle || form.nomBoutique || "Ma Boutique"}</p>
                <p className="text-green-700 text-[11.5px]">{tenant?.slug ? `${tenant.slug}.axso.com` : "votre-boutique.axso.com"}</p>
                <p className="text-[#666666] text-[12px] leading-relaxed">{form.metaDescription || form.description?.slice(0, 160) || "Ajoutez une description pour améliorer votre visibilité sur Google."}</p>
              </div>
            </div>
          )}

          {section === "reseaux" && (
            <div className="ax-card p-6 space-y-4">
              <div>
                <h2 className="text-[14px] font-bold text-[#111111]">Vos liens sociaux</h2>
                <p className="text-[11.5px] text-[#AAAAAA] mt-0.5">Affichés dans le pied de page de votre boutique</p>
              </div>
              <div className="space-y-3">
                {CHAMPS_RESEAUX.map(s => {
                  const filled = !!(form as any)[s.key];
                  return (
                    <div key={s.key} className="flex items-center gap-3 p-2.5 rounded-2xl border transition-all"
                      style={filled ? { borderColor: `${s.color}30`, background: `${s.color}06` } : { borderColor: "#F0F0F0" }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: filled ? `${s.color}14` : "#F5F5F5" }}>
                        <s.Icon size={14} style={{ color: filled ? s.color : "#AAAAAA" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <input value={(form as any)[s.key]} onChange={e => set(s.key, e.target.value)}
                          placeholder={`${s.label} — ${s.placeholder}`}
                          className="w-full bg-transparent outline-none text-[13px] text-[#111111] placeholder:text-[#CCCCCC]" />
                      </div>
                      {filled && (
                        <a href={(form as any)[s.key]} target="_blank" rel="noopener noreferrer"
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 hover:bg-white transition-all">
                          <ExternalLink size={12} style={{ color: s.color }} />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {section === "livraison" && (
            <div className="ax-card p-6 space-y-5">
              <div>
                <h2 className="text-[14px] font-bold text-[#111111]">Paramètres de livraison</h2>
                <p className="text-[11.5px] text-[#AAAAAA] mt-0.5">Frais et zones desservies par votre boutique</p>
              </div>
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
                <label className={labelCls}>Zones de livraison</label>
                <ZonesInput value={form.zonesLivraison} onChange={v => set("zonesLivraison", v)} />
              </div>
              <p className="text-[11.5px] text-[#888888] bg-[#FAFAFA] border border-[#F0F0F0] rounded-2xl p-3.5 leading-relaxed">
                {form.livraisonGratuite
                  ? "Tous vos clients bénéficient de la livraison gratuite, quelle que soit la zone."
                  : `Vos clients paient ${form.fraisLivraison || 0} pour la livraison${parseFloat(form.livraisonMin) > 0 ? `, offerte dès ${form.livraisonMin}` : ""}.`}
              </p>
            </div>
          )}
        </div>

        {/* Aperçu en direct */}
        <aside className="hidden xl:block xl:sticky xl:top-5">
          <LivePreview form={form} theme={theme} slug={tenant?.slug} />
        </aside>
      </div>

      {/* ── Barre de sauvegarde flottante ── */}
      {dirty && (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-[#111111] text-white pl-4 pr-2 py-2 rounded-full shadow-2xl">
          <span className="text-[12px] font-medium flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] animate-pulse" /> Modifications non enregistrées
          </span>
          <button onClick={sauvegarder} disabled={saving}
            className="flex items-center gap-1.5 font-bold text-[12px] px-4 py-1.5 rounded-full hover:opacity-90 disabled:opacity-50 transition-all flex-shrink-0"
            style={{ background: "#F5A623", color: "#111111" }}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {saving ? "Sauvegarde…" : "Enregistrer"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Anneau de progression ──────────────────────────────────────────────────
function ProgressRing({ pct }: { pct: number }) {
  const r = 20, c = 2 * Math.PI * r;
  return (
    <div className="relative w-12 h-12 flex-shrink-0">
      <svg viewBox="0 0 48 48" className="w-12 h-12 -rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="#EFEFEF" strokeWidth="4" />
        <circle cx="24" cy="24" r={r} fill="none" stroke="#F5A623" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} style={{ transition: "stroke-dashoffset .6s ease" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold text-[#111111]">{pct}%</span>
      </div>
    </div>
  );
}

// ─── Badge de longueur (SEO) ────────────────────────────────────────────────
function LongueurBadge({ n, min, max }: { n: number; min: number; max: number }) {
  const ok = n >= min && n <= max;
  const empty = n === 0;
  const color = empty ? "#AAAAAA" : ok ? "#16A34A" : "#D97706";
  const bg = empty ? "#F5F5F5" : ok ? "#ECFDF5" : "#FFFBEB";
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color, background: bg }}>
      {n} / {max} car.
    </span>
  );
}

// ─── Mockup miniature d'un thème ────────────────────────────────────────────
function ThemeMockup({ t, nom }: { t: typeof THEMES[number]; nom: string }) {
  return (
    <div style={{ backgroundColor: t.fond }}>
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: `1px solid ${t.accent}22` }}>
        <span style={{ color: t.texte, fontWeight: 700, fontSize: 10 }} className="truncate">{nom || "Ma Boutique"}</span>
        <div className="flex gap-1 flex-shrink-0">
          {[0, 1, 2].map(i => <div key={i} className="w-2.5 h-1.5 rounded-sm" style={{ background: `${t.texte}30` }} />)}
        </div>
      </div>
      <div className="h-9 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${t.accent}22, transparent)` }}>
        <div className="h-1.5 w-14 rounded-full" style={{ background: t.accent }} />
      </div>
      <div className="grid grid-cols-3 gap-1.5 p-2.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="aspect-square rounded-lg" style={{ background: `${t.accent}16` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Saisie des zones de livraison (chips) ──────────────────────────────────
function ZonesInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const zones = value.split(",").map(z => z.trim()).filter(Boolean);
  const [draft, setDraft] = useState("");

  function addZone() {
    const v = draft.trim();
    if (!v || zones.includes(v)) { setDraft(""); return; }
    onChange([...zones, v].join(", "));
    setDraft("");
  }
  function removeZone(z: string) {
    onChange(zones.filter(x => x !== z).join(", "));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[26px]">
        {zones.map(z => (
          <span key={z} className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-full text-[11.5px] font-medium"
            style={{ background: "#FFFBEB", color: "#B4740A", border: "1px solid #FDE68A" }}>
            {z}
            <button type="button" onClick={() => removeZone(z)} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[#FDE68A] transition-colors">
              <X size={9} />
            </button>
          </span>
        ))}
        {!zones.length && <p className="text-[11.5px] text-[#CCCCCC] py-1">Aucune zone ajoutée pour l'instant</p>}
      </div>
      <div className="flex gap-2">
        <input value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addZone(); } }}
          placeholder="Ex: Dakar, Thiès, Saint-Louis…" className={inputCls} />
        <button type="button" onClick={addZone}
          className="px-4 rounded-2xl flex items-center justify-center flex-shrink-0 hover:opacity-90 transition-all"
          style={{ background: "#111111", color: "#fff" }}>
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Aperçu en direct de la vitrine ──────────────────────────────────────────
function LivePreview({ form, theme, slug }: { form: any; theme: typeof THEMES[number]; slug?: string }) {
  return (
    <div className="ax-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[#F0F0F0] flex items-center gap-2 bg-[#FAFAFA]">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-[#F3B3AC]" />
          <div className="w-2 h-2 rounded-full bg-[#F5D28A]" />
          <div className="w-2 h-2 rounded-full bg-[#A9DFB0]" />
        </div>
        <div className="flex-1 bg-white border border-[#EFEFEF] rounded-full px-3 py-1 text-[9.5px] text-[#AAAAAA] text-center truncate">
          {slug ? `${slug}.axso.com` : "votre-boutique.axso.com"}
        </div>
      </div>
      <div style={{ backgroundColor: theme.fond }}>
        <div className="h-20 relative flex items-end px-4 pb-3" style={{ background: form.bannerUrl ? undefined : `linear-gradient(135deg, ${theme.accent}30, transparent)` }}>
          {form.bannerUrl && <img src={form.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45), transparent)" }} />
          <div className="relative z-10 w-10 h-10 rounded-2xl overflow-hidden ring-2 flex items-center justify-center flex-shrink-0"
            style={{ background: form.logoUrl ? "#fff" : theme.accent, borderColor: theme.fond }}>
            {form.logoUrl
              ? <img src={form.logoUrl} alt="" className="w-full h-full object-cover" />
              : <Store size={16} color="#fff" />}
          </div>
        </div>
        <div className="px-4 pt-3 pb-4">
          <p style={{ color: theme.texte, fontWeight: 800, fontSize: 14 }} className="truncate">{form.nomBoutique || "Ma Boutique"}</p>
          <p style={{ color: theme.texte, opacity: 0.6, fontSize: 10.5 }} className="mt-1 line-clamp-2 leading-relaxed">
            {form.description || "Votre description apparaîtra ici, sur la page d'accueil de votre boutique."}
          </p>
          <div className="grid grid-cols-3 gap-1.5 mt-3.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ background: `${theme.texte}0A` }}>
                <div className="aspect-square" style={{ background: `${theme.accent}22` }} />
                <div className="h-1.5 w-3/4 mx-auto my-1.5 rounded-full" style={{ background: `${theme.texte}18` }} />
              </div>
            ))}
          </div>
          <div className="mt-3.5 h-8 rounded-xl flex items-center justify-center text-[10.5px] font-bold"
            style={{ background: theme.accent, color: "#fff" }}>
            Découvrir la boutique
          </div>
        </div>
      </div>
      <div className="px-4 py-2.5 border-t border-[#F0F0F0] flex items-center gap-1.5">
        <Sparkles size={10} className="text-[#F5A623]" />
        <p className="text-[10px] text-[#AAAAAA]">Aperçu mis à jour en direct</p>
      </div>
    </div>
  );
}
