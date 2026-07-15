"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Truck, Plus, Sparkles, Loader2, ExternalLink, TrendingUp,
  Package, Search, BarChart2, Zap, Globe, X, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface ProduitDropship {
  id: string;
  nom: string;
  prix: number;
  prixFournisseur: number | null;
  images: string[];
  categorie: string | null;
  urlFournisseur: string | null;
  nomFournisseur: string | null;
  ventes: number;
  stock: number;
}

function MargeBar({ marge }: { marge: number }) {
  const color = marge >= 40 ? "#16a34a" : marge >= 20 ? "#F97316" : "#ef4444";
  const label = marge >= 40 ? "Excellente" : marge >= 20 ? "Bonne" : "Faible";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400 font-medium">Marge</span>
        <span className="text-[11px] font-bold" style={{ color }}>{marge}% · {label}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(marge, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

export default function DropshippingPage() {
  const router = useRouter();
  const [produits, setProduits]     = useState<ProduitDropship[]>([]);
  const [loading, setLoading]       = useState(true);
  const [importModal, setImportModal] = useState(false);
  const [aiMode, setAiMode]         = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [aiPlan, setAiPlan]         = useState<any>(null);
  const [search, setSearch]         = useState("");

  const [form, setForm] = useState({
    nom: "", prix: "", prixFournisseur: "", categorie: "",
    urlFournisseur: "", nomFournisseur: "", description: "", promptIA: "",
  });

  useEffect(() => { chargerProduits(); }, []);

  async function chargerProduits() {
    setLoading(true);
    try {
      const res = await fetch("/api/produits?limit=50");
      const data = await res.json();
      setProduits((data.produits || []).filter((p: any) => p.type === "dropshipping"));
    } catch { toast.error("Erreur chargement"); }
    finally { setLoading(false); }
  }

  async function genererAvecIA() {
    if (!form.promptIA.trim()) { toast.error("Décrivez le produit"); return; }
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/universal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Génère une fiche produit dropshipping complète pour : "${form.promptIA}".
Réponds en JSON avec exactement :
{
  "nom": "...",
  "description": "...",
  "categorie": "...",
  "prixVente": 0,
  "prixFournisseur": 0,
  "tags": [],
  "nomFournisseur": "AliExpress",
  "imagePrompt": "description précise pour générer l'image du produit"
}
Le prix de vente doit être 2 à 3x le prix fournisseur. Adapte les prix au marché africain en XOF.`,
          }],
        }),
      });
      const data = await res.json();
      const text = data.reponse || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const plan = JSON.parse(jsonMatch[0]);
        setAiPlan(plan);
        if (plan.imagePrompt) {
          const encoded = encodeURIComponent(`${plan.imagePrompt}, professional product photography, white background, 4K`);
          plan.imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=800&height=800&nologo=true&model=flux&enhance=true&seed=${Math.floor(Math.random() * 999999)}`;
        }
      } else {
        toast.error("L'IA n'a pas retourné un plan valide");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur IA");
    } finally {
      setGenerating(false);
    }
  }

  async function creerDepuisIA() {
    if (!aiPlan) return;
    setSaving(true);
    try {
      const res = await fetch("/api/produits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: aiPlan.nom,
          slug: aiPlan.nom.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36),
          description: aiPlan.description,
          prix: aiPlan.prixVente,
          prixFournisseur: aiPlan.prixFournisseur,
          categorie: aiPlan.categorie,
          tags: aiPlan.tags || [],
          images: aiPlan.imageUrl ? [aiPlan.imageUrl] : [],
          type: "dropshipping",
          nomFournisseur: aiPlan.nomFournisseur || "AliExpress",
          stock: 9999,
          actif: true,
        }),
      });
      if (!res.ok) throw new Error("Erreur création");
      toast.success(`"${aiPlan.nom}" ajouté au catalogue`);
      fermerModal();
      chargerProduits();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function creerManuel() {
    if (!form.nom || !form.prix) { toast.error("Nom et prix requis"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/produits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: form.nom,
          slug: form.nom.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36),
          description: form.description,
          prix: parseFloat(form.prix),
          prixFournisseur: form.prixFournisseur ? parseFloat(form.prixFournisseur) : undefined,
          categorie: form.categorie || undefined,
          urlFournisseur: form.urlFournisseur || undefined,
          nomFournisseur: form.nomFournisseur || undefined,
          type: "dropshipping",
          stock: 9999,
          images: [],
          actif: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");
      toast.success("Produit dropshipping créé !");
      fermerModal();
      router.push(`/dashboard/produits/${data.produit.id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  function fermerModal() {
    setImportModal(false);
    setAiPlan(null);
    setForm(f => ({ ...f, promptIA: "", nom: "", prix: "", prixFournisseur: "" }));
  }

  const produitsFiltres = search
    ? produits.filter(p => p.nom.toLowerCase().includes(search.toLowerCase()) || p.nomFournisseur?.toLowerCase().includes(search.toLowerCase()))
    : produits;

  const stats = {
    total: produits.length,
    margeM: produits.filter(p => p.prixFournisseur).length > 0
      ? Math.round(produits.filter(p => p.prixFournisseur).reduce((s, p) => s + (1 - p.prixFournisseur! / p.prix) * 100, 0) / produits.filter(p => p.prixFournisseur).length)
      : 0,
    ventes: produits.reduce((s, p) => s + p.ventes, 0),
  };

  const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm outline-none placeholder-gray-400 transition-all focus:border-orange-300 focus:ring-2 focus:ring-orange-50";

  return (
    <div className="space-y-5" style={{ fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
              style={{ background: "linear-gradient(135deg,#F97316,#EA580C)", boxShadow: "0 4px 14px rgba(249,115,22,0.3)" }}>
              <Truck size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Dropshipping</h1>
              <p className="text-gray-400 text-sm mt-0.5">Importez et gérez vos produits fournisseurs</p>
            </div>
          </div>
          <button onClick={() => setImportModal(true)}
            className="flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
            style={{ background: "linear-gradient(135deg,#F97316,#EA580C)", boxShadow: "0 4px 14px rgba(249,115,22,0.25)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 18px rgba(249,115,22,0.4)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(249,115,22,0.25)"}>
            <Plus size={16} /> Importer un produit
          </button>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Package, label: "Produits actifs", val: stats.total, sub: "dans votre catalogue" },
          { icon: BarChart2, label: "Marge moyenne", val: `${stats.margeM || 0}%`, sub: "sur vos produits" },
          { icon: TrendingUp, label: "Ventes totales", val: stats.ventes, sub: "toutes périodes" },
        ].map(s => {
          const Ic = s.icon;
          return (
            <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "#FFF7ED" }}>
                  <Ic size={16} style={{ color: "#F97316" }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{s.val}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* ── Produits ───────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={28} className="animate-spin" style={{ color: "#F97316" }} />
            <p className="text-sm text-gray-400">Chargement des produits…</p>
          </div>
        </div>
      ) : produits.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "#FFF7ED" }}>
            <Truck size={28} style={{ color: "#FDBA74" }} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Aucun produit dropshipping</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
            Importez votre premier produit manuellement ou laissez AXIA trouver des produits gagnants.
          </p>
          <button onClick={() => { setImportModal(true); setAiMode(true); }}
            className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all"
            style={{ background: "linear-gradient(135deg,#F97316,#EA580C)" }}>
            <Sparkles size={15} /> Trouver des produits avec AXIA
          </button>
        </div>
      ) : (
        <>
          {/* Barre de recherche */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 shadow-sm"
            onFocusCapture={e => (e.currentTarget.style.borderColor = "#FDBA74")}
            onBlurCapture={e => (e.currentTarget.style.borderColor = "#e5e7eb")}>
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un produit…"
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none" />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {produitsFiltres.map((p) => {
              const marge = p.prixFournisseur ? Math.round((1 - p.prixFournisseur / p.prix) * 100) : null;
              return (
                <div key={p.id}
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm transition-all duration-200 group"
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#FDBA74";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(249,115,22,0.08)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#f3f4f6";
                    (e.currentTarget as HTMLElement).style.boxShadow = "";
                  }}>
                  <div className="aspect-square bg-gray-50 overflow-hidden relative">
                    {p.images[0] ? (
                      <img src={p.images[0]} alt={p.nom}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <div className="text-3xl">📦</div>
                        <p className="text-[11px] text-gray-300">Aucune image</p>
                      </div>
                    )}
                    {/* Badge fournisseur */}
                    {p.nomFournisseur && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: "rgba(0,0,0,0.55)", color: "white", backdropFilter: "blur(4px)" }}>
                        {p.nomFournisseur}
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm line-clamp-1">{p.nom}</p>
                      {p.categorie && <p className="text-xs text-gray-400 mt-0.5">{p.categorie}</p>}
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[11px] text-gray-400 mb-0.5">Prix de vente</p>
                        <p className="text-lg font-bold text-gray-900">
                          {p.prix.toLocaleString()}
                          <span className="text-xs font-normal text-gray-400 ml-1">FCFA</span>
                        </p>
                      </div>
                      {p.prixFournisseur && (
                        <div className="text-right">
                          <p className="text-[11px] text-gray-400 mb-0.5">Coût fournisseur</p>
                          <p className="text-sm font-semibold text-gray-500">{p.prixFournisseur.toLocaleString()} FCFA</p>
                        </div>
                      )}
                    </div>
                    {marge !== null && <MargeBar marge={marge} />}
                    <div className="flex gap-2 pt-1">
                      <Link href={`/dashboard/produits/${p.id}`}
                        className="flex-1 text-center text-xs font-semibold border py-2 rounded-xl transition-all text-gray-600 hover:text-gray-900"
                        style={{ background: "#F9FAFB", borderColor: "#E5E7EB" }}>
                        Modifier
                      </Link>
                      {p.urlFournisseur && (
                        <a href={p.urlFournisseur} target="_blank" rel="noopener noreferrer"
                          className="px-3 py-2 rounded-xl border transition-all"
                          style={{ background: "#FFF7ED", borderColor: "#FDBA74", color: "#F97316" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#FFEDD5"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#FFF7ED"}>
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Modal Import ────────────────────────────────────────── */}
      {importModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) fermerModal(); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">Importer un produit</h2>
                <p className="text-xs text-gray-400 mt-0.5">Assisté par AXIA ou en mode manuel</p>
              </div>
              <button onClick={fermerModal}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors">
                <X size={15} className="text-gray-500" />
              </button>
            </div>

            {/* Toggle */}
            <div className="flex gap-1.5 p-4 border-b border-gray-100">
              {[
                { id: true, label: "AXIA — IA", icon: Sparkles, desc: "Généré automatiquement" },
                { id: false, label: "Manuel", icon: Globe, desc: "Remplir manuellement" },
              ].map(m => {
                const Ic = m.icon;
                return (
                  <button key={String(m.id)} onClick={() => { setAiMode(m.id); setAiPlan(null); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={aiMode === m.id
                      ? { background: "linear-gradient(135deg,#F97316,#EA580C)", color: "white", boxShadow: "0 2px 8px rgba(249,115,22,0.25)" }
                      : { background: "#F9FAFB", color: "#6B7280" }}>
                    <Ic size={14} /> {m.label}
                  </button>
                );
              })}
            </div>

            <div className="p-5 space-y-4">

              {/* Mode IA */}
              {aiMode && (
                <div className="space-y-4">
                  {!aiPlan ? (
                    <>
                      <div>
                        <label className="text-gray-700 text-sm font-semibold block mb-2">
                          Décrivez le produit à trouver
                        </label>
                        <textarea
                          value={form.promptIA}
                          onChange={e => setForm(f => ({ ...f, promptIA: e.target.value }))}
                          rows={4}
                          placeholder="Ex: Chaussures de sport homme tendance, marché Côte d'Ivoire, style Nike, segment 20–35 ans…"
                          className={inputCls + " resize-none"}
                        />
                      </div>
                      <button onClick={genererAvecIA} disabled={generating || !form.promptIA.trim()}
                        className="w-full flex items-center justify-center gap-2.5 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: "linear-gradient(135deg,#F97316,#EA580C)", boxShadow: "0 4px 14px rgba(249,115,22,0.25)" }}>
                        {generating
                          ? <><Loader2 size={16} className="animate-spin" /> AXIA analyse le marché…</>
                          : <><Zap size={16} /> Générer la fiche produit</>}
                      </button>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-xl p-4 border" style={{ background: "#FFF7ED", borderColor: "#FDBA74" }}>
                        <div className="flex items-start gap-3">
                          {aiPlan.imageUrl && (
                            <img src={aiPlan.imageUrl} alt={aiPlan.nom}
                              className="w-20 h-20 rounded-xl object-cover flex-shrink-0 shadow-sm" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm">{aiPlan.nom}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{aiPlan.description}</p>
                            <div className="flex items-center flex-wrap gap-3 mt-2.5">
                              <span className="text-sm font-bold" style={{ color: "#F97316" }}>
                                {aiPlan.prixVente?.toLocaleString()} FCFA
                              </span>
                              <span className="text-xs text-gray-400">
                                Coût : {aiPlan.prixFournisseur?.toLocaleString()} FCFA
                              </span>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={{ background: "rgba(249,115,22,0.12)", color: "#C2410C" }}>
                                Marge {Math.round((1 - aiPlan.prixFournisseur / aiPlan.prixVente) * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setAiPlan(null)}
                          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
                          Régénérer
                        </button>
                        <button onClick={creerDepuisIA} disabled={saving}
                          className="flex-1 flex items-center justify-center gap-2 text-white font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50"
                          style={{ background: "linear-gradient(135deg,#F97316,#EA580C)" }}>
                          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                          Importer ce produit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mode Manuel */}
              {!aiMode && (
                <div className="space-y-3.5">
                  {[
                    { label: "Nom du produit *", field: "nom", placeholder: "Ex: Sneakers Jordan Replica" },
                    { label: "URL fournisseur (AliExpress, CJ…)", field: "urlFournisseur", placeholder: "https://aliexpress.com/item/..." },
                    { label: "Nom du fournisseur", field: "nomFournisseur", placeholder: "AliExpress, CJ Dropshipping…" },
                    { label: "Catégorie", field: "categorie", placeholder: "Mode, Électronique…" },
                  ].map(f => (
                    <div key={f.field}>
                      <label className="text-gray-600 text-xs font-semibold block mb-1.5">{f.label}</label>
                      <input value={(form as any)[f.field]}
                        onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))}
                        placeholder={f.placeholder}
                        className={inputCls} />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-600 text-xs font-semibold block mb-1.5">Prix de vente * (FCFA)</label>
                      <input type="number" value={form.prix}
                        onChange={e => setForm(p => ({ ...p, prix: e.target.value }))}
                        placeholder="25 000" className={inputCls} />
                    </div>
                    <div>
                      <label className="text-gray-600 text-xs font-semibold block mb-1.5">Coût fournisseur (FCFA)</label>
                      <input type="number" value={form.prixFournisseur}
                        onChange={e => setForm(p => ({ ...p, prixFournisseur: e.target.value }))}
                        placeholder="8 000" className={inputCls} />
                    </div>
                  </div>
                  {form.prix && form.prixFournisseur && (
                    <MargeBar marge={Math.round((1 - parseFloat(form.prixFournisseur) / parseFloat(form.prix)) * 100)} />
                  )}
                  <div>
                    <label className="text-gray-600 text-xs font-semibold block mb-1.5">Description</label>
                    <textarea value={form.description}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      rows={3} placeholder="Description du produit…"
                      className={inputCls + " resize-none"} />
                  </div>
                  <button onClick={creerManuel} disabled={saving}
                    className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#F97316,#EA580C)", boxShadow: "0 4px 14px rgba(249,115,22,0.25)" }}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                    Créer le produit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
