"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle, Send, Search, CheckCircle2,
  Clock, Truck, Package, XCircle, Phone,
  Settings, Wifi, WifiOff, Loader2, ShoppingBag, ArrowLeft,
  CheckCheck, Check, Zap, MapPin, FileText, RefreshCw, Bell,
  ChevronDown, Plus
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Conversation {
  de: string; nom: string | null; dernier: string;
  lu: boolean; nonLus: number; updatedAt: string;
}
interface Message {
  id: string; de: string; nom: string | null;
  corps: string; lu: boolean;
  direction: "entrant" | "sortant";
  commandeId: string | null; createdAt: string;
}
interface Commande {
  id: string; numero: string; statut: string;
  paiementStatut: string; montantTotal: number; devise: string;
  createdAt: string; trackingToken?: string | null;
  lignes: { nom: string; quantite: number }[];
}
interface WaConfig { statut: string; config: { phone_number_id?: string; numero_affiche?: string; verified_name?: string } | null }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function heure(iso: string) {
  const d = new Date(iso), now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "maintenant";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
function initiales(nom: string | null, tel: string) {
  if (nom) return nom.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return tel.slice(-2);
}
function avatarColor(seed: string) {
  const colors = ["#25D366","#F5A623","#7c3aed","#0ea5e9","#ec4899","#f97316","#10b981"];
  return colors[seed.charCodeAt(seed.length - 1) % colors.length];
}

const STATUT_LABEL: Record<string, { label: string; color: string; icon: any }> = {
  en_attente:     { label: "En attente",     color: "#f59e0b", icon: Clock },
  confirmee:      { label: "Confirmée",      color: "#60a5fa", icon: CheckCircle2 },
  en_preparation: { label: "En préparation", color: "#a78bfa", icon: Package },
  expediee:       { label: "Expédiée",       color: "#38bdf8", icon: Truck },
  livree:         { label: "Livrée",         color: "#34d399", icon: CheckCircle2 },
  annulee:        { label: "Annulée",        color: "#f87171", icon: XCircle },
};

// ─── Templates réponse rapide ────────────────────────────────────────────────
const TEMPLATES = [
  { label: "Bonjour", text: "Bonjour 👋 Comment puis-je vous aider ?" },
  { label: "Reçu", text: "Votre commande a bien été reçue, merci ! ✅" },
  { label: "En cours", text: "Votre commande est en cours de préparation 📦" },
  { label: "Expédiée", text: "Votre commande a été expédiée 🚚 Vous serez livré très prochainement !" },
  { label: "Livrée", text: "Votre commande a été livrée avec succès ✅ Merci pour votre confiance !" },
  { label: "Confirmation", text: "Pouvez-vous confirmer votre commande en répondant OUI ? 🙏" },
];

// ─── Modal Config ─────────────────────────────────────────────────────────────
function ConfigPanel({ onClose, onConnecte }: { onClose: () => void; onConnecte: (cfg: WaConfig) => void }) {
  const [form, setForm] = useState({ phone_number_id: "", access_token: "" });
  const [loading, setLoading] = useState(false);

  async function connecter() {
    if (!form.phone_number_id || !form.access_token) { toast.error("Remplissez tous les champs"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/connecteurs/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`✅ WhatsApp Business connecté ! (${data.numero ?? ""})`);
      onConnecte({ statut: "actif", config: { phone_number_id: form.phone_number_id, numero_affiche: data.numero, verified_name: data.nom } });
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#111827] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <MessageCircle size={20} style={{ color: "#25D366" }} /> Connecter WhatsApp Business
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="rounded-xl p-4 space-y-1.5 text-sm text-gray-300" style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)" }}>
          <p className="font-semibold" style={{ color: "#25D366" }}>Comment obtenir vos identifiants ?</p>
          <p>1. <span className="text-white font-mono">developers.facebook.com</span> → Créer une app</p>
          <p>2. Ajouter le produit <span className="text-white">WhatsApp Business</span></p>
          <p>3. Copier le <span className="font-mono" style={{ color: "#25D366" }}>Phone Number ID</span> + <span className="font-mono" style={{ color: "#25D366" }}>Token permanent</span></p>
          <p>4. Webhook : <span className="font-mono text-xs text-white">…/api/webhooks/whatsapp</span> · Token : <span className="font-mono text-white text-xs">axso_meta_2026</span></p>
          <p>5. S'abonner à l'événement <span className="font-mono text-white">messages</span></p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-gray-400 text-xs block mb-1.5">Phone Number ID *</label>
            <input value={form.phone_number_id} onChange={e => setForm(f => ({ ...f, phone_number_id: e.target.value }))}
              placeholder="123456789012345"
              className="w-full bg-[#1f2937] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-[#25D366]/50" />
          </div>
          <div>
            <label className="text-gray-400 text-xs block mb-1.5">Token d'accès permanent *</label>
            <input value={form.access_token} onChange={e => setForm(f => ({ ...f, access_token: e.target.value }))}
              placeholder="EAAxxxxxxx…" type="password"
              className="w-full bg-[#1f2937] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-[#25D366]/50" />
          </div>
        </div>
        <button onClick={connecter} disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
          style={{ background: "#25D366", boxShadow: "0 4px 20px rgba(37,211,102,0.3)" }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Wifi size={16} />}
          {loading ? "Vérification…" : "Tester et connecter"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WhatsAppPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contactActif, setContactActif] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [input, setInput] = useState("");
  const [recherche, setRecherche] = useState("");
  const [loading, setLoading] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [waConfig, setWaConfig] = useState<WaConfig | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [mobileThread, setMobileThread] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [slug, setSlug] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const contactActifRef = useRef<string | null>(null);

  const connecte = waConfig?.statut === "actif";
  const totalNonLus = conversations.reduce((s, c) => s + (c.nonLus || 0), 0);

  // Charger config + conversations + slug
  useEffect(() => {
    Promise.all([
      fetch("/api/connecteurs/whatsapp").then(r => r.json()),
      fetch("/api/messages/whatsapp").then(r => r.json()),
      fetch("/api/tenants/moi").then(r => r.json()),
    ]).then(([cfg, conv, tenant]) => {
      setWaConfig(cfg.config ? { statut: cfg.config.statut ?? "inactif", config: cfg.config.config } : null);
      setConversations(conv.conversations ?? []);
      setSlug(tenant.tenant?.slug ?? "");
      setLoading(false);
    });
  }, []);

  // Polling conversations toutes les 15s
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/messages/whatsapp").then(r => r.json()).then(d => {
        setConversations(d.conversations ?? []);
      }).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Charger thread quand on change de contact
  const chargerThread = useCallback(async (contact: string) => {
    const d = await fetch(`/api/messages/whatsapp?contact=${encodeURIComponent(contact)}`).then(r => r.json());
    setMessages(d.messages ?? []);
    setCommandes(d.commandes ?? []);
    setConversations(prev => prev.map(c => c.de === contact ? { ...c, lu: true, nonLus: 0 } : c));
  }, []);

  useEffect(() => {
    contactActifRef.current = contactActif;
    if (!contactActif) return;
    chargerThread(contactActif);
  }, [contactActif, chargerThread]);

  // Polling thread actif toutes les 10s
  useEffect(() => {
    pollRef.current && clearInterval(pollRef.current);
    if (!contactActif) return;
    pollRef.current = setInterval(() => {
      if (contactActifRef.current) chargerThread(contactActifRef.current);
    }, 10000);
    return () => { pollRef.current && clearInterval(pollRef.current); };
  }, [contactActif, chargerThread]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function envoyer(texte?: string) {
    const corps = (texte ?? input).trim();
    if (!corps || !contactActif || envoi) return;
    setEnvoi(true);
    setShowTemplates(false);
    try {
      const res = await fetch("/api/messages/whatsapp/envoyer", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: contactActif, message: corps }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(), de: contactActif, nom: null,
        corps, lu: true, direction: "sortant", commandeId: null,
        createdAt: new Date().toISOString(),
      }]);
      if (!texte) setInput("");
      setConversations(prev => prev.map(c =>
        c.de === contactActif ? { ...c, dernier: corps, updatedAt: new Date().toISOString() } : c
      ));
    } catch (e: any) { toast.error(e.message || "Erreur envoi"); }
    finally { setEnvoi(false); }
  }

  async function envoyerTracking(cmd: Commande) {
    if (!cmd.trackingToken) return;
    const url = `${window.location.origin}/${slug}/tracking/${cmd.trackingToken}`;
    const msg = `🚚 Suivez votre commande #${cmd.numero} en temps réel :\n${url}`;
    await envoyer(msg);
    toast.success("Lien de tracking envoyé !");
  }

  async function envoyerFacture(cmd: Commande) {
    if (!cmd.trackingToken) return;
    const url = `${window.location.origin}/${slug}/facture/${cmd.trackingToken}`;
    const msg = `📄 Voici votre facture pour la commande #${cmd.numero} :\n${url}`;
    await envoyer(msg);
    toast.success("Facture envoyée !");
  }

  async function confirmerCommande(commandeId: string, numero: string) {
    const res = await fetch(`/api/commandes/${commandeId}/statut`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: "confirmee" }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(`Commande #${numero} confirmée ✅`);
      setCommandes(prev => prev.map(c => c.id === commandeId ? { ...c, statut: "confirmee" } : c));
      if (data.whatsappUrl) window.open(data.whatsappUrl, "_blank");
    } else { toast.error(data.error || "Erreur"); }
  }

  const convsFiltrees = conversations.filter(c =>
    !recherche || (c.nom ?? c.de).toLowerCase().includes(recherche.toLowerCase()) || c.de.includes(recherche)
  );
  const convActuelle = conversations.find(c => c.de === contactActif);

  return (
    <div className="flex h-[calc(100vh-4rem)] rounded-2xl overflow-hidden border border-white/5" style={{ background: "#0d1117" }}>

      {/* ── GAUCHE : Conversations ── */}
      <div className={`${mobileThread ? "hidden" : "flex"} lg:flex flex-col border-r border-white/8 flex-shrink-0`} style={{ width: 320 }}>
        {/* Header */}
        <div className="p-4 border-b border-white/8 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#25D366" }}>
                <MessageCircle size={17} className="text-white" />
              </div>
              <div>
                <div className="font-bold text-white text-sm leading-tight">WhatsApp Business</div>
                {connecte && waConfig?.config?.numero_affiche && (
                  <div className="text-[10px] text-gray-500 font-mono">{waConfig.config.numero_affiche}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {totalNonLus > 0 && (
                <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold text-white" style={{ background: "#25D366" }}>
                  <Bell size={9} /> {totalNonLus}
                </div>
              )}
              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-semibold ${connecte ? "text-[#25D366]" : "text-red-400"}`}
                style={{ background: connecte ? "rgba(37,211,102,0.12)" : "rgba(239,68,68,0.12)" }}>
                {connecte ? <Wifi size={9} /> : <WifiOff size={9} />}
                {connecte ? "Actif" : "Hors ligne"}
              </div>
              <button onClick={() => setShowConfig(true)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-all">
                <Settings size={13} />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher…"
              className="w-full bg-white/5 border border-white/8 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#25D366]/40" />
          </div>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-600">
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : convsFiltrees.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.2)" }}>
                <MessageCircle size={24} style={{ color: "#25D366" }} />
              </div>
              <p className="text-gray-500 text-sm font-medium">Aucune conversation</p>
              {!connecte && (
                <button onClick={() => setShowConfig(true)} className="text-xs hover:underline" style={{ color: "#25D366" }}>
                  Connecter WhatsApp Business →
                </button>
              )}
            </div>
          ) : convsFiltrees.map(conv => {
            const actif = conv.de === contactActif;
            return (
              <button key={conv.de}
                onClick={() => { setContactActif(conv.de); setMobileThread(true); }}
                className="w-full flex items-start gap-3 px-4 py-3.5 border-b border-white/4 text-left transition-all hover:bg-white/4"
                style={{ borderLeft: actif ? "2px solid #25D366" : "2px solid transparent", background: actif ? "rgba(37,211,102,0.06)" : undefined }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                  style={{ background: avatarColor(conv.de) }}>
                  {initiales(conv.nom, conv.de)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-semibold text-sm text-white truncate">{conv.nom ?? conv.de}</p>
                    <span className="text-[10px] text-gray-600 flex-shrink-0 ml-2">{heure(conv.updatedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-600 truncate">{conv.dernier}</p>
                    {conv.nonLus > 0 && (
                      <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1" style={{ background: "#25D366" }}>
                        {conv.nonLus}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CENTRE : Thread ── */}
      <div className={`${!mobileThread ? "hidden" : "flex"} lg:flex flex-1 flex-col min-w-0`}>
        {contactActif && convActuelle ? (
          <>
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/8 flex items-center gap-3" style={{ background: "rgba(17,24,39,0.7)" }}>
              <button onClick={() => setMobileThread(false)} className="lg:hidden w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white">
                <ArrowLeft size={16} />
              </button>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: avatarColor(contactActif) }}>
                {initiales(convActuelle.nom, contactActif)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm leading-tight">{convActuelle.nom ?? contactActif}</p>
                <p className="text-[10px] text-gray-500 font-mono">{contactActif}</p>
              </div>
              <div className="flex items-center gap-2">
                {commandes.length > 0 && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1" style={{ color: "#F5A623", background: "rgba(245,166,35,0.12)" }}>
                    <ShoppingBag size={10} /> {commandes.length} cmd
                  </span>
                )}
                <a href={`tel:${contactActif}`} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-all">
                  <Phone size={13} />
                </a>
                <button onClick={() => chargerThread(contactActif)} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-all">
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5" style={{ background: "#0d1117" }}>
              {messages.map((msg, i) => {
                const sortant = msg.direction === "sortant";
                const showDate = i === 0 || new Date(messages[i - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="flex items-center justify-center my-3">
                        <span className="text-[10px] text-gray-600 px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
                          {new Date(msg.createdAt).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${sortant ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                        style={{
                          background: sortant ? "#25D366" : "#1f2937",
                          borderBottomRightRadius: sortant ? 4 : undefined,
                          borderBottomLeftRadius: !sortant ? 4 : undefined,
                          boxShadow: sortant ? "0 2px 8px rgba(37,211,102,0.18)" : "0 2px 8px rgba(0,0,0,0.25)",
                          color: "white",
                        }}>
                        <p className="whitespace-pre-wrap">{msg.corps}</p>
                        <div className={`flex items-center gap-1 mt-1 ${sortant ? "justify-end" : ""}`}>
                          <span className="text-[10px] opacity-50">{new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                          {sortant && (msg.lu ? <CheckCheck size={11} className="opacity-70" /> : <Check size={11} className="opacity-40" />)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Templates réponse rapide */}
            {showTemplates && (
              <div className="border-t border-white/8 p-3" style={{ background: "#111827" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={11} style={{ color: "#F5A623" }} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Réponses rapides</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATES.map((t, i) => (
                    <button key={i} onClick={() => envoyer(t.text)}
                      className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all hover:opacity-80"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#d1d5db" }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-white/8" style={{ background: "rgba(17,24,39,0.9)" }}>
              {!connecte ? (
                <div className="text-center py-3">
                  <p className="text-gray-500 text-sm">WhatsApp Business non connecté</p>
                  <button onClick={() => setShowConfig(true)} className="text-xs hover:underline mt-1" style={{ color: "#25D366" }}>
                    Connecter maintenant →
                  </button>
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <button onClick={() => setShowTemplates(s => !s)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                    style={{ background: showTemplates ? "rgba(245,166,35,0.2)" : "rgba(255,255,255,0.06)", color: showTemplates ? "#F5A623" : "#6b7280" }}>
                    <Zap size={14} />
                  </button>
                  <textarea value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyer(); } }}
                    placeholder="Tapez votre message… (Entrée pour envoyer)"
                    rows={1}
                    className="flex-1 border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none resize-none"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", maxHeight: 120 }}
                    onFocus={e => (e.target.style.borderColor = "rgba(37,211,102,0.4)")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                  <button onClick={() => envoyer()} disabled={!input.trim() || envoi}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-90 disabled:opacity-40 flex-shrink-0"
                    style={{ background: "#25D366", boxShadow: "0 3px 12px rgba(37,211,102,0.3)" }}>
                    {envoi ? <Loader2 size={15} className="animate-spin text-white" /> : <Send size={15} className="text-white" />}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4 max-w-xs">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto" style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.2)" }}>
                <MessageCircle size={36} style={{ color: "#25D366" }} />
              </div>
              <div>
                <p className="text-white font-semibold text-lg">WhatsApp Business</p>
                <p className="text-gray-600 text-sm mt-1">Sélectionnez une conversation ou attendez un message client</p>
              </div>
              {!connecte && (
                <button onClick={() => setShowConfig(true)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 mx-auto hover:opacity-90 transition-all"
                  style={{ background: "#25D366", boxShadow: "0 4px 16px rgba(37,211,102,0.3)" }}>
                  <Wifi size={14} /> Connecter WhatsApp Business
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── DROIT : Commandes du contact ── */}
      {contactActif && (
        <div className="hidden xl:flex flex-col border-l border-white/8 flex-shrink-0 overflow-y-auto" style={{ width: 280, background: "#0d1117" }}>
          <div className="p-4 border-b border-white/8">
            <p className="text-white font-semibold text-sm flex items-center gap-2">
              <ShoppingBag size={13} style={{ color: "#F5A623" }} />
              Commandes liées
              {commandes.length > 0 && <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(245,166,35,0.15)", color: "#F5A623" }}>{commandes.length}</span>}
            </p>
          </div>

          {commandes.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
              <ShoppingBag size={28} className="text-gray-800 mb-3" />
              <p className="text-gray-600 text-xs">Aucune commande liée à ce contact</p>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {commandes.map(cmd => {
                const s = STATUT_LABEL[cmd.statut] ?? { label: cmd.statut, color: "#9ca3af", icon: Clock };
                const Icon = s.icon;
                return (
                  <div key={cmd.id} className="rounded-xl p-3 space-y-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-white font-bold">#{cmd.numero}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ color: s.color, background: `${s.color}18` }}>
                        <Icon size={9} />{s.label}
                      </span>
                    </div>
                    {cmd.lignes.slice(0, 2).map((l, i) => (
                      <p key={i} className="text-xs text-gray-500 truncate">{l.nom} ×{l.quantite}</p>
                    ))}
                    <div className="text-xs font-bold" style={{ color: "#F5A623" }}>
                      {cmd.montantTotal.toLocaleString("fr-FR")} {cmd.devise}
                    </div>

                    {/* Actions */}
                    <div className="space-y-1.5 pt-1 border-t border-white/6">
                      {cmd.statut === "en_attente" && (
                        <button onClick={() => confirmerCommande(cmd.id, cmd.numero)}
                          className="w-full text-[11px] py-1.5 rounded-lg font-bold text-white flex items-center justify-center gap-1.5 hover:opacity-90 transition-all"
                          style={{ background: "#25D366" }}>
                          <CheckCircle2 size={11} /> Confirmer
                        </button>
                      )}
                      {cmd.trackingToken && (
                        <button onClick={() => envoyerTracking(cmd)}
                          className="w-full text-[11px] py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 hover:bg-white/8 transition-all"
                          style={{ color: "#60a5fa", background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.15)" }}>
                          <MapPin size={10} /> Envoyer tracking
                        </button>
                      )}
                      {cmd.trackingToken && (
                        <button onClick={() => envoyerFacture(cmd)}
                          className="w-full text-[11px] py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 hover:bg-white/8 transition-all"
                          style={{ color: "#a78bfa", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.15)" }}>
                          <FileText size={10} /> Envoyer facture
                        </button>
                      )}
                      <button onClick={() => router.push(`/dashboard/commandes/${cmd.id}`)}
                        className="w-full text-[11px] py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 hover:bg-white/8 transition-all"
                        style={{ color: "#9ca3af", border: "1px solid rgba(255,255,255,0.08)" }}>
                        Voir la commande →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Auto-confirm tip */}
          <div className="m-3 mt-auto p-3 rounded-xl" style={{ background: "rgba(37,211,102,0.06)", border: "1px solid rgba(37,211,102,0.15)" }}>
            <p className="text-xs font-semibold flex items-center gap-1.5 mb-1" style={{ color: "#25D366" }}>
              <Zap size={10} /> Confirmation auto
            </p>
            <p className="text-gray-600 text-xs leading-relaxed">
              Si le client répond <span className="font-mono text-white">"OUI"</span>, <span className="font-mono text-white">"CONFIRMER"</span> ou <span className="font-mono text-white">"OK"</span>, la commande se confirme automatiquement.
            </p>
          </div>
        </div>
      )}

      {showConfig && (
        <ConfigPanel onClose={() => setShowConfig(false)} onConnecte={cfg => { setWaConfig(cfg); setShowConfig(false); }} />
      )}
    </div>
  );
}
