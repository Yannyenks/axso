"use client";
// Page Assistant IA Axso  chat avec Claude
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const suggestionsRapides = [
  "Génère une description pour ma nouvelle robe wax",
  "Suggère-moi un prix pour des bijoux artisanaux au Sénégal",
  "Rédige un email marketing pour mes clientes",
  "Comment améliorer mon taux de conversion ?",
  "Crée un code promo attractif pour le week-end",
  "Analyse mes ventes et donne-moi des conseils",
];

function MessageBubble({ msg }: { msg: Message }) {
  const estIA = msg.role === "assistant";
  return (
    <div className={`flex gap-3 ${estIA ? "" : "flex-row-reverse"}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
        estIA ? "bg-[#7c3aed]/20 border border-[#7c3aed]/30" : "bg-[#F5A623]/20 border border-[#F5A623]/30"
      }`}>
        {estIA ? <Sparkles size={14} className="text-[#7c3aed]" /> : <User size={14} className="text-[#F5A623]" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
        estIA
          ? "bg-[#1a0a2e] border border-[#7c3aed]/20 text-gray-200"
          : "bg-[#F5A623]/10 border border-[#F5A623]/20 text-gray-100"
      }`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
      </div>
    </div>
  );
}

export default function IAPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Bonjour ! ?? Je suis votre assistant IA Axso, spécialisé dans le commerce africain. Je peux vous aider à rédiger des descriptions produits, optimiser vos prix, créer du contenu marketing et bien plus encore. Que puis-je faire pour vous aujourd'hui ? ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const envoyerMessage = async (texte?: string) => {
    const messageTexte = texte || input.trim();
    if (!messageTexte || loading) return;

    const userMsg: Message = { role: "user", content: messageTexte };
    const nouveauxMessages = [...messages, userMsg];
    setMessages(nouveauxMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nouveauxMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      setMessages([...nouveauxMessages, { role: "assistant", content: data.reponse }]);
    } catch {
      setMessages([...nouveauxMessages, {
        role: "assistant",
        content: "Désolé, une erreur s'est produite. Vérifiez votre clé ANTHROPIC_API_KEY dans .env.local.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Titre */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/20 border border-[#7c3aed]/30 flex items-center justify-center">
          <Sparkles className="text-[#7c3aed]" size={18} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Assistant IA</h1>
          <p className="text-gray-400 text-xs">Propulsé par Claude · Spécialisé Afrique</p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          En ligne
        </div>
      </div>

      {/* Zone de chat */}
      <div className="flex-1 bg-white border border-gray-100 rounded-2xl flex flex-col overflow-hidden min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#7c3aed]/20 flex items-center justify-center">
                <Sparkles size={14} className="text-[#7c3aed]" />
              </div>
              <div className="bg-[#1a0a2e] border border-[#7c3aed]/20 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 size={14} className="text-[#7c3aed] animate-spin" />
                <span className="text-gray-400 text-sm">En train de réfléchir...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions rapides */}
        {messages.length <= 1 && (
          <div className="px-6 pb-4">
            <p className="text-gray-500 text-xs mb-3 uppercase tracking-wider">Suggestions</p>
            <div className="flex flex-wrap gap-2">
              {suggestionsRapides.map((s, i) => (
                <button
                  key={i}
                  onClick={() => envoyerMessage(s)}
                  className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:border-[#F5A623]/30 hover:text-[#F5A623] transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Zone de saisie */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && envoyerMessage()}
              placeholder="Demandez quelque chose à votre assistant..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm placeholder:text-gray-600 focus:border-[#7c3aed]/40 focus:outline-none"
              disabled={loading}
            />
            <button
              onClick={() => envoyerMessage()}
              disabled={!input.trim() || loading}
              className="w-11 h-11 rounded-xl bg-[#7c3aed] flex items-center justify-center hover:bg-[#6d28d9] transition-colors disabled:opacity-40"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

