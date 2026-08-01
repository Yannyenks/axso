"use client";
import { useState, useEffect } from "react";
import { Link2, TrendingUp, Users, DollarSign, Copy, CheckCheck, Zap, Share2, Eye, ShoppingBag, Plus, ExternalLink, Palette, Globe } from "lucide-react";

const TABS = [
  { id: "programme", label: "Mon programme" },
  { id: "entrante", label: "Affiliés entrants" },
  { id: "commissions", label: "Commissions" },
  { id: "materiel", label: "Matériel pub" },
];

function copier(texte: string, cb: (v: boolean) => void) {
  navigator.clipboard.writeText(texte);
  cb(true); setTimeout(() => cb(false), 2000);
}

// ─── Onglet Programme (liens d'affiliation sortants) ──────────────────────────
function OngletProgramme() {
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
    });
  }, []);

  const totalClics = liens.reduce((a, l) => a + l.clics, 0);
  const totalConversions = liens.reduce((a, l) => a + l.conversions, 0);
  const getLienUrl = (lien: any) => `${appUrl}/${lien.tenant.slug}${lien.produit ? `/produits/${lien.produit.nom}` : ""}?ref=${lien.code}`;

  if (loading) return <div className="py-8 text-center text-sm text-gray-400">Chargement…</div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total gagné", value: `${totaux.total.toLocaleString()} XAF`, color: "bg-green-100 text-green-600" },
          { label: "En attente", value: `${totaux.pending.toLocaleString()} XAF`, color: "bg-amber-100 text-amber-600" },
          { label: "Clics", value: totalClics.toLocaleString(), color: "bg-blue-100 text-blue-600" },
          { label: "Conversions", value: totalConversions.toLocaleString(), color: "bg-purple-100 text-purple-600" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.color}`}><DollarSign size={14}/></div>
            <p className="text-[18px] font-bold text-[#111]">{s.value}</p>
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
            const taux = lien.produit?.tauxCommissionAff ? `${Math.round(lien.produit.tauxCommissionAff * 100)}%` : "—";
            return (
              <div key={lien.id} className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  {lien.produit?.images?.[0] && <img src={lien.produit.images[0]} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0"/>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold text-[#111] truncate">{lien.produit?.nom ?? lien.tenant.nomBoutique}</p>
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold shrink-0">{taux}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">{lien.tenant.nomBoutique} · Code: <span className="font-mono font-bold text-[#F5A623]">{lien.code}</span></p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-[10px] text-gray-400 font-mono truncate">{url}</div>
                      <button onClick={() => copier(url, v => { if (v) setCopiedId(lien.id); })}
                        className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${copiedId === lien.id ? "bg-green-100 text-green-700" : "bg-[#111] text-white"}`}>
                        {copiedId === lien.id ? <><CheckCheck size={11}/></> : <><Copy size={11}/></>}
                      </button>
                    </div>
                    <div className="mt-2 flex gap-4 text-[11px] text-gray-400">
                      <span><Eye size={10} className="inline mr-1"/>{lien.clics} clics</span>
                      <span><ShoppingBag size={10} className="inline mr-1"/>{lien.conversions} ventes</span>
                      <span className="text-green-600 font-semibold">+{lien.montantGenere?.toLocaleString()} XAF</span>
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

// ─── Onglet Affiliés entrants ─────────────────────────────────────────────────
function OngletEntrante() {
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nomProgramme: "", nomMarchand: "", urlProgramme: "", monLien: "", taux: "", devise: "XAF" });
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const charger = () => fetch("/api/affiliation/entrante").then(r => r.json()).then(d => { setProgrammes(d.programmes ?? []); setLoading(false); });
  useEffect(() => { charger(); }, []);

  async function creer() {
    setSaving(true);
    await fetch("/api/affiliation/entrante", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, taux: parseFloat(form.taux) || 0 }) });
    await charger(); setShowForm(false); setSaving(false);
    setForm({ nomProgramme: "", nomMarchand: "", urlProgramme: "", monLien: "", taux: "", devise: "XAF" });
  }

  if (loading) return <div className="py-8 text-center text-sm text-gray-400">Chargement…</div>;

  const totalRevenus = programmes.reduce((s, p) => s + (p.revenusGeneres ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-[10px] text-gray-400">Programmes</p>
          <p className="text-[20px] font-bold text-[#111]">{programmes.length}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-[10px] text-gray-400">Actifs</p>
          <p className="text-[20px] font-bold text-[#111]">{programmes.filter(p => p.actif).length}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-[10px] text-gray-400">Revenus totaux</p>
          <p className="text-[20px] font-bold text-[#F5A623]">{totalRevenus.toLocaleString()}</p>
        </div>
      </div>

      <button onClick={() => setShowForm(!showForm)}
        className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#F5A623]/40 text-[12px] text-[#F5A623] font-semibold hover:bg-[#FFF8EC] transition-all">
        + Ajouter un programme entrant
      </button>

      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[{ key: "nomProgramme", ph: "Nom du programme" }, { key: "nomMarchand", ph: "Nom du marchand" }, { key: "urlProgramme", ph: "URL du programme" }, { key: "monLien", ph: "Mon lien affilié" }].map(({ key, ph }) => (
              <input key={key} placeholder={ph} value={(form as any)[key]} onChange={e => setForm(v => ({ ...v, [key]: e.target.value }))}
                className="border border-gray-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-[#F5A623]/50" />
            ))}
            <input placeholder="Taux %" value={form.taux} onChange={e => setForm(v => ({ ...v, taux: e.target.value }))} type="number"
              className="border border-gray-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-[#F5A623]/50" />
          </div>
          <button onClick={creer} disabled={!form.nomProgramme || saving}
            className="w-full py-2 bg-[#F5A623] text-white rounded-xl text-[12px] font-semibold disabled:opacity-50">{saving ? "…" : "Ajouter"}</button>
        </div>
      )}

      {programmes.map(p => (
        <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
          <Globe size={14} className="text-[#F5A623] shrink-0"/>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-[#111]">{p.nomProgramme}</p>
            <p className="text-[11px] text-gray-400">{p.nomMarchand} · {p.taux}% comm.</p>
          </div>
          {p.monLien && (
            <button onClick={() => copier(p.monLien, v => { if (v) setCopiedId(p.id); })}
              className="text-[10px] text-gray-400 hover:text-[#F5A623] border border-gray-100 px-2 py-1 rounded-lg">
              {copiedId === p.id ? "Copié ✓" : "Copier lien"}
            </button>
          )}
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${p.actif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
            {p.actif ? "Actif" : "Inactif"}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Onglet Commissions ───────────────────────────────────────────────────────
function OngletCommissions() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const charger = () => fetch("/api/affiliation/paiements").then(r => r.json()).then(d => { setCommissions(d.commissions ?? []); setLoading(false); });
  useEffect(() => { charger(); }, []);

  async function payer(affilieId: string) {
    setSaving(affilieId);
    await fetch("/api/affiliation/paiements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ affilieId }) });
    await charger(); setSaving(null);
  }

  if (loading) return <div className="py-8 text-center text-sm text-gray-400">Chargement…</div>;

  return (
    <div className="space-y-3">
      {commissions.length === 0 && <p className="text-center text-sm text-gray-400 py-8">Aucune commission en attente</p>}
      {commissions.map((c, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#F5A623]/15 flex items-center justify-center shrink-0">
            <Users size={13} className="text-[#F5A623]"/>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-[#111]">{c.affilieNom ?? c.affilieId?.slice(-8)}</p>
            <p className="text-[11px] text-gray-400">{c.nbCommissions} commission(s) en attente</p>
          </div>
          <span className="text-[13px] font-bold text-[#F5A623]">{c.montantDu?.toLocaleString()} XAF</span>
          <button onClick={() => payer(c.affilieId)} disabled={saving === c.affilieId}
            className="px-3 py-1.5 bg-green-500 text-white rounded-xl text-[11px] font-semibold hover:bg-green-600 disabled:opacity-50">
            {saving === c.affilieId ? "…" : "Payer"}
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Onglet Matériel publicitaire ─────────────────────────────────────────────
function OngletMateriel() {
  const [liens, setLiens] = useState<any[]>([]);
  const [selectedLien, setSelectedLien] = useState<any>(null);
  const [couleur1, setCouleur1] = useState("#F5A623");
  const [couleur2, setCouleur2] = useState("#7c3aed");
  const [cookieJours, setCookieJours] = useState(30);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  useEffect(() => {
    fetch("/api/affiliation/liens").then(r => r.json()).then(d => {
      const l = d.liens ?? [];
      setLiens(l);
      if (l.length > 0) { setSelectedLien(l[0]); setCookieJours(l[0].cookieJours ?? 30); }
    });
  }, []);

  async function saveCookieJours() {
    if (!selectedLien) return;
    setSaving(true);
    await fetch("/api/affiliation/liens", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selectedLien.id, cookieJours }) });
    setSaving(false);
  }

  const lienUrl = selectedLien ? `${appUrl}/${selectedLien.tenant?.slug ?? ""}?ref=${selectedLien.code}` : "";

  const htmlBanniere = `<a href="${lienUrl}" style="display:block;background:linear-gradient(135deg,${couleur1},${couleur2});padding:20px 30px;border-radius:12px;text-align:center;text-decoration:none;">
  <span style="color:white;font-size:18px;font-weight:bold;">${selectedLien?.tenant?.nomBoutique ?? "Boutique"}</span>
  <span style="display:block;color:rgba(255,255,255,0.85);font-size:13px;margin-top:4px;">Découvrir les produits →</span>
</a>`;

  return (
    <div className="space-y-5">
      {liens.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">Aucun lien d'affiliation disponible</p>
      ) : (
        <>
          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Lien sélectionné</label>
            <select value={selectedLien?.id ?? ""} onChange={e => { const l = liens.find(x => x.id === e.target.value); setSelectedLien(l ?? null); setCookieJours(l?.cookieJours ?? 30); }}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-[#F5A623]/50">
              {liens.map(l => <option key={l.id} value={l.id}>{l.produit?.nom ?? l.tenant?.nomBoutique} · {l.code}</option>)}
            </select>
          </div>

          {/* Fenêtre attribution */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
            <p className="text-[12px] font-semibold text-[#111]">Fenêtre d'attribution</p>
            <div className="flex items-center gap-3">
              <input type="range" min={1} max={90} value={cookieJours} onChange={e => setCookieJours(+e.target.value)} className="flex-1 accent-[#F5A623]"/>
              <span className="text-[13px] font-bold text-[#F5A623] w-16 text-center">{cookieJours} jours</span>
              <button onClick={saveCookieJours} disabled={saving}
                className="px-3 py-1.5 bg-[#F5A623] text-white rounded-xl text-[11px] font-semibold disabled:opacity-50">{saving ? "…" : "Sauver"}</button>
            </div>
          </div>

          {/* Bannière */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
            <p className="text-[12px] font-semibold text-[#111]">Bannière HTML</p>
            <div className="flex gap-3">
              <div><label className="text-[10px] text-gray-400">Couleur 1</label><input type="color" value={couleur1} onChange={e => setCouleur1(e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-gray-200 cursor-pointer"/></div>
              <div><label className="text-[10px] text-gray-400">Couleur 2</label><input type="color" value={couleur2} onChange={e => setCouleur2(e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-gray-200 cursor-pointer"/></div>
            </div>
            {/* Preview */}
            <a href={lienUrl} target="_blank" rel="noopener noreferrer"
              style={{ display:"block", background:`linear-gradient(135deg,${couleur1},${couleur2})`, padding:"20px 24px", borderRadius:"12px", textAlign:"center", textDecoration:"none" }}>
              <span style={{ color:"white", fontSize:"16px", fontWeight:"bold" }}>{selectedLien?.tenant?.nomBoutique ?? "Boutique"}</span>
              <span style={{ display:"block", color:"rgba(255,255,255,0.85)", fontSize:"12px", marginTop:"4px" }}>Découvrir les produits →</span>
            </a>
            <button onClick={() => copier(htmlBanniere, v => { if (v) setCopied("html"); })}
              className="w-full py-2 border border-gray-200 rounded-xl text-[12px] text-gray-600 hover:bg-gray-50 transition-all">
              {copied === "html" ? "✓ Copié !" : "Copier le code HTML"}
            </button>
          </div>

          {/* Templates texte */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
            <p className="text-[12px] font-semibold text-[#111]">Templates texte</p>
            {[
              { id: "wa", label: "WhatsApp", text: `🛍️ Découvrez ${selectedLien?.tenant?.nomBoutique ?? "cette boutique"} !\n\nProduits de qualité, livraison rapide.\n👉 ${lienUrl}` },
              { id: "ig", label: "Instagram", text: `✨ Ma boutique coup de cœur du moment : ${selectedLien?.tenant?.nomBoutique ?? ""}\nLien en bio → ${lienUrl}` },
            ].map(t => (
              <div key={t.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-gray-400 font-semibold">{t.label}</p>
                  <button onClick={() => copier(t.text, v => { if (v) setCopied(t.id); })}
                    className="text-[10px] text-gray-400 hover:text-[#F5A623] border border-gray-100 px-2 py-0.5 rounded-lg">{copied === t.id ? "✓ Copié" : "Copier"}</button>
                </div>
                <p className="text-[11px] text-gray-500 bg-gray-50 rounded-lg p-2 whitespace-pre-line">{t.text}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function AffiliationPage() {
  const [onglet, setOnglet] = useState("programme");

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-5" style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
      <div>
        <h1 className="text-[18px] font-bold text-[#111]">Affiliation</h1>
        <p className="text-[12px] text-gray-500">Programme, affiliés entrants, commissions et matériel publicitaire</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 overflow-x-auto">
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setOnglet(id)}
            className={`flex-1 py-2 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all ${onglet === id ? "bg-white shadow-sm text-[#111]" : "text-gray-500 hover:text-gray-700"}`}>
            {label}
          </button>
        ))}
      </div>

      {onglet === "programme" && <OngletProgramme />}
      {onglet === "entrante" && <OngletEntrante />}
      {onglet === "commissions" && <OngletCommissions />}
      {onglet === "materiel" && <OngletMateriel />}
    </div>
  );
}
