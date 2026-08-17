"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PCOnlyGate } from "@/components/dashboard/PCOnlyGate";
import { Plus, Palette, Check, Trash2, Edit2, ExternalLink, Sparkles } from "lucide-react";

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

  async function activer(themeId: string) {
    setActivating(themeId);
    try {
      await fetch("/api/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId }),
      });
      setTenant((t: any) => ({ ...t, themeId }));
      toast.success("Thème activé sur votre boutique !");
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
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const builtins = themes.filter((t) => t.builtin);
  const custom = themes.filter((t) => !t.builtin);

  return (
    <div className="max-w-6xl space-y-8">
      <PCOnlyGate label="Theme Studio" />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-poppins">Theme Studio</h1>
          <p className="text-gray-400 text-sm mt-1">Créez et gérez les thèmes de votre boutique</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/themes/creer")}
          className="flex items-center gap-2 bg-[#F5A623] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#d4820a] transition-all shadow-lg shadow-[#F5A623]/25"
        >
          <Plus size={16} /> Créer un thème
        </button>
      </div>

      {/* Thème actif */}
      {tenant && (
        <div className="bg-gradient-to-r from-[#F5A623]/10 to-transparent border border-[#F5A623]/20 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#F5A623]/20 flex items-center justify-center">
            <Palette size={18} className="text-[#F5A623]" />
          </div>
          <div>
            <p className="text-gray-500 text-xs">Thème actuellement actif</p>
            <p className="text-gray-900 font-semibold">
              {themes.find((t) => t.id === tenant.themeId || t.slug === tenant.themeId)?.nom || tenant.themeId}
            </p>
          </div>
          {tenant.slug && (
            <a href={`/${tenant.slug}`} target="_blank" rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1.5 text-xs text-[#F5A623] border border-[#F5A623]/30 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all">
              <ExternalLink size={11} /> Voir la boutique
            </a>
          )}
        </div>
      )}

      {/* Thèmes personnalisés */}
      {custom.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-[#F5A623]" />
            <h2 className="text-gray-800 font-semibold">Mes thèmes</h2>
            <span className="text-xs bg-[#F5A623]/15 text-[#F5A623] px-2 py-0.5 rounded-full font-medium">{custom.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {custom.map((t) => (
              <ThemeCard
                key={t.id}
                theme={t}
                actif={tenant?.themeId === t.id}
                activating={activating === t.id}
                deleting={deleting === t.id}
                onActivate={() => activer(t.id)}
                onEdit={() => router.push(`/dashboard/themes/creer?id=${t.id}`)}
                onDelete={() => supprimer(t.id)}
                showDelete
              />
            ))}
          </div>
        </section>
      )}

      {/* Thèmes intégrés */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-gray-800 font-semibold">Thèmes Axso Premium</h2>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{builtins.length} thèmes</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {builtins.map((t) => (
            <ThemeCard
              key={t.id}
              theme={t}
              actif={tenant?.themeId === t.id || tenant?.themeId === t.slug}
              activating={activating === t.id}
              onActivate={() => activer(t.slug || t.id)}
              onEdit={() => router.push(`/dashboard/themes/creer?base=${t.slug || t.id}`)}
              showDelete={false}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function ThemeCard({
  theme, actif, activating, deleting, onActivate, onEdit, onDelete, showDelete,
}: {
  theme: any; actif: boolean; activating: boolean;
  deleting?: boolean; onActivate: () => void; onEdit: () => void;
  onDelete?: () => void; showDelete: boolean;
}) {
  const cfg = theme.config?.colors || theme.config;
  const fond = cfg?.fond || "#fff8f0";
  const accent = cfg?.accent || "#F5A623";
  const texte = cfg?.texte || "#2c1503";
  const surface = cfg?.surface || "#fef3e8";

  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all ${actif ? "border-[#F5A623] shadow-lg shadow-[#F5A623]/15" : "border-gray-200 hover:border-gray-300"}`}>
      {/* Aperçu */}
      <div className="h-40 relative overflow-hidden" style={{ backgroundColor: fond }}>
        {/* Mini storefront preview */}
        <div className="absolute inset-0 p-3 flex flex-col gap-2">
          {/* Navbar simulée */}
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg" style={{ backgroundColor: `${fond}ee` }}>
            <div className="h-2 w-16 rounded" style={{ backgroundColor: accent }} />
            <div className="flex gap-1.5">
              {[1, 2, 3].map((i) => <div key={i} className="h-1.5 w-8 rounded-sm" style={{ backgroundColor: `${texte}40` }} />)}
            </div>
          </div>
          {/* Hero simulé */}
          <div className="flex-1 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}15`, border: `1px solid ${accent}30` }}>
            <div className="text-center">
              <div className="h-2.5 w-20 rounded mx-auto mb-1.5" style={{ backgroundColor: accent }} />
              <div className="h-1.5 w-28 rounded mx-auto mb-2.5" style={{ backgroundColor: `${texte}50` }} />
              <div className="h-5 w-16 rounded-lg mx-auto" style={{ backgroundColor: accent }} />
            </div>
          </div>
          {/* Produits simulés */}
          <div className="grid grid-cols-3 gap-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-lg" style={{ backgroundColor: surface, border: `1px solid ${accent}20` }}>
                <div className="h-6 rounded-t-lg" style={{ backgroundColor: `${accent}20` }} />
                <div className="h-1.5 w-8 rounded mx-auto mt-1" style={{ backgroundColor: `${texte}40` }} />
              </div>
            ))}
          </div>
        </div>

        {/* Badge actif */}
        {actif && (
          <div className="absolute top-2 right-2 bg-[#F5A623] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Check size={9} /> Actif
          </div>
        )}
        {theme.badge && !actif && (
          <div className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${accent}20`, color: accent }}>
            {theme.badge}
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="bg-white p-4">
        <div className="flex items-start justify-between mb-1">
          <p className="text-gray-900 font-semibold text-sm">{theme.nom}</p>
          <div className="flex gap-1">
            {[fond, accent, texte].map((c, i) => (
              <div key={i} className="w-3.5 h-3.5 rounded-full border border-gray-200" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        {theme.description && <p className="text-gray-400 text-xs mb-3">{theme.description}</p>}

        <div className="flex gap-2">
          {actif ? (
            <div className="flex-1 text-center py-2 rounded-xl text-xs font-semibold text-[#F5A623] bg-blue-50 border border-[#F5A623]/20">
              Thème actif
            </div>
          ) : (
            <button onClick={onActivate} disabled={activating}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all text-white disabled:opacity-50"
              style={{ backgroundColor: accent }}>
              {activating ? "Activation..." : "Activer"}
            </button>
          )}
          <button onClick={onEdit}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 hover:border-[#F5A623]/40 text-gray-400 hover:text-[#F5A623] transition-all">
            <Edit2 size={13} />
          </button>
          {showDelete && onDelete && (
            <button onClick={onDelete} disabled={deleting}
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 hover:border-red-200 text-gray-400 hover:text-red-400 transition-all">
              {deleting ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={13} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
