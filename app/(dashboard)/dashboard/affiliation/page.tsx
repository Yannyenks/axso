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
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
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
      <div className="flex items-center justify-center h-48 text-gray-400">
        Chargement...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Share2 size={22} className="text-[#1B4FD8]" /> Affiliation
          </h1>
          <p className="text-gray-500 text-sm mt-1">
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
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Link2 size={18} /> Mes liens d'affiliation
        </h2>

        {liens.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-8 text-center">
            <Share2 size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucun lien encore</p>
            <p className="text-gray-400 text-sm mt-1">
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
                <div key={lien.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
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
                        <p className="font-semibold text-gray-900 text-sm">
                          {lien.produit?.nom ?? lien.tenant.nomBoutique}
                        </p>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                          {taux} commission
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{lien.tenant.nomBoutique} · Code: <span className="font-mono font-bold text-[#1B4FD8]">{lien.code}</span></p>

                      {/* URL */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-500 font-mono truncate">
                          {url}
                        </div>
                        <button
                          onClick={() => { copier(url, (v) => { if (v) setCopiedId(lien.id); }); }}
                          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isCopied
                              ? "bg-green-100 text-green-700"
                              : "bg-[#1B4FD8] text-white hover:bg-[#1440BE]"
                          }`}
                        >
                          {isCopied ? <><CheckCheck size={12} /> Copié</> : <><Copy size={12} /> Copier</>}
                        </button>
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          className="flex-shrink-0 p-1.5 text-gray-400 hover:text-[#1B4FD8] transition-colors">
                          <ExternalLink size={14} />
                        </a>
                      </div>

                      {/* Métriques */}
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Eye size={11} /> {lien.clics} clics</span>
                        <span className="flex items-center gap-1"><ShoppingBag size={11} /> {lien.conversions} ventes</span>
                        <span className="flex items-center gap-1 text-green-600 font-semibold">
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
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={18} /> Historique des commissions
          </h2>
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Produit</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Commande</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Taux</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Gagné</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {commissions.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{c.lien.produit?.nom ?? c.lien.tenant.nomBoutique}</p>
                      <p className="text-xs text-gray-400">{c.lien.tenant.nomBoutique}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">#{c.commande.numero}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{Math.round(c.taux * 100)}%</td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      +{c.montantGagne.toLocaleString()} {c.devise}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        c.statut === "capturee" || c.statut === "payee"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
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
