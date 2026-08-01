"use client";
import { useEffect, useState } from "react";

interface Programme {
  id: string;
  nom: string;
  marchand: string;
  url: string;
  categorie: string | null;
  commission: number;
  devise: string;
  clics: number;
  conversions: number;
  revenus: number;
  actif: boolean;
  createdAt: string;
}

const EMPTY = { nom: "", marchand: "", url: "", categorie: "", commission: "10", devise: "XAF" };

export default function AffiliationEntrantePage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [stats, setStats] = useState({ total: 0, actifs: 0, revenuTotal: 0, clicsTotal: 0 });
  const [form, setForm] = useState({ ...EMPTY });
  const [loading, setLoading] = useState(false);

  async function load() {
    const r = await fetch("/api/affiliation/entrante").then(r => r.json());
    setProgrammes(r.programmes ?? []);
    setStats(r.stats ?? {});
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.nom || !form.url) return;
    setLoading(true);
    await fetch("/api/affiliation/entrante", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, commission: parseFloat(form.commission) / 100 }),
    });
    setForm({ ...EMPTY });
    await load();
    setLoading(false);
  }

  async function toggle(p: Programme) {
    await fetch("/api/affiliation/entrante", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, actif: !p.actif }),
    });
    load();
  }

  async function del(id: string) {
    if (!confirm("Supprimer ce programme ?")) return;
    await fetch(`/api/affiliation/entrante?id=${id}`, { method: "DELETE" });
    load();
  }

  const inp = "w-full border border-[#E8E8E8] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-[#F5A623]/60";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-[#111]">Affiliation entrante</h1>
        <p className="text-[13px] text-[#888] mt-0.5">Programmes où tu es affilié d'autres marchands — génère des revenus en les recommandant</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Programmes", v: stats.total },
          { label: "Actifs", v: stats.actifs, color: "#22c55e" },
          { label: "Clics totaux", v: stats.clicsTotal },
          { label: "Revenus", v: stats.revenuTotal.toLocaleString() + " XAF", color: "#F5A623" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-[#F0F0F0] rounded-2xl p-4 text-center">
            <p className="text-[20px] font-bold" style={{ color: s.color ?? "#111" }}>{s.v}</p>
            <p className="text-[11px] text-[#AAA] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="bg-[#FFF8EC] border border-[#F5A623]/20 rounded-2xl p-4 text-[13px] text-[#7a5a00]">
        <strong>Comment ça marche :</strong> Ajoute un programme d'affiliation (ex: Jumia Affiliate, Amazon Associates, un partenaire local).
        Partage ton lien sur ta boutique ou réseaux sociaux. Quand quelqu'un clique et achète, tu perçois une commission.
      </div>

      {/* Form */}
      <div className="bg-white border border-[#F0F0F0] rounded-2xl p-5 space-y-3">
        <h2 className="text-[14px] font-bold text-[#111]">Ajouter un programme</h2>
        <div className="grid grid-cols-2 gap-3">
          <input className={inp} placeholder="Nom du programme (ex: Jumia Affiliate)" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
          <input className={inp} placeholder="Marchand / Plateforme" value={form.marchand} onChange={e => setForm(f => ({ ...f, marchand: e.target.value }))} />
          <input className={inp} placeholder="Lien d'affiliation (avec tracking)" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          <input className={inp} placeholder="Catégorie (optionnel)" value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} />
          <div className="flex gap-2">
            <input className={inp} placeholder="Commission %" type="number" value={form.commission} onChange={e => setForm(f => ({ ...f, commission: e.target.value }))} />
            <select className={inp} value={form.devise} onChange={e => setForm(f => ({ ...f, devise: e.target.value }))}>
              <option>XAF</option><option>EUR</option><option>USD</option>
            </select>
          </div>
        </div>
        <button
          onClick={save} disabled={!form.nom || !form.url || loading}
          className="px-5 py-2 rounded-xl text-white text-[13px] font-semibold disabled:opacity-40"
          style={{ background: "#F5A623" }}
        >
          {loading ? "..." : "Ajouter le programme"}
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {programmes.map(p => (
          <div key={p.id} className="bg-white border border-[#F0F0F0] rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-semibold text-[#111]">{p.nom}</p>
                  {p.categorie && <span className="text-[10px] bg-[#F0F0F0] text-[#666] px-2 py-0.5 rounded-full">{p.categorie}</span>}
                  {!p.actif && <span className="text-[10px] bg-[#F0F0F0] text-[#AAA] px-2 py-0.5 rounded-full">Inactif</span>}
                </div>
                <p className="text-[12px] text-[#888] mt-0.5">{p.marchand} · Commission : {Math.round(p.commission * 100)}%</p>
                <p className="text-[11px] text-[#3b82f6] mt-1 truncate max-w-sm">{p.url}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[13px] font-bold text-[#F5A623]">{p.revenus.toLocaleString()} {p.devise}</p>
                <p className="text-[11px] text-[#AAA]">{p.clics} clics · {p.conversions} conv.</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { navigator.clipboard.writeText(p.url); alert("Lien copié !"); }}
                className="text-[11px] border border-[#E8E8E8] px-3 py-1 rounded-lg text-[#666]"
              >
                Copier le lien
              </button>
              <button onClick={() => toggle(p)} className="text-[11px] border border-[#E8E8E8] px-3 py-1 rounded-lg text-[#666]">
                {p.actif ? "Désactiver" : "Activer"}
              </button>
              <button onClick={() => del(p.id)} className="text-[11px] border border-red-100 px-3 py-1 rounded-lg text-red-500">
                Supprimer
              </button>
            </div>
          </div>
        ))}
        {!programmes.length && (
          <div className="bg-[#FAFAFA] rounded-2xl p-8 text-center text-[13px] text-[#AAA]">
            Aucun programme d'affiliation. Ajoute-en un pour commencer à générer des revenus passifs.
          </div>
        )}
      </div>
    </div>
  );
}
