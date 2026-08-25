"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Send, Loader2, Mic, MicOff, LayoutDashboard, History, Sparkles, PanelLeft, Plus } from "lucide-react";
import { renderMarkdown, parseContent } from "@/lib/axia-format";
import { useAxiaConversations } from "@/hooks/useAxiaConversations";
import { AxiaConversationSidebar } from "@/components/dashboard/AxiaConversationSidebar";

interface Msg { role: "user" | "assistant"; content: string; streaming?: boolean }

const SUGGESTIONS = [
  "Fais un rapport complet de mes ventes",
  "Quels produits risquent d'être en rupture ?",
  "Génère un post Instagram pour mes produits",
  "Quels clients relancer aujourd'hui ?",
  "Crée un code promo flash de 20% pendant 24h",
  "Résume l'activité d'aujourd'hui",
];

// Écran d'accueil du dashboard — AXIA est le point d'entrée principal (les
// marchands lui parlent directement), le dashboard classique est accessible
// en un clic via le bouton "Tableau de bord" plutôt que d'être l'écran par
// défaut. Voir /dashboard/accueil pour l'ancienne vue d'ensemble.
export default function AxiaHomePage() {
  const [nomBoutique, setNomBoutique] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const {
    conversations, activeId, loadingList,
    creerConversation, chargerConversation, sauvegarder, renommer, supprimer, setActiveId,
  } = useAxiaConversations();

  useEffect(() => {
    fetch("/api/tenants/moi").then(r => r.json()).then(d => setNomBoutique(d?.nomBoutique ?? null)).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function ouvrirConversation(id: string) {
    setActiveId(id);
    setSidebarOpen(false);
    const conv = await chargerConversation(id);
    setMessages(conv?.messages ?? []);
  }

  async function nouvelleConversation() {
    setActiveId(null);
    setMessages([]);
    setSidebarOpen(false);
    inputRef.current?.focus();
  }

  async function supprimerConversation(id: string) {
    await supprimer(id);
    if (activeId === id) { setActiveId(null); setMessages([]); }
  }

  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const rec = new SR();
    rec.lang = "fr-FR";
    rec.onresult = (e: any) => setInput(Array.from(e.results).map((r: any) => r[0].transcript).join(""));
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const envoyer = async (txt?: string) => {
    const msg = (txt ?? input).trim();
    if (!msg || loading) return;

    // Crée le fil de discussion au premier message si on part d'un écran vide.
    let convId = activeId;
    if (!convId) convId = await creerConversation();

    const hist: Msg[] = [...messages, { role: "user", content: msg }];
    setMessages([...hist, { role: "assistant", content: "", streaming: true }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/axia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: hist.map(m => ({ role: m.role, content: m.content })), stream: true }),
      });
      if (!res.ok || !res.body) throw new Error(`Erreur ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "token" && data.text) {
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.streaming) return [...prev.slice(0, -1), { ...last, content: last.content + data.text }];
                return prev;
              });
            } else if (data.type === "done") {
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.streaming) return [...prev.slice(0, -1), { ...last, streaming: false }];
                return prev;
              });
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.streaming) return [...prev.slice(0, -1), { role: "assistant", content: `Erreur : ${err.message}` }];
        return prev;
      });
    } finally {
      setLoading(false);
      setMessages(prev => {
        const finalMsgs = prev.map(m => ({ ...m, streaming: false }));
        if (convId) sauvegarder(convId, finalMsgs);
        return finalMsgs;
      });
      inputRef.current?.focus();
    }
  };

  const isEmpty = messages.length === 0;

  const InputBar = ({ centered }: { centered?: boolean }) => (
    <div className={centered ? "w-full max-w-2xl mx-auto" : "flex-shrink-0 px-4 sm:px-6 pb-4 sm:pb-6 pt-2"}>
      <div className="flex items-center gap-2 rounded-2xl px-4 py-3 transition-colors"
        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(10px)" }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); envoyer(); } }}
          placeholder="Demande n'importe quoi à AXIA…"
          disabled={loading}
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
        />
        <button onClick={toggleVoice}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
          style={{ background: listening ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.06)" }}>
          {listening ? <MicOff size={14} className="text-red-400 animate-pulse" /> : <Mic size={14} className="text-white/50" />}
        </button>
        <button onClick={() => envoyer()} disabled={!input.trim() || loading}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0"
          style={{ background: input.trim() && !loading ? "#F5A623" : "rgba(255,255,255,0.06)" }}>
          {loading ? <Loader2 size={13} className="animate-spin text-white/50" /> : <Send size={13} className={input.trim() ? "text-[#1B2A4A]" : "text-white/40"} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex min-h-0" style={{ fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif" }}>

      {/* Sidebar conversations — colonne persistante desktop, tiroir sur mobile */}
      <div className={`flex-shrink-0 overflow-hidden transition-all duration-300 ${sidebarOpen ? "w-[260px]" : "w-0"} hidden lg:block`}>
        <div className="w-[260px] h-full">
          <AxiaConversationSidebar
            conversations={conversations} activeId={activeId} loading={loadingList}
            onSelect={ouvrirConversation} onNew={nouvelleConversation}
            onDelete={supprimerConversation} onRename={renommer}
          />
        </div>
      </div>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setSidebarOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-[80%] max-w-[300px]" onClick={e => e.stopPropagation()}>
            <AxiaConversationSidebar
              conversations={conversations} activeId={activeId} loading={loadingList}
              onSelect={ouvrirConversation} onNew={nouvelleConversation}
              onDelete={supprimerConversation} onRename={renommer} onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 h-full flex flex-col min-h-0" style={{ background: "linear-gradient(160deg,#0d1526 0%,#1B2A4A 55%,#16233f 100%)" }}>
        {/* Barre supérieure */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 sm:px-6 py-4">
          <div className="flex items-center gap-1.5">
            <button onClick={() => setSidebarOpen(v => !v)}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10 flex-shrink-0"
              title="Historique des conversations">
              <PanelLeft size={15} className="text-white/60" />
            </button>
            <button onClick={nouvelleConversation}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10 flex-shrink-0 lg:hidden"
              title="Nouvelle conversation">
              <Plus size={15} className="text-white/60" />
            </button>
            <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 ml-1" style={{ boxShadow: "0 0 20px rgba(245,166,35,0.25)" }}>
              <img src="/axia-icon.png" alt="Axia" className="w-full h-full object-cover" />
            </div>
            <span className="text-white font-bold text-sm tracking-tight">AXIA</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/axia/journal"
              className="flex items-center gap-1.5 text-[11.5px] font-semibold text-white/60 hover:text-white border border-white/10 hover:border-white/25 rounded-full px-3 py-1.5 transition-all">
              <History size={12} /> Journal
            </Link>
            <Link href="/dashboard/accueil"
              className="flex items-center gap-1.5 text-[11.5px] font-bold rounded-full px-3.5 py-1.5 transition-all hover:opacity-90"
              style={{ background: "#F5A623", color: "#1B2A4A" }}>
              <LayoutDashboard size={12} /> Tableau de bord
            </Link>
          </div>
        </div>

        {isEmpty ? (
          /* ── Écran d'accueil centré ────────────────────────────────── */
          <div className="flex-1 flex flex-col items-center justify-center px-6 min-h-0">
            <div className="ax-axia-mascot w-20 h-20 sm:w-24 sm:h-24 mb-5 rounded-3xl overflow-hidden"
              style={{ boxShadow: "0 0 50px rgba(245,166,35,0.35), 0 8px 30px rgba(0,0,0,0.3)" }}>
              <img src="/axia-icon.png" alt="Axia" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white text-center mb-1.5">
              {nomBoutique ? `Bonjour, ${nomBoutique}` : "Bonjour"}
            </h1>
            <p className="text-white/40 text-sm text-center mb-8">Que veux-tu faire pour ta boutique aujourd'hui ?</p>

            <InputBar centered />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 w-full max-w-2xl">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => envoyer(s)}
                  className="flex items-center gap-2 text-left px-4 py-3 rounded-2xl text-[13px] text-white/70 hover:text-white transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Sparkles size={12} className="flex-shrink-0" style={{ color: "#F5A623" }} />
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ── Conversation ──────────────────────────────────────────── */
          <>
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4 min-h-0 max-w-3xl w-full mx-auto">
              {messages.map((m, i) => {
                const { text, images, videos } = parseContent(m.content);
                return (
                  <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden"
                      style={m.role === "user" ? { background: "#F5A623" } : { background: "rgba(255,255,255,0.08)" }}>
                      {m.role === "assistant"
                        ? <img src="/axia-icon.png" alt="Axia" className="w-full h-full object-cover" />
                        : <span className="text-[11px] font-bold text-[#1B2A4A]">{(nomBoutique ?? "M")[0]}</span>}
                    </div>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "text-[#1B2A4A] font-medium" : "text-white/90"}`}
                      style={m.role === "user" ? { background: "#F5A623" } : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      {m.role === "assistant"
                        ? <div className="axia-md" dangerouslySetInnerHTML={{ __html: renderMarkdown(text || (m.streaming ? "" : m.content)) }} />
                        : <span className="whitespace-pre-wrap">{text}</span>}
                      {images.map((src, j) => <img key={j} src={src} alt="" className="rounded-xl mt-2 max-w-full" />)}
                      {videos.map((src, j) => <video key={j} src={src} controls className="rounded-xl mt-2 max-w-full" />)}
                      {m.streaming && (
                        <span className="inline-flex gap-0.5 ml-1 align-middle">
                          {[0, 1, 2].map(k => (
                            <span key={k} className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "rgba(255,255,255,0.4)", animation: `xdot 1s ${k * 0.15}s ease-in-out infinite` }} />
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <InputBar />
          </>
        )}

        <style>{`
          @keyframes xdot{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}}
          .axia-md .axia-p{margin:0 0 8px}
          .axia-md .axia-p:last-child{margin-bottom:0}
          .axia-md .axia-h1,.axia-md .axia-h2,.axia-md .axia-h3{font-weight:700;margin:10px 0 4px;color:#fff}
          .axia-md .axia-ul{margin:4px 0 8px;padding-left:18px}
          .axia-md .axia-li{margin:2px 0}
          .axia-md .axia-link{color:#F5A623;text-decoration:underline}
          .axia-md .axia-inline-code{background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:5px;font-size:0.85em}
          .axia-md .axia-pre{background:rgba(0,0,0,0.3);border-radius:10px;padding:10px 12px;overflow-x:auto;margin:6px 0}
          .axia-md .axia-bq{border-left:2px solid #F5A623;padding-left:10px;opacity:0.8;margin:6px 0}
        `}</style>
      </div>
    </div>
  );
}
