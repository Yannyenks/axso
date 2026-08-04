"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Users, TrendingUp, DollarSign, Link2, Copy, CheckCheck, Zap,
  Share2, Eye, ShoppingBag, Plus, Globe, Settings, BarChart3,
  ChevronRight, AlertCircle, CheckCircle, XCircle, Clock,
  ArrowUpRight, Wallet, Send, Filter, Search, RefreshCw,
  Award, Target, Percent, Edit3, Trash2, UserCheck, UserX,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Programme {
  id: string; nom: string; description?: string;
  typeCommission: string; valeurCommission: number;
  dureeCookie: number; seuilPaiement: number;
  tousLesProduits: boolean; tiersActifs: boolean;
  actif: boolean; _count?: { affilies: number };
}
interface Affilie {
  id: string; nom: string; email: string; telephone?: string;
  codeParrainage: string; statut: string;
  clics: number; conversions: number;
  commissionTotal: number; commissionPending: number;
  createdAt: string;
  programme?: { nom: string; valeurCommission: number; typeCommission: string };
}
interface Stats {
  totalAffilies: number; affiliesActifs: number;
  commissionsPaid: number; commissionsPending: number;
  gmvAffilies: number; clics: number; conversions: number;
  tauxConversion: number;
  funnel: { clics: number; conversions: number; paiements: number };
}

const TABS = [
  { id: "stats",     label: "Vue d'ensemble", Icon: BarChart3 },
  { id: "programme", label: "Mon programme",  Icon: Settings  },
  { id: "affilies",  label: "Affiliés",       Icon: Users     },
  { id: "paiements", label: "Paiements",      Icon: Wallet    },
  { id: "liens",     label: "Mes liens",      Icon: Link2     },
];

function copier(texte: string, cb: (v: boolean) => void) {
  navigator.clipboard.writeText(texte).catch(() => {});
  cb(true); setTimeout(() => cb(false), 2000);
}

function StatCard({ label, value, sub, color = "#F5A623", Icon: Ic }: {
  label: string; value: string; sub?: string; color?: string; Icon: any;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
          <Ic size={16} style={{ color }} />
        </div>
      </div>
      <p className="text-[22px] font-bold text-[#111] leading-none">{value}</p>
      <p className="text-[11px] text-gray-400 mt-1">{label}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color }}>{sub}</p>}
    </div>
  );
}

function Badge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    actif:       { label: "Actif",       cls: "bg-green-100 text-green-700" },
    en_attente:  { label: "En attente",  cls: "bg-amber-100 text-amber-700" },
    suspendu:    { label: "Suspendu",    cls: "bg-red-100 text-red-600"     },
    pending:     { label: "En attente",  cls: "bg-amber-100 text-amber-700" },
    approuvee:   { label: "Approuvée",   cls: "bg-blue-100 text-blue-700"   },
    payee:       { label: "Payée",       cls: "bg-green-100 text-green-700" },
    rejetee:     { label: "Rejetée",     cls: "bg-red-100 text-red-600"     },
  };
  const m = map[statut] ?? { label: statut, cls: "bg-gray-100 text-gray-500" };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.cls}`}>{m.label}</span>;
}

// ─── Vue d'ensemble ───────────────────────────────────────────────────────────
function OngletStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [top, setTop] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/affiliation/stats")
      .then(r => r.json())
      .then(d => { setStats(d.stats ?? null); setTop(d.topAffilies ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-12 text-center text-sm text-gray-400">Chargement…</div>;
  if (!stats) return null;

  const conv = stats.clics > 0 ? ((stats.conversions / stats.clics) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Affiliés actifs"      value={String(stats.affiliesActifs)}                         Icon={Users}       color="#7c3aed" sub={`/ ${stats.totalAffilies} total`} />
        <StatCard label="Commissions versées"  value={`${stats.commissionsPaid.toLocaleString()} XAF`}      Icon={DollarSign}  color="#10b981" />
        <StatCard label="En attente de paiement" value={`${stats.commissionsPending.toLocaleString()} XAF`} Icon={Clock}       color="#F5A623" />
        <StatCard label="GMV généré"           value={`${stats.gmvAffilies.toLocaleString()} XAF`}          Icon={TrendingUp}  color="#0ea5e9" sub="via affiliés" />
      </div>

      {/* Funnel */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <p className="text-[12px] font-bold text-[#111] mb-4">Funnel de conversion</p>
        <div className="flex items-end gap-2">
          {[
            { label: "Clics", value: stats.funnel.clics,      color: "#0ea5e9" },
            { label: "Ventes", value: stats.funnel.conversions, color: "#7c3aed" },
            { label: "Payés",  value: stats.funnel.paiements,   color: "#10b981" },
          ].map((f, i) => {
            const max = Math.max(stats.funnel.clics, 1);
            const pct = Math.round((f.value / max) * 100);
            return (
              <div key={i} className="flex-1 text-center">
                <div className="flex flex-col items-center justify-end h-24 mb-2">
                  <div className="w-full rounded-t-xl transition-all" style={{ height: `${Math.max(pct, 8)}%`, background: f.color }} />
                </div>
                <p className="text-[18px] font-bold text-[#111]">{f.value.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400">{f.label}</p>
                {i > 0 && <p className="text-[10px] text-gray-300">{pct}%</p>}
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-gray-400 mt-3 text-center">Taux de conversion global : <strong className="text-[#F5A623]">{conv}%</strong></p>
      </div>

      {/* Top affiliés */}
      {top.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-[12px] font-bold text-[#111] mb-4">Top affiliés</p>
          <div className="space-y-2">
            {top.map((a, i) => (
              <div key={a.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-[11px] font-bold text-gray-300 w-4">{i + 1}</span>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: ["#F5A623","#7c3aed","#0ea5e9","#10b981","#ef4444"][i] }}>
                  {a.nom.slice(0,1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[#111] truncate">{a.nom}</p>
                  <p className="text-[10px] text-gray-400">{a.clics} clics · {a.conversions} ventes</p>
                </div>
                <p className="text-[13px] font-bold text-[#F5A623]">{(a.commissionTotal ?? 0).toLocaleString()} XAF</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mon programme ────────────────────────────────────────────────────────────
function OngletProgramme() {
  const [prog, setProg] = useState<Programme | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nom: "", description: "", typeCommission: "pourcentage",
    valeurCommission: 10, dureeCookie: 30, seuilPaiement: 5000,
    tousLesProduits: true, tiersActifs: false, actif: true,
  });

  const charger = useCallback(() => {
    fetch("/api/affiliation/programmes")
      .then(r => r.json())
      .then(d => {
        const p = d.programmes?.[0] ?? null;
        setProg(p);
        if (p) setForm({ nom: p.nom, description: p.description ?? "", typeCommission: p.typeCommission, valeurCommission: p.valeurCommission, dureeCookie: p.dureeCookie, seuilPaiement: p.seuilPaiement, tousLesProduits: p.tousLesProduits, tiersActifs: p.tiersActifs, actif: p.actif });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { charger(); }, [charger]);

  async function sauver() {
    setSaving(true);
    const method = prog ? "PATCH" : "POST";
    const body = prog ? { id: prog.id, ...form } : form;
    await fetch("/api/affiliation/programmes", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    await charger(); setEditing(false); setSaving(false);
  }

  if (loading) return <div className="py-12 text-center text-sm text-gray-400">Chargement…</div>;

  if (!prog && !editing) {
    return (
      <div className="py-10 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#F5A623]/10 flex items-center justify-center mx-auto">
          <Target size={28} className="text-[#F5A623]" />
        </div>
        <p className="text-[14px] font-bold text-[#111]">Aucun programme d'affiliation</p>
        <p className="text-[12px] text-gray-400 max-w-xs mx-auto">Créez votre programme pour permettre à des influenceurs et ambassadeurs de promouvoir vos produits.</p>
        <button onClick={() => setEditing(true)}
          className="px-5 py-2.5 bg-[#F5A623] text-white rounded-xl text-[12px] font-bold">
          + Créer mon programme
        </button>
      </div>
    );
  }

  if (editing || !prog) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-bold text-[#111]">{prog ? "Modifier le programme" : "Créer un programme"}</p>
          {prog && <button onClick={() => setEditing(false)} className="text-[11px] text-gray-400 hover:text-gray-600">Annuler</button>}
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Nom du programme *</label>
            <input value={form.nom} onChange={e => setForm(v => ({ ...v, nom: e.target.value }))}
              placeholder="Programme Ambassadeurs 2026"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-[#F5A623]/60" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Description</label>
            <textarea value={form.description} onChange={e => setForm(v => ({ ...v, description: e.target.value }))}
              placeholder="Rejoignez notre programme et gagnez des commissions sur chaque vente..."
              rows={2}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-[#F5A623]/60 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Type de commission</label>
              <select value={form.typeCommission} onChange={e => setForm(v => ({ ...v, typeCommission: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-[#F5A623]/60 bg-white">
                <option value="pourcentage">Pourcentage (%)</option>
                <option value="fixe">Montant fixe (XAF)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                Valeur ({form.typeCommission === "pourcentage" ? "%" : "XAF"})
              </label>
              <input type="number" value={form.valeurCommission} onChange={e => setForm(v => ({ ...v, valeurCommission: +e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-[#F5A623]/60" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Fenêtre cookie (jours)</label>
              <input type="number" value={form.dureeCookie} onChange={e => setForm(v => ({ ...v, dureeCookie: +e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-[#F5A623]/60" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Seuil paiement (XAF)</label>
              <input type="number" value={form.seuilPaiement} onChange={e => setForm(v => ({ ...v, seuilPaiement: +e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-[#F5A623]/60" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => setForm(v => ({ ...v, actif: !v.actif }))}
                className={`w-9 h-5 rounded-full transition-colors relative ${form.actif ? "bg-[#F5A623]" : "bg-gray-200"}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${form.actif ? "left-4" : "left-0.5"}`} />
              </div>
              <span className="text-[12px] text-gray-600">Programme actif</span>
            </label>
          </div>
        </div>
        <button onClick={sauver} disabled={!form.nom || saving}
          className="w-full py-3 bg-[#F5A623] text-white rounded-2xl text-[13px] font-bold disabled:opacity-50 hover:bg-[#d4880d] transition-colors">
          {saving ? "Sauvegarde…" : prog ? "Mettre à jour" : "Créer le programme"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[15px] font-bold text-[#111]">{prog.nom}</p>
            {prog.description && <p className="text-[12px] text-gray-400 mt-1">{prog.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Badge statut={prog.actif ? "actif" : "suspendu"} />
            <button onClick={() => setEditing(true)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <Edit3 size={13} className="text-gray-400" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Commission", value: prog.typeCommission === "pourcentage" ? `${prog.valeurCommission}%` : `${prog.valeurCommission.toLocaleString()} XAF` },
            { label: "Cookie attribution", value: `${prog.dureeCookie} jours` },
            { label: "Seuil paiement",     value: `${prog.seuilPaiement.toLocaleString()} XAF` },
            { label: "Affiliés",           value: String(prog._count?.affilies ?? 0) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400">{label}</p>
              <p className="text-[14px] font-bold text-[#111] mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Lien de signup public */}
      <div className="bg-[#FFF8EC] border border-[#F5A623]/30 rounded-2xl p-4">
        <p className="text-[11px] font-bold text-[#d4880d] mb-2">Lien d'inscription affilié</p>
        <p className="text-[11px] text-gray-500 mb-2">Partagez ce lien pour que les affiliés puissent s'inscrire à votre programme.</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white border border-[#F5A623]/20 rounded-xl px-3 py-2 text-[11px] font-mono text-gray-500 truncate">
            {process.env.NEXT_PUBLIC_APP_URL ?? ""}/rejoindre/{prog.id}
          </div>
          <CopyButton text={`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/rejoindre/${prog.id}`} />
        </div>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => copier(text, setCopied)}
      className={`shrink-0 px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${copied ? "bg-green-100 text-green-700" : "bg-[#F5A623] text-white"}`}>
      {copied ? <CheckCheck size={12}/> : <Copy size={12}/>}
    </button>
  );
}

// ─── Gestion des affiliés ─────────────────────────────────────────────────────
function OngletAffilies() {
  const [affilies, setAffilies] = useState<Affilie[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtre, setFiltre] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: "", email: "", telephone: "" });
  const [saving, setSaving] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);

  const charger = useCallback(() => {
    const qs = new URLSearchParams();
    if (filtre !== "all") qs.set("statut", filtre);
    if (search) qs.set("search", search);
    fetch(`/api/affiliation/affilies?${qs}`)
      .then(r => r.json())
      .then(d => { setAffilies(d.affilies ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filtre, search]);

  useEffect(() => { charger(); }, [charger]);

  async function creer() {
    setSaving(true);
    await fetch("/api/affiliation/affilies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ nom: "", email: "", telephone: "" }); setShowForm(false); setSaving(false); charger();
  }

  async function changerStatut(id: string, statut: string) {
    setActioning(id);
    await fetch("/api/affiliation/affilies", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, statut }) });
    setActioning(null); charger();
  }

  return (
    <div className="space-y-4">
      {/* Barre filtres */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un affilié…"
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-[12px] outline-none focus:border-[#F5A623]/50" />
        </div>
        <select value={filtre} onChange={e => setFiltre(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-[#F5A623]/50 bg-white">
          <option value="all">Tous</option>
          <option value="en_attente">En attente</option>
          <option value="actif">Actifs</option>
          <option value="suspendu">Suspendus</option>
        </select>
        <button onClick={() => setShowForm(!showForm)}
          className="px-3 py-2 bg-[#F5A623] text-white rounded-xl text-[11px] font-bold flex items-center gap-1">
          <Plus size={12}/> Ajouter
        </button>
      </div>

      {/* Formulaire ajout */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
          <p className="text-[12px] font-bold text-[#111]">Ajouter un affilié</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "nom", ph: "Nom complet *" },
              { key: "email", ph: "Email *" },
              { key: "telephone", ph: "Téléphone" },
            ].map(({ key, ph }) => (
              <input key={key} placeholder={ph} value={(form as any)[key]}
                onChange={e => setForm(v => ({ ...v, [key]: e.target.value }))}
                className="border border-gray-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-[#F5A623]/50" />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={creer} disabled={!form.nom || !form.email || saving}
              className="px-4 py-2 bg-[#F5A623] text-white rounded-xl text-[12px] font-bold disabled:opacity-50">
              {saving ? "…" : "Créer"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-[12px] text-gray-600">
              Annuler
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-sm text-gray-400">Chargement…</div>
      ) : affilies.length === 0 ? (
        <div className="py-10 text-center border-2 border-dashed border-gray-200 rounded-2xl">
          <Users size={28} className="text-gray-200 mx-auto mb-3" />
          <p className="text-[13px] font-semibold text-[#111]">Aucun affilié</p>
          <p className="text-[11px] text-gray-400 mt-1">Partagez votre lien d'inscription pour recruter des affiliés.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {affilies.map(a => (
            <div key={a.id} className="bg-white border border-gray-100 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#7c3aed]/15 flex items-center justify-center text-[12px] font-bold text-[#7c3aed] shrink-0">
                  {a.nom.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-semibold text-[#111]">{a.nom}</p>
                    <Badge statut={a.statut} />
                  </div>
                  <p className="text-[11px] text-gray-400">{a.email}{a.telephone ? ` · ${a.telephone}` : ""}</p>
                  <p className="text-[10px] font-mono text-[#F5A623] mt-0.5">Code: {a.codeParrainage}</p>
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-400">
                    <span><Eye size={10} className="inline mr-1"/>{a.clics} clics</span>
                    <span><ShoppingBag size={10} className="inline mr-1"/>{a.conversions} ventes</span>
                    <span className="text-[#F5A623] font-bold">{a.commissionTotal.toLocaleString()} XAF</span>
                    {a.commissionPending > 0 && (
                      <span className="text-amber-600">({a.commissionPending.toLocaleString()} en att.)</span>
                    )}
                  </div>
                </div>
              </div>
              {/* Actions */}
              <div className="mt-3 flex gap-2">
                {a.statut === "en_attente" && (
                  <button onClick={() => changerStatut(a.id, "actif")}
                    disabled={actioning === a.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-[10px] font-bold hover:bg-green-200 transition-colors">
                    <UserCheck size={10}/> Approuver
                  </button>
                )}
                {a.statut === "actif" && (
                  <button onClick={() => changerStatut(a.id, "suspendu")}
                    disabled={actioning === a.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-[10px] font-bold hover:bg-red-200 transition-colors">
                    <UserX size={10}/> Suspendre
                  </button>
                )}
                {a.statut === "suspendu" && (
                  <button onClick={() => changerStatut(a.id, "actif")}
                    disabled={actioning === a.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-[10px] font-bold hover:bg-green-200 transition-colors">
                    <UserCheck size={10}/> Réactiver
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Paiements ────────────────────────────────────────────────────────────────
function OngletPaiements() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [formPay, setFormPay] = useState({ affilieurId: "", montant: 0, methode: "mobile_money", telephone: "", notes: "" });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const charger = useCallback(() => {
    fetch("/api/affiliation/paiements")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { charger(); }, [charger]);

  async function marquerTraite(id: string) {
    setPaying(id);
    await fetch("/api/affiliation/paiements", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, statut: "traite" }) });
    setPaying(null); charger();
  }

  async function creerPaiement() {
    setSaving(true);
    await fetch("/api/affiliation/paiements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formPay) });
    setSaving(false); setShowForm(false); charger();
  }

  if (loading) return <div className="py-12 text-center text-sm text-gray-400">Chargement…</div>;

  const paiements = data?.paiements ?? [];
  const stats = data?.stats ?? { totalPaye: 0, totalDu: 0, soldeRestant: 0 };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-[10px] text-gray-400">Total payé</p>
          <p className="text-[18px] font-bold text-[#10b981]">{stats.totalPaye.toLocaleString()} XAF</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-[10px] text-gray-400">Dû aux affiliés</p>
          <p className="text-[18px] font-bold text-[#F5A623]">{stats.totalDu.toLocaleString()} XAF</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-[10px] text-gray-400">Solde restant</p>
          <p className="text-[18px] font-bold text-[#111]">{Math.max(0, stats.soldeRestant).toLocaleString()} XAF</p>
        </div>
      </div>

      <button onClick={() => setShowForm(!showForm)}
        className="w-full py-2.5 border-2 border-dashed border-[#F5A623]/40 rounded-2xl text-[12px] text-[#F5A623] font-bold hover:bg-[#FFF8EC] transition-all flex items-center justify-center gap-1">
        <Plus size={13}/> Enregistrer un paiement
      </button>

      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="ID affilié / affilieurId" value={formPay.affilieurId}
              onChange={e => setFormPay(v => ({ ...v, affilieurId: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-[#F5A623]/50" />
            <input type="number" placeholder="Montant XAF" value={formPay.montant || ""}
              onChange={e => setFormPay(v => ({ ...v, montant: +e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-[#F5A623]/50" />
            <input placeholder="Téléphone Mobile Money"
              value={formPay.telephone} onChange={e => setFormPay(v => ({ ...v, telephone: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-[#F5A623]/50" />
            <select value={formPay.methode} onChange={e => setFormPay(v => ({ ...v, methode: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-[#F5A623]/50 bg-white">
              <option value="mobile_money">Mobile Money</option>
              <option value="wave">Wave</option>
              <option value="orange_money">Orange Money</option>
              <option value="mtn_momo">MTN MoMo</option>
            </select>
          </div>
          <button onClick={creerPaiement} disabled={!formPay.affilieurId || !formPay.montant || saving}
            className="w-full py-2 bg-[#F5A623] text-white rounded-xl text-[12px] font-bold disabled:opacity-50">
            {saving ? "…" : "Enregistrer"}
          </button>
        </div>
      )}

      {paiements.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-6">Aucun paiement enregistré</p>
      ) : (
        <div className="space-y-2">
          {paiements.map((p: any) => (
            <div key={p.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: p.statut === "traite" ? "#10b98115" : "#F5A62315" }}>
                {p.statut === "traite" ? <CheckCircle size={16} className="text-green-500"/> : <Clock size={16} className="text-[#F5A623]"/>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[#111]">{p.affilieurId.slice(-8)}</p>
                <p className="text-[11px] text-gray-400">{p.methode} · {p.telephone ?? "—"}</p>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-bold text-[#F5A623]">{p.montant.toLocaleString()} XAF</p>
                <Badge statut={p.statut === "traite" ? "payee" : "pending"} />
              </div>
              {p.statut === "en_attente" && (
                <button onClick={() => marquerTraite(p.id)} disabled={paying === p.id}
                  className="px-3 py-1.5 bg-green-500 text-white rounded-xl text-[10px] font-bold hover:bg-green-600 disabled:opacity-50">
                  {paying === p.id ? "…" : "Marquer payé"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mes liens (B2B sortants) ─────────────────────────────────────────────────
function OngletLiens() {
  const [liens, setLiens] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [totaux, setTotaux] = useState({ total: 0, pending: 0, captured: 0 });
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  useEffect(() => {
    Promise.all([
      fetch("/api/affiliation/liens").then(r => r.json()),
      fetch("/api/affiliation/commissions?role=affilieur").then(r => r.json()),
    ]).then(([liensData, comData]) => {
      setLiens(liensData.liens ?? []);
      setCommissions(comData.commissions ?? []);
      setTotaux(comData.totaux ?? { total: 0, pending: 0, captured: 0 });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalClics = liens.reduce((a, l) => a + l.clics, 0);
  const totalConversions = liens.reduce((a, l) => a + l.conversions, 0);
  const getLienUrl = (l: any) => `${appUrl}/${l.tenant.slug}${l.produit ? `/produits/${l.produit.nom}` : ""}?ref=${l.code}`;

  if (loading) return <div className="py-8 text-center text-sm text-gray-400">Chargement…</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total gagné",    value: `${totaux.total.toLocaleString()} XAF`,   color: "#10b981" },
          { label: "En attente",     value: `${totaux.pending.toLocaleString()} XAF`,  color: "#F5A623" },
          { label: "Clics",          value: totalClics.toLocaleString(),                color: "#0ea5e9" },
          { label: "Conversions",    value: totalConversions.toLocaleString(),          color: "#7c3aed" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-[20px] font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {liens.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
          <Share2 size={28} className="text-gray-200 mx-auto mb-3"/>
          <p className="text-[13px] font-semibold text-[#111]">Aucun lien encore</p>
          <p className="text-[12px] text-gray-400 mt-1">Allez sur la page d'un produit et cliquez "Obtenir mon lien d'affiliation"</p>
        </div>
      ) : (
        <div className="space-y-3">
          {liens.map(lien => {
            const url = getLienUrl(lien);
            const trackUrl = `${appUrl}/api/track/${lien.code}`;
            const taux = lien.produit?.tauxCommissionAff ? `${Math.round(lien.produit.tauxCommissionAff * 100)}%` : "—";
            return (
              <div key={lien.id} className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  {lien.produit?.images?.[0] && <img src={lien.produit.images[0]} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0"/>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold text-[#111] truncate">{lien.produit?.nom ?? lien.tenant.nomBoutique}</p>
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold shrink-0">{taux}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">{lien.tenant.nomBoutique} · <span className="font-mono font-bold text-[#F5A623]">{lien.code}</span></p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-[10px] text-gray-400 font-mono truncate">{trackUrl}</div>
                      <button onClick={() => copier(trackUrl, v => { if (v) setCopiedId(lien.id); })}
                        className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${copiedId === lien.id ? "bg-green-100 text-green-700" : "bg-[#111] text-white"}`}>
                        {copiedId === lien.id ? <CheckCheck size={11}/> : <Copy size={11}/>}
                      </button>
                    </div>
                    <div className="mt-2 flex gap-4 text-[11px] text-gray-400">
                      <span><Eye size={10} className="inline mr-1"/>{lien.clics} clics</span>
                      <span><ShoppingBag size={10} className="inline mr-1"/>{lien.conversions} ventes</span>
                      <span className="text-green-600 font-bold">+{(lien.montantGenere ?? 0).toLocaleString()} XAF</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function AffiliationPage() {
  const [onglet, setOnglet] = useState("stats");

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-5" style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
      <div>
        <h1 className="text-[18px] font-bold text-[#111]">Affiliation</h1>
        <p className="text-[12px] text-gray-500">Programme d'affiliation, affiliés et commissions</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 overflow-x-auto">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setOnglet(id)}
            className={`flex-1 py-2 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${onglet === id ? "bg-white shadow-sm text-[#111]" : "text-gray-500 hover:text-gray-700"}`}>
            <Icon size={11}/>
            {label}
          </button>
        ))}
      </div>

      {onglet === "stats"     && <OngletStats />}
      {onglet === "programme" && <OngletProgramme />}
      {onglet === "affilies"  && <OngletAffilies />}
      {onglet === "paiements" && <OngletPaiements />}
      {onglet === "liens"     && <OngletLiens />}
    </div>
  );
}
