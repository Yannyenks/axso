"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  Save, Monitor, Tablet, Smartphone, ExternalLink, ArrowLeft,
  ChevronRight, ChevronDown, Layers, Palette,
  ToggleLeft, ToggleRight, RefreshCw
} from "lucide-react";
import { THEME_DEFAULTS, resolveThemeConfig, type ThemeConfig } from "@/lib/theme-config";

type Tab = "personnaliser" | "editeur";
type Device = "desktop" | "tablet" | "mobile";

const SECTIONS_META = [
  { id: "annonce", label: "Barre d'annonce", icon: "??", desc: "Message promotionnel en haut de page" },
  { id: "hero", label: "Hero / Bannière", icon: "???", desc: "Section principale de la page d'accueil" },
  { id: "vedettes", label: "Produits vedettes", icon: "?", desc: "Mise en avant de vos meilleurs produits" },
  { id: "collections", label: "Collections", icon: "??", desc: "Grille de vos collections" },
  { id: "promo", label: "Bannière promo", icon: "??", desc: "Section promotionnelle personnalisée" },
  { id: "avis", label: "Avis clients", icon: "??", desc: "Témoignages et évaluations" },
  { id: "newsletter", label: "Newsletter", icon: "??", desc: "Formulaire d'inscription email" },
] as const;

type SectionId = typeof SECTIONS_META[number]["id"];

export default function BuilderPage() {
  const [tab, setTab] = useState<Tab>("personnaliser");
  const [device, setDevice] = useState<Device>("desktop");
  const [tenant, setTenant] = useState<any>(null);
  const [config, setConfig] = useState<ThemeConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<ThemeConfig | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId | null>("hero");
  const [activePanelTab, setActivePanelTab] = useState<"sections" | "style">("sections");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const editorRef = useRef<any>(null);
  const gjsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/tenants/moi-complet")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setTenant(data);
        const resolved = resolveThemeConfig(data.themeId, (data.themeConfig as any) || {});
        setConfig(resolved);
        setOriginalConfig(resolved);
      });
  }, []);

  useEffect(() => {
    if (tab !== "editeur" || !tenant || editorRef.current) return;
    if (!gjsContainerRef.current) return;

    const initGjs = async () => {
      const grapesjs = (await import("grapesjs")).default;
      await import("grapesjs/dist/css/grapes.min.css");
      const gjsBlocksBasic = (await import("grapesjs-blocks-basic")).default;

      const savedHtml = (tenant.themeConfig as any)?.builderHtml || "";
      const savedCss = (tenant.themeConfig as any)?.builderCss || "";

      const editor = grapesjs.init({
        container: gjsContainerRef.current!,
        height: "100%",
        width: "100%",
        storageManager: false,
        plugins: [gjsBlocksBasic],
        pluginsOpts: { [gjsBlocksBasic as any]: { flexGrid: true } },
        canvas: { styles: ["https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap"] },
      });

      if (savedHtml) editor.setComponents(savedHtml);
      if (savedCss) editor.setStyle(savedCss);

      editorRef.current = editor;
    };

    initGjs();
  }, [tab, tenant]);

  const updateSection = useCallback((sectionId: SectionId, field: string, value: any) => {
    setConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionId]: { ...(prev.sections[sectionId] as any), [field]: value },
        },
      };
    });
  }, []);

  const updateColors = useCallback((field: string, value: string) => {
    setConfig((prev) => prev ? { ...prev, colors: { ...prev.colors, [field]: value } } : prev);
  }, []);

  const updateFonts = useCallback((field: string, value: string) => {
    setConfig((prev) => prev ? { ...prev, fonts: { ...prev.fonts, [field]: value } } : prev);
  }, []);

  const handleSave = async () => {
    if (!config || !tenant) return;
    setSaving(true);
    try {
      let builderHtml = (tenant.themeConfig as any)?.builderHtml;
      let builderCss = (tenant.themeConfig as any)?.builderCss;
      if (editorRef.current) {
        builderHtml = editorRef.current.getHtml();
        builderCss = editorRef.current.getCss();
      }

      await fetch("/api/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeConfig: { ...config, builderHtml, builderCss } }),
      });

      setOriginalConfig(config);
      setSaved(true);
      setIframeKey((k) => k + 1);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig);

  if (!config || !tenant) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Chargement de l'éditeur</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#050508] text-white overflow-hidden">

      {/* HEADER */}
      <header className="h-14 flex items-center justify-between px-4 bg-[#0a0a12] border-b border-white/5 flex-shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm flex-shrink-0">
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <div className="h-5 w-px bg-white/10 hidden sm:block" />
          <span className="text-sm font-medium text-white truncate">{tenant.nomBoutique}</span>
          {hasChanges && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5A623]/20 text-[#F5A623] flex-shrink-0">
              Modifié
            </span>
          )}
        </div>

        {tab === "personnaliser" && (
          <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-white/5">
            {([["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]] as [Device, any][]).map(([d, Icon]) => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                className={`w-8 h-7 rounded flex items-center justify-center transition-all ${device === d ? "bg-[#F5A623]/20 text-[#F5A623]" : "text-gray-500 hover:text-gray-600"}`}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={`/${tenant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-all"
          >
            <ExternalLink size={12} />
            Voir boutique
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${saving ? "opacity-60 cursor-not-allowed" : "hover:opacity-90 active:scale-95"}`}
            style={{ backgroundColor: saved ? "#34d399" : "#F5A623", color: "#050508" }}
          >
            {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
            {saving ? "Sauvegarde" : saved ? "Sauvegardé ?" : "Sauvegarder"}
          </button>
        </div>
      </header>

      {/* TABS */}
      <div className="flex bg-[#0a0a12] border-b border-white/5 px-4 flex-shrink-0">
        {(["personnaliser", "editeur"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-xs font-semibold transition-all border-b-2 ${tab === t ? "border-[#F5A623] text-white" : "border-transparent text-gray-500 hover:text-gray-600"}`}
          >
            {t === "personnaliser" ? "?? Personnaliser" : "?? Éditeur libre"}
          </button>
        ))}
      </div>

      {/* MAIN */}
      <div className="flex-1 flex overflow-hidden">

        {/* THEME EDITOR */}
        {tab === "personnaliser" && (
          <>
            {/* Left panel */}
            <div className="w-72 flex-shrink-0 bg-[#0a0a12] border-r border-white/5 flex flex-col overflow-hidden">
              <div className="flex border-b border-white/5 flex-shrink-0">
                <button
                  onClick={() => setActivePanelTab("sections")}
                  className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-all ${activePanelTab === "sections" ? "text-white border-b-2 border-[#F5A623]" : "text-gray-500 hover:text-gray-600"}`}
                >
                  <Layers size={12} /> Sections
                </button>
                <button
                  onClick={() => setActivePanelTab("style")}
                  className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-all ${activePanelTab === "style" ? "text-white border-b-2 border-[#F5A623]" : "text-gray-500 hover:text-gray-600"}`}
                >
                  <Palette size={12} /> Style global
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {activePanelTab === "sections" && (
                  <div className="divide-y divide-white/5">
                    {SECTIONS_META.map((meta) => {
                      const sec = (config.sections as any)[meta.id] as any;
                      const isActive = activeSection === meta.id;
                      return (
                        <div key={meta.id} className={isActive ? "bg-white/[0.025]" : ""}>
                          <div
                            className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-white/[0.02] select-none"
                            onClick={() => setActiveSection(isActive ? null : meta.id as SectionId)}
                          >
                            <span className="text-base flex-shrink-0">{meta.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white">{meta.label}</p>
                              <p className="text-[10px] text-gray-600 truncate">{meta.desc}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={(e) => { e.stopPropagation(); updateSection(meta.id as SectionId, "actif", !sec.actif); }}
                              >
                                {sec.actif
                                  ? <ToggleRight size={20} style={{ color: "#F5A623" }} />
                                  : <ToggleLeft size={20} className="text-gray-600" />}
                              </button>
                              {isActive ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-600" />}
                            </div>
                          </div>

                          {isActive && (
                            <div className="px-4 pb-5 space-y-3">

                              {meta.id === "annonce" && (
                                <>
                                  <FieldInput label="Texte" value={sec.texte} onChange={(v) => updateSection("annonce", "texte", v)} multiline />
                                  <div className="grid grid-cols-2 gap-2">
                                    <FieldColor label="Fond" value={sec.couleurFond} onChange={(v) => updateSection("annonce", "couleurFond", v)} />
                                    <FieldColor label="Texte" value={sec.couleurTexte} onChange={(v) => updateSection("annonce", "couleurTexte", v)} />
                                  </div>
                                </>
                              )}

                              {meta.id === "hero" && (
                                <>
                                  <FieldSelect
                                    label="Style"
                                    value={sec.style}
                                    options={[
                                      { value: "centered", label: "Centré (gradient)" },
                                      { value: "split", label: "Divisé (image + texte)" },
                                      { value: "fullscreen", label: "Plein écran (100vh)" },
                                      { value: "minimal", label: "Minimal (texte seul)" },
                                    ]}
                                    onChange={(v) => updateSection("hero", "style", v)}
                                  />
                                  <FieldInput label="Titre principal" value={sec.titre} onChange={(v) => updateSection("hero", "titre", v)} />
                                  <FieldInput label="Sous-titre" value={sec.sousTitre} onChange={(v) => updateSection("hero", "sousTitre", v)} multiline />
                                  <FieldInput label="Texte du bouton CTA" value={sec.ctaTexte} onChange={(v) => updateSection("hero", "ctaTexte", v)} />
                                  <FieldSlider
                                    label={`Opacité overlay : ${sec.overlay}%`}
                                    value={sec.overlay}
                                    min={0}
                                    max={90}
                                    onChange={(v) => updateSection("hero", "overlay", v)}
                                  />
                                </>
                              )}

                              {meta.id === "vedettes" && (
                                <>
                                  <FieldInput label="Titre de la section" value={sec.titre} onChange={(v) => updateSection("vedettes", "titre", v)} />
                                  <FieldSelect
                                    label="Nombre de produits"
                                    value={String(sec.nombre)}
                                    options={[
                                      { value: "4", label: "4 produits" },
                                      { value: "8", label: "8 produits" },
                                      { value: "12", label: "12 produits" },
                                    ]}
                                    onChange={(v) => updateSection("vedettes", "nombre", Number(v))}
                                  />
                                  <FieldSelect
                                    label="Trier par"
                                    value={sec.triPar}
                                    options={[
                                      { value: "ventes", label: "Best-sellers (ventes)" },
                                      { value: "featured", label: "Mis en avant" },
                                      { value: "recent", label: "Plus récents" },
                                    ]}
                                    onChange={(v) => updateSection("vedettes", "triPar", v)}
                                  />
                                </>
                              )}

                              {meta.id === "collections" && (
                                <FieldInput label="Titre de la section" value={sec.titre} onChange={(v) => updateSection("collections", "titre", v)} />
                              )}

                              {meta.id === "promo" && (
                                <>
                                  <FieldInput label="Titre" value={sec.titre} onChange={(v) => updateSection("promo", "titre", v)} />
                                  <FieldInput label="Description" value={sec.texte} onChange={(v) => updateSection("promo", "texte", v)} multiline />
                                  <FieldInput label="Texte du bouton" value={sec.ctaTexte} onChange={(v) => updateSection("promo", "ctaTexte", v)} />
                                </>
                              )}

                              {meta.id === "avis" && (
                                <FieldInput label="Titre de la section" value={sec.titre} onChange={(v) => updateSection("avis", "titre", v)} />
                              )}

                              {meta.id === "newsletter" && (
                                <>
                                  <FieldInput label="Titre" value={sec.titre} onChange={(v) => updateSection("newsletter", "titre", v)} />
                                  <FieldInput label="Description" value={sec.texte} onChange={(v) => updateSection("newsletter", "texte", v)} multiline />
                                  <FieldInput label="Placeholder email" value={sec.placeholder} onChange={(v) => updateSection("newsletter", "placeholder", v)} />
                                  <FieldInput label="Texte du bouton" value={sec.ctaTexte} onChange={(v) => updateSection("newsletter", "ctaTexte", v)} />
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {activePanelTab === "style" && (
                  <div className="p-4 space-y-6">
                    <div>
                      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-3">Couleurs</p>
                      <div className="space-y-2.5">
                        <FieldColor label="Fond (background)" value={config.colors.fond} onChange={(v) => updateColors("fond", v)} />
                        <FieldColor label="Accent (boutons, titres)" value={config.colors.accent} onChange={(v) => updateColors("accent", v)} />
                        <FieldColor label="Texte principal" value={config.colors.texte} onChange={(v) => updateColors("texte", v)} />
                        <FieldColor label="Surface (cartes, sections)" value={config.colors.surface} onChange={(v) => updateColors("surface", v)} />
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-3">Polices</p>
                      <div className="space-y-2.5">
                        <FieldSelect
                          label="Police des titres"
                          value={config.fonts.titre}
                          options={[
                            { value: "playfair", label: "Playfair Display  Élégant" },
                            { value: "inter", label: "Inter  Moderne & épuré" },
                          ]}
                          onChange={(v) => updateFonts("titre", v)}
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-3">Coins arrondis</p>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { value: "4px", label: "Carré" },
                          { value: "8px", label: "Doux" },
                          { value: "16px", label: "Arrondi" },
                          { value: "24px", label: "Pilule" },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setConfig((prev) => prev ? { ...prev, radius: opt.value } : prev)}
                            className={`flex flex-col items-center gap-1.5 p-2.5 border transition-all ${config.radius === opt.value ? "border-[#F5A623] bg-[#F5A623]/10" : "border-white/10 hover:border-white/20"}`}
                            style={{ borderRadius: opt.value }}
                          >
                            <div
                              className="w-6 h-6 border-2"
                              style={{
                                borderRadius: opt.value,
                                borderColor: config.radius === opt.value ? "#F5A623" : "#ffffff30",
                              }}
                            />
                            <span className={`text-[9px] font-medium ${config.radius === opt.value ? "text-[#F5A623]" : "text-gray-500"}`}>
                              {opt.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const defaults = THEME_DEFAULTS[tenant.themeId] || THEME_DEFAULTS["terre-et-or"];
                        setConfig({ ...defaults, builderHtml: config.builderHtml, builderCss: config.builderCss });
                      }}
                      className="w-full text-xs text-gray-500 hover:text-gray-600 transition-colors py-2.5 border border-white/10 rounded-xl hover:border-white/20"
                    >
                      ? Réinitialiser le thème par défaut
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-white/5 flex-shrink-0">
                <p className="text-[10px] text-center" style={{ color: hasChanges ? "#f59e0b" : "#374151" }}>
                  {hasChanges ? "? Modifications non sauvegardées" : "? Tout est à jour"}
                </p>
              </div>
            </div>

            {/* Preview */}
            <div className="flex-1 bg-[#030305] flex flex-col overflow-hidden">
              <div className="h-9 flex items-center gap-3 px-4 bg-[#0a0a12] border-b border-white/5 flex-shrink-0">
                <div className="flex gap-1.5 flex-shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                </div>
                <div className="flex-1 bg-[#15151e] rounded px-3 py-1 text-[10px] text-gray-500 text-center truncate">
                  {typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/{tenant.slug}
                </div>
                <button
                  onClick={() => setIframeKey((k) => k + 1)}
                  className="text-gray-500 hover:text-gray-600 transition-colors flex-shrink-0"
                  title="Actualiser après sauvegarde"
                >
                  <RefreshCw size={12} />
                </button>
              </div>

              <div className="flex-1 flex items-stretch justify-center bg-[#080810] overflow-hidden">
                <div
                  className="transition-all duration-500 bg-white overflow-hidden"
                  style={{
                    width: device === "desktop" ? "100%" : device === "tablet" ? "768px" : "390px",
                    maxWidth: "100%",
                    margin: device !== "desktop" ? "16px auto" : "0",
                    borderRadius: device !== "desktop" ? "16px" : "0",
                    boxShadow: device !== "desktop" ? "0 20px 60px rgba(0,0,0,0.5)" : "none",
                  }}
                >
                  <iframe
                    key={iframeKey}
                    src={`/${tenant.slug}`}
                    className="w-full border-0 block"
                    style={{ height: device !== "desktop" ? "calc(100vh - 140px)" : "calc(100vh - 88px)" }}
                    title="Prévisualisation boutique"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* GRAPESJS */}
        {tab === "editeur" && (
          <div className="flex-1 relative overflow-hidden">
            <div ref={gjsContainerRef} className="w-full h-full" />
          </div>
        )}
      </div>
    </div>
  );
}

function FieldInput({ label, value, onChange, multiline = false }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean;
}) {
  return (
    <div>
      <label className="block text-[10px] text-gray-500 mb-1.5">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="w-full bg-[#15151e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F5A623]/50 resize-none transition-colors"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#15151e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F5A623]/50 transition-colors"
        />
      )}
    </div>
  );
}

function FieldColor({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-[10px] text-gray-400 flex-1 min-w-0 truncate">{label}</label>
      <div className="flex items-center gap-2 flex-shrink-0">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded-lg cursor-pointer border border-white/20"
          style={{ padding: "1px" }}
        />
        <span className="text-[10px] font-mono text-gray-500 w-16 text-right">{value.toUpperCase()}</span>
      </div>
    </div>
  );
}

function FieldSelect({ label, value, options, onChange }: {
  label: string; value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[10px] text-gray-500 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#15151e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F5A623]/50 transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function FieldSlider({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-[10px] text-gray-500 mb-2">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-[#F5A623] cursor-pointer"
      />
    </div>
  );
}

