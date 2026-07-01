"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Loader2, CheckCircle2, Image as ImageIcon, Sparkles } from "lucide-react";
import { AgentAvatar } from "@/components/dashboard/AgentAvatar";

interface Message {
  role: "user" | "assistant";
  content: string;
  actions?: string[];
  images?: string[];
}

// Extrait les URLs d'images du contenu (format [IMAGE:url])
function parseMessage(content: string): { text: string; images: string[] } {
  const images: string[] = [];
  const text = content.replace(/\[IMAGE:(https?:\/\/[^\]]+)\]/g, (_, url) => {
    images.push(url);
    return "";
  }).trim();
  return { text, images };
}

const SUGGESTIONS = [
  { texte: "Crée 3 produits pour une boutique de mode wax africaine avec photos IA", emoji: "👗" },
  { texte: "Génère un rapport complet de mes ventes du mois", emoji: "📊" },
  { texte: "Envoie une campagne email de relance à mes clients inactifs", emoji: "📧" },
  { texte: "Crée un post Instagram pour promouvoir mes meilleurs produits", emoji: "📱" },
  { texte: "Analyse mes produits sans image et génère des visuels IA", emoji: "🖼️" },
  { texte: "Qui sont mes meilleurs clients ? Envoie-leur un email VIP", emoji: "👑" },
  { texte: "Crée un code promo SUMMER30 de 30% et génère un visuel pour IG", emoji: "🎁" },
  { texte: "Quelles commandes sont en attente de livraison ?", emoji: "🚚" },
];

function ActionBadge({ action }: { action: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 rounded-lg">
      <CheckCircle2 size={10}/>{action}
    </span>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const estIA = msg.role === "assistant";
  const { text, images: parsedImages } = parseMessage(msg.content);
  const allImages = [...(parsedImages || []), ...(msg.images || [])];

  return (
    <div className={`flex gap-3 ${estIA ? "" : "flex-row-reverse"} group`}>
      {/* Avatar */}
      {estIA ? (
        <div className="flex-shrink-0 mt-1">
          <AgentAvatar state="idle" size={36} />
        </div>
      ) : (
        <div className="w-9 h-9 rounded-xl bg-[#F5A623]/15 border border-[#F5A623]/25 flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-sm">👤</span>
        </div>
      )}

      <div className="flex flex-col gap-2 max-w-[78%]">
        {/* Bulle texte */}
        {text && (
          <div
            className={`rounded-2xl px-4 py-3 ${
              estIA
                ? "bg-white border border-gray-100 text-gray-800 shadow-sm"
                : "text-white"
            }`}
            style={!estIA ? { background: "linear-gradient(135deg, #F5A623, #d4820a)" } : {}}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
          </div>
        )}

        {/* Images générées par IA */}
        {allImages.length > 0 && (
          <div className={`flex flex-wrap gap-2 ${estIA ? "" : "flex-row-reverse"}`}>
            {allImages.map((url, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden border border-gray-100 shadow-md group/img"
                style={{ width: 180, height: 180 }}>
                <img
                  src={url}
                  alt="Visuel généré par AXIA"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-end p-2">
                  <span className="opacity-0 group-hover/img:opacity-100 transition-opacity text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ImageIcon size={9}/> IA généré
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions effectuées */}
        {msg.actions && msg.actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {msg.actions.map((a, i) => <ActionBadge key={i} action={a}/>)}
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 mt-1">
        <AgentAvatar state="thinking" size={36}/>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2">
        <span className="text-sm text-gray-400">AXIA réfléchit</span>
        {[0,1,2].map(i => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#F5A623]"
            style={{ animation: `axiaDot 1s ${i*0.2}s ease-in-out infinite` }}/>
        ))}
      </div>
    </div>
  );
}

export default function IAPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Bonjour ! Je suis **AXIA**, votre assistante IA Axso 🌟\n\nJe peux tout gérer pour vous : créer des produits avec photos IA, lancer des campagnes marketing, analyser vos ventes, optimiser vos livraisons…\n\nDécrivez simplement ce que vous voulez faire — je m'occupe du reste.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarState, setAvatarState] = useState<"idle" | "thinking" | "speaking">("idle");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const envoyer = async (texte?: string) => {
    const txt = (texte || input).trim();
    if (!txt || loading) return;

    const userMsg: Message = { role: "user", content: txt };
    const historique = [...messages, userMsg];
    setMessages(historique);
    setInput("");
    setLoading(true);
    setAvatarState("thinking");

    try {
      const res = await fetch("/api/ai/universal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historique.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      setAvatarState("speaking");
      const data = await res.json();
      const { text, images } = parseMessage(data.reponse || "");

      setMessages([
        ...historique,
        {
          role: "assistant",
          content: text || data.message || "Action effectuée.",
          actions: data.actions || [],
          images,
        },
      ]);
    } catch {
      setMessages([...historique, { role: "assistant", content: "Désolé, une erreur est survenue. Réessayez." }]);
    } finally {
      setLoading(false);
      setTimeout(() => setAvatarState("idle"), 2000);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyer(); }
  };

  const showSuggestions = messages.length <= 1;

  return (
    <div className="h-full flex flex-col" style={{ background: "#f8f9fc" }}>

      {/* ─── Header AXIA ──────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-6 py-4 border-b border-gray-100 bg-white flex items-center gap-4"
        style={{ boxShadow: "0 1px 12px rgba(0,0,0,0.04)" }}
      >
        <AgentAvatar state={avatarState} size={56} />
        <div className="ml-2 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">AXIA</h1>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F5A623]/10 text-[#7a4800] border border-[#F5A623]/20">
              IA Universelle
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-0.5">
            Propulsée par freellmapi · 20+ capacités · Produits, Marketing, Analytics, Livraison
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
            En ligne
          </span>
          <a
            href="/dashboard/agents"
            className="text-xs text-[#d4820a] bg-[#F5A623]/8 px-3 py-1.5 rounded-lg border border-[#F5A623]/20 hover:bg-[#F5A623]/15 transition-colors"
          >
            <Sparkles size={11} className="inline mr-1"/>Voir les agents
          </a>
        </div>
      </div>

      {/* ─── Zone messages ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 min-h-0">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg}/>
        ))}
        {loading && <ThinkingBubble/>}
        <div ref={messagesEndRef}/>
      </div>

      {/* ─── Suggestions rapides ──────────────────────────────────── */}
      {showSuggestions && (
        <div className="flex-shrink-0 px-6 pb-3">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Essayez ces actions</p>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => envoyer(s.texte)}
                className="text-left text-xs bg-white border border-gray-200 text-gray-600 px-3 py-2.5 rounded-xl hover:border-[#F5A623]/40 hover:text-[#d4820a] hover:bg-amber-50/60 hover:shadow-sm transition-all flex items-start gap-2"
              >
                <span className="text-base leading-none flex-shrink-0">{s.emoji}</span>
                <span className="leading-snug">{s.texte}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Input ────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white">
        <div
          className="flex gap-3 items-end rounded-2xl border p-3 transition-all focus-within:border-[#F5A623]/50 focus-within:shadow-[0_0_0_3px_rgba(245,166,35,0.08)]"
          style={{ borderColor: "rgba(229,231,235,1)", background: "#fafafa" }}
        >
          {/* Mini avatar dans l'input */}
          <div className="flex-shrink-0 pb-0.5">
            <AgentAvatar state={loading ? "thinking" : "idle"} size={28}/>
          </div>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Parlez à AXIA — créer des produits, analyser les ventes, générer des visuels IA, envoyer des emails…"
            rows={1}
            disabled={loading}
            className="flex-1 bg-transparent text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none resize-none"
            style={{ maxHeight: "140px" }}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 140) + "px";
            }}
          />
          <button
            onClick={() => envoyer()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-35 flex-shrink-0"
            style={{ background: input.trim() && !loading ? "linear-gradient(135deg, #F5A623, #d4820a)" : "#f3f4f6" }}
          >
            {loading
              ? <Loader2 size={15} className="animate-spin text-gray-400"/>
              : <Send size={15} className={input.trim() ? "text-white" : "text-gray-400"}/>
            }
          </button>
        </div>
        <p className="text-center text-gray-300 text-[10px] mt-2">
          Entrée pour envoyer · Shift+Entrée pour saut de ligne · Les images sont générées automatiquement
        </p>
      </div>

      <style>{`
        @keyframes axiaDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.35; }
          40%            { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
