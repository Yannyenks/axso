"use client";
import { useEffect, useState } from "react";

interface Paiement {
  id: string;
  affilieurId: string;
  montant: number;
  methode: string;
  telephone: string | null;
  reference: string | null;
  statut: string;
  notes: string | null;
  createdAt: string;
}
interface CommissionDue { affilieurId: string; _sum: { montant: number }; _count: number; }

const STATUS_COLORS: Record<string, string> = {
  en_attente: "#F5A623", traite: "#22c55e", echec: "#ef4444",
};

const EMPTY = { affilieurId: "", montant: "", methode: "mobile_money", telephone: "", notes: "" };

export default function PaiementsCommissionsPage() {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [dues, setDues] = useState<CommissionDue[]>([]);
  const [stats, setStats] = useState({ totalPaye: 0, totalDu: 0, soldeRestant: 0 });
  const [form, setForm] = useState({ ...EMPTY });
  const [loading, setLoading] = useState(false);

  async function load() {
    const r = await fetch("/api/affiliation/paiements").then(r => r.json());
    setPaiements(r.paiements ?? []);
    setDues(r.commissionsDues ?? []);
    setStats(r.stats ?? { totalPaye: 0, totalDu: 0, soldeRestant: 0 });
  }
  useEffect(() => { load(); }, []);

  async function payer() {
    if (!form.affilieurId || !form.montant) return;
    setLoading(true);
    await fetch("/api/affiliation/paiements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, montant: parseFloat(form.montant) }),
    });
    setForm({ ...EMPTY });
    await load();
    setLoading(false);
  }

  async function marquerTraite(id: string, reference: string) {
    await fetch("/api/affiliation/paiements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, statut: "traite", reference }),
    });
    load();
  }

  const inp = "w-full border border-[#E8E8E8] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-[#F5A623]/60";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-[#111]">Paiements commissions</h1>
        <p className="text-[13px] text-[#888] mt-0.5">Versements aux affiliés via mobile money</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total versé", v: stats.totalPaye.toLocaleString() + " XAF", color: "#22c55e" },
          { label: "Total dû", v: stats.totalDu.toLocaleString() + " XAF", color: "#F5A623" },
          { label: "Solde restant", v: stats.soldeRestant.toLocaleString() + " XAF", color: "#ef4444" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-[#F0F0F0] rounded-2xl p-4 text-center">
            <p className="text-[20px] font-bold" style={{ color: s.color }}>{s.v}</p>
            <p className="text-[11px] text-[#AAA] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Commissions dues par affilié */}
      {dues.length > 0 && (
        <div className="bg-white border border-[#F0F0F0] rounded-2xl p-5">
          <h2 className="text-[14px] font-bold text-[#111] mb-3">Commissions dues par affilié</h2>
          <div className="space-y-2">
            {dues.map((d: CommissionDue) => (
              <div key={d.affilieurId} className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-xl">
                <div>
                  <p className="text-[13px] font-medium text-[#111]">{d.affilieurId.slice(0, 20)}...</p>
                  <p className="text-[11px] text-[#888]">{d._count} commande(s)</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-[14px] font-bold text-[#F5A623]">{(d._sum.montant ?? 0).toLocaleString()} XAF</p>
                  <button
                    onClick={() => setForm(f => ({ ...f, affilieurId: d.affilieurId, montant: String(d._sum.montant ?? 0) }))}
                    className="text-[11px] bg-[#F5A623] text-white px-3 py-1 rounded-lg"
                  >
                    Payer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulaire paiement */}
      <div className="bg-white border border-[#F0F0F0] rounded-2xl p-5 space-y-3">
        <h2 className="text-[14px] font-bold text-[#111]">Nouveau paiement</h2>
        <div className="grid grid-cols-2 gap-3">
          <input className={inp} placeholder="ID affilié" value={form.affilieurId} onChange={e => setForm(f => ({ ...f, affilieurId: e.target.value }))} />
          <input className={inp} placeholder="Montant (XAF)" type="number" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} />
          <select className={inp} value={form.methode} onChange={e => setForm(f => ({ ...f, methode: e.target.value }))}>
            <option value="mobile_money">Mobile Money</option>
            <option value="virement">Virement bancaire</option>
            <option value="wallet">Wallet Axso</option>
          </select>
          <input className={inp} placeholder="Téléphone (mobile money)" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} />
        </div>
        <input className={inp} placeholder="Notes (optionnel)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        <button
          onClick={payer} disabled={!form.affilieurId || !form.montant || loading}
          className="px-5 py-2 rounded-xl text-white text-[13px] font-semibold disabled:opacity-40"
          style={{ background: "#F5A623" }}
        >
          {loading ? "..." : "Enregistrer le paiement"}
        </button>
      </div>

      {/* Historique */}
      <div className="space-y-2">
        <h2 className="text-[14px] font-bold text-[#111]">Historique</h2>
        {paiements.map(p => (
          <div key={p.id} className="bg-white border border-[#F0F0F0] rounded-2xl p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-semibold text-[#111]">{p.montant.toLocaleString()} XAF</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white" style={{ background: STATUS_COLORS[p.statut] ?? "#888" }}>
                  {p.statut.replace("_", " ")}
                </span>
              </div>
              <p className="text-[11px] text-[#888] mt-0.5">
                {p.methode} · {p.telephone ?? "—"} · {new Date(p.createdAt).toLocaleDateString("fr")}
              </p>
              {p.reference && <p className="text-[11px] text-[#AAA]">Réf: {p.reference}</p>}
            </div>
            {p.statut === "en_attente" && (
              <button
                onClick={() => {
                  const ref = prompt("Référence de paiement (optionnel) :");
                  marquerTraite(p.id, ref ?? "");
                }}
                className="text-[11px] bg-[#22c55e] text-white px-3 py-1 rounded-lg"
              >
                Marquer traité
              </button>
            )}
          </div>
        ))}
        {!paiements.length && (
          <div className="bg-[#FAFAFA] rounded-2xl p-6 text-center text-[13px] text-[#AAA]">Aucun paiement enregistré.</div>
        )}
      </div>
    </div>
  );
}
