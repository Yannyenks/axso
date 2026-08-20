"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PCOnlyGate } from "@/components/dashboard/PCOnlyGate";
import {
  Plus, Palette, Check, Trash2, Edit2, ExternalLink,
  Sparkles, Sun, Layers, ArrowLeft, Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Variant = "original" | "light" | "concentrated";

interface ThemeColors {
  fond: string;
  accent: string;
  texte: string;
  surface: string;
  texteMuted?: string;
  bordure?: string;
}

function lightVariantColors(base: ThemeColors): ThemeColors {
  return {
    fond: "#FFFFFF",
    surface: "#F8F9FB",
    texte: "#111827",
    texteMuted: "#6B7280",
    bordure: "#E5E7EB",
    accent: base.accent,
  };
}

function concentratedVariantColors(base: ThemeColors): ThemeColors {
  const accent = base.accent;
  return {
    fond: base.texte,
    surface: shadeHex(base.texte, 15),
    texte: "#FFFFFF",
    texteMuted: "rgba(255,255,255,0.6)",
    bordure: "rgba(255,255,255,0.12)",
    accent,
  };
}

function shadeHex(hex: string, amount: number): string {
  try {
    const h = hex.replace("#", "");
    const num = parseInt(h, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  } catch {
    return hex;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ThemesPage() {
  const router = useRouter();
  const [themes, setThemes] = useState<any[]>([]);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/themes").then((r) => r.json()),
      fetch("/api/tenants/moi").then((r) => r.json()),
    ]).then(([td, te]) => {
      setThemes(td.themes || []);
      setTenant(te.tenant);
      setLoading(false);
    });
  }, []);

  async function activer(themeSlug: string, variant: Variant, baseColors: ThemeColors) {
    const key = `${themeSlug}-${variant}`;
    setActivating(key);
    try {
      let body: Record<string, any> = { themeId: themeSlug };
      if (variant === "light") {
        body.themeConfig = { colors: lightVariantColors(baseColors) };
      } else if (variant === "concentrated") {
        body.themeConfig = { colors: concentratedVariantColors(baseColors) };
      }
      await fetch("/api/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setTenant((t: any) => ({ ...t, themeId: themeSlug, activeVariant: variant }));
      toast.success(`Thème "${variant === "light" ? "Clair" : variant === "concentrated" ? "Concentré" : "Original"}" activé !`);
    } catch {
      toast.error("Erreur lors de l'activation");
    } finally {
      setActivating(null);
    }
  }

  async function supprimer(id: string) {
    if (!confirm("Supprimer ce thème ?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/themes/${id}`, { method: "DELETE" });
      setThemes((ts) => ts.filter((t) => t.id !== id));
      toast.success("Thème supprimé");
    } catch {
      toast.error("Erreur");
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const builtins = themes.filter((t) => t.builtin);
  const custom = themes.filter((t) => !t.builtin);

  return (
    <div
      className="h-screen flex flex-col bg-[#F5F7FA] overflow-hidden"
      style={{ fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif" }}
    >
      <PCOnlyGate label="Theme Studio" />

      {/* ── Header ── */}
      <header className="h-14 flex items-center gap-4 px-6 bg-white border-b border-gray-200 flex-shrink-0">
        <button
          onClick={() => router.push("/dashboard/boutique")}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={15} />
          <span className="text-sm font-medium">Boutique</span>
        </button>
        <div className="h-5 w-px bg-gray-200" />
        <div className="flex items-center gap-2">
          <Palette size={16} className="text-[#F5A623]" />
          <h1 className="text-sm font-bold text-gray-800">Theme Studio</h1>
        </div>

        {tenant && (
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FFF7ED] border border-[#F5A623]/20 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-[#F5A623]" />
              <span className="text-xs font-medium text-[#92400E]">
                {themes.find((t) => t.id === tenant.themeId || t.slug === tenant.themeId)?.nom || tenant.themeId}
              </span>
            </div>
            {tenant.slug && (
              <a
                href={`/${tenant.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-400 hover:text-gray-700 transition-all"
              >
                <ExternalLink size={11} /> Voir la boutique
              </a>
            )}
            <button
              onClick={() => router.push("/dashboard/themes/creer")}
              className="flex items-center gap-2 bg-[#F5A623] text-white px-4 py-1.5 rounded-lg font-semibold text-xs hover:bg-[#d4820a] transition-all"
            >
              <Plus size={14} /> Créer un thème
            </button>
          </div>
        )}
      </header>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6">

        {/* Thèmes perso */}
        {custom.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={14} className="text-[#F5A623]" />
              <h2 className="text-sm font-bold text-gray-700">Mes thèmes</h2>
              <span className="text-[10px] bg-[#F5A623]/15 text-[#F5A623] px-2 py-0.5 rounded-full font-semibold">{custom.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {custom.map((t) => (
                <SimpleThemeCard
                  key={t.id}
                  theme={t}
                  actif={tenant?.themeId === t.id}
                  activating={activating === t.id}
                  deleting={deleting === t.id}
                  onActivate={() => {
                    const colors = t.config?.colors || {};
                    activer(t.id, "original", colors);
                  }}
                  onEdit={() => router.push(`/dashboard/themes/creer?id=${t.id}`)}
                  onDelete={() => supprimer(t.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Thèmes intégrés — avec variantes */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Layers size={14} className="text-gray-500" />
            <h2 className="text-sm font-bold text-gray-700">Thèmes Axso Premium</h2>
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{builtins.length} thèmes · 3 variantes chacun</span>
          </div>
          <div className="space-y-6">
            {builtins.map((t) => (
              <BuiltinThemeRow
                key={t.id}
                theme={t}
                activeThemeId={tenant?.themeId}
                activating={activating}
                onActivate={(variant) => {
                  const baseColors = t.config?.colors || {};
                  activer(t.slug || t.id, variant, baseColors);
                }}
                onEdit={() => router.push(`/dashboard/themes/creer?base=${t.slug || t.id}`)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── Ligne d'un thème intégré (3 variantes côte à côte) ──────────────────────
function BuiltinThemeRow({
  theme, activeThemeId, activating, onActivate, onEdit,
}: {
  theme: any;
  activeThemeId: string;
  activating: string | null;
  onActivate: (v: Variant) => void;
  onEdit: () => void;
}) {
  const [preview, setPreview] = useState<Variant>("original");
  const slug = theme.slug || theme.id;
  const isActive = activeThemeId === slug || activeThemeId === theme.id;

  const base: ThemeColors = {
    fond:    theme.config?.colors?.fond    || "#fff8f0",
    accent:  theme.config?.colors?.accent  || "#F5A623",
    texte:   theme.config?.colors?.texte   || "#111111",
    surface: theme.config?.colors?.surface || "#fef3e8",
    texteMuted: theme.config?.colors?.texteMuted,
    bordure: theme.config?.colors?.bordure,
  };

  const variants: Array<{ id: Variant; label: string; Icon: any; colors: ThemeColors }> = [
    { id: "original",     label: "Original",   Icon: Layers, colors: base },
    { id: "light",        label: "Clair",       Icon: Sun,    colors: lightVariantColors(base) },
    { id: "concentrated", label: "Concentré",   Icon: Zap,    colors: concentratedVariantColors(base) },
  ];

  const activeVariant = variants.find(v => v.id === preview)!;
  const activatingKey = `${slug}-${preview}`;

  return (
    <div className={`rounded-2xl border-2 bg-white overflow-hidden transition-all ${isActive ? "border-[#F5A623] shadow-lg shadow-[#F5A623]/10" : "border-gray-200 hover:border-gray-300"}`}>
      <div className="flex flex-col sm:flex-row">

        {/* Preview principale */}
        <div className="flex-1 min-w-0">
          <ThemePreview colors={activeVariant.colors} radius={theme.config?.radius || "12px"} />
        </div>

        {/* Infos + variantes */}
        <div className="w-full sm:w-64 flex-shrink-0 p-4 border-t sm:border-t-0 sm:border-l border-gray-100 flex flex-col">
          {/* Nom + badge */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-bold text-gray-800">{theme.nom}</p>
                {isActive && (
                  <span className="text-[9px] bg-[#F5A623] text-white px-1.5 py-0.5 rounded-full font-bold">ACTIF</span>
                )}
              </div>
              {theme.description && (
                <p className="text-[11px] text-gray-400 leading-snug">{theme.description}</p>
              )}
            </div>
          </div>

          {/* Sélecteur de variante */}
          <div className="mb-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Variante</p>
            <div className="grid grid-cols-3 gap-1.5">
              {variants.map(v => (
                <button
                  key={v.id}
                  onClick={() => setPreview(v.id)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${preview === v.id ? "border-[#F5A623] bg-[#FFF7ED]" : "border-gray-100 hover:border-gray-200 bg-gray-50"}`}
                >
                  {/* Mini preview de couleur */}
                  <div className="flex gap-0.5 w-full">
                    <div className="flex-1 h-3 rounded-l-md" style={{ backgroundColor: v.colors.fond }} />
                    <div className="flex-1 h-3" style={{ backgroundColor: v.colors.accent }} />
                    <div className="flex-1 h-3 rounded-r-md" style={{ backgroundColor: v.colors.surface }} />
                  </div>
                  <span className={`text-[10px] font-semibold leading-none ${preview === v.id ? "text-[#92400E]" : "text-gray-500"}`}>
                    {v.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Palette de couleurs */}
          <div className="flex gap-1 mb-4">
            {[activeVariant.colors.fond, activeVariant.colors.accent, activeVariant.colors.texte, activeVariant.colors.surface].map((c, i) => (
              <div key={i} className="w-5 h-5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: c }} title={c} />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-auto">
            {isActive ? (
              <div className="flex-1 text-center py-2 rounded-xl text-[11px] font-semibold text-[#F5A623] bg-[#FFF7ED] border border-[#F5A623]/20">
                ✓ Thème actif
              </div>
            ) : (
              <button
                onClick={() => onActivate(preview)}
                disabled={activating === activatingKey}
                className="flex-1 py-2 rounded-xl text-[11px] font-bold text-white transition-all disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: activeVariant.colors.accent }}
              >
                {activating === activatingKey ? "..." : `Activer — ${activeVariant.label}`}
              </button>
            )}
            <button
              onClick={onEdit}
              className="w-8 h-8 rounded-xl flex items-center justify-center border border-gray-200 hover:border-[#F5A623]/40 text-gray-400 hover:text-[#F5A623] transition-all"
            >
              <Edit2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Preview mini d'un thème ─────────────────────────────────────────────────
function ThemePreview({ colors, radius }: { colors: ThemeColors; radius: string }) {
  const r = parseInt(radius) || 12;
  const rSm = `${Math.min(r, 8)}px`;
  const rMd = `${Math.min(r, 12)}px`;
  return (
    <div className="h-48 sm:h-full min-h-[160px] p-3 flex flex-col gap-2" style={{ backgroundColor: colors.fond }}>
      {/* Navbar */}
      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: colors.surface, borderRadius: rSm }}>
        <div className="h-2 w-14 rounded" style={{ backgroundColor: colors.accent, borderRadius: "4px" }} />
        <div className="flex gap-1">
          {[1,2,3].map(i => <div key={i} className="h-1.5 w-7 rounded-sm" style={{ backgroundColor: `${colors.texte}30` }} />)}
        </div>
        <div className="h-5 w-10 rounded-md" style={{ backgroundColor: colors.accent, borderRadius: rSm }} />
      </div>
      {/* Hero */}
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: `${colors.accent}18`, borderRadius: rMd, border: `1px solid ${colors.accent}30` }}
      >
        <div className="text-center px-2">
          <div className="h-3 w-24 rounded mx-auto mb-2" style={{ backgroundColor: colors.texte, opacity: 0.8, borderRadius: "4px" }} />
          <div className="h-1.5 w-32 rounded mx-auto mb-3" style={{ backgroundColor: colors.texte, opacity: 0.3, borderRadius: "4px" }} />
          <div className="h-6 w-16 rounded-lg mx-auto" style={{ backgroundColor: colors.accent, borderRadius: rSm }} />
        </div>
      </div>
      {/* Products */}
      <div className="grid grid-cols-4 gap-1.5">
        {[1,2,3,4].map(i => (
          <div key={i} style={{ backgroundColor: colors.surface, borderRadius: rSm, border: `1px solid ${colors.accent}18` }}>
            <div className="h-8" style={{ backgroundColor: `${colors.accent}25`, borderRadius: `${rSm} ${rSm} 0 0` }} />
            <div className="h-1.5 w-8 rounded mx-auto my-1" style={{ backgroundColor: `${colors.texte}30` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Carte simple (thèmes custom) ────────────────────────────────────────────
function SimpleThemeCard({
  theme, actif, activating, deleting, onActivate, onEdit, onDelete,
}: {
  theme: any; actif: boolean; activating: boolean;
  deleting?: boolean; onActivate: () => void; onEdit: () => void;
  onDelete?: () => void;
}) {
  const colors: ThemeColors = {
    fond:    theme.config?.colors?.fond    || "#fff8f0",
    accent:  theme.config?.colors?.accent  || "#F5A623",
    texte:   theme.config?.colors?.texte   || "#111111",
    surface: theme.config?.colors?.surface || "#fef3e8",
  };

  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all ${actif ? "border-[#F5A623] shadow-lg shadow-[#F5A623]/15" : "border-gray-200 hover:border-gray-300"}`}>
      <ThemePreview colors={colors} radius={theme.config?.radius || "12px"} />
      <div className="bg-white p-3.5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-gray-800">{theme.nom}</p>
          <div className="flex gap-1">
            {[colors.fond, colors.accent, colors.texte].map((c, i) => (
              <div key={i} className="w-3.5 h-3.5 rounded-full border border-gray-200" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        {theme.description && <p className="text-gray-400 text-[11px] mb-3 leading-snug">{theme.description}</p>}
        <div className="flex gap-2">
          {actif ? (
            <div className="flex-1 text-center py-2 rounded-xl text-[11px] font-semibold text-[#F5A623] bg-[#FFF7ED] border border-[#F5A623]/20">
              Thème actif
            </div>
          ) : (
            <button
              onClick={onActivate}
              disabled={activating}
              className="flex-1 py-2 rounded-xl text-[11px] font-bold text-white disabled:opacity-50 hover:opacity-90 transition-all"
              style={{ backgroundColor: colors.accent }}
            >
              {activating ? "..." : "Activer"}
            </button>
          )}
          <button onClick={onEdit} className="w-8 h-8 rounded-xl flex items-center justify-center border border-gray-200 hover:border-[#F5A623]/40 text-gray-400 hover:text-[#F5A623] transition-all">
            <Edit2 size={13} />
          </button>
          {onDelete && (
            <button onClick={onDelete} disabled={deleting} className="w-8 h-8 rounded-xl flex items-center justify-center border border-gray-200 hover:border-red-200 text-gray-400 hover:text-red-400 transition-all">
              {deleting ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={13} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
