"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Wallet, ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle2,
  XCircle, TrendingUp, ShieldCheck, Loader2, Copy, RefreshCw,
  Smartphone, Building2, ChevronRight, AlertCircle, Info
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Transaction {
  id: string; type: string; montant: number; devise: string;
  description: string; reference?: string; statut: string; createdAt: string;
}
interface RetraitItem {
  id: string; montant: number; devise: string; methode: string;
  destinataire: string; operateur?: string; statut: string;
  reference?: string; createdAt: string;
}
interface WalletData {
  solde: number; totalRecu: number; totalRetire: number;
  totalCommission: number; soldeSequestre: number;
  retraitsEnAttente: number; devise: string;
  transactions: Transaction[]; retraits: RetraitItem[];
}

const OPERATEURS = [
  { id: "MTN",    label: "MTN Mobile Money",   pays: ["CM","GH","CI","UG","RW","BJ","GN"] },
  { id: "Orange", label: "Orange Money",        pays: ["CM","SN","CI","ML","BF","GN"] },
  { id: "Wave",   label: "Wave",                pays: ["SN","CI","ML","BF"] },
  { id: "Moov",   label: "Moov Money",          pays: ["CI","BJ","TG","BF"] },
  { id: "Mpesa",  label: "M-Pesa",              pays: ["KE","TZ","GH"] },
  { id: "Airtel", label: "Airtel Money",        pays: ["UG","TZ","RW","ZM"] },
  { id: "Free",   label: "Free Money",          pays: ["SN"] },
];

function fmt(n: number, devise = "XAF") {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: devise, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    completed:   { label: "Complété",   color: "#34d399", bg: "rgba(52,211,153,0.12)",  icon: CheckCircle2 },
    complete:    { label: "Complété",   color: "#34d399", bg: "rgba(52,211,153,0.12)",  icon: CheckCircle2 },
    en_attente:  { label: "En attente", color: "#fb923c", bg: "rgba(251,146,60,0.12)",  icon: Clock },
    traitement:  { label: "En cours",   color: "#F5A623", bg: "rgba(245,166,35,0.12)", icon: Loader2 },
    en_cours:    { label: "En cours",   color: "#F5A623", bg: "rgba(245,166,35,0.12)", icon: Loader2 },
    echoue:      { label: "Échoué",     color: "#f87171", bg: "rgba(248,113,113,0.12)", icon: XCircle },
  };
  const s = map[statut] ?? map["en_attente"];
  const Icon = s.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: s.color, background: s.bg }}>
      <Icon size={10}/>{s.label}
    </span>
  );
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRetrait, setShowRetrait] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<"transactions" | "retraits">("transactions");

  const [form, setForm] = useState({
    montant: "",
    methode: "mobile_money" as "mobile_money" | "virement_bancaire",
    destinataire: "",
    operateur: "MTN",
    notes: "",
  });

  async function charger() {
    setLoading(true);
    try {
      const res = await fetch("/api/wallet");
      const data = await res.json();
      setWallet(data.wallet);
    } catch { toast.error("Erreur chargement wallet"); }
    finally { setLoading(false); }
  }

  useEffect(() => { charger(); }, []);

  async function soumettrRetrait(e: React.FormEvent) {
    e.preventDefault();
    if (!form.montant || Number(form.montant) <= 0) { toast.error("Montant invalide"); return; }
    if (!form.destinataire.trim()) { toast.error("Numéro / IBAN requis"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/wallet/retrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, montant: Number(form.montant) }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Erreur retrait"); return; }
      toast.success("Retrait initié ! Traitement sous 24–48h.");
      setShowRetrait(false);
      setForm({ montant: "", methode: "mobile_money", destinataire: "", operateur: "MTN", notes: "" });
      charger();
    } finally { setSubmitting(false); }
  }

  const devise = wallet?.devise ?? "XAF";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet size={24} className="text-[#F5A623]"/>
            Wallet Axso
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Votre compte de paiement sécurisé</p>
        </div>
        <button onClick={charger} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
          <RefreshCw size={14}/> Actualiser
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={32} className="animate-spin text-[#F5A623]"/>
        </div>
      ) : (
        <>
          {/* ── Carte Wallet ── */}
          <div className="relative rounded-3xl overflow-hidden p-8 text-white" style={{
            background: "linear-gradient(135deg, #2c1503 0%, #F5A623 55%, #d4820a 100%)",
            boxShadow: "0 20px 60px rgba(245,166,35,0.35)",
          }}>
            {/* Décorations */}
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10"
              style={{ background: "radial-gradient(circle, white, transparent 70%)", transform: "translate(30%,-30%)" }}/>
            <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full opacity-8"
              style={{ background: "radial-gradient(circle, rgba(245,166,35,0.4), transparent 70%)", transform: "translate(-30%,30%)" }}/>

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-4 opacity-70">
                  <ShieldCheck size={14}/>
                  <span className="text-xs font-semibold tracking-widest uppercase">Wallet Axso · Sécurisé</span>
                </div>
                <p className="text-sm opacity-70 mb-1">Solde disponible</p>
                <p className="text-5xl font-black tracking-tight">
                  {fmt(wallet?.solde ?? 0, devise)}
                </p>
                {(wallet?.soldeSequestre ?? 0) > 0 && (
                  <div className="mt-3 flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 w-fit">
                    <Clock size={13} className="opacity-70"/>
                    <p className="text-xs opacity-80">
                      <strong>{fmt(wallet!.soldeSequestre, devise)}</strong> en séquestre (libération 48h)
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:items-end gap-3">
                <button
                  onClick={() => setShowRetrait(true)}
                  disabled={(wallet?.solde ?? 0) <= 0}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-[#F5A623] font-bold rounded-2xl text-sm hover:bg-amber-50 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ArrowUpFromLine size={16}/>
                  Retirer les fonds
                </button>
                <p className="text-xs opacity-50 text-right">Minimum 1 000 {devise}</p>
              </div>
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: TrendingUp,       label: "Total reçu",         val: wallet?.totalRecu ?? 0,       color: "#34d399", bg: "#f0fdf4" },
              { icon: ArrowUpFromLine,  label: "Total retiré",        val: wallet?.totalRetire ?? 0,     color: "#F5A623", bg: "#fff8eb" },
              { icon: ShieldCheck,      label: "Commissions Axso",    val: wallet?.totalCommission ?? 0, color: "#a78bfa", bg: "#f5f3ff" },
              { icon: Clock,            label: "En séquestre",        val: wallet?.soldeSequestre ?? 0,  color: "#fb923c", bg: "#fff7ed" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}>
                    <Icon size={16} style={{ color: s.color }}/>
                  </div>
                  <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                  <p className="text-lg font-bold text-gray-900">{fmt(s.val, devise)}</p>
                </div>
              );
            })}
          </div>

          {/* ── Bandeau info escrow ── */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <Info size={16} className="text-[#F5A623] mt-0.5 flex-shrink-0"/>
            <div className="text-sm text-blue-800">
              <strong>Comment fonctionne le Wallet Axso ?</strong><br/>
              Chaque paiement client est d'abord placé en <strong>séquestre 48h</strong> (protection acheteur).
              Après confirmation de livraison ou expiration du délai, les fonds sont crédités sur votre wallet — déduction faite de la commission Axso (3%).
              Vous pouvez ensuite retirer vers Mobile Money ou compte bancaire.
            </div>
          </div>

          {/* ── Onglets transactions / retraits ── */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100">
              {(["transactions", "retraits"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-4 text-sm font-semibold transition-colors ${tab === t ? "text-[#F5A623] border-b-2 border-[#F5A623]" : "text-gray-400 hover:text-gray-600"}`}>
                  {t === "transactions" ? "Historique des transactions" : "Historique des retraits"}
                </button>
              ))}
            </div>

            {tab === "transactions" ? (
              <div className="divide-y divide-gray-50">
                {(wallet?.transactions ?? []).length === 0 ? (
                  <div className="py-16 text-center text-gray-400">
                    <Wallet size={32} className="mx-auto mb-3 opacity-30"/>
                    <p>Aucune transaction pour le moment</p>
                    <p className="text-xs mt-1">Les mouvements apparaîtront ici après vos premières ventes</p>
                  </div>
                ) : (wallet?.transactions ?? []).map((tx) => (
                  <div key={tx.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      tx.type === "CREDIT" ? "bg-green-100" : tx.type === "COMMISSION" ? "bg-violet-100" : "bg-blue-100"
                    }`}>
                      {tx.type === "CREDIT"     && <ArrowDownToLine size={16} className="text-green-600"/>}
                      {tx.type === "COMMISSION" && <ShieldCheck size={16} className="text-violet-600"/>}
                      {tx.type === "RETRAIT"    && <ArrowUpFromLine size={16} className="text-blue-600"/>}
                      {tx.type === "REMBOURSEMENT" && <RefreshCw size={16} className="text-orange-600"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{tx.description}</p>
                      {tx.reference && <p className="text-xs text-gray-400">{tx.reference}</p>}
                      <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-base font-bold ${tx.montant >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {tx.montant >= 0 ? "+" : ""}{fmt(tx.montant, tx.devise)}
                      </p>
                      <StatutBadge statut={tx.statut}/>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {(wallet?.retraits ?? []).length === 0 ? (
                  <div className="py-16 text-center text-gray-400">
                    <ArrowUpFromLine size={32} className="mx-auto mb-3 opacity-30"/>
                    <p>Aucun retrait effectué</p>
                  </div>
                ) : (wallet?.retraits ?? []).map((r) => (
                  <div key={r.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${r.methode === "mobile_money" ? "bg-orange-100" : "bg-blue-100"}`}>
                      {r.methode === "mobile_money" ? <Smartphone size={16} className="text-orange-600"/> : <Building2 size={16} className="text-blue-600"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">
                        {r.methode === "mobile_money" ? `Mobile Money · ${r.operateur ?? ""}` : "Virement bancaire"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{r.destinataire}</p>
                      <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-gray-800">-{fmt(r.montant, r.devise)}</p>
                      <StatutBadge statut={r.statut}/>
                      {r.reference && (
                        <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{r.reference}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Modal Retrait ── */}
      {showRetrait && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowRetrait(false); }}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" style={{ maxHeight: "90vh", overflowY: "auto" }}>

            {/* Header modal */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Retirer des fonds</h2>
                <p className="text-sm text-gray-500">Solde disponible : <strong className="text-[#F5A623]">{fmt(wallet?.solde ?? 0, devise)}</strong></p>
              </div>
              <button onClick={() => setShowRetrait(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">✕</button>
            </div>

            <form onSubmit={soumettrRetrait} className="p-6 space-y-5">

              {/* Montant */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Montant à retirer</label>
                <div className="relative">
                  <input
                    type="number"
                    value={form.montant}
                    onChange={e => setForm(f => ({ ...f, montant: e.target.value }))}
                    placeholder="Ex: 50 000"
                    min="1000"
                    max={wallet?.solde ?? 0}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-lg font-bold focus:outline-none focus:border-[#F5A623]/50 pr-16"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">{devise}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {[25, 50, 75, 100].map(pct => (
                    <button key={pct} type="button"
                      onClick={() => setForm(f => ({ ...f, montant: String(Math.floor((wallet?.solde ?? 0) * pct / 100)) }))}
                      className="flex-1 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-500 hover:border-[#F5A623]/40 hover:text-[#F5A623] transition-all">
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Méthode */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Méthode de retrait</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "mobile_money",     label: "Mobile Money",   icon: Smartphone, desc: "MTN, Orange, Wave…" },
                    { id: "virement_bancaire", label: "Virement",       icon: Building2,  desc: "IBAN / Compte" },
                  ].map(m => {
                    const Icon = m.icon;
                    return (
                      <button key={m.id} type="button"
                        onClick={() => setForm(f => ({ ...f, methode: m.id as any }))}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${form.methode === m.id ? "border-[#F5A623] bg-[#F5A623]/5" : "border-gray-100 hover:border-gray-200"}`}>
                        <Icon size={22} className={form.methode === m.id ? "text-[#F5A623]" : "text-gray-400"}/>
                        <span className={`text-sm font-bold ${form.methode === m.id ? "text-[#F5A623]" : "text-gray-600"}`}>{m.label}</span>
                        <span className="text-xs text-gray-400">{m.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Money — opérateur */}
              {form.methode === "mobile_money" && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Opérateur</label>
                  <div className="grid grid-cols-3 gap-2">
                    {OPERATEURS.map(op => (
                      <button key={op.id} type="button"
                        onClick={() => setForm(f => ({ ...f, operateur: op.id }))}
                        className={`py-2.5 px-2 text-xs font-bold rounded-xl border transition-all ${form.operateur === op.id ? "border-[#F5A623] bg-[#F5A623]/8 text-[#F5A623]" : "border-gray-100 text-gray-500 hover:border-gray-200"}`}>
                        {op.id}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Numéro / IBAN */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  {form.methode === "mobile_money" ? "Numéro Mobile Money" : "IBAN ou numéro de compte"}
                </label>
                <input
                  type="text"
                  value={form.destinataire}
                  onChange={e => setForm(f => ({ ...f, destinataire: e.target.value }))}
                  placeholder={form.methode === "mobile_money" ? "+237 6XX XXX XXX" : "FR76 XXXX XXXX XXXX"}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Note (optionnel)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Ex: Virement mensuel…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-[#F5A623]/50"
                />
              </div>

              {/* Récap commission */}
              {form.montant && Number(form.montant) > 0 && (
                <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Montant demandé</span>
                    <span className="font-semibold text-gray-800">{fmt(Number(form.montant), devise)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Frais de virement</span>
                    <span className="font-semibold text-gray-500">Inclus</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold">
                    <span className="text-gray-900">Vous recevrez</span>
                    <span className="text-[#F5A623]">{fmt(Number(form.montant), devise)}</span>
                  </div>
                </div>
              )}

              {/* Avertissement */}
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                <AlertCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0"/>
                <p className="text-xs text-amber-700">Traitement sous 24–48h ouvrées. Les fonds sont débités immédiatement de votre wallet.</p>
              </div>

              <button type="submit" disabled={submitting || !form.montant || Number(form.montant) <= 0}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white text-sm transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #F5A623, #d4820a)", boxShadow: "0 4px 20px rgba(245,166,35,0.3)" }}>
                {submitting ? <><Loader2 size={16} className="animate-spin"/>Traitement…</> : <><ArrowUpFromLine size={16}/>Confirmer le retrait</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
