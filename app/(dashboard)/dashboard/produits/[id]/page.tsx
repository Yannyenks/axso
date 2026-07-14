"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, X, Plus, Sparkles, Loader2, Package, ImageIcon, Tag, BarChart2, Globe, Eye, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatMontant } from "@/lib/utils";

const CATEGORIES = [
  "Mode & Vêtements", "Beauté & Cosmétiques", "Alimentation & Épicerie",
  "Artisanat & Art", "Électronique", "Maison & Décoration",
  "Santé & Bien-être", "Sport & Loisirs", "Autre",
];

type Produit = {
  id: string; nom: string; slug: string; description: string | null;
  prix: number; prixCompare: number | null; stock: number; sku: string | null;
  images: string[]; categorie: string | null; tags: string[];
  actif: boolean; featured: boolean; poids: number | null;
  metaTitle: string | null; metaDesc: string | null;
  type: "physique" | "digital" | "dropshipping";
  ventes: number; vues: number; devise?: string;
  _count: { avis: number; lignesCommande: number };
};

export default function EditProduitPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [produit, setProduit] = useState<Produit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [genIA, setGenIA] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [imageInput, setImageInput] = useState("");
  const [form, setForm] = useState<Partial<Produit>>({});

  useEffect(() => {
    fetch(`/api/produits/${id}`)
      .then(r => r.json())
      .then(d => {
        setProduit(d.produit);
        setForm(d.produit);
        setLoading(false);
      });
  }, [id]);

  function set(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function ajouterTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !(form.tags || []).includes(t)) set("tags", [...(form.tags || []), t]);
    setTagInput("");
  }

  function ajouterImage() {
    const url = imageInput.trim();
    if (url && !(form.images || []).includes(url)) set("images", [...(form.images || []), url]);
    setImageInput("");
  }

  async function genererDescription() {
    if (!form.nom) { toast.error("Entrez d'abord le nom du produit"); return; }
    setGenIA(true);
    try {
      const res = await fetch("/api/ai/description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: form.nom, categorie: form.categorie }),
      });
      const data = await res.json();
      if (data.description) set("description", data.description);
    } catch { toast.error("Erreur IA"); }
    finally { setGenIA(false); }
  }

  async function sauvegarder() {
    setSaving(true);
    try {
      const res = await fetch(`/api/produits/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          prix: typeof form.prix === "string" ? parseFloat(form.prix as any) : form.prix,
          prixCompare: form.prixCompare ? parseFloat(form.prixCompare as any) : null,
          stock: typeof form.stock === "string" ? parseInt(form.stock as any) : form.stock,
          poids: form.poids ? parseFloat(form.poids as any) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setProduit(data.produit);
      toast.success("Produit mis à jour !");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function supprimer() {
    if (!confirm("Supprimer ce produit définitivement ?")) return;
    setDeleting(true);
    const res = await fetch(`/api/produits/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Produit supprimé");
      router.push("/dashboard/produits");
    } else {
      toast.error("Erreur lors de la suppression");
      setDeleting(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 size={24} className="animate-spin text-[#F5A623]" />
    </div>
  );
  if (!produit) return <div className="text-center py-16 text-gray-400">Produit introuvable</div>;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/produits" className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-white hover:border-[#F5A623]/30 transition-all">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white font-poppins line-clamp-1">{produit.nom}</h1>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
              <span>{produit.ventes} ventes</span>
              <span>·</span>
              <span>{produit.vues} vues</span>
              <span>·</span>
              <span>{produit._count.avis} avis</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={supprimer} disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50">
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            Supprimer
          </button>
          <button onClick={() => set("actif", !form.actif)}
            className={`px-4 py-2 rounded-xl text-sm border transition-all ${form.actif ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-white border-gray-200 text-gray-500"}`}>
            {form.actif ? "Actif" : "Brouillon"}
          </button>
          <button onClick={sauvegarder} disabled={saving}
            className="flex items-center gap-2 bg-[#F5A623] text-black font-semibold px-5 py-2 rounded-xl text-sm hover:bg-[#d4820a] transition-all disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Enregistrer
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-5">
          {/* Infos de base */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Package size={15} className="text-[#F5A623]" />
              <h2 className="text-white font-semibold text-sm">Informations générales</h2>
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1.5">Nom du produit</label>
              <input value={form.nom || ""} onChange={e => set("nom", e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F5A623]/50" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-gray-400 text-xs">Description</label>
                <button onClick={genererDescription} disabled={genIA}
                  className="flex items-center gap-1.5 text-[#F5A623] text-xs hover:text-[#d4820a] transition-colors disabled:opacity-50">
                  {genIA ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  Régénérer avec l'IA
                </button>
              </div>
              <textarea value={form.description || ""} onChange={e => set("description", e.target.value)}
                rows={5} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F5A623]/50 resize-none" />
            </div>
          </div>

          {/* Prix & Stock */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 size={15} className="text-[#F5A623]" />
              <h2 className="text-white font-semibold text-sm">Prix & Stock</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Prix de vente</label>
                <input type="number" value={form.prix ?? ""} onChange={e => set("prix", e.target.value)}
                  min="0" step="0.01"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F5A623]/50" />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Prix barré</label>
                <input type="number" value={form.prixCompare ?? ""} onChange={e => set("prixCompare", e.target.value || null)}
                  min="0" step="0.01"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F5A623]/50" />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Stock</label>
                <input type="number" value={form.stock ?? 0} onChange={e => set("stock", e.target.value)}
                  min="0" step="1"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F5A623]/50" />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">SKU / Référence</label>
                <input value={form.sku || ""} onChange={e => set("sku", e.target.value || null)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F5A623]/50" />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon size={15} className="text-[#F5A623]" />
              <h2 className="text-white font-semibold text-sm">Images</h2>
            </div>
            <div className="flex gap-2">
              <input value={imageInput} onChange={e => setImageInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && ajouterImage()}
                placeholder="Coller une URL d'image..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F5A623]/50 placeholder:text-gray-600" />
              <button onClick={ajouterImage} className="px-4 py-2.5 bg-[#F5A623]/10 border border-[#F5A623]/20 text-[#F5A623] rounded-xl text-sm hover:bg-[#F5A623]/20">
                <Plus size={16} />
              </button>
            </div>
            {(form.images || []).length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {(form.images || []).map((img, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-200">
                    <img src={img} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                    {i === 0 && <div className="absolute bottom-1 left-1 bg-[#F5A623] text-black text-[10px] px-1.5 py-0.5 rounded font-medium">Principale</div>}
                    <button onClick={() => set("images", (form.images || []).filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                <ImageIcon size={24} className="text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-xs">Aucune image</p>
              </div>
            )}
          </div>

          {/* SEO */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe size={15} className="text-[#F5A623]" />
              <h2 className="text-white font-semibold text-sm">SEO</h2>
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1.5">Titre méta</label>
              <input value={form.metaTitle || ""} onChange={e => set("metaTitle", e.target.value || null)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F5A623]/50" />
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1.5">Méta description</label>
              <textarea value={form.metaDesc || ""} onChange={e => set("metaDesc", e.target.value || null)}
                rows={2} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F5A623]/50 resize-none" />
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-5">
          {/* Stats */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h2 className="text-white font-semibold text-sm mb-3">Statistiques</h2>
            <div className="space-y-3">
              {[
                { label: "Ventes totales", value: produit.ventes, color: "text-[#F5A623]" },
                { label: "Vues totales", value: produit.vues, color: "text-blue-400" },
                { label: "Avis reçus", value: produit._count.avis, color: "text-yellow-400" },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">{s.label}</span>
                  <span className={`font-bold text-sm ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Catégorie & Tags */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-[#F5A623]" />
              <h2 className="text-white font-semibold text-sm">Catégorie & Tags</h2>
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1.5">Catégorie</label>
              <select value={form.categorie || ""} onChange={e => set("categorie", e.target.value || null)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-white text-sm focus:outline-none">
                <option value="">Aucune</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1.5">Tags</label>
              <div className="flex gap-2">
                <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); ajouterTag(); } }}
                  placeholder="Ajouter un tag..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#F5A623]/50 placeholder:text-gray-600" />
                <button onClick={ajouterTag} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 hover:text-white text-xs">+</button>
              </div>
              {(form.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(form.tags || []).map(t => (
                    <span key={t} className="flex items-center gap-1 bg-[#F5A623]/10 border border-[#F5A623]/20 text-[#F5A623] text-xs px-2 py-1 rounded-lg">
                      {t}<button onClick={() => set("tags", (form.tags || []).filter(x => x !== t))}><X size={9} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Type de produit */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
            <h2 className="text-white font-semibold text-sm mb-1">Type de produit</h2>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { val: "physique",     label: "📦 Physique",     color: "#F5A623" },
                { val: "digital",      label: "💾 Digital",      color: "#7c3aed" },
                { val: "dropshipping", label: "🚚 Drop",         color: "#059669" },
              ] as const).map(t => (
                <button
                  key={t.val}
                  onClick={() => set("type", t.val)}
                  className="py-2 rounded-xl text-xs font-semibold transition-all border"
                  style={{
                    background: (form as any).type === t.val ? `${t.color}20` : "transparent",
                    borderColor: (form as any).type === t.val ? `${t.color}60` : "#e5e7eb",
                    color: (form as any).type === t.val ? t.color : "#9ca3af",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {(form as any).type === "digital" && (
              <p className="text-xs text-purple-400 bg-purple-500/10 rounded-lg px-3 py-2">
                Paiement Stripe obligatoire • Livraison instantanée par fichier ou lien
              </p>
            )}
          </div>

          {/* Options */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
            <h2 className="text-white font-semibold text-sm mb-1">Options</h2>
            {[
              { label: "Produit actif", desc: "Visible sur la boutique", key: "actif" },
              { label: "Mis en avant", desc: "Affiché en page d'accueil", key: "featured" },
            ].map(opt => (
              <div key={opt.key} className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">{opt.label}</p>
                  <p className="text-gray-500 text-xs">{opt.desc}</p>
                </div>
                <button onClick={() => set(opt.key, !(form as any)[opt.key])}
                  className={`w-11 h-6 rounded-full transition-all relative ${(form as any)[opt.key] ? "bg-[#F5A623]" : "bg-[#333]"}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${(form as any)[opt.key] ? "left-5" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
