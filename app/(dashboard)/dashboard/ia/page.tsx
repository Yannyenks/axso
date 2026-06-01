"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, User, Bot, CheckCircle2, Zap } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  actions?: string[];
}

const SUGGESTIONS = [
  { texte: "Ajoute un produit 'Robe wax premium' à 25000 XOF", emoji: "➕" },
  { texte: "Crée un code promo BIENVENUE20 de 20%", emoji: "🎁" },
  { texte: "Montre-moi mes stats des 30 derniers jours", emoji: "📊" },
  { texte: "Change mon thème pour Noir Obsidien", emoji: "🎨" },
  { texte: "Ajoute 5 produits pour une boutique de cosmétiques", emoji: "✨" },
  { texte: "Comment optimiser mes ventes ce mois-ci ?", emoji: "💡" },
];

function ActionBadge({ action }: { action: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 rounded-lg">
      <CheckCircle2 size={11} />
      {action}
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const estIA = msg.role === "assistant";
  return (
    <div className={`flex gap-3 ${estIA ? "" : "flex-row-reverse"}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
        estIA ? "bg-[#F5A623]/20 border border-[#F5A623]/30" : "bg-gray-100 border border-gray-200"
      }`}>
        {estIA ? <Bot size={14} className="text-[#F5A623]" /> : <User size={14} className="text-gray-500" />}
      </div>
      <div className="flex flex-col gap-2 max-w-[80%]">
        <div className={`rounded-2xl px-4 py-3 ${
          estIA
            ? "bg-white border border-gray-100 text-gray-800 shadow-sm"
            : "bg-[#F5A623] text-white"
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        </div>
        {msg.actions && msg.actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {msg.actions.map((a, i) => <ActionBadge key={i} action={a} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function IAPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Bonjour ! Je suis votre copilote IA Axso 🤖\n\nJe peux prendre des actions directes sur votre boutique — ajouter des produits, créer des promos, analyser vos ventes, changer votre thème, et bien plus.\n\nQue souhaitez-vous faire ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const envoyer = async (texte?: string) => {
    const txt = texte || input.trim();
    if (!txt || loading) return;

    const userMsg: Message = { role: "user", content: txt };
    const historique = [...messages, userMsg];
    setMessages(historique);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/copilote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historique.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      setMessages([
        ...historique,
        {
          role: "assistant",
          content: data.reponse || data.message || "Réponse reçue.",
          actions: data.actions || [],
        },
      ]);
    } catch {
      setMessages([
        ...historique,
        { role: "assistant", content: "Désolé, une erreur s'est produite. Réessayez." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      envoyer();
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#F5A623]/20 border border-[#F5A623]/30 flex items-center justify-center">
          <Bot className="text-[#F5A623]" size={18} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Copilote IA</h1>
          <p className="text-gray-400 text-xs">Propulsé par Claude · Agit sur votre boutique</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-[#F5A623] bg-[#F5A623]/10 px-3 py-1.5 rounded-lg border border-[#F5A623]/20">
            <Zap size={11} /> Actions directes
          </div>
          <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            En ligne
          </div>
        </div>
      </div>

      {/* Zone chat */}
      <div className="flex-1 bg-white border border-gray-100 rounded-2xl flex flex-col overflow-hidden min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#F5A623]/20 border border-[#F5A623]/30 flex items-center justify-center">
                <Bot size={14} className="text-[#F5A623]" />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm">
                <Loader2 size={14} className="text-[#F5A623] animate-spin" />
                <span className="text-gray-400 text-sm">En train d'agir...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="px-6 pb-4">
            <p className="text-gray-400 text-xs mb-3 uppercase tracking-wider font-medium">Actions rapides</p>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => envoyer(s.texte)}
                  className="text-left text-xs bg-gray-50 border border-gray-200 text-gray-600 px-3 py-2.5 rounded-xl hover:border-[#F5A623]/40 hover:text-[#F5A623] hover:bg-orange-50/50 transition-all flex items-start gap-2"
                >
                  <span className="flex-shrink-0">{s.emoji}</span>
                  <span>{s.texte}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Dites à l'IA ce que vous voulez faire..."
              rows={1}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:border-[#F5A623]/50 focus:ring-2 focus:ring-[#F5A623]/10 focus:outline-none resize-none transition-all"
              disabled={loading}
              style={{ maxHeight: "120px" }}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 120) + "px";
              }}
            />
            <button
              onClick={() => envoyer()}
              disabled={!input.trim() || loading}
              className="w-11 h-11 rounded-xl bg-[#F5A623] flex items-center justify-center hover:bg-[#D4911A] transition-colors disabled:opacity-40 flex-shrink-0"
            >
              {loading ? <Loader2 size={16} className="animate-spin text-white" /> : <Send size={16} className="text-white" />}
            </button>
          </div>
          <p className="text-center text-gray-300 text-[10px] mt-2">Entrée pour envoyer · Shift+Entrée pour saut de ligne</p>
        </div>
      </div>
    </div>
  );
}
