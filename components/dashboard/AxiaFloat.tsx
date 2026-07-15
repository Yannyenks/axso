"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles, X, Mic, MicOff, Send, Volume2, VolumeX,
  Phone, Paperclip, ChevronDown, Zap, Image as ImageIcon,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type VoicePhase = "idle" | "listening" | "thinking" | "speaking";

interface Msg {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  images?: string[];
  actions?: string[];
}

// ── Utils ─────────────────────────────────────────────────────────────────────
function parseContent(content: string): { text: string; images: string[] } {
  const images: string[] = [];
  const text = content
    .replace(/\[IMAGE:(https?:\/\/[^\]]+)\]/gi, (_, u) => { images.push(u); return ""; })
    .replace(/IMAGE:(https?:\/\/\S+)/gi,         (_, u) => { images.push(u); return ""; })
    .trim();
  return { text, images };
}

// Stable waveform heights (not re-generated on each render)
const WAVE_HEIGHTS = Array.from({ length: 18 }, () => 8 + Math.floor(Math.random() * 26));

const SUGGESTIONS = [
  { emoji: "🖼️", label: "Créer un produit avec photo IA" },
  { emoji: "📊", label: "Analyser mes ventes du mois" },
  { emoji: "🎯", label: "Créer un code promo" },
  { emoji: "📱", label: "Post Instagram pour mes produits" },
];

// ── State visuals per phase ───────────────────────────────────────────────────
const PHASE_CONFIG: Record<VoicePhase, {
  label: string; sub: string;
  orbGrad: string; orbShadow: string;
  ringColor: string;
}> = {
  idle: {
    label: "AXIA",
    sub: "Appuyez pour parler",
    orbGrad: "radial-gradient(circle at 35% 35%, #7c3aed, #4c1d95)",
    orbShadow: "0 0 40px rgba(124,58,237,0.35), inset 0 1px 1px rgba(255,255,255,0.12)",
    ringColor: "#7c3aed",
  },
  listening: {
    label: "J'écoute…",
    sub: "Parlez maintenant",
    orbGrad: "radial-gradient(circle at 35% 35%, #9f67f5, #6d28d9)",
    orbShadow: "0 0 90px rgba(124,58,237,0.75), 0 0 180px rgba(124,58,237,0.35), inset 0 1px 1px rgba(255,255,255,0.2)",
    ringColor: "#7c3aed",
  },
  thinking: {
    label: "AXIA réfléchit…",
    sub: "Analyse en cours",
    orbGrad: "radial-gradient(circle at 35% 35%, #F5A623, #d4820a)",
    orbShadow: "0 0 80px rgba(245,166,35,0.6), 0 0 160px rgba(245,166,35,0.25)",
    ringColor: "#F5A623",
  },
  speaking: {
    label: "AXIA répond",
    sub: "Touchez pour interrompre",
    orbGrad: "radial-gradient(circle at 35% 35%, #10b981, #047857)",
    orbShadow: "0 0 80px rgba(16,185,129,0.55), 0 0 160px rgba(16,185,129,0.25)",
    ringColor: "#10b981",
  },
};

// ── Component ─────────────────────────────────────────────────────────────────
export function AxiaFloat() {
  const [open, setOpen]           = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voicePhase, setVoicePhase] = useState<VoicePhase>("idle");
  const [messages, setMessages]   = useState<Msg[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [ttsOn, setTtsOn]         = useState(true);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [interimText, setInterimText]   = useState("");   // live transcript while listening

  const bottomRef    = useRef<HTMLDivElement>(null);
  const voiceScrollRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const fileRef      = useRef<HTMLInputElement>(null);
  const recognRef    = useRef<any>(null);
  const sendRef      = useRef<(text: string) => void>(() => {});
  const voiceModeRef = useRef(voiceMode);
  const ttsRef       = useRef(ttsOn);
  const loadingRef   = useRef(loading);

  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);
  useEffect(() => { ttsRef.current = ttsOn; }, [ttsOn]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { voiceScrollRef.current?.scrollTo({ top: 9999, behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (open && !voiceMode) setTimeout(() => inputRef.current?.focus(), 250); }, [open, voiceMode]);

  // ── TTS: speak, then restart listening automatically ─────────────────────
  const speakThenListen = useCallback((text: string) => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();

    if (!ttsRef.current) {
      // TTS disabled — restart listening immediately
      if (voiceModeRef.current) {
        setTimeout(() => startListening(), 400);
      }
      return;
    }

    setVoicePhase("speaking");
    const clean = text.replace(/[*_`#]/g, "").slice(0, 500);
    const utt   = new SpeechSynthesisUtterance(clean);
    utt.lang  = "fr-FR";
    utt.rate  = 1.1;
    utt.pitch = 1.05;

    utt.onend = () => {
      if (voiceModeRef.current) {
        setTimeout(() => startListening(), 300);
      }
    };
    utt.onerror = () => {
      if (voiceModeRef.current) setTimeout(() => startListening(), 300);
    };

    window.speechSynthesis.speak(utt);
  }, []); // eslint-disable-line

  // ── API call (SSE streaming) ───────────────────────────────────────────────
  const callAI = useCallback(async (text: string, historyBefore: Msg[], imgUrl?: string | null) => {
    if (loadingRef.current) return;
    setLoading(true);
    setInterimText("");

    let firstToken = true;
    let streamingContent = "";
    let finalActions: string[] = [];

    try {
      const res = await fetch("/api/ai/universal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyBefore.map(m => ({ role: m.role, content: m.content })),
          imageUrl: imgUrl ?? undefined,
          fast: false,
          stream: true,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Réponse invalide");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let evt: any;
          try { evt = JSON.parse(line.slice(6)); } catch { continue; }

          if (evt.type === "token") {
            streamingContent += evt.text as string;
            if (firstToken) {
              firstToken = false;
              setLoading(false);
              setMessages(prev => [...prev, { role: "assistant", content: streamingContent }]);
            } else {
              setMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = { ...next[next.length - 1], content: streamingContent };
                return next;
              });
            }
          } else if (evt.type === "done") {
            finalActions = (evt.actions as string[]) ?? [];
          } else if (evt.type === "error") {
            throw new Error((evt.text as string) || "Erreur AXIA");
          }
        }
      }

      // Finalize: parse images, attach actions
      const { text: txt, images } = parseContent(streamingContent || "Je n'ai pas pu répondre.");
      setMessages(prev => {
        const next = [...prev];
        if (!firstToken) {
          next[next.length - 1] = { role: "assistant", content: txt, images, actions: finalActions };
        } else {
          next.push({ role: "assistant", content: txt, images, actions: finalActions });
        }
        return next;
      });

      if (voiceModeRef.current) speakThenListen(txt);

    } catch {
      const errMsg = "Erreur de connexion. Réessaie dans un instant.";
      setMessages(prev => {
        const next = [...prev];
        if (!firstToken && next[next.length - 1]?.role === "assistant") {
          next[next.length - 1] = { role: "assistant", content: errMsg };
        } else {
          next.push({ role: "assistant", content: errMsg });
        }
        return next;
      });
      if (voiceModeRef.current) setVoicePhase("idle");
    } finally {
      setLoading(false);
    }
  }, [speakThenListen]);

  // ── Send (text or voice) ──────────────────────────────────────────────────
  const sendMessage = useCallback((text: string, imgUrl?: string | null) => {
    const t = text.trim();
    if (!t || loadingRef.current) return;

    const userMsg: Msg = { role: "user", content: t, imageUrl: imgUrl ?? undefined };
    let nextMessages: Msg[] = [];
    setMessages(prev => {
      nextMessages = [...prev, userMsg];
      return nextMessages;
    });

    if (voiceModeRef.current) setVoicePhase("thinking");
    callAI(t, nextMessages, imgUrl);
  }, [callAI]);

  useEffect(() => { sendRef.current = (t) => sendMessage(t); }, [sendMessage]);

  // ── Speech recognition ────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!voiceModeRef.current) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setVoicePhase("idle"); return; }

    window.speechSynthesis?.cancel();

    const rec = new SR();
    rec.lang            = "fr-FR";
    rec.continuous      = false;
    rec.interimResults  = true;

    rec.onresult = (e: any) => {
      let interim = "";
      let final   = "";
      for (const r of e.results) {
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      setInterimText(interim || final);
      if (final) {
        setInterimText("");
        sendRef.current(final);
      }
    };

    rec.onend   = () => {
      if (voiceModeRef.current && !loadingRef.current) {
        // Silence detected without result — stay idle, let user tap
        setVoicePhase("idle");
      }
    };
    rec.onerror = () => setVoicePhase("idle");

    recognRef.current = rec;
    setVoicePhase("listening");
    setInterimText("");
    rec.start();
  }, []);

  const stopListening = useCallback(() => {
    recognRef.current?.stop();
    setVoicePhase("idle");
    setInterimText("");
  }, []);

  // ── Voice mode open/close ─────────────────────────────────────────────────
  const openVoiceMode = () => {
    window.speechSynthesis?.cancel();
    setVoiceMode(true);
    setVoicePhase("idle");
    setOpen(false);
    setTimeout(() => startListening(), 600);
  };

  const closeVoiceMode = () => {
    stopListening();
    window.speechSynthesis?.cancel();
    setVoiceMode(false);
    setVoicePhase("idle");
    setInterimText("");
  };

  // ── Orb tap handler ───────────────────────────────────────────────────────
  const handleOrbTap = () => {
    if (voicePhase === "speaking") {
      // Interrupt AXIA
      window.speechSynthesis?.cancel();
      setTimeout(() => startListening(), 200);
    } else if (voicePhase === "listening") {
      stopListening();
    } else if (voicePhase === "idle") {
      startListening();
    }
    // thinking → do nothing (wait for AI)
  };

  // ── File input ────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPendingImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSendChat = () => {
    const t = input.trim();
    if ((!t && !pendingImage) || loading) return;
    setInput("");
    const img = pendingImage;
    setPendingImage(null);
    if (t) sendMessage(t, img);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const phase   = PHASE_CONFIG[voicePhase];
  const isOrb   = voicePhase === "listening" || voicePhase === "speaking";

  return (
    <>
      {/* ── Voice Mode Screen ───────────────────────────────────────────── */}
      {voiceMode && (
        <div className="fixed inset-0 z-[9990] flex flex-col select-none"
          style={{ background: "radial-gradient(ellipse at 50% 38%, #0c0020 0%, #030008 100%)" }}>

          {/* Animated rings behind orb */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            {[180, 260, 340, 420].map((s, i) => (
              <div key={i} className="absolute rounded-full border"
                style={{
                  width: s, height: s,
                  borderColor: phase.ringColor,
                  opacity: isOrb ? 0.22 - i * 0.04 : 0.06,
                  animation: isOrb
                    ? `axiaRing ${2.4 + i * 0.5}s ${i * 0.3}s ease-in-out infinite`
                    : undefined,
                  transition: "opacity 0.6s",
                }} />
            ))}
          </div>

          {/* Close & TTS controls */}
          <div className="absolute top-5 right-5 flex gap-2">
            <button onClick={() => setTtsOn(v => !v)}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "rgba(255,255,255,0.08)" }}>
              {ttsOn ? <Volume2 size={16} className="text-white/70" /> : <VolumeX size={16} className="text-white/30" />}
            </button>
            <button onClick={closeVoiceMode}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "rgba(255,255,255,0.08)" }}>
              <X size={18} className="text-white/70" />
            </button>
          </div>

          {/* Transcript bubbles (last 6 messages) */}
          {messages.length > 0 && (
            <div ref={voiceScrollRef}
              className="absolute top-0 left-0 right-0 bottom-[380px] overflow-y-auto px-5 pt-16 pb-4 flex flex-col justify-end gap-2">
              {messages.slice(-6).map((m, i) => {
                const { text } = parseContent(m.content);
                if (!text) return null;
                return (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                      style={m.role === "user"
                        ? { background: "rgba(124,58,237,0.35)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(124,58,237,0.3)" }
                        : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.08)" }
                      }>
                      {text}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Central orb + status */}
          <div className="absolute bottom-0 left-0 right-0 h-[380px] flex flex-col items-center justify-center gap-6">

            {/* Orb */}
            <div
              onClick={handleOrbTap}
              className="relative w-36 h-36 rounded-full flex items-center justify-center cursor-pointer"
              style={{
                background: phase.orbGrad,
                boxShadow: phase.orbShadow,
                transform: voicePhase === "listening" ? "scale(1.1)" : voicePhase === "speaking" ? "scale(1.05)" : "scale(1)",
                transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
              }}>
              {voicePhase === "thinking" ? (
                <div className="w-10 h-10 rounded-full border-4 border-white/20 border-t-white animate-spin" />
              ) : (
                <Sparkles size={46} className="text-white drop-shadow-lg" />
              )}

              {/* Mic indicator on orb */}
              {voicePhase === "listening" && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg">
                  <Mic size={14} className="text-violet-700" />
                </div>
              )}
              {voicePhase === "speaking" && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg">
                  <Volume2 size={14} className="text-emerald-600" />
                </div>
              )}
            </div>

            {/* Waveform (listening only) */}
            {voicePhase === "listening" && (
              <div className="flex items-end justify-center gap-[3px] h-12">
                {WAVE_HEIGHTS.map((h, i) => (
                  <div key={i} className="rounded-full"
                    style={{
                      width: 3,
                      height: h,
                      background: "linear-gradient(to top, #7c3aed, #a78bfa)",
                      animation: `axiaWave ${0.5 + (i % 4) * 0.2}s ${i * 0.06}s ease-in-out infinite alternate`,
                    }} />
                ))}
              </div>
            )}

            {/* Speaking bars (speaking only) */}
            {voicePhase === "speaking" && (
              <div className="flex items-center justify-center gap-[4px] h-12">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="rounded-full"
                    style={{
                      width: 4,
                      background: "linear-gradient(to top, #10b981, #6ee7b7)",
                      animation: `axiaSpeak ${0.7 + (i % 3) * 0.3}s ${i * 0.09}s ease-in-out infinite alternate`,
                      height: 8 + (i % 5) * 8,
                    }} />
                ))}
              </div>
            )}

            {/* Thinking dots */}
            {voicePhase === "thinking" && (
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(j => (
                  <div key={j} className="w-2.5 h-2.5 rounded-full bg-[#F5A623]"
                    style={{ animation: `axiaDot 1s ${j * 0.2}s ease-in-out infinite` }} />
                ))}
              </div>
            )}

            {/* Status text */}
            <div className="text-center px-8">
              <p className="text-white font-bold text-xl tracking-wide">{phase.label}</p>

              {/* Live interim transcript */}
              {interimText ? (
                <p className="text-white/60 text-sm mt-2 italic">« {interimText} »</p>
              ) : (
                <p className="text-white/40 text-sm mt-2">{phase.sub}</p>
              )}
            </div>

            {/* Bottom hint */}
            <p className="text-white/25 text-[11px] pb-4">
              {voicePhase === "idle" ? "Tapez l'orbe pour parler" :
               voicePhase === "listening" ? "Je vous écoute activement" :
               voicePhase === "speaking" ? "Tapez l'orbe pour interrompre" :
               "Traitement de votre demande…"}
            </p>
          </div>
        </div>
      )}

      {/* ── Chat Panel ───────────────────────────────────────────────────── */}
      {open && !voiceMode && (
        <div
          className="fixed right-4 sm:right-6 z-[9991] flex flex-col rounded-2xl overflow-hidden"
          style={{
            bottom: "88px",
            width: "min(440px, calc(100vw - 32px))",
            maxHeight: "min(660px, calc(100vh - 120px))",
            fontFamily: "'Poppins',system-ui,sans-serif",
            boxShadow: "0 8px 48px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12), 0 0 0 1px rgba(245,166,35,0.12)",
            background: "#fff",
          }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #1a0533 0%, #2d1065 60%, #1e0a4e 100%)" }}>
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#7c3aed,#F5A623)", boxShadow: "0 0 12px rgba(245,166,35,0.35)" }}>
                <Sparkles size={16} className="text-white" />
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#1a0533]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-white text-sm font-bold leading-none">AXIA</p>
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(245,166,35,0.2)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.3)" }}>IA</span>
                </div>
                <p className="text-white/50 text-[10px] mt-0.5">Copilote e-commerce · En ligne</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setTtsOn(v => !v)} title="Réponses vocales"
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                {ttsOn ? <Volume2 size={12} className="text-white/80" /> : <VolumeX size={12} className="text-white/30" />}
              </button>
              <button onClick={openVoiceMode} title="Mode vocal"
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(124,58,237,0.3)" }}>
                <Phone size={12} className="text-white" />
              </button>
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                <ChevronDown size={13} className="text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ minHeight: 0, background: "#f8f9fc" }}>
            {messages.length === 0 && (
              <div className="text-center pt-2 pb-4">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#1a0533,#2d1065)", boxShadow: "0 4px 20px rgba(124,58,237,0.25)" }}>
                  <Sparkles size={24} className="text-white" />
                </div>
                <p className="text-gray-800 font-bold text-base">Bonjour, je suis AXIA</p>
                <p className="text-gray-400 text-xs mt-1.5 leading-relaxed max-w-[260px] mx-auto">
                  Votre copilote IA e-commerce. Je peux créer des produits avec photos IA, lancer des campagnes, analyser vos ventes…
                </p>
                <div className="flex flex-col gap-2 mt-5">
                  {SUGGESTIONS.map(s => (
                    <button key={s.label}
                      onClick={() => sendMessage(s.label)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm text-left transition-all bg-white"
                      style={{ borderColor: "#e5e7eb" }}>
                      <span className="text-base">{s.emoji}</span>
                      <span className="font-medium text-gray-700 text-[13px]">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => {
              const isUser = m.role === "user";
              const { text, images: parsedImgs } = parseContent(m.content);
              const allImages = [...(parsedImgs || []), ...(m.images || [])];
              return (
                <div key={i} className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)" }}>
                      <Sparkles size={12} className="text-white" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2 max-w-[85%]">
                    {m.imageUrl && (
                      <div className={`rounded-xl overflow-hidden border border-gray-100 ${isUser ? "self-end" : ""}`}
                        style={{ maxWidth: 200 }}>
                        <img src={m.imageUrl} alt="Image partagée" className="w-full object-cover" />
                      </div>
                    )}
                    {text && (
                      <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                        isUser ? "rounded-br-sm text-white" : "rounded-bl-sm bg-white border border-gray-100 text-gray-800 shadow-sm"
                      }`}
                        style={isUser ? { background: "linear-gradient(135deg,#1a0533,#4c1d95)" } : {}}>
                        {text}
                      </div>
                    )}
                    {allImages.length > 0 && (
                      <div className={`flex flex-wrap gap-2 ${isUser ? "justify-end" : ""}`}>
                        {allImages.map((url, j) => (
                          <div key={j} className="relative rounded-xl overflow-hidden border border-gray-100 shadow-md group"
                            style={{ width: 160, height: 160 }}>
                            <img src={url} alt="Généré par AXIA" className="w-full h-full object-cover" loading="lazy" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-end p-2">
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                                <ImageIcon size={9} /> IA
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {m.actions && m.actions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {m.actions.map((a, j) => (
                          <span key={j} className="inline-flex items-center gap-1 text-[11px] bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-lg">
                            <Zap size={9} /> {a}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)" }}>
                  <Sparkles size={12} className="text-white" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    {[0, 1, 2].map(j => (
                      <div key={j} className="w-2 h-2 rounded-full"
                        style={{ background: "#7c3aed", animation: `axiaDot 1s ${j * 0.18}s ease-in-out infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Image preview */}
          {pendingImage && (
            <div className="px-3 pt-2 flex-shrink-0 bg-white border-t border-gray-100">
              <div className="relative inline-block">
                <img src={pendingImage} alt="preview" className="h-14 w-14 rounded-xl object-cover border border-gray-200" />
                <button onClick={() => setPendingImage(null)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center">
                  <X size={10} className="text-white" />
                </button>
              </div>
            </div>
          )}

          {/* Input bar */}
          <div className="px-3 py-3 border-t border-gray-100 bg-white flex-shrink-0">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <button onClick={() => fileRef.current?.click()}
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "#7c3aed10" }} title="Joindre une image">
                <Paperclip size={13} style={{ color: "#7c3aed" }} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <input ref={inputRef} value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                placeholder="Parlez à AXIA…"
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none min-w-0" />
              <button onClick={handleSendChat} disabled={(!input.trim() && !pendingImage) || loading}
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#7c3aed,#4c1d95)" }}>
                <Send size={11} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating button ───────────────────────────────────────────────── */}
      {!voiceMode && (
        <button onClick={() => setOpen(v => !v)} aria-label="AXIA"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9991] transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ filter: "drop-shadow(0 4px 20px rgba(124,58,237,0.45))" }}>
          <div className="flex items-center gap-2.5 transition-all duration-300"
            style={{
              background: open
                ? "linear-gradient(135deg,#1a0533,#4c1d95)"
                : "linear-gradient(135deg,#1a0533 0%,#5b21b6 50%,#7c3aed 100%)",
              borderRadius: open ? "50%" : "60px",
              padding: open ? "14px" : "11px 20px",
              boxShadow: open
                ? "0 4px 16px rgba(124,58,237,0.5)"
                : "0 4px 24px rgba(124,58,237,0.55), 0 0 0 1px rgba(245,166,35,0.2), inset 0 1px 0 rgba(255,255,255,0.12)",
            }}>
            {open ? <X size={18} className="text-white" /> : (
              <>
                <div className="relative">
                  <Sparkles size={17} className="text-white" />
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <span className="text-white font-bold text-[13px] tracking-wider">AXIA</span>
              </>
            )}
          </div>
        </button>
      )}

      <style>{`
        @keyframes axiaDot  { 0%,80%,100%{transform:scale(0.6);opacity:0.5} 40%{transform:scale(1);opacity:1} }
        @keyframes axiaWave { to { transform: scaleY(0.15); } }
        @keyframes axiaSpeak { to { transform: scaleY(0.2); } }
        @keyframes axiaRing { 0%,100%{transform:scale(1);opacity:0.22} 50%{transform:scale(1.06);opacity:0.1} }
      `}</style>
    </>
  );
}
