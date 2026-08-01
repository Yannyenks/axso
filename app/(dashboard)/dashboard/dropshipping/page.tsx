"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Globe, Star, RefreshCw, ExternalLink } from "lucide-react";

interface Fournisseur {
  id: string;
  nom: string;
  pays: string;
  type: string;
  url: string | null;
  email: string | null;
  delaiLivraison: number;
  fiabilite: number;
  margeAuto: number;
  actif: boolean;
  livraisonsTotal: number;
  livraisonsOk: number;
  notes: string | null;
  _count?: { produits: number };
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  aliexpress: { label: "AliExpress", color: "#FF6A00" },
  cj: { label: "CJ Dropshipping", color: "#1677FF" },
  jumia: { label: "Jumia", color: "#EF6C00" },
  local: { label: "Local", color: "#10b981" },
  autre: { label: "Autre", color: "#888" },
};

function Stars({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={10} fill={i <= n ? "#F5A623" : "none"} stroke={i <= n ? "#F5A623" : "#DDD"} />
      ))}
    </span>
  );
}

export default function DropshippingPage() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nom: "", pays: "Chine", type: "aliexpress", url: "", email: "",
    telephone: "", delaiLivraison: 15, margeAuto: 30, notes: "",
  });

  useEffect(() => {
    fetch("/api/fournisseurs")
      .then((r) => r.json())
      .then((d) => setFournisseurs(d.fournisseurs ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function saveFournisseur() {
    setSaving(true);
    const res = await fetch("/api/fournisseurs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, margeAuto: form.margeAuto / 100 }),
    });
    const data = await res.json();
    if (data.fournisseur) {
      setFournisseurs((prev) => [data.fournisseur, ...prev]);
      setForm({ nom: "", pays: "Chine", type: "aliexpress", url: "", email: "", telephone: "", delaiLivraison: 15, margeAuto: 30, notes: "" });
      setShowForm(false);
    }
    setSaving(false);
  }

  async function deleteFournisseur(id: string) {
    if (!confirm("Supprimer ce fournisseur ?")) return;
    await fetch(`/api/fournisseurs?id=${id}`, { method: "DELETE" });
    setFournisseurs((prev) => prev.filter((f) => f.id !== id));
  }

  const totalProduits = fournisseurs.reduce((s, f) => s + (f._count?.produits ?? 0), 0);
  const tauxFiabilite = fournisseurs.length > 0
    ? Math.round(fournisseurs.reduce((s, f) => s + f.fiabilite, 0) / fournisseurs.length * 20)
    : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-[#111111] tracking-tight">Dropshipping</h1>
          <p className="text-[12.5px] text-[#AAAAAA] mt-0.5">Fournisseurs, marges auto et routage commandes</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-[13px] font-semibold"
          style={{ background: "#F5A623" }}
        >
          <Plus size={14} /> Ajouter fournisseur
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-[#F0F0F0] rounded-xl p-4">
          <p className="text-[11px] text-[#888] mb-1">Fournisseurs actifs</p>
          <p className="text-2xl font-bold text-[#111]">{fournisseurs.filter((f) => f.actif).length}</p>
        </div>
        <div className="bg-white border border-[#F0F0F0] rounded-xl p-4">
          <p className="text-[11px] text-[#888] mb-1">Produits sourcés</p>
          <p className="text-2xl font-bold text-[#111]">{totalProduits}</p>
        </div>
        <div className="bg-white border border-[#F0F0F0] rounded-xl p-4">
          <p className="text-[11px] text-[#888] mb-1">Fiabilité moy.</p>
          <p className="text-2xl font-bold" style={{ color: "#F5A623" }}>{tauxFiabilite}%</p>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white border border-[#F0F0F0] rounded-xl p-5">
          <h3 className="text-[14px] font-semibold text-[#111] mb-4">Nouveau fournisseur</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Nom *", key: "nom", placeholder: "Grand Fournisseur SAS" },
              { label: "Pays", key: "pays", placeholder: "Chine" },
              { label: "URL catalogue", key: "url", placeholder: "https://..." },
              { label: "Email contact", key: "email", placeholder: "contact@..." },
              { label: "Notes internes", key: "notes", placeholder: "Délais fiables, bon SAV..." },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-[11px] text-[#888] mb-1">{label}</label>
                <input className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2 text-[13px]" placeholder={placeholder} value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label className="block text-[11px] text-[#888] mb-1">Type</label>
              <select className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2 text-[13px]" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-[#888] mb-1">Délai livraison (jours)</label>
              <input type="number" className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2 text-[13px]" value={form.delaiLivraison} onChange={(e) => setForm((f) => ({ ...f, delaiLivraison: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-[11px] text-[#888] mb-1">Marge auto (%)</label>
              <input type="number" className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2 text-[13px]" value={form.margeAuto} min={0} max={500} onChange={(e) => setForm((f) => ({ ...f, margeAuto: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={saveFournisseur} disabled={saving || !form.nom} className="px-4 py-2 rounded-lg text-white text-[13px] font-semibold disabled:opacity-50" style={{ background: "#F5A623" }}>
              {saving ? "Enregistrement..." : "Ajouter"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-[13px] text-[#666] border border-[#E5E5E5]">Annuler</button>
          </div>
        </div>
      )}

      {/* Liste */}
      {fournisseurs.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E5E5E5] rounded-xl p-10 text-center">
          <Globe size={32} className="mx-auto mb-3 text-[#DDD]" />
          <p className="text-[13px] text-[#888]">Aucun fournisseur. Commence par en ajouter un.</p>
          <button onClick={() => setShowForm(true)} className="mt-4 px-4 py-2 rounded-lg text-white text-[13px] font-semibold" style={{ background: "#F5A623" }}>
            Ajouter un fournisseur
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {fournisseurs.map((f) => {
            const tc = TYPE_LABELS[f.type] ?? { label: f.type, color: "#888" };
            const fiabiliteOk = f.livraisonsTotal > 0 ? Math.round((f.livraisonsOk / f.livraisonsTotal) * 100) : null;
            return (
              <div key={f.id} className="bg-white border border-[#F0F0F0] rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#F5F5F5" }}>
                      <Globe size={18} className="text-[#888]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-semibold text-[#111]">{f.nom}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-white" style={{ background: tc.color }}>
                          {tc.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <Stars n={Math.round(f.fiabilite)} />
                        <span className="text-[11px] text-[#888]">{f.pays} · {f.delaiLivraison}j délai</span>
                        {fiabiliteOk !== null && <span className="text-[11px] text-[#888]">{fiabiliteOk}% à temps</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[12px] font-bold text-[#111]">+{Math.round(f.margeAuto * 100)}% marge</p>
                    <p className="text-[10px] text-[#AAA]">{f._count?.produits ?? 0} produits</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {f.url && (
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-[#F5F5F5]">
                        <ExternalLink size={13} className="text-[#888]" />
                      </a>
                    )}
                    <button onClick={() => deleteFournisseur(f.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  </div>
                </div>
                {f.notes && <p className="text-[11px] text-[#888] mt-2">{f.notes}</p>}
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-[#FFFBF0] border border-[#F5A623]/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <RefreshCw size={16} style={{ color: "#F5A623" }} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-[#111]">Routage automatique</p>
            <p className="text-[12px] text-[#666] mt-1">
              Lorsqu'une commande contient des produits dropshipping, AXIA peut alerter le fournisseur par email, calculer la marge automatiquement et mettre à jour le statut de livraison. Dis simplement à AXIA "route cette commande" ou "alerte le fournisseur".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
