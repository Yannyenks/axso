"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, Save, Monitor, Tablet, Smartphone,
  Palette, Type, Layout, Sparkles, Eye, RefreshCw,
} from "lucide-react";
import { THEME_DEFAULTS, resolveThemeConfig, type ThemeConfig } from "@/lib/theme-config";

type Device = "desktop" | "tablet" | "mobile";
type Panel = "couleurs" | "typographie" | "sections" | "effets";

const EFFETS = [
  { id: "", label: "Aucun" },
  { id: "noir-obsidien", label: "Particules dorées" },
  { id: "violet-cosmos", label: "Nébuleuse violette" },
  { id: "ocean-atlantique", label: "Vagues océaniques" },
  { id: "kente-royal", label: "Géométries kente" },
  { id: "bwiti-forest", label: "Lucioles forestières" },
];

const FONTS_TITRE = [
  { value: "playfair", label: "Playfair Display (Élégant)" },
  { value: "inter", label: "Inter (Moderne)" },
  { value: "georgia", label: "Georgia (Classique)" },
];

const FONTS_CORPS = [
  { value: "inter", label: "Inter (Lisible)" },
  { value: "roboto", label: "Roboto (Propre)" },
  { value: "lato", label: "Lato (Doux)" },
];

const SECTIONS_LABELS: Record<string, string> = {
  annonce: "Barre d'annonce",
  hero: "Hero / Bannière",
  vedettes: "Produits vedettes",
  collections: "Collections",
  promo: "Bannière promo",
  avis: "Avis clients",
  newsletter: "Newsletter",
};

const BASES = Object.keys(THEME_DEFAULTS).map((k) => ({
  id: k,
  nom: {
    "noir-obsidien": "Noir Obsidien",
    "violet-cosmos": "Violet Cosmos",
    "terre-et-or": "Terre & Or",
    "ocean-atlantique": "Océan Atlantique",
    "kente-royal": "Kente Royal",
    "bwiti-forest": "Bwiti Forest",
  }[k] || k,
}));

export default function CreerThemePage() {
  const router = useRouter();
  const params = useSearchParams();
  const themeId = params.get("id");
  const baseId = params.get("base") || "terre-et-or";

  const [nom, setNom] = useState("Mon thème personnalisé");
  const [description, setDescription] = useState("");
  const [effetId, setEffetId] = useState("");
  const [base, setBase] = useState(baseId);
  const [config, setConfig] = useState<ThemeConfig>(() => resolveThemeConfig(baseId));
  const [panel, setPanel] = useState<Panel>("couleurs");
  const [device, setDevice] = useState<Device>("desktop");
  const [saving, setSaving] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [tenant, setTenant] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    fetch("/api/tenants/moi").then((r) => r.json()).then((d) => {
      if (d.tenant) {
        setTenant(d.tenant);
        setPreviewUrl(`/${d.tenant.slug}`);
      }
    });

    if (themeId) {
      fetch(`/api/themes`).then((r) => r.json()).then((d) => {
        const t = (d.themes || []).find((t: any) => t.id === themeId);
        if (t) {
          setNom(t.nom);
          setDescription(t.description || "");
          setEffetId(t.effetId || "");
          setConfig(t.config as ThemeConfig);
        }
      });
    }
  }, [themeId]);

  // Déclencher rechargement iframe avec debounce
  const refreshPreview = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setIframeKey((k) => k + 1), 800);
  }, []);

  function changeBase(newBase: string) {
    setBase(newBase);
    setConfig(resolveThemeConfig(newBase));
    refreshPreview();
  }

  function setColor(field: string, value: string) {
    setConfig((c) => ({ ...c, colors: { ...c.colors, [field]: value } }));
    refreshPreview();
  }

  function setFont(field: string, value: string) {
    setConfig((c) => ({ ...c, fonts: { ...c.fonts, [field]: value } }));
    refreshPreview();
  }

  function setRadius(value: string) {
    setConfig((c) => ({ ...c, radius: value }));
    refreshPreview();
  }

  function setSectionActif(sid: string, val: boolean) {
    setConfig((c) => ({
      ...c,
      sections: { ...c.sections, [sid]: { ...(c.sections as any)[sid], actif: val } },
    }));
    refreshPreview();
  }

  function setSectionText(sid: string, field: string, val: string) {
    setConfig((c) => ({
      ...c,
      sections: { ...c.sections, [sid]: { ...(c.sections as any)[sid], [field]: val } },
    }));
  }

  async function sauvegarder() {
    if (!nom.trim()) { toast.error("Donnez un nom à votre thème"); return; }
    setSaving(true);
    try {
      if (themeId) {
        // Modifier thème existant
        const res = await fetch(`/api/themes/${themeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nom, description, config, effetId }),
        });
        if (!res.ok) throw new Error();
        toast.success("Thème mis à jour !");
      } else {
        // Créer nouveau thème
        const res = await fetch("/api/themes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nom, description, config, effetId, badge: "✦ Custom" }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        toast.success("Thème créé !");
        // Activer directement si confirmé
        await fetch("/api/tenants", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ themeId: data.theme.id }),
        });
      }
      router.push("/dashboard/themes");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  const deviceWidth = device === "desktop" ? "100%" : device === "tablet" ? "768px" : "390px";

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden -m-6">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 bg-white border-b border-gray-200 flex-shrink-0 gap-3 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.push("/dashboard/themes")}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors text-sm">
            <ArrowLeft size={15} /> Retour
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="text-sm font-semibold text-gray-900 bg-transparent border-none outline-none min-w-0 max-w-48"
            placeholder="Nom du thème"
          />
        </div>

        {/* Device switcher */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {([["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]] as [Device, any][]).map(([d, Icon]) => (
            <button key={d} onClick={() => setDevice(d)}
              className={`w-8 h-7 rounded flex items-center justify-center transition-all ${device === d ? "bg-white text-[#F5A623] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
              <Icon size={14} />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setIframeKey((k) => k + 1)}
            className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-300 transition-all">
            <RefreshCw size={11} /> Actualiser
          </button>
          <button onClick={sauvegarder} disabled={saving}
            className="flex items-center gap-2 bg-[#F5A623] text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-[#D4911A] disabled:opacity-50 transition-all shadow shadow-[#F5A623]/25">
            <Save size={14} />
            {saving ? "Sauvegarde..." : themeId ? "Mettre à jour" : "Créer le thème"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Panel gauche */}
        <aside className="w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {([
              ["couleurs", Palette],
              ["typographie", Type],
              ["sections", Layout],
              ["effets", Sparkles],
            ] as [Panel, any][]).map(([p, Icon]) => (
              <button key={p} onClick={() => setPanel(p)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium capitalize transition-all border-b-2 ${panel === p ? "border-[#F5A623] text-[#F5A623]" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                <Icon size={14} />
                {p}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">

            {/* === COULEURS === */}
            {panel === "couleurs" && (
              <>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Thème de base</p>
                  <div className="grid grid-cols-2 gap-2">
                    {BASES.map((b) => {
                      const bc = THEME_DEFAULTS[b.id]?.colors;
                      return (
                        <button key={b.id} onClick={() => changeBase(b.id)}
                          className={`p-2.5 rounded-xl border-2 text-left transition-all ${base === b.id ? "border-[#F5A623]" : "border-gray-100 hover:border-gray-200"}`}>
                          <div className="flex gap-1 mb-1.5">
                            {[bc?.fond, bc?.accent, bc?.texte].map((c, i) => (
                              <div key={i} className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                          <p className="text-[10px] text-gray-600 font-medium truncate">{b.nom}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Couleurs personnalisées</p>
                  <div className="space-y-3">
                    {([
                      ["fond", "Fond principal"],
                      ["accent", "Couleur d'accent"],
                      ["texte", "Couleur du texte"],
                      ["surface", "Fond des cartes"],
                    ] as [string, string][]).map(([field, label]) => (
                      <div key={field} className="flex items-center justify-between">
                        <label className="text-sm text-gray-700">{label}</label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 font-mono">{(config.colors as any)[field]}</span>
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-200 cursor-pointer">
                            <input
                              type="color"
                              value={(config.colors as any)[field] || "#000000"}
                              onChange={(e) => setColor(field, e.target.value)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="w-full h-full rounded-lg" style={{ backgroundColor: (config.colors as any)[field] }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Arrondi des boutons</p>
                  <div className="grid grid-cols-4 gap-2">
                    {["4px", "8px", "12px", "16px", "20px", "24px", "32px", "50px"].map((r) => (
                      <button key={r} onClick={() => setRadius(r)}
                        className={`py-2 text-xs border-2 transition-all ${config.radius === r ? "border-[#F5A623] text-[#F5A623] bg-amber-50" : "border-gray-100 text-gray-500 hover:border-gray-200"}`}
                        style={{ borderRadius: r }}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* === TYPOGRAPHIE === */}
            {panel === "typographie" && (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Police des titres</p>
                  <div className="space-y-2">
                    {FONTS_TITRE.map((f) => (
                      <button key={f.value} onClick={() => setFont("titre", f.value)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all ${config.fonts.titre === f.value ? "border-[#F5A623] bg-amber-50" : "border-gray-100 hover:border-gray-200"}`}>
                        <p className="text-sm font-medium text-gray-800" style={{ fontFamily: f.value === "playfair" ? "'Playfair Display', serif" : f.value }}>{f.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: f.value === "playfair" ? "'Playfair Display', serif" : f.value }}>Boutique Élégante</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Police du texte</p>
                  <div className="space-y-2">
                    {FONTS_CORPS.map((f) => (
                      <button key={f.value} onClick={() => setFont("corps", f.value)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all ${config.fonts.corps === f.value ? "border-[#F5A623] bg-amber-50" : "border-gray-100 hover:border-gray-200"}`}>
                        <p className="text-sm font-medium text-gray-800">{f.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Lorem ipsum dolor sit amet</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</p>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Description de ce thème..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none outline-none focus:border-[#F5A623] text-gray-700"
                  />
                </div>
              </div>
            )}

            {/* === SECTIONS === */}
            {panel === "sections" && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sections de la boutique</p>
                {Object.entries(SECTIONS_LABELS).map(([sid, label]) => {
                  const sec = (config.sections as any)[sid];
                  return (
                    <div key={sid} className="border border-gray-100 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between p-3">
                        <span className="text-sm text-gray-800 font-medium">{label}</span>
                        <button onClick={() => setSectionActif(sid, !sec?.actif)}
                          className={`w-10 h-5.5 rounded-full transition-all relative ${sec?.actif ? "bg-[#F5A623]" : "bg-gray-200"}`}
                          style={{ width: "40px", height: "22px" }}>
                          <div className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-all ${sec?.actif ? "left-5" : "left-0.5"}`}
                            style={{ width: "18px", height: "18px", top: "2px", left: sec?.actif ? "20px" : "2px" }} />
                        </button>
                      </div>
                      {sec?.actif && sec.titre !== undefined && (
                        <div className="px-3 pb-3 border-t border-gray-50">
                          <input
                            value={sec.titre || ""}
                            onChange={(e) => setSectionText(sid, "titre", e.target.value)}
                            placeholder="Titre de la section"
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#F5A623] mt-2 text-gray-700"
                          />
                          {sec.sousTitre !== undefined && (
                            <input
                              value={sec.sousTitre || ""}
                              onChange={(e) => setSectionText(sid, "sousTitre", e.target.value)}
                              placeholder="Sous-titre"
                              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#F5A623] mt-1.5 text-gray-700"
                            />
                          )}
                          {sec.ctaTexte !== undefined && (
                            <input
                              value={sec.ctaTexte || ""}
                              onChange={(e) => setSectionText(sid, "ctaTexte", e.target.value)}
                              placeholder="Texte du bouton"
                              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#F5A623] mt-1.5 text-gray-700"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* === EFFETS === */}
            {panel === "effets" && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Effet canvas 3D</p>
                <p className="text-xs text-gray-400">Animation de fond visible sur toutes les pages de la boutique</p>
                <div className="space-y-2">
                  {EFFETS.map((e) => (
                    <button key={e.id} onClick={() => setEffetId(e.id)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${effetId === e.id ? "border-[#F5A623] bg-amber-50" : "border-gray-100 hover:border-gray-200"}`}>
                      <p className="text-sm text-gray-800 font-medium">{e.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Preview */}
        <main className="flex-1 overflow-hidden bg-gray-100 flex flex-col items-center justify-start p-6">
          <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
            <Eye size={12} />
            Aperçu en temps réel — sauvegardez pour voir les effets 3D
          </div>
          <div
            className="bg-white shadow-2xl rounded-xl overflow-hidden transition-all duration-300"
            style={{ width: deviceWidth, height: "calc(100vh - 180px)", maxWidth: "100%" }}
          >
            {previewUrl ? (
              <iframe
                key={`${iframeKey}-${JSON.stringify(config.colors)}`}
                src={previewUrl}
                className="w-full h-full border-0"
                title="Aperçu boutique"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                <div className="text-center">
                  <Eye size={32} className="mx-auto mb-3 opacity-30" />
                  <p>Aperçu disponible après connexion à une boutique</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
