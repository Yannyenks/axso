"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle, Send, Search, RefreshCw, CheckCircle2,
  Clock, Truck, Package, XCircle, ChevronRight, Phone,
  Settings, Wifi, WifiOff, Loader2, ShoppingBag, ArrowLeft,
  CheckCheck, Check, Zap, User
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Conversation {
  de: string;
  nom: string | null;
  dernier: string;
  lu: boolean;
  nonLus: number;
  updatedAt: string;
}

interface Message {
  id: string;
  de: string;
  nom: string | null;
  corps: string;
  lu: boolean;
  direction: "entrant" | "sortant";
  commandeId: string | null;
  createdAt: string;
}

interface Commande {
  id: string;
  numero: string;
  statut: string;
  paiementStatut: string;
  montantTotal: number;
  devise: string;
  createdAt: string;
  lignes: { nom: string; quantite: number }[];
}

// ─── Config WhatsApp ──────────────────────────────────────────────────────────

interface WaConfig { statut: string; config: { phone_number_id?: string; numero_affiche?: string; verified_name?: string } | null }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function heure(iso: string) {
  const d = new Date(iso);
  const now = new Date();
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

const STATUT_LABEL: Record<string, { label: string; color: string; icon: any }> = {
  en_attente:     { label: "En attente",     color: "#f59e0b", icon: Clock },
  confirmee:      { label: "Confirmée",      color: "#60a5fa", icon: CheckCircle2 },
  en_preparation: { label: "En préparation", color: "#a78bfa", icon: Package },
  expediee:       { label: "Expédiée",       color: "#38bdf8", icon: Truck },
  livree:         { label: "Livrée",         color: "#34d399", icon: CheckCircle2 },
  annulee:        { label: "Annulée",        color: "#f87171", icon: XCircle },
};

// ─── Panel Config ─────────────────────────────────────────────────────────────

function ConfigPanel({ onClose, onConnecte }: { onClose: () => void; onConnecte: (cfg: WaConfig) => void }) {
  const [form, setForm] = useState({ phone_number_id: "", access_token: "" });
  const [loading, setLoading] = useState(false);

  async function connecter() {
    if (!form.phone_number_id || !form.access_token) { toast.error("Remplissez tous les champs"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/connecteurs/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`✅ WhatsApp Business connecté ! (${data.numero ?? ""})`);
      onConnecte({ statut: "actif", config: { phone_number_id: form.phone_number_id, numero_affiche: data.numero, verified_name: data.nom } });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <MessageCircle size={20} className="text-[#25D366]" /> Connecter WhatsApp Business
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>

        <div className="bg-[#25D366]/10 border border-[#25D366]/25 rounded-xl p-4 space-y-1 text-sm text-gray-300">
          <p className="font-semibold text-[#25D366]">Comment obtenir vos identifiants ?</p>
          <p>1. Allez sur <span className="font-mono text-white">developers.facebook.com</span></p>
          <p>2. Créez une app → Ajouter WhatsApp Business</p>
          <p>3. Copiez le <span className="font-mono text-[#25D366]">Phone Number ID</span> et le <span className="font-mono text-[#25D366]">Token d'accès</span></p>
          <p>4. Configurez le webhook → <span className="font-mono text-xs text-white">https://axso.vercel.app/api/webhooks/whatsapp</span></p>
          <p>   Token de vérification : <span className="font-mono text-xs text-white">axso_meta_2026</span></p>
          <p>5. S'abonner à l'événement <span className="font-mono text-white">messages</span></p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-gray-400 text-xs block mb-1.5">Phone Number ID *</label>
            <input
              value={form.phone_number_id}
              onChange={e => setForm(f => ({ ...f, phone_number_id: e.target.value }))}
              placeholder="Ex: 123456789012345"
              className="w-full bg-[#1f2937] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-[#25D366]/50"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs block mb-1.5">Token d'accès *</label>
            <input
              value={form.access_token}
              onChange={e => setForm(f => ({ ...f, access_token: e.target.value }))}
              placeholder="EAAxxxxxxx..."
              type="password"
              className="w-full bg-[#1f2937] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-[#25D366]/50"
            />
          </div>
        </div>

        <button
          onClick={connecter}
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "#25D366", boxShadow: "0 4px 20px rgba(37,211,102,0.3)" }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Wifi size={16} />}
          {loading ? "Connexion en cours…" : "Tester et connecter"}
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const connecte = waConfig?.statut === "actif";

  // Charger config + conversations
  useEffect(() => {
    Promise.all([
      fetch("/api/connecteurs/whatsapp").then(r => r.json()),
      fetch("/api/messages/whatsapp").then(r => r.json()),
    ]).then(([cfg, conv]) => {
      setWaConfig(cfg.config ? { statut: cfg.config.statut ?? "inactif", config: cfg.config.config } : null);
      setConversations(conv.conversations ?? []);
      setLoading(false);
    });
  }, []);

  // Charger le thread quand on change de contact
  useEffect(() => {
    if (!contactActif) return;
    fetch(`/api/messages/whatsapp?contact=${encodeURIComponent(contactActif)}`)
      .then(r => r.json())
      .then(d => {
        setMessages(d.messages ?? []);
        setCommandes(d.commandes ?? []);
        // Mettre à jour nonLus dans la liste
        setConversations(prev => prev.map(c => c.de === contactActif ? { ...c, lu: true, nonLus: 0 } : c));
      });
  }, [contactActif]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function envoyer() {
    if (!input.trim() || !contactActif || envoi) return;
    setEnvoi(true);
    try {
      const res = await fetch("/api/messages/whatsapp/envoyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: contactActif, message: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Ajouter le message sortant localement
      const newMsg: Message = {
        id: Date.now().toString(),
        de: contactActif,
        nom: null,
        corps: input.trim(),
        lu: true,
        direction: "sortant",
        commandeId: null,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, newMsg]);
      setInput("");
      // Mettre à jour la conversation dans la liste
      setConversations(prev => prev.map(c =>
        c.de === contactActif ? { ...c, dernier: input.trim(), updatedAt: new Date().toISOString() } : c
      ));
    } catch (e: any) {
      toast.error(e.message || "Erreur envoi");
    } finally {
      setEnvoi(false);
    }
  }

  async function confirmerCommande(commandeId: string, numero: string) {
    const res = await fetch(`/api/commandes/${commandeId}/statut`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: "confirmee" }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(`Commande #${numero} confirmée ✅`);
      setCommandes(prev => prev.map(c => c.id === commandeId ? { ...c, statut: "confirmee" } : c));
      if (data.whatsappUrl) window.open(data.whatsappUrl, "_blank");
    } else {
      toast.error(data.error || "Erreur");
    }
  }

  const convsFiltrees = conversations.filter(c =>
    !recherche || (c.nom ?? c.de).toLowerCase().includes(recherche.toLowerCase()) || c.de.includes(recherche)
  );

  const convActuelle = conversations.find(c => c.de === contactActif);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#0d1117] rounded-2xl overflow-hidden border border-white/5">

      {/* ── PANEL GAUCHE : Conversations ── */}
      <div className={`${mobileThread ? "hidden" : "flex"} lg:flex flex-col w-full lg:w-80 xl:w-96 border-r border-white/8 flex-shrink-0`}>
        {/* Header */}
        <div className="p-4 border-b border-white/8 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#25D366" }}>
                <MessageCircle size={15} className="text-white" />
              </div>
              <span className="font-bold text-white">WhatsApp Business</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${connecte ? "bg-[#25D366]/15 text-[#25D366]" : "bg-red-500/15 text-red-400"}`}>
                {connecte ? <Wifi size={10} /> : <WifiOff size={10} />}
                {connecte ? "Connecté" : "Non connecté"}
              </div>
              <button onClick={() => setShowConfig(true)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/8 transition-all">
                <Settings size={14} />
              </button>
            </div>
          </div>
          {/* Numéro connecté */}
          {connecte && waConfig?.config?.numero_affiche && (
            <p className="text-xs text-gray-500 font-mono">{waConfig.config.numero_affiche} · {waConfig.config.verified_name}</p>
          )}
          {/* Recherche */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
              placeholder="Rechercher…"
              className="w-full bg-white/5 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#25D366]/40"
            />
          </div>
        </div>

        {/* Liste conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : convsFiltrees.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageCircle size={32} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm font-medium">Aucun message</p>
              {!connecte && (
                <button onClick={() => setShowConfig(true)} className="mt-3 text-xs text-[#25D366] hover:underline">
                  Connecter WhatsApp Business →
                </button>
              )}
            </div>
          ) : (
            convsFiltrees.map(conv => {
              const actif = conv.de === contactActif;
              const ini = initiales(conv.nom, conv.de);
              return (
                <button
                  key={conv.de}
                  onClick={() => { setContactActif(conv.de); setMobileThread(true); }}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 border-b border-white/4 text-left transition-all hover:bg-white/4 ${actif ? "bg-[#25D366]/8 border-l-2 border-l-[#25D366]" : ""}`}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
                    style={{ background: `hsl(${(conv.de.charCodeAt(conv.de.length - 1) * 37) % 360}, 55%, 40%)` }}>
                    {ini}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-semibold text-sm text-white truncate">{conv.nom ?? conv.de}</p>
                      <span className="text-[10px] text-gray-500 flex-shrink-0 ml-2">{heure(conv.updatedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-500 truncate">{conv.dernier}</p>
                      {conv.nonLus > 0 && (
                        <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1" style={{ background: "#25D366" }}>
                          {conv.nonLus}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── PANEL CENTRAL : Thread ── */}
      <div className={`${!mobileThread ? "hidden" : "flex"} lg:flex flex-1 flex-col min-w-0`}>
        {contactActif && convActuelle ? (
          <>
            {/* Header thread */}
            <div className="px-4 py-3.5 border-b border-white/8 flex items-center gap-3 bg-[#111827]/60">
              <button onClick={() => { setMobileThread(false); }} className="lg:hidden w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white">
                <ArrowLeft size={16} />
              </button>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: `hsl(${(contactActif.charCodeAt(contactActif.length - 1) * 37) % 360}, 55%, 40%)` }}>
                {initiales(convActuelle.nom, contactActif)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">{convActuelle.nom ?? contactActif}</p>
                <p className="text-xs text-gray-500 font-mono">{contactActif}</p>
              </div>
              <div className="flex items-center gap-2">
                {commandes.length > 0 && (
                  <span className="text-xs bg-[#F5A623]/15 text-[#F5A623] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                    <ShoppingBag size={10} /> {commandes.length} commande{commandes.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#0d1117]"
              style={{ backgroundImage: "radial-gradient(circle at 50% 50%, rgba(37,211,102,0.02) 0%, transparent 70%)" }}>
              {messages.map((msg, i) => {
                const sortant = msg.direction === "sortant";
                const showDate = i === 0 || new Date(messages[i - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="flex items-center justify-center my-3">
                        <span className="text-[10px] text-gray-600 bg-white/4 px-3 py-1 rounded-full">
                          {new Date(msg.createdAt).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${sortant ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${sortant ? "rounded-br-sm text-white" : "rounded-bl-sm text-gray-100"}`}
                        style={{
                          background: sortant ? "#25D366" : "#1f2937",
                          boxShadow: sortant ? "0 2px 8px rgba(37,211,102,0.2)" : "0 2px 8px rgba(0,0,0,0.3)",
                        }}
                      >
                        <p className="whitespace-pre-wrap">{msg.corps}</p>
                        <div className={`flex items-center gap-1 mt-1 ${sortant ? "justify-end" : ""}`}>
                          <span className="text-[10px] opacity-60">{new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                          {sortant && (msg.lu ? <CheckCheck size={11} className="opacity-80" /> : <Check size={11} className="opacity-50" />)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Zone de réponse */}
            <div className="p-3 border-t border-white/8 bg-[#111827]/80">
              {!connecte ? (
                <div className="text-center py-3">
                  <p className="text-gray-500 text-sm">WhatsApp Business non connecté</p>
                  <button onClick={() => setShowConfig(true)} className="text-[#25D366] text-xs hover:underline mt-1">
                    Connecter maintenant →
                  </button>
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyer(); } }}
                    placeholder="Tapez votre message…"
                    rows={1}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#25D366]/40 resize-none"
                    style={{ maxHeight: "120px" }}
                  />
                  <button
                    onClick={envoyer}
                    disabled={!input.trim() || envoi}
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:opacity-90 disabled:opacity-40 flex-shrink-0"
                    style={{ background: "#25D366", boxShadow: "0 3px 12px rgba(37,211,102,0.35)" }}
                  >
                    {envoi ? <Loader2 size={16} className="animate-spin text-white" /> : <Send size={16} className="text-white" />}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "#25D366" }}>
                <MessageCircle size={28} className="text-white" />
              </div>
              <p className="text-gray-300 font-semibold">Sélectionnez une conversation</p>
              <p className="text-gray-600 text-sm max-w-xs">
                Toutes vos conversations WhatsApp Business apparaissent ici en temps réel
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── PANEL DROIT : Commandes du contact ── */}
      {contactActif && commandes.length > 0 && (
        <div className="hidden xl:flex flex-col w-72 border-l border-white/8 flex-shrink-0 overflow-y-auto bg-[#0d1117]">
          <div className="p-4 border-b border-white/8">
            <p className="text-white font-semibold text-sm flex items-center gap-2">
              <ShoppingBag size={14} className="text-[#F5A623]" /> Commandes
            </p>
          </div>
          <div className="p-3 space-y-2">
            {commandes.map(cmd => {
              const s = STATUT_LABEL[cmd.statut] ?? { label: cmd.statut, color: "#9ca3af", icon: Clock };
              const Icon = s.icon;
              return (
                <div key={cmd.id} className="bg-white/4 border border-white/8 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-white font-bold">#{cmd.numero}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: s.color, background: `${s.color}18` }}>
                      <Icon size={9} className="inline mr-1" />{s.label}
                    </span>
                  </div>
                  {cmd.lignes.slice(0, 2).map((l, i) => (
                    <p key={i} className="text-xs text-gray-400 truncate">{l.nom} ×{l.quantite}</p>
                  ))}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-[#F5A623]">
                      {cmd.montantTotal.toLocaleString()} {cmd.devise}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {cmd.statut === "en_attente" && (
                        <button
                          onClick={() => confirmerCommande(cmd.id, cmd.numero)}
                          className="text-[10px] px-2.5 py-1 rounded-lg font-semibold text-white transition-all hover:opacity-90"
                          style={{ background: "#25D366" }}
                        >
                          Confirmer
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/dashboard/commandes/${cmd.id}`)}
                        className="text-[10px] px-2 py-1 rounded-lg text-gray-400 hover:text-white border border-white/10 transition-all"
                      >
                        Voir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Auto-confirm tip */}
          <div className="m-3 p-3 rounded-xl bg-[#25D366]/8 border border-[#25D366]/20">
            <p className="text-[#25D366] text-xs font-semibold flex items-center gap-1.5 mb-1">
              <Zap size={11} /> Confirmation automatique
            </p>
            <p className="text-gray-500 text-xs leading-relaxed">
              Si le client répond <span className="font-mono text-white">"OUI"</span>, <span className="font-mono text-white">"CONFIRMER"</span> ou <span className="font-mono text-white">"OK"</span>, la commande se confirme automatiquement.
            </p>
          </div>
        </div>
      )}

      {/* ── Modal Config ── */}
      {showConfig && (
        <ConfigPanel
          onClose={() => setShowConfig(false)}
          onConnecte={cfg => { setWaConfig(cfg); setShowConfig(false); }}
        />
      )}
    </div>
  );
}
