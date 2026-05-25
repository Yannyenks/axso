"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Sparkles, Loader2, Package, Image as ImageIcon, Tag, BarChart2, Globe } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { slugify } from "@/lib/utils";

const CATEGORIES = [
  "Mode & Vêtements", "Beauté & Cosmétiques", "Alimentation & Épicerie",
  "Artisanat & Art", "Électronique", "Maison & Décoration",
  "Santé & Bien-être", "Sport & Loisirs", "Autre",
];

export default function NouveauProduitPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [genIA, setGenIA] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [imageInput, setImageInput] = useState("");

  const [form, setForm] = useState({
    nom: "",
    slug: "",
    description: "",
    prix: "",
    prixCompare: "",
    stock: "0",
    sku: "",
    categorie: "",
    tags: [] as string[],
    images: [] as string[],
    actif: true,
    featured: false,
    poids: "",
    metaTitle: "",
    metaDesc: "",
  });

  function set(field: string, value: any) {
    setForm(f => {
      const updated = { ...f, [field]: value };
      if (field === "nom") updated.slug = slugify(value);
      return updated;
    });
  }

  function ajouterTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      set("tags", [...form.tags, t]);
    }
    setTagInput("");
  }

  function ajouterImage() {
    const url = imageInput.trim();
    if (url && !form.images.includes(url)) {
      set("images", [...form.images, url]);
    }
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
    } catch {
      toast.error("Erreur IA");
    } finally {
      setGenIA(false);
    }
  }

  async function sauvegarder() {
    if (!form.nom || !form.prix) {
      toast.error("Nom et prix obligatoires");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/produits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: form.nom,
          slug: form.slug || slugify(form.nom),
          description: form.description || undefined,
          prix: parseFloat(form.prix),
          prixCompare: form.prixCompare ? parseFloat(form.prixCompare) : undefined,
          stock: parseInt(form.stock) || 0,
          sku: form.sku || undefined,
          categorie: form.categorie || undefined,
          tags: form.tags,
          images: form.images,
          actif: form.actif,
          featured: form.featured,
          poids: form.poids ? parseFloat(form.poids) : undefined,
          metaTitle: form.metaTitle || undefined,
          metaDesc: form.metaDesc || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");
      toast.success("Produit créé !");
      router.push(`/dashboard/produits/${data.produit.id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/produits" className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-[#F5A623]/30 transition-all">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-playfair">Nouveau produit</h1>
            <p className="text-gray-500 text-xs">Remplissez les informations ci-dessous</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => set("actif", !form.actif)}
            className={`px-4 py-2 rounded-xl text-sm border transition-all ${form.actif ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-white border-gray-200 text-gray-500"}`}
          >
            {form.actif ? "Actif" : "Brouillon"}
          </button>
          <button onClick={sauvegarder} disabled={saving}
            className="flex items-center gap-2 bg-[#F5A623] text-black font-semibold px-5 py-2 rounded-xl text-sm hover:bg-[#FFD280] transition-all disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Créer le produit
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
              <h2 className="text-gray-800 font-semibold text-sm">Informations générales</h2>
            </div>

            <div>
              <label className="text-gray-400 text-xs block mb-1.5">Nom du produit *</label>
              <input value={form.nom} onChange={e => set("nom", e.target.value)}
                placeholder="Ex: Robe Wax Premium" maxLength={120}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50 placeholder:text-gray-600" />
            </div>

            <div>
              <label className="text-gray-400 text-xs block mb-1.5">Slug URL</label>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <span className="text-gray-600 text-xs">/produits/</span>
                <input value={form.slug} onChange={e => set("slug", e.target.value)}
                  className="bg-transparent text-sm text-gray-600 outline-none flex-1" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-gray-400 text-xs">Description</label>
                <button onClick={genererDescription} disabled={genIA}
                  className="flex items-center gap-1.5 text-[#F5A623] text-xs hover:text-[#FFD280] transition-colors disabled:opacity-50">
                  {genIA ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  Générer avec l'IA
                </button>
              </div>
              <textarea value={form.description} onChange={e => set("description", e.target.value)}
                rows={5} placeholder="Décrivez votre produit en détail..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50 placeholder:text-gray-600 resize-none" />
            </div>
          </div>

          {/* Prix & Stock */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 size={15} className="text-[#F5A623]" />
              <h2 className="text-gray-800 font-semibold text-sm">Prix & Stock</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Prix de vente *</label>
                <input type="number" value={form.prix} onChange={e => set("prix", e.target.value)}
                  placeholder="0" min="0" step="0.01"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50" />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Prix barré (optionnel)</label>
                <input type="number" value={form.prixCompare} onChange={e => set("prixCompare", e.target.value)}
                  placeholder="0" min="0" step="0.01"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50" />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Stock initial *</label>
                <input type="number" value={form.stock} onChange={e => set("stock", e.target.value)}
                  min="0" step="1"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50" />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">SKU / Référence</label>
                <input value={form.sku} onChange={e => set("sku", e.target.value)}
                  placeholder="SKU-001"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50" />
              </div>
            </div>

            {form.prixCompare && parseFloat(form.prixCompare) > parseFloat(form.prix || "0") && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2 text-green-400 text-xs">
                Réduction de {Math.round((1 - parseFloat(form.prix) / parseFloat(form.prixCompare)) * 100)}% affiché sur la boutique
              </div>
            )}
          </div>

          {/* Images */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon size={15} className="text-[#F5A623]" />
              <h2 className="text-gray-800 font-semibold text-sm">Images</h2>
            </div>

            <div className="flex gap-2">
              <input value={imageInput} onChange={e => setImageInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && ajouterImage()}
                placeholder="Coller une URL d'image..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50 placeholder:text-gray-600" />
              <button onClick={ajouterImage} className="px-4 py-2.5 bg-[#F5A623]/10 border border-[#F5A623]/20 text-[#F5A623] rounded-xl text-sm hover:bg-[#F5A623]/20 transition-all">
                <Plus size={16} />
              </button>
            </div>

            {form.images.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {form.images.map((img, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-200">
                    <img src={img} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                    {i === 0 && <div className="absolute bottom-1 left-1 bg-[#F5A623] text-black text-[10px] px-1.5 py-0.5 rounded font-medium">Principale</div>}
                    <button onClick={() => set("images", form.images.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                <ImageIcon size={24} className="text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-xs">Ajoutez des URLs d'images ci-dessus</p>
              </div>
            )}
          </div>

          {/* SEO */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe size={15} className="text-[#F5A623]" />
              <h2 className="text-gray-800 font-semibold text-sm">SEO (optionnel)</h2>
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1.5">Titre méta</label>
              <input value={form.metaTitle} onChange={e => set("metaTitle", e.target.value)}
                placeholder="Titre pour les moteurs de recherche"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50 placeholder:text-gray-600" />
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1.5">Méta description</label>
              <textarea value={form.metaDesc} onChange={e => set("metaDesc", e.target.value)}
                rows={2} placeholder="Description affichée dans les résultats Google..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50 placeholder:text-gray-600 resize-none" />
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-5">
          {/* Catégorie & Tags */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Tag size={14} className="text-[#F5A623]" />
              <h2 className="text-gray-800 font-semibold text-sm">Catégorie & Tags</h2>
            </div>

            <div>
              <label className="text-gray-400 text-xs block mb-1.5">Catégorie</label>
              <select value={form.categorie} onChange={e => set("categorie", e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50">
                <option value="">Sélectionner...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-xs block mb-1.5">Tags</label>
              <div className="flex gap-2">
                <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); ajouterTag(); } }}
                  placeholder="Ajouter un tag..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 text-xs focus:outline-none focus:border-[#F5A623]/50 placeholder:text-gray-600" />
                <button onClick={ajouterTag} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 hover:text-gray-900 text-xs">+</button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.map(t => (
                    <span key={t} className="flex items-center gap-1 bg-[#F5A623]/10 border border-[#F5A623]/20 text-[#F5A623] text-xs px-2 py-1 rounded-lg">
                      {t}
                      <button onClick={() => set("tags", form.tags.filter(x => x !== t))}><X size={9} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
            <h2 className="text-gray-800 font-semibold text-sm mb-3">Options</h2>

            {[
              { label: "Produit actif", desc: "Visible sur votre boutique", key: "actif" },
              { label: "Mis en avant", desc: "Affiché en page d'accueil", key: "featured" },
            ].map(opt => (
              <div key={opt.key} className="flex items-center justify-between">
                <div>
                  <p className="text-gray-800 text-sm">{opt.label}</p>
                  <p className="text-gray-500 text-xs">{opt.desc}</p>
                </div>
                <button onClick={() => set(opt.key, !(form as any)[opt.key])}
                  className={`w-11 h-6 rounded-full transition-all relative ${(form as any)[opt.key] ? "bg-[#F5A623]" : "bg-[#333]"}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${(form as any)[opt.key] ? "left-5" : "left-0.5"}`} />
                </button>
              </div>
            ))}

            <div className="pt-2">
              <label className="text-gray-400 text-xs block mb-1.5">Poids (kg)</label>
              <input type="number" value={form.poids} onChange={e => set("poids", e.target.value)}
                placeholder="0.5" min="0" step="0.01"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50" />
            </div>
          </div>

          {/* Aperçu rapide */}
          {(form.nom || form.images[0]) && (
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <p className="text-gray-500 text-xs px-4 pt-3 pb-2">Aperçu boutique</p>
              <div className="aspect-square bg-gray-50 overflow-hidden">
                {form.images[0] ? (
                  <img src={form.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">??</div>
                )}
              </div>
              <div className="p-4">
                <p className="text-gray-800 font-medium text-sm line-clamp-2">{form.nom || "Nom du produit"}</p>
                {form.prix && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[#F5A623] font-bold text-sm">{form.prix} FCFA</span>
                    {form.prixCompare && <span className="text-gray-500 text-xs line-through">{form.prixCompare}</span>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

