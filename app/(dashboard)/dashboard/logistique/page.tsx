"use client";
import { useState, useEffect } from "react";
import { Package, RotateCcw, FileText, ShoppingCart, Warehouse, Truck, Plus, Minus, Trash2, Printer } from "lucide-react";

const TABS = [
  { id: "livraisons", label: "Livraisons", Icon: Truck },
  { id: "retours", label: "Retours", Icon: RotateCcw },
  { id: "factures", label: "Factures", Icon: FileText },
  { id: "pos", label: "Caisse POS", Icon: ShoppingCart },
  { id: "entrepots", label: "Entrepôts", Icon: Warehouse },
  { id: "transporteurs", label: "Transporteurs", Icon: Package },
];

// ─── Livraisons ──────────────────────────────────────────────────────────────
function OngletLivraisons() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/commandes?limit=30&statut=en_preparation,en_transit,expedie")
      .then(r => r.json()).then(d => { setCommandes(d.commandes ?? []); setLoading(false); });
  }, []);

  const STATUTS: Record<string, { label: string; color: string }> = {
    en_attente: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
    en_preparation: { label: "Préparation", color: "bg-blue-100 text-blue-700" },
    expedie: { label: "Expédié", color: "bg-purple-100 text-purple-700" },
    en_transit: { label: "En transit", color: "bg-indigo-100 text-indigo-700" },
    livree: { label: "Livré", color: "bg-green-100 text-green-700" },
    annulee: { label: "Annulé", color: "bg-red-100 text-red-700" },
  };

  if (loading) return <div className="p-8 text-center text-sm text-gray-400">Chargement…</div>;

  return (
    <div className="space-y-2">
      {commandes.length === 0 && <p className="text-center text-sm text-gray-400 py-8">Aucune livraison en cours</p>}
      {commandes.map(c => {
        const s = STATUTS[c.statut] ?? { label: c.statut, color: "bg-gray-100 text-gray-600" };
        return (
          <div key={c.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-[#111] truncate">{c.numero}</p>
              <p className="text-[11px] text-gray-400 truncate">{c.client?.nom ?? c.nomClient ?? "—"}</p>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
            <span className="text-[12px] font-bold text-[#F5A623]">{c.montantTotal?.toLocaleString()} XAF</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Retours RMA ─────────────────────────────────────────────────────────────
function OngletRetours() {
  const [retours, setRetours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ commandeNumero: "", motif: "", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/retours").then(r => r.json()).then(d => { setRetours(d.retours ?? []); setLoading(false); });
  }, []);

  async function creerRetour() {
    setSaving(true);
    await fetch("/api/retours", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await fetch("/api/retours").then(r => r.json());
    setRetours(d.retours ?? []); setShowForm(false); setSaving(false);
    setForm({ commandeNumero: "", motif: "", description: "" });
  }

  const MOTIFS = ["produit_defectueux", "mauvaise_taille", "non_conforme", "endommage", "autre"];

  if (loading) return <div className="p-8 text-center text-sm text-gray-400">Chargement…</div>;

  return (
    <div className="space-y-3">
      <button onClick={() => setShowForm(!showForm)}
        className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#F5A623]/40 text-[12px] text-[#F5A623] font-semibold hover:bg-[#FFF8EC] transition-all">
        + Nouveau retour RMA
      </button>
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
          <input placeholder="N° commande" value={form.commandeNumero} onChange={e => setForm(v => ({ ...v, commandeNumero: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-[#F5A623]/50" />
          <select value={form.motif} onChange={e => setForm(v => ({ ...v, motif: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[12px] outline-none">
            <option value="">Motif…</option>
            {MOTIFS.map(m => <option key={m} value={m}>{m.replace(/_/g, " ")}</option>)}
          </select>
          <textarea placeholder="Description" value={form.description} onChange={e => setForm(v => ({ ...v, description: e.target.value }))}
            rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[12px] outline-none resize-none" />
          <button onClick={creerRetour} disabled={saving}
            className="w-full py-2 bg-[#F5A623] text-white rounded-xl text-[12px] font-semibold disabled:opacity-50">
            {saving ? "…" : "Créer le retour"}
          </button>
        </div>
      )}
      {retours.length === 0 && !showForm && <p className="text-center text-sm text-gray-400 py-8">Aucun retour</p>}
      {retours.map(r => (
        <div key={r.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
          <RotateCcw size={14} className="text-orange-400" />
          <div className="flex-1">
            <p className="text-[12px] font-semibold text-[#111]">{r.numero ?? r.id.slice(-6)}</p>
            <p className="text-[11px] text-gray-400">{r.motif?.replace(/_/g, " ")} · {r.commande?.numero ?? ""}</p>
          </div>
          <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">{r.statut}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Factures ─────────────────────────────────────────────────────────────────
function OngletFactures() {
  const [factures, setFactures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/factures?limit=30").then(r => r.json()).then(d => { setFactures(d.factures ?? []); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 text-center text-sm text-gray-400">Chargement…</div>;

  return (
    <div className="space-y-2">
      {factures.length === 0 && <p className="text-center text-sm text-gray-400 py-8">Aucune facture</p>}
      {factures.map(f => (
        <div key={f.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
          <FileText size={14} className="text-blue-400" />
          <div className="flex-1">
            <p className="text-[12px] font-semibold text-[#111]">{f.numero}</p>
            <p className="text-[11px] text-gray-400">{new Date(f.createdAt).toLocaleDateString("fr")}</p>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${f.statut === "payee" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
            {f.statut}
          </span>
          <span className="text-[12px] font-bold text-[#111]">{f.montantTTC?.toLocaleString()} XAF</span>
        </div>
      ))}
    </div>
  );
}

// ─── POS ──────────────────────────────────────────────────────────────────────
type ProduitPOS = { id: string; nom: string; prix: number; stock: number; images: string[] };
type CartItem = ProduitPOS & { qte: number };

function OngletPOS() {
  const [produits, setProduits] = useState<ProduitPOS[]>([]);
  const [recherche, setRecherche] = useState("");
  const [panier, setPanier] = useState<CartItem[]>([]);
  const [paiement, setPaiement] = useState("especes");
  const [nomClient, setNomClient] = useState("");
  const [reduction, setReduction] = useState(0);
  const [loading, setLoading] = useState(false);
  const [succes, setSucces] = useState<any>(null);

  useEffect(() => {
    fetch("/api/produits?limit=50&actif=true").then(r => r.json()).then(d => setProduits(d.produits ?? []));
  }, []);

  const filtrés = produits.filter(p => p.nom.toLowerCase().includes(recherche.toLowerCase()));
  const sousTotal = panier.reduce((s, i) => s + i.prix * i.qte, 0);
  const total = Math.max(0, sousTotal - reduction);

  function ajouter(p: ProduitPOS) {
    setPanier(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, qte: i.qte + 1 } : i);
      return [...prev, { ...p, qte: 1 }];
    });
  }

  async function valider() {
    if (panier.length === 0) return;
    setLoading(true);
    const res = await fetch("/api/commandes/pos-creer", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: panier.map(i => ({ produitId: i.id, quantite: i.qte, prixUnitaire: i.prix })), paiement, nomClient, reduction }),
    });
    const d = await res.json();
    if (d.commande) { setSucces(d); setPanier([]); }
    setLoading(false);
  }

  if (succes) return (
    <div className="text-center py-10 space-y-3">
      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <span className="text-2xl">✓</span>
      </div>
      <p className="text-[15px] font-bold text-green-700">Vente enregistrée</p>
      <p className="text-[12px] text-gray-500">{succes.commande.numero} · {total.toLocaleString()} XAF</p>
      <div className="flex gap-2 justify-center">
        <button onClick={() => { setPanier([]); setSucces(null); setNomClient(""); setReduction(0); }}
          className="px-4 py-2 bg-[#F5A623] text-white rounded-xl text-[12px] font-semibold">Nouvelle vente</button>
        <button onClick={() => window.print()}
          className="px-4 py-2 border border-gray-200 rounded-xl text-[12px] text-gray-600 flex items-center gap-1">
          <Printer size={12} /> Ticket
        </button>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-3">
        <input placeholder="Rechercher un produit…" value={recherche} onChange={e => setRecherche(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-[#F5A623]/50" />
        <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
          {filtrés.map(p => (
            <button key={p.id} onClick={() => ajouter(p)}
              className="text-left bg-white border border-gray-100 rounded-xl p-3 hover:border-[#F5A623]/40 hover:bg-[#FFF8EC] transition-all">
              <p className="text-[12px] font-semibold text-[#111] truncate">{p.nom}</p>
              <p className="text-[12px] text-[#F5A623] font-bold">{p.prix?.toLocaleString()} XAF</p>
              <p className="text-[10px] text-gray-400">Stock: {p.stock}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 min-h-[140px]">
          {panier.length === 0 ? <p className="text-center text-sm text-gray-300 pt-6">Panier vide</p> : (
            <div className="space-y-2">
              {panier.map(i => (
                <div key={i.id} className="flex items-center gap-2">
                  <p className="flex-1 text-[12px] truncate">{i.nom}</p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPanier(p => p.map(x => x.id === i.id ? { ...x, qte: Math.max(1, x.qte - 1) } : x))}
                      className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"><Minus size={10} /></button>
                    <span className="text-[12px] w-5 text-center">{i.qte}</span>
                    <button onClick={() => setPanier(p => p.map(x => x.id === i.id ? { ...x, qte: x.qte + 1 } : x))}
                      className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"><Plus size={10} /></button>
                  </div>
                  <span className="text-[11px] font-bold text-[#F5A623] w-20 text-right">{(i.prix * i.qte).toLocaleString()}</span>
                  <button onClick={() => setPanier(p => p.filter(x => x.id !== i.id))}><Trash2 size={12} className="text-gray-300 hover:text-red-400" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
        <input placeholder="Nom client (optionnel)" value={nomClient} onChange={e => setNomClient(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-[#F5A623]/50" />
        <div className="flex gap-2">
          {["especes", "mobile_money", "carte"].map(m => (
            <button key={m} onClick={() => setPaiement(m)}
              className={`flex-1 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${paiement === m ? "bg-[#F5A623] text-white" : "bg-gray-100 text-gray-500"}`}>
              {m === "especes" ? "Espèces" : m === "mobile_money" ? "Mobile" : "Carte"}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between px-1">
          <span className="text-[12px] text-gray-500">Total</span>
          <span className="text-[16px] font-black text-[#111]">{total.toLocaleString()} XAF</span>
        </div>
        <button onClick={valider} disabled={panier.length === 0 || loading}
          className="w-full py-3 bg-[#F5A623] text-white rounded-xl text-[13px] font-bold hover:bg-[#e09520] transition-all disabled:opacity-40 shadow-sm">
          {loading ? "…" : "Encaisser"}
        </button>
      </div>
    </div>
  );
}

// ─── Entrepôts ────────────────────────────────────────────────────────────────
function OngletEntrepots() {
  const [entrepots, setEntrepots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: "", adresse: "", ville: "", pays: "CM", principal: false });
  const [saving, setSaving] = useState(false);

  const charger = () => fetch("/api/entrepots").then(r => r.json()).then(d => { setEntrepots(d.entrepots ?? []); setLoading(false); });
  useEffect(() => { charger(); }, []);

  async function creer() {
    setSaving(true);
    await fetch("/api/entrepots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    await charger(); setShowForm(false); setSaving(false); setForm({ nom: "", adresse: "", ville: "", pays: "CM", principal: false });
  }

  if (loading) return <div className="p-8 text-center text-sm text-gray-400">Chargement…</div>;

  return (
    <div className="space-y-3">
      <button onClick={() => setShowForm(!showForm)}
        className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#F5A623]/40 text-[12px] text-[#F5A623] font-semibold hover:bg-[#FFF8EC] transition-all">
        + Nouvel entrepôt
      </button>
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2">
          {[{ key: "nom", ph: "Nom de l'entrepôt" }, { key: "adresse", ph: "Adresse" }, { key: "ville", ph: "Ville" }].map(({ key, ph }) => (
            <input key={key} placeholder={ph} value={(form as any)[key]} onChange={e => setForm(v => ({ ...v, [key]: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-[#F5A623]/50" />
          ))}
          <label className="flex items-center gap-2 text-[12px] text-gray-600">
            <input type="checkbox" checked={form.principal} onChange={e => setForm(v => ({ ...v, principal: e.target.checked }))} />
            Entrepôt principal
          </label>
          <button onClick={creer} disabled={!form.nom || saving}
            className="w-full py-2 bg-[#F5A623] text-white rounded-xl text-[12px] font-semibold disabled:opacity-50">
            {saving ? "…" : "Créer"}
          </button>
        </div>
      )}
      {entrepots.map(e => (
        <div key={e.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
          <Warehouse size={14} className="text-[#F5A623]" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[12px] font-semibold text-[#111]">{e.nom}</p>
              {e.principal && <span className="text-[9px] bg-[#F5A623]/15 text-[#F5A623] px-1.5 py-0.5 rounded-full font-bold">PRINCIPAL</span>}
            </div>
            <p className="text-[11px] text-gray-400">{e.ville}{e.adresse ? ` · ${e.adresse}` : ""}</p>
          </div>
          <span className="text-[10px] text-gray-400">{e._count?.stocks ?? 0} SKU</span>
        </div>
      ))}
    </div>
  );
}

// ─── Transporteurs ────────────────────────────────────────────────────────────
function OngletTransporteurs() {
  const [liste, setListe] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [tarif, setTarif] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/transporteurs").then(r => r.json()).then(d => { setListe(d.transporteurs ?? []); setLoading(false); });
  }, []);

  async function toggle(code: string, current: boolean) {
    setSaving(true);
    await fetch("/api/transporteurs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, actif: !current }) });
    setListe(l => l.map(t => t.code === code ? { ...t, actif: !current } : t));
    setSaving(false);
  }

  async function saveConfig(code: string) {
    setSaving(true);
    await fetch("/api/transporteurs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, apiKey, tarif: tarif ? parseFloat(tarif) : null }) });
    setEditing(null); setApiKey(""); setTarif(""); setSaving(false);
    fetch("/api/transporteurs").then(r => r.json()).then(d => setListe(d.transporteurs ?? []));
  }

  if (loading) return <div className="p-8 text-center text-sm text-gray-400">Chargement…</div>;

  return (
    <div className="space-y-3">
      {liste.map(t => (
        <div key={t.code} className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">{t.logo}</span>
            <div className="flex-1">
              <p className="text-[12px] font-semibold text-[#111]">{t.nom}</p>
              <p className="text-[10px] text-gray-400">{t.zones.join(", ")}{t.tarif ? ` · ${t.tarif} XAF` : ""}</p>
            </div>
            <button onClick={() => { setEditing(t.code); setApiKey(""); setTarif(t.tarif?.toString() ?? ""); }}
              className="text-[10px] text-gray-400 hover:text-[#F5A623] border border-gray-100 px-2 py-1 rounded-lg">Config</button>
            <button onClick={() => toggle(t.code, t.actif)} disabled={saving}
              className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${t.actif ? "bg-[#F5A623]" : "bg-gray-200"}`}>
              <span className={`inline-block h-4 w-4 m-0.5 rounded-full bg-white shadow transition-transform ${t.actif ? "translate-x-4" : ""}`} />
            </button>
          </div>
          {editing === t.code && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
              <input placeholder="Clé API" value={apiKey} onChange={e => setApiKey(e.target.value)} type="password"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-[#F5A623]/50" />
              <input placeholder="Tarif fixe XAF" type="number" value={tarif} onChange={e => setTarif(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-[#F5A623]/50" />
              <div className="flex gap-2">
                <button onClick={() => saveConfig(t.code)} disabled={saving}
                  className="flex-1 py-1.5 bg-[#F5A623] text-white rounded-xl text-[11px] font-semibold disabled:opacity-50">Sauver</button>
                <button onClick={() => setEditing(null)} className="px-3 py-1.5 border border-gray-200 rounded-xl text-[11px] text-gray-500">Annuler</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function LogistiquePage() {
  const [onglet, setOnglet] = useState("livraisons");

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-5" style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
      <div>
        <h1 className="text-[18px] font-bold text-[#111]">Logistique</h1>
        <p className="text-[12px] text-gray-500">Livraisons, retours, factures, caisse, stocks et transporteurs</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 overflow-x-auto">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setOnglet(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all ${onglet === id ? "bg-white shadow-sm text-[#111]" : "text-gray-500 hover:text-gray-700"}`}>
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {onglet === "livraisons" && <OngletLivraisons />}
        {onglet === "retours" && <OngletRetours />}
        {onglet === "factures" && <OngletFactures />}
        {onglet === "pos" && <OngletPOS />}
        {onglet === "entrepots" && <OngletEntrepots />}
        {onglet === "transporteurs" && <OngletTransporteurs />}
      </div>
    </div>
  );
}
