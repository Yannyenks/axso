"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Truck, Plus, Sparkles, Loader2, ExternalLink, TrendingUp,
  Package, Search, BarChart2, Zap, Globe, X, ArrowRight
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

function MargeIndicator({ marge }: { marge: number }) {
  const color = marge >= 40 ? "#34d399" : marge >= 20 ? "#F5A623" : "#f87171";
  const label = marge >= 40 ? "Excellente" : marge >= 20 ? "Correcte" : "Faible";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(marge, 100)}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{marge}% · {label}</span>
    </div>
  );
}

export default function DropshippingPage() {
  const router = useRouter();
  const [produits, setProduits] = useState<ProduitDropship[]>([]);
  const [loading, setLoading] = useState(true);
  const [importModal, setImportModal] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [importForm, setImportForm] = useState({
    // Mode manuel
    nom: "", prix: "", prixFournisseur: "", categorie: "", urlFournisseur: "",
    nomFournisseur: "", description: "",
    // Mode IA
    promptIA: "",
  });

  const [aiPlan, setAiPlan] = useState<any>(null);
  const [saving, setSaving] = useState(false);

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

  // ─── Import IA ──────────────────────────────────────────────────
  async function genererAvecIA() {
    if (!importForm.promptIA.trim()) { toast.error("Décrivez le produit"); return; }
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/universal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Génère une fiche produit dropshipping complète pour : "${importForm.promptIA}".

Réponds en JSON avec exactement ce format:
{
  "nom": "...",
  "description": "...",
  "categorie": "...",
  "prixVente": 0,
  "prixFournisseur": 0,
  "tags": [],
  "nomFournisseur": "AliExpress",
  "imagePrompt": "description pour générer une image du produit"
}

Le prix de vente doit être 2 à 3x le prix fournisseur (bonne marge). Adapte les prix au marché africain en XOF ou CFA.`,
          }],
        }),
      });
      const data = await res.json();
      const text = data.reponse || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const plan = JSON.parse(jsonMatch[0]);
        setAiPlan(plan);

        // Générer l'image via Pollinations
        if (plan.imagePrompt) {
          const encoded = encodeURIComponent(`${plan.imagePrompt}, professional product photography, white background, 4K, high quality`);
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
      toast.success(`✅ "${aiPlan.nom}" ajouté au catalogue !`);
      setImportModal(false);
      setAiPlan(null);
      setImportForm(f => ({ ...f, promptIA: "" }));
      chargerProduits();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function creerManuel() {
    if (!importForm.nom || !importForm.prix) { toast.error("Nom et prix requis"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/produits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: importForm.nom,
          slug: importForm.nom.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36),
          description: importForm.description,
          prix: parseFloat(importForm.prix),
          prixFournisseur: importForm.prixFournisseur ? parseFloat(importForm.prixFournisseur) : undefined,
          categorie: importForm.categorie || undefined,
          urlFournisseur: importForm.urlFournisseur || undefined,
          nomFournisseur: importForm.nomFournisseur || undefined,
          type: "dropshipping",
          stock: 9999,
          images: [],
          actif: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");
      toast.success("Produit dropshipping créé !");
      setImportModal(false);
      router.push(`/dashboard/produits/${data.produit.id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  const stats = {
    total: produits.length,
    margeM: produits.length > 0
      ? Math.round(produits.filter(p => p.prixFournisseur).reduce((s, p) => s + (1 - p.prixFournisseur! / p.prix) * 100, 0) / produits.filter(p => p.prixFournisseur).length)
      : 0,
    ventes: produits.reduce((s, p) => s + p.ventes, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-poppins flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Truck size={20} className="text-emerald-600" />
            </div>
            Dropshipping
          </h1>
          <p className="text-gray-400 text-sm mt-1">Importez et gérez vos produits fournisseurs</p>
        </div>
        <button
          onClick={() => setImportModal(true)}
          className="flex items-center gap-2 bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/25"
        >
          <Plus size={16} /> Importer un produit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Package, label: "Produits actifs", val: stats.total, color: "#34d399" },
          { icon: BarChart2, label: "Marge moyenne", val: `${stats.margeM || 0}%`, color: "#F5A623" },
          { icon: TrendingUp, label: "Ventes totales", val: stats.ventes, color: "#818cf8" },
        ].map((s) => {
          const Icone = s.icon;
          return (
            <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.color + "15" }}>
                  <Icone size={16} style={{ color: s.color }} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{s.val}</p>
              </div>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Liste produits */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="text-emerald-400 animate-spin" />
        </div>
      ) : produits.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Truck size={28} className="text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Aucun produit dropshipping</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
            Importez votre premier produit manuellement ou laissez l'IA trouver des produits gagnants pour vous.
          </p>
          <button onClick={() => { setImportModal(true); setAiMode(true); }}
            className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-emerald-600 transition-all mx-auto">
            <Sparkles size={15} /> Trouver des produits avec l'IA
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {produits.map((p) => {
            const marge = p.prixFournisseur ? Math.round((1 - p.prixFournisseur / p.prix) * 100) : null;
            return (
              <div key={p.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow group">
                <div className="aspect-square bg-gray-50 overflow-hidden">
                  {p.images[0] ? (
                    <img src={p.images[0]} alt={p.nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm line-clamp-1">{p.nom}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.nomFournisseur || "Fournisseur"} · {p.categorie}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{p.prix.toLocaleString()} <span className="text-xs font-normal text-gray-400">FCFA</span></p>
                      {p.prixFournisseur && <p className="text-xs text-gray-400">Coût : {p.prixFournisseur.toLocaleString()} FCFA</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-500">{p.ventes} ventes</span>
                    </div>
                  </div>
                  {marge !== null && <MargeIndicator marge={marge} />}
                  <div className="flex gap-2 pt-1">
                    <Link href={`/dashboard/produits/${p.id}`}
                      className="flex-1 text-center text-xs bg-gray-50 border border-gray-200 text-gray-600 py-2 rounded-xl hover:bg-gray-100 transition-colors">
                      Modifier
                    </Link>
                    {p.urlFournisseur && (
                      <a href={p.urlFournisseur} target="_blank" rel="noopener noreferrer"
                        className="px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors">
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modal Import ─── */}
      {importModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) { setImportModal(false); setAiPlan(null); } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Importer un produit</h2>
                <p className="text-sm text-gray-400">Manuel ou assisté par l'IA</p>
              </div>
              <button onClick={() => { setImportModal(false); setAiPlan(null); }} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            {/* Toggle mode */}
            <div className="flex gap-1 p-4 border-b border-gray-100">
              {[{ id: false, label: "Manuel", icon: Globe }, { id: true, label: "IA — Auto", icon: Sparkles }].map(m => {
                const Icone = m.icon;
                return (
                  <button key={String(m.id)} onClick={() => { setAiMode(m.id); setAiPlan(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${aiMode === m.id ? "bg-emerald-500 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                    <Icone size={14} /> {m.label}
                  </button>
                );
              })}
            </div>

            <div className="p-6 space-y-4">
              {/* Mode IA */}
              {aiMode && (
                <div className="space-y-4">
                  {!aiPlan ? (
                    <>
                      <div>
                        <label className="text-gray-600 text-sm font-medium block mb-2">Décrivez le produit que vous voulez vendre</label>
                        <textarea
                          value={importForm.promptIA}
                          onChange={e => setImportForm(f => ({ ...f, promptIA: e.target.value }))}
                          rows={4}
                          placeholder="Ex: Chaussures de sport homme tendance, marché Côte d'Ivoire, style Nike, segment 20-35 ans..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-emerald-400 resize-none"
                        />
                      </div>
                      <button onClick={genererAvecIA} disabled={generating || !importForm.promptIA.trim()}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white font-semibold py-3 rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50">
                        {generating ? <><Loader2 size={16} className="animate-spin" /> L'IA analyse le marché…</> : <><Zap size={16} /> Générer la fiche produit</>}
                      </button>
                    </>
                  ) : (
                    <div className="space-y-4">
                      {/* Aperçu plan IA */}
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          {aiPlan.imageUrl && (
                            <img src={aiPlan.imageUrl} alt={aiPlan.nom} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900">{aiPlan.nom}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{aiPlan.description}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm font-bold text-emerald-600">{aiPlan.prixVente?.toLocaleString()} FCFA</span>
                              <span className="text-xs text-gray-400">Coût: {aiPlan.prixFournisseur?.toLocaleString()} FCFA</span>
                              <span className="text-xs font-semibold text-emerald-600">
                                Marge: {Math.round((1 - aiPlan.prixFournisseur / aiPlan.prixVente) * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => { setAiPlan(null); }}
                          className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
                          Régénérer
                        </button>
                        <button onClick={creerDepuisIA} disabled={saving}
                          className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white font-semibold py-3 rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50">
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
                <div className="space-y-4">
                  {[
                    { label: "Nom du produit *", field: "nom", placeholder: "Ex: Sneakers Jordan Replica" },
                    { label: "URL fournisseur (AliExpress, etc.)", field: "urlFournisseur", placeholder: "https://aliexpress.com/item/..." },
                    { label: "Nom du fournisseur", field: "nomFournisseur", placeholder: "AliExpress, CJ Dropshipping..." },
                    { label: "Catégorie", field: "categorie", placeholder: "Mode, Électronique..." },
                  ].map(f => (
                    <div key={f.field}>
                      <label className="text-gray-500 text-xs block mb-1.5">{f.label}</label>
                      <input value={(importForm as any)[f.field]} onChange={e => setImportForm(p => ({ ...p, [f.field]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-emerald-400" />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-500 text-xs block mb-1.5">Prix de vente * (FCFA)</label>
                      <input type="number" value={importForm.prix} onChange={e => setImportForm(p => ({ ...p, prix: e.target.value }))}
                        placeholder="25000"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-emerald-400" />
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs block mb-1.5">Prix fournisseur (FCFA)</label>
                      <input type="number" value={importForm.prixFournisseur} onChange={e => setImportForm(p => ({ ...p, prixFournisseur: e.target.value }))}
                        placeholder="8000"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-emerald-400" />
                    </div>
                  </div>
                  {importForm.prix && importForm.prixFournisseur && (
                    <MargeIndicator marge={Math.round((1 - parseFloat(importForm.prixFournisseur) / parseFloat(importForm.prix)) * 100)} />
                  )}
                  <textarea value={importForm.description} onChange={e => setImportForm(p => ({ ...p, description: e.target.value }))}
                    rows={3} placeholder="Description du produit..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-emerald-400 resize-none" />
                  <button onClick={creerManuel} disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white font-semibold py-3 rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50">
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
