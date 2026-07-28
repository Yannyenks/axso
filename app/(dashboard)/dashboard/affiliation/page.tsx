"use client";
import { useState, useEffect } from "react";
import {
  Link2, TrendingUp, Users, DollarSign, Copy, CheckCheck,
  Zap, Share2, Eye, ShoppingBag, Plus, ExternalLink,
} from "lucide-react";

interface Lien {
  id: string;
  code: string;
  clics: number;
  conversions: number;
  montantGenere: number;
  actif: boolean;
  produit?: { nom: string; prix: number; images: string[]; tauxCommissionAff: number | null };
  tenant: { nomBoutique: string; slug: string };
  commissions: { montantGagne: number; statut: string }[];
}

interface Commission {
  id: string;
  montantGagne: number;
  taux: number;
  devise: string;
  statut: string;
  createdAt: string;
  lien: {
    code: string;
    produit?: { nom: string; images: string[] };
    tenant: { nomBoutique: string };
  };
  commande: { numero: string; montantTotal: number };
}

interface Totaux { total: number; pending: number; captured: number }

function copier(texte: string, setCopied: (v: boolean) => void) {
  navigator.clipboard.writeText(texte);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="ax-card p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon size={18} />
      </div>
      <p className="text-[20px] font-bold text-[#111111] tabular-nums" style={{ fontVariantNumeric: "tabular-nums" }}>{value}</p>
      <p className="text-[12px] text-[#AAAAAA] mt-0.5">{label}</p>
    </div>
  );
}

export default function AffiliationPage() {
  const [liens, setLiens] = useState<Lien[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [totaux, setTotaux] = useState<Totaux>({ total: 0, pending: 0, captured: 0 });
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  useEffect(() => {
    Promise.all([
      fetch("/api/affiliation/liens").then((r) => r.json()),
      fetch("/api/affiliation/commissions?role=affilieur").then((r) => r.json()),
    ]).then(([liensData, comData]) => {
      setLiens(liensData.liens ?? []);
      setCommissions(comData.commissions ?? []);
      setTotaux(comData.totaux ?? { total: 0, pending: 0, captured: 0 });
      setLoading(false);
    });
  }, []);

  const totalClics = liens.reduce((a, l) => a + l.clics, 0);
  const totalConversions = liens.reduce((a, l) => a + l.conversions, 0);

  const getLienUrl = (lien: Lien) =>
    `${appUrl}/${lien.tenant.slug}${lien.produit ? `/produits/${lien.produit.nom}` : ""}?ref=${lien.code}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-[#AAAAAA]">
        Chargement...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-[#111111] tracking-tight">Affiliation</h1>
          <p className="text-[12.5px] text-[#AAAAAA] mt-0.5">
            Partagez des produits, gagnez des commissions automatiquement
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total gagné" value={`${totaux.total.toLocaleString()} FCFA`} color="bg-green-100 text-green-600" />
        <StatCard icon={Zap} label="En attente" value={`${totaux.pending.toLocaleString()} FCFA`} color="bg-amber-100 text-amber-600" />
        <StatCard icon={Eye} label="Clics totaux" value={totalClics.toLocaleString()} color="bg-blue-100 text-blue-600" />
        <StatCard icon={ShoppingBag} label="Conversions" value={totalConversions.toLocaleString()} color="bg-purple-100 text-purple-600" />
      </div>

      {/* Mes liens */}
      <div>
        <h2 className="text-[13px] font-semibold text-[#111111] mb-4 flex items-center gap-2">
          <Link2 size={15} className="text-[#AAAAAA]" /> Mes liens d'affiliation
        </h2>

        {liens.length === 0 ? (
          <div className="bg-[#F9F9F9] border border-dashed border-[#E8E8E8] rounded-[20px] p-8 text-center">
            <Share2 size={32} className="text-[#CCCCCC] mx-auto mb-3" />
            <p className="text-[13px] font-semibold text-[#111111]">Aucun lien encore</p>
            <p className="text-[12px] text-[#AAAAAA] mt-1">
              Allez sur la page d'un produit digital et cliquez "Obtenir mon lien d'affiliation"
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {liens.map((lien) => {
              const url = getLienUrl(lien);
              const taux = lien.produit?.tauxCommissionAff
                ? `${Math.round(lien.produit.tauxCommissionAff * 100)}%`
                : "—";
              const isCopied = copiedId === lien.id;

              return (
                <div key={lien.id} className="ax-card p-4">
                  <div className="flex items-start gap-3">
                    {lien.produit?.images?.[0] && (
                      <img
                        src={lien.produit.images[0]}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-semibold text-[#111111]">
                          {lien.produit?.nom ?? lien.tenant.nomBoutique}
                        </p>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                          {taux} commission
                        </span>
                      </div>
                      <p className="text-[11.5px] text-[#AAAAAA] mt-0.5">{lien.tenant.nomBoutique} · Code: <span className="font-mono font-bold text-[#F5A623]">{lien.code}</span></p>

                      {/* URL */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-[#F9F9F9] border border-[#E8E8E8] rounded-lg px-3 py-1.5 text-[11.5px] text-[#AAAAAA] font-mono truncate">
                          {url}
                        </div>
                        <button
                          onClick={() => { copier(url, (v) => { if (v) setCopiedId(lien.id); }); }}
                          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isCopied
                              ? "bg-[#F0FDF4] text-[#16A34A]"
                              : "bg-[#111111] text-white hover:bg-[#222222]"
                          }`}
                        >
                          {isCopied ? <><CheckCheck size={12} /> Copié</> : <><Copy size={12} /> Copier</>}
                        </button>
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          className="flex-shrink-0 p-1.5 text-[#CCCCCC] hover:text-[#F5A623] transition-colors">
                          <ExternalLink size={14} />
                        </a>
                      </div>

                      {/* Métriques */}
                      <div className="mt-2 flex items-center gap-4 text-[11.5px] text-[#AAAAAA]">
                        <span className="flex items-center gap-1"><Eye size={11} /> {lien.clics} clics</span>
                        <span className="flex items-center gap-1"><ShoppingBag size={11} /> {lien.conversions} ventes</span>
                        <span className="flex items-center gap-1 text-[#16A34A] font-semibold">
                          <DollarSign size={11} /> {lien.montantGenere.toLocaleString()} gagné
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historique commissions */}
      {commissions.length > 0 && (
        <div>
          <h2 className="text-[13px] font-semibold text-[#111111] mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-[#AAAAAA]" /> Historique des commissions
          </h2>
          <div className="ax-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#F9F9F9] border-b border-[#F3F3F3]">
                <tr>
                  <th className="text-left px-4 py-3 ax-label">Produit</th>
                  <th className="text-left px-4 py-3 ax-label">Commande</th>
                  <th className="text-right px-4 py-3 ax-label">Taux</th>
                  <th className="text-right px-4 py-3 ax-label">Gagné</th>
                  <th className="text-right px-4 py-3 ax-label">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F9F9F9]">
                {commissions.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-[#222]">{c.lien.produit?.nom ?? c.lien.tenant.nomBoutique}</p>
                      <p className="text-[11.5px] text-[#AAAAAA]">{c.lien.tenant.nomBoutique}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-[#F5A623] font-bold">#{c.commande.numero}</td>
                    <td className="px-4 py-3 text-right text-[13px] text-[#666]">{Math.round(c.taux * 100)}%</td>
                    <td className="px-4 py-3 text-right font-bold text-[#16A34A]">
                      +{c.montantGagne.toLocaleString()} {c.devise}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${
                        c.statut === "capturee" || c.statut === "payee"
                          ? "bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]"
                          : "bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]"
                      }`}>
                        {c.statut === "capturee" ? "Confirmée" : c.statut === "payee" ? "Payée" : "En attente"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
