"use client";
import { useEffect, useState } from "react";

interface CF {
  id: string;
  commandeId: string;
  fournisseurId: string;
  statut: string;
  reference: string | null;
  montantFournisseur: number | null;
  delaiEstime: number | null;
  trackingNo: string | null;
  notes: string | null;
  envoiAuto: boolean;
  createdAt: string;
  commande: { numero: string; clientNom: string; clientEmail: string; montantTotal: number; devise: string; createdAt: string };
  fournisseur: { nom: string; pays: string; type: string };
}

const STATUTS = ["en_attente","envoye","confirme","expedie","livre","annule"];
const STATUT_COLORS: Record<string, string> = {
  en_attente: "#F5A623", envoye: "#3b82f6", confirme: "#8b5cf6", expedie: "#f59e0b", livre: "#22c55e", annule: "#ef4444",
};

export default function CommandesFournisseurPage() {
  const [commandes, setCommandes] = useState<CF[]>([]);
  const [stats, setStats] = useState({ total: 0, en_attente: 0, expedie: 0, livre: 0 });
  const [filterStatut, setFilterStatut] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tracking, setTracking] = useState<Record<string, string>>({});
  const [ref, setRef] = useState<Record<string, string>>({});

  async function load() {
    const url = filterStatut ? `/api/dropshipping/commandes-fournisseur?statut=${filterStatut}` : "/api/dropshipping/commandes-fournisseur";
    const r = await fetch(url).then(r => r.json());
    setCommandes(r.commandes ?? []);
    setStats(r.stats ?? {});
  }
  useEffect(() => { load(); }, [filterStatut]);

  async function updateStatut(id: string, statut: string, cf: CF) {
    await fetch("/api/dropshipping/commandes-fournisseur", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, statut, trackingNo: tracking[id] ?? cf.trackingNo, reference: ref[id] ?? cf.reference }),
    });
    load();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-[#111]">Commandes fournisseurs</h1>
        <p className="text-[13px] text-[#888] mt-0.5">Suivi du routing automatique vers vos fournisseurs dropshipping</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", v: stats.total },
          { label: "En attente", v: stats.en_attente, color: "#F5A623" },
          { label: "Expédiées", v: stats.expedie, color: "#f59e0b" },
          { label: "Livrées", v: stats.livre, color: "#22c55e" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-[#F0F0F0] rounded-2xl p-4 text-center">
            <p className="text-[22px] font-bold" style={{ color: s.color ?? "#111" }}>{s.v}</p>
            <p className="text-[11px] text-[#AAA] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterStatut("")} className={`text-[12px] px-3 py-1.5 rounded-xl border transition-all ${!filterStatut ? "bg-[#111] text-white border-[#111]" : "border-[#E8E8E8] text-[#666]"}`}>Tous</button>
        {STATUTS.map(s => (
          <button key={s} onClick={() => setFilterStatut(s)} className={`text-[12px] px-3 py-1.5 rounded-xl border transition-all ${filterStatut === s ? "text-white border-transparent" : "border-[#E8E8E8] text-[#666]"}`}
            style={filterStatut === s ? { background: STATUT_COLORS[s] } : {}}>
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {commandes.map(cf => (
          <div key={cf.id} className="bg-white border border-[#F0F0F0] rounded-2xl overflow-hidden">
            <div
              className="p-4 flex items-center gap-3 cursor-pointer hover:bg-[#FAFAFA] transition-colors"
              onClick={() => setExpanded(expanded === cf.id ? null : cf.id)}
            >
              <span className="text-[10px] px-2 py-0.5 rounded-full text-white font-bold" style={{ background: STATUT_COLORS[cf.statut] ?? "#888" }}>
                {cf.statut.replace("_", " ")}
              </span>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-[#111]">Cmd {cf.commande.numero} → {cf.fournisseur.nom}</p>
                <p className="text-[11px] text-[#888]">{cf.commande.clientNom} · {cf.montantFournisseur?.toLocaleString()} {cf.commande.devise} fournisseur</p>
              </div>
              <p className="text-[11px] text-[#AAA]">{new Date(cf.createdAt).toLocaleDateString("fr")}</p>
            </div>

            {expanded === cf.id && (
              <div className="border-t border-[#F0F0F0] p-4 space-y-3 bg-[#FAFAFA]">
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div><span className="text-[#AAA]">Client :</span> {cf.commande.clientNom} ({cf.commande.clientEmail})</div>
                  <div><span className="text-[#AAA]">Fournisseur :</span> {cf.fournisseur.nom} ({cf.fournisseur.pays})</div>
                  <div><span className="text-[#AAA]">Délai estimé :</span> {cf.delaiEstime ?? "—"} jours</div>
                  <div><span className="text-[#AAA]">Tracking :</span> {cf.trackingNo ?? "—"}</div>
                  {cf.reference && <div><span className="text-[#AAA]">Réf fournisseur :</span> {cf.reference}</div>}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <input
                    className="border border-[#E8E8E8] rounded-xl px-3 py-1.5 text-[12px] outline-none"
                    placeholder="N° tracking"
                    value={tracking[cf.id] ?? cf.trackingNo ?? ""}
                    onChange={e => setTracking(t => ({ ...t, [cf.id]: e.target.value }))}
                  />
                  <input
                    className="border border-[#E8E8E8] rounded-xl px-3 py-1.5 text-[12px] outline-none"
                    placeholder="Réf fournisseur"
                    value={ref[cf.id] ?? cf.reference ?? ""}
                    onChange={e => setRef(r => ({ ...r, [cf.id]: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {STATUTS.filter(s => s !== cf.statut).map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatut(cf.id, s, cf)}
                      className="text-[11px] px-3 py-1 rounded-xl text-white font-medium"
                      style={{ background: STATUT_COLORS[s] }}
                    >
                      → {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {!commandes.length && (
          <div className="bg-[#FAFAFA] rounded-2xl p-8 text-center text-[13px] text-[#AAA]">
            Aucune commande fournisseur. Les commandes des produits dropshipping apparaîtront ici.
          </div>
        )}
      </div>
    </div>
  );
}
