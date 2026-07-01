"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, X, Mic, MicOff, Send, Volume2, VolumeX, Minimize2, Phone } from "lucide-react";

interface Msg { role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  { emoji: "📊", label: "Voir mes stats du mois" },
  { emoji: "➕", label: "Ajouter un produit" },
  { emoji: "🎯", label: "Créer un code promo" },
];

export function AxiaFloat() {
  const [open, setOpen]             = useState(false);
  const [voiceMode, setVoiceMode]   = useState(false);
  const [messages, setMessages]     = useState<Msg[]>([]);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [recording, setRecording]   = useState(false);
  const [ttsOn, setTtsOn]           = useState(false);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const recognRef    = useRef<any>(null);
  const sendRef      = useRef<(text?: string) => void>(() => {});
  const voiceModeRef = useRef(voiceMode);

  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (open && !voiceMode) setTimeout(() => inputRef.current?.focus(), 250); }, [open, voiceMode]);

  const speak = useCallback((text: string) => {
    if (!ttsOn || typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "fr-FR";
    utt.rate = 1.05;
    window.speechSynthesis.speak(utt);
  }, [ttsOn]);

  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    setInput("");

    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);

    try {
      const res  = await fetch("/api/ai/copilote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      const reply = data.reponse || "Je n'ai pas pu répondre.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      speak(reply);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Erreur de connexion. Réessaie dans un instant." }]);
    } finally {
      setLoading(false);
    }
  }, [input, messages, loading, speak]);

  // keep ref current so startRecording can call it without stale closure
  useEffect(() => { sendRef.current = sendMessage; }, [sendMessage]);

  const startRecording = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "fr-FR";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const t = e.results[0]?.[0]?.transcript || "";
      if (t) {
        if (voiceModeRef.current) {
          sendRef.current(t);
        } else {
          setInput(t);
        }
      }
    };
    rec.onend  = () => setRecording(false);
    rec.onerror = () => setRecording(false);
    rec.start();
    recognRef.current = rec;
    setRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    recognRef.current?.stop();
    setRecording(false);
  }, []);

  const openVoiceMode = () => {
    setVoiceMode(true);
    setOpen(true);
    setTimeout(startRecording, 400);
  };

  const closeVoiceMode = () => {
    stopRecording();
    window.speechSynthesis?.cancel();
    setVoiceMode(false);
    setOpen(false);
  };

  return (
    <>
      {/* ── Voice mode backdrop ──────────────────────────────── */}
      {voiceMode && (
        <div className="fixed inset-0 z-[9990]"
          style={{ background: "radial-gradient(ellipse at center, #1a0533 0%, #0a001a 100%)" }}>

          {/* Animated rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[160, 220, 280].map((s, i) => (
              <div key={i} className="absolute rounded-full border opacity-20"
                style={{
                  width: s, height: s,
                  borderColor: "#7c3aed",
                  animation: `ping ${2 + i * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                }} />
            ))}
          </div>

          <div className="relative h-full flex flex-col items-center justify-center gap-6">
            {/* Orb */}
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center transition-transform duration-300 cursor-pointer select-none"
              style={{
                background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                boxShadow: recording
                  ? "0 0 80px rgba(124,58,237,0.7), 0 0 160px rgba(124,58,237,0.35)"
                  : "0 0 40px rgba(124,58,237,0.4)",
                transform: recording ? "scale(1.12)" : "scale(1)",
              }}
              onClick={recording ? stopRecording : startRecording}
            >
              <Sparkles size={44} className="text-white" />
            </div>

            <div className="text-center">
              <p className="text-white font-bold text-xl">
                {recording ? "J'écoute…" : loading ? "AXIA réfléchit…" : "AXIA"}
              </p>
              <p className="text-white/50 text-sm mt-1">
                {recording ? "Parlez maintenant" : loading ? "Traitement en cours" : "Appuyez pour parler"}
              </p>
            </div>

            {/* Last assistant reply in voice mode */}
            {messages.length > 0 && messages[messages.length - 1].role === "assistant" && (
              <div className="mx-auto max-w-xs px-5 py-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
                <p className="text-white/90 text-sm text-center leading-relaxed line-clamp-4">
                  {messages[messages.length - 1].content}
                </p>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-5 mt-4">
              <button
                onClick={recording ? stopRecording : startRecording}
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all"
                style={{ background: recording ? "#ef4444" : "rgba(255,255,255,0.15)" }}>
                {recording
                  ? <MicOff size={24} className="text-white" />
                  : <Mic size={24} className="text-white" />}
              </button>
              <button onClick={closeVoiceMode}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                <X size={20} className="text-white" />
              </button>
              <button onClick={() => setTtsOn(v => !v)}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                {ttsOn
                  ? <Volume2 size={18} className="text-white" />
                  : <VolumeX size={18} className="text-white/50" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Chat panel ──────────────────────────────────────── */}
      {open && !voiceMode && (
        <div
          className="fixed right-4 sm:right-6 z-[9991] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          style={{
            bottom: "80px",
            width: "min(380px, calc(100vw - 32px))",
            maxHeight: "min(580px, calc(100vh - 120px))",
            fontFamily: "'Poppins',system-ui,sans-serif",
          }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-bold leading-none">AXIA</p>
                <p className="text-white/60 text-[10px] mt-0.5">Agent IA e-commerce • Axso</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setTtsOn(v => !v)} title="Réponses vocales"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                {ttsOn ? <Volume2 size={12} className="text-white" /> : <VolumeX size={12} className="text-white/50" />}
              </button>
              <button onClick={openVoiceMode} title="Mode vocal"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Phone size={12} className="text-white" />
              </button>
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Minimize2 size={12} className="text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ minHeight: 0 }}>
            {messages.length === 0 && (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#7c3aed18,#7c3aed06)", border: "1.5px solid #7c3aed20" }}>
                  <Sparkles size={22} style={{ color: "#7c3aed" }} />
                </div>
                <p className="text-gray-800 font-semibold text-sm">Bonjour, je suis AXIA</p>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  Votre copilote IA e-commerce.<br />Que puis-je faire pour vous ?
                </p>
                <div className="flex flex-col gap-1.5 mt-4 text-left">
                  {SUGGESTIONS.map(s => (
                    <button key={s.label}
                      onClick={() => sendRef.current(s.label)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50/50 transition-all text-sm text-gray-600 hover:text-violet-700 group">
                      <span>{s.emoji}</span>
                      <span className="font-medium">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)" }}>
                    <Sparkles size={10} className="text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "rounded-br-sm text-white"
                      : "rounded-bl-sm bg-gray-50 border border-gray-100 text-gray-800"
                  }`}
                  style={m.role === "user" ? { background: "linear-gradient(135deg,#7c3aed,#5b21b6)" } : {}}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)" }}>
                  <Sparkles size={10} className="text-white" />
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map(j => (
                      <div key={j} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                        style={{ animationDelay: `${j * 150}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="px-3 py-3 border-t border-gray-100 bg-white flex-shrink-0">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Parlez à AXIA…"
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
              />
              <button
                onClick={recording ? stopRecording : startRecording}
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{ background: recording ? "#ef4444" : "#7c3aed18" }}>
                {recording
                  ? <MicOff size={12} className="text-white" />
                  : <Mic size={12} style={{ color: "#7c3aed" }} />}
              </button>
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all"
                style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)" }}>
                <Send size={11} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating trigger button ──────────────────────────── */}
      {!voiceMode && (
        <button
          onClick={() => setOpen(v => !v)}
          aria-label="AXIA"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9991] transition-transform duration-200 hover:scale-105 active:scale-95">
          <div
            className="flex items-center gap-2 transition-all duration-300"
            style={{
              background: open
                ? "linear-gradient(135deg,#5b21b6,#4c1d95)"
                : "linear-gradient(135deg,#7c3aed,#5b21b6)",
              borderRadius: open ? "50%" : "50px",
              padding: open ? "14px" : "12px 18px",
              boxShadow: "0 4px 20px rgba(124,58,237,0.45), 0 1px 4px rgba(0,0,0,0.15)",
            }}>
            {open
              ? <X size={18} className="text-white" />
              : (
                <>
                  <Sparkles size={16} className="text-white" />
                  <span className="text-white font-bold text-sm tracking-wide">AXIA</span>
                </>
              )}
          </div>
        </button>
      )}
    </>
  );
}
