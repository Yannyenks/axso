"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles, X, Mic, Send, Volume2, VolumeX,
  Phone, Paperclip, ChevronDown, Zap, Image as ImageIcon,
  Trash2, Copy, Check, Square, RotateCcw, Video, Music,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type VoicePhase = "idle" | "listening" | "thinking" | "speaking";

interface Msg {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  images?: string[];
  videos?: string[];
  audios?: string[];
  actions?: string[];
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function renderMarkdown(raw: string): string {
  let s = raw
    // Fenced code blocks
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      `<pre class="axia-pre"><code class="axia-code">${code.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()}</code></pre>`)
    // Inline code
    .replace(/`([^`\n]+)`/g, '<code class="axia-inline-code">$1</code>')
    // Bold + italic
    .replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    // Headings
    .replace(/^### (.+)$/gm, '<p class="axia-h3">$1</p>')
    .replace(/^## (.+)$/gm, '<p class="axia-h2">$1</p>')
    .replace(/^# (.+)$/gm, '<p class="axia-h1">$1</p>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="axia-bq">$1</blockquote>')
    // Horizontal rule
    .replace(/^---+$/gm, '<hr class="axia-hr"/>')
    // Links
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="axia-link">$1</a>')
    // Lists
    .replace(/^[-•*] (.+)$/gm, '<li class="axia-li">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="axia-li axia-ol">$1</li>')
    // Paragraphs
    .replace(/\n\n+/g, '</p><p class="axia-p">')
    .replace(/\n/g, "<br/>");

  // Wrap list items
  s = s.replace(/(<li class="axia-li[^"]*">[\s\S]*?<\/li>)+/g, m => `<ul class="axia-ul">${m}</ul>`);
  return `<p class="axia-p">${s}</p>`;
}

// ── Media parser ──────────────────────────────────────────────────────────────
function parseContent(content: string): { text: string; images: string[]; videos: string[]; audios: string[] } {
  const images: string[] = [];
  const videos: string[] = [];
  const audios: string[] = [];
  const text = content
    .replace(/\[IMAGE:(https?:\/\/[^\]]+)\]/gi, (_, u) => { images.push(u); return ""; })
    .replace(/IMAGE:(https?:\/\/\S+)/gi, (_, u) => { images.push(u); return ""; })
    .replace(/\[VIDEO:(https?:\/\/[^\]]+)\]/gi, (_, u) => { videos.push(u); return ""; })
    .replace(/VIDEO:(https?:\/\/\S+)/gi, (_, u) => { videos.push(u); return ""; })
    .replace(/\[AUDIO:(https?:\/\/[^\]]+)\]/gi, (_, u) => { audios.push(u); return ""; })
    .replace(/AUDIO:(https?:\/\/\S+)/gi, (_, u) => { audios.push(u); return ""; })
    .trim();
  return { text, images, videos, audios };
}

// ── Persistence ───────────────────────────────────────────────────────────────
const STORAGE_KEY = "axia_msgs_v3";
function loadMessages(): Msg[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}
function saveMessages(msgs: Msg[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-60))); } catch {}
}

// ── Waveform (stable) ─────────────────────────────────────────────────────────
const WAVE_HEIGHTS = Array.from({ length: 20 }, () => 8 + Math.floor(Math.random() * 28));

// ── Voice phase config ────────────────────────────────────────────────────────
const PHASE_CONFIG: Record<VoicePhase, { label: string; sub: string; orbGrad: string; orbShadow: string; ringColor: string }> = {
  idle:      { label: "AXIA",          sub: "Appuyez pour parler",       orbGrad: "radial-gradient(circle at 35% 35%, #7c3aed, #4c1d95)",    orbShadow: "0 0 40px rgba(124,58,237,0.35), inset 0 1px 1px rgba(255,255,255,0.12)", ringColor: "#7c3aed" },
  listening: { label: "J'écoute…",     sub: "Parlez maintenant",         orbGrad: "radial-gradient(circle at 35% 35%, #9f67f5, #6d28d9)",    orbShadow: "0 0 90px rgba(124,58,237,0.75), 0 0 180px rgba(124,58,237,0.35), inset 0 1px 1px rgba(255,255,255,0.2)", ringColor: "#7c3aed" },
  thinking:  { label: "AXIA réfléchit…",sub: "Analyse en cours",         orbGrad: "radial-gradient(circle at 35% 35%, #F5A623, #d4820a)",    orbShadow: "0 0 80px rgba(245,166,35,0.6), 0 0 160px rgba(245,166,35,0.25)", ringColor: "#F5A623" },
  speaking:  { label: "AXIA répond",   sub: "Touchez pour interrompre",  orbGrad: "radial-gradient(circle at 35% 35%, #10b981, #047857)",    orbShadow: "0 0 80px rgba(16,185,129,0.55), 0 0 160px rgba(16,185,129,0.25)", ringColor: "#10b981" },
};

// ── Suggestions ───────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { emoji: "📊", label: "Rapport de mes ventes ce mois-ci" },
  { emoji: "🖼️", label: "Crée un produit avec photo IA" },
  { emoji: "🎯", label: "Crée un code promo -20%" },
  { emoji: "📱", label: "Post Instagram pour ma boutique" },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function AxiaFloat() {
  const [open, setOpen]             = useState(false);
  const [voiceMode, setVoiceMode]   = useState(false);
  const [voicePhase, setVoicePhase] = useState<VoicePhase>("idle");
  const [messages, setMessages]     = useState<Msg[]>(loadMessages);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [ttsOn, setTtsOn]           = useState(true);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [interimText, setInterimText]   = useState("");
  const [copiedIdx, setCopiedIdx]       = useState<number | null>(null);
  const [unread, setUnread]             = useState(0);

  const bottomRef      = useRef<HTMLDivElement>(null);
  const voiceScrollRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const fileRef        = useRef<HTMLInputElement>(null);
  const recognRef      = useRef<any>(null);
  const abortRef       = useRef<AbortController | null>(null);
  const sendRef        = useRef<(text: string) => void>(() => {});
  const voiceModeRef   = useRef(voiceMode);
  const ttsRef         = useRef(ttsOn);
  const loadingRef     = useRef(loading);

  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);
  useEffect(() => { ttsRef.current = ttsOn; }, [ttsOn]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { voiceScrollRef.current?.scrollTo({ top: 9999, behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (open && !voiceMode) setTimeout(() => inputRef.current?.focus(), 250); }, [open, voiceMode]);

  // Persist conversation
  useEffect(() => { saveMessages(messages); }, [messages]);

  // Unread badge
  useEffect(() => {
    if (!open && messages.length > 0 && messages[messages.length - 1].role === "assistant") {
      setUnread(u => u + 1);
    }
  }, [messages]); // eslint-disable-line
  useEffect(() => { if (open) setUnread(0); }, [open]);

  // ── TTS ─────────────────────────────────────────────────────────────────────
  const speakThenListen = useCallback((text: string) => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    if (!ttsRef.current) {
      if (voiceModeRef.current) setTimeout(() => startListening(), 400);
      return;
    }
    setVoicePhase("speaking");
    const utt = new SpeechSynthesisUtterance(text.replace(/[*_`#>\-]/g, "").slice(0, 500));
    utt.lang = "fr-FR"; utt.rate = 1.1; utt.pitch = 1.05;
    utt.onend = () => { if (voiceModeRef.current) setTimeout(() => startListening(), 300); };
    utt.onerror = () => { if (voiceModeRef.current) setTimeout(() => startListening(), 300); };
    window.speechSynthesis.speak(utt);
  }, []); // eslint-disable-line

  // ── API call (SSE) ───────────────────────────────────────────────────────────
  const callAI = useCallback(async (text: string, historyBefore: Msg[], imgUrl?: string | null) => {
    if (loadingRef.current) return;
    setLoading(true);
    setInterimText("");

    abortRef.current = new AbortController();
    let firstToken = true;
    let streamingContent = "";
    let finalActions: string[] = [];

    try {
      const res = await fetch("/api/ai/universal", {
        method: "POST",
        signal: abortRef.current.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyBefore.map(m => ({ role: m.role, content: m.content })),
          imageUrl: imgUrl ?? undefined,
          fast: false,
          stream: true,
        }),
      });

      if (!res.ok || !res.body) throw new Error(`Erreur ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
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

      // Finalize
      const { text: txt, images, videos, audios } = parseContent(streamingContent || "Je n'ai pas pu répondre.");
      setMessages(prev => {
        const next = [...prev];
        const msg: Msg = { role: "assistant", content: txt, images, videos, audios, actions: finalActions };
        if (!firstToken) next[next.length - 1] = msg;
        else next.push(msg);
        return next;
      });
      if (voiceModeRef.current) speakThenListen(txt);

    } catch (err: any) {
      if (err?.name === "AbortError") {
        // User stopped — finalize what was streamed
        if (streamingContent) {
          const { text: txt, images, videos, audios } = parseContent(streamingContent);
          setMessages(prev => {
            const next = [...prev];
            if (!firstToken) next[next.length - 1] = { role: "assistant", content: txt, images, videos, audios, actions: [] };
            return next;
          });
        }
      } else {
        const errMsg = "Connexion interrompue. Réessaie dans un instant.";
        setMessages(prev => {
          const next = [...prev];
          if (!firstToken && next[next.length - 1]?.role === "assistant")
            next[next.length - 1] = { role: "assistant", content: errMsg };
          else next.push({ role: "assistant", content: errMsg });
          return next;
        });
        if (voiceModeRef.current) setVoicePhase("idle");
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [speakThenListen]);

  // ── Send ─────────────────────────────────────────────────────────────────────
  const sendMessage = useCallback((text: string, imgUrl?: string | null) => {
    const t = text.trim();
    if (!t || loadingRef.current) return;
    const userMsg: Msg = { role: "user", content: t, imageUrl: imgUrl ?? undefined };
    let nextMessages: Msg[] = [];
    setMessages(prev => { nextMessages = [...prev, userMsg]; return nextMessages; });
    if (voiceModeRef.current) setVoicePhase("thinking");
    callAI(t, nextMessages, imgUrl);
  }, [callAI]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
  }, []);

  const regenerateLast = useCallback(() => {
    setMessages(prev => {
      const lastUser = [...prev].reverse().find(m => m.role === "user");
      if (!lastUser) return prev;
      const withoutLast = prev.filter((_, i) => {
        const lastAssIdx = prev.map(m => m.role).lastIndexOf("assistant");
        return i !== lastAssIdx;
      });
      const msgs = withoutLast;
      setTimeout(() => callAI(lastUser.content, msgs), 0);
      return msgs;
    });
  }, [callAI]);

  useEffect(() => { sendRef.current = (t) => sendMessage(t); }, [sendMessage]);

  // ── Speech recognition ────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!voiceModeRef.current) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setVoicePhase("idle"); return; }
    window.speechSynthesis?.cancel();
    const rec = new SR();
    rec.lang = "fr-FR"; rec.continuous = false; rec.interimResults = true;
    rec.onresult = (e: any) => {
      let interim = "", final = "";
      for (const r of e.results) {
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      setInterimText(interim || final);
      if (final) { setInterimText(""); sendRef.current(final); }
    };
    rec.onend = () => { if (voiceModeRef.current && !loadingRef.current) setVoicePhase("idle"); };
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

  const handleOrbTap = () => {
    if (voicePhase === "speaking") { window.speechSynthesis?.cancel(); setTimeout(() => startListening(), 200); }
    else if (voicePhase === "listening") stopListening();
    else if (voicePhase === "idle") startListening();
  };

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

  const clearConversation = () => {
    if (messages.length === 0) return;
    if (!confirm("Effacer toute la conversation ?")) return;
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const phase = PHASE_CONFIG[voicePhase];
  const isOrb = voicePhase === "listening" || voicePhase === "speaking";

  return (
    <>
      {/* ── Voice Mode ──────────────────────────────────────────────────────── */}
      {voiceMode && (
        <div className="fixed inset-0 z-[9990] flex flex-col select-none"
          style={{ background: "radial-gradient(ellipse at 50% 38%, #0c0020 0%, #030008 100%)" }}>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            {[180, 260, 340, 430].map((s, i) => (
              <div key={i} className="absolute rounded-full border"
                style={{ width: s, height: s, borderColor: phase.ringColor, opacity: isOrb ? 0.22 - i * 0.04 : 0.06,
                  animation: isOrb ? `axiaRing ${2.4 + i * 0.5}s ${i * 0.3}s ease-in-out infinite` : undefined,
                  transition: "opacity 0.6s" }} />
            ))}
          </div>

          <div className="absolute top-5 right-5 flex gap-2">
            <button onClick={() => setTtsOn(v => !v)}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.08)" }}>
              {ttsOn ? <Volume2 size={16} className="text-white/70" /> : <VolumeX size={16} className="text-white/30" />}
            </button>
            <button onClick={closeVoiceMode}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.08)" }}>
              <X size={18} className="text-white/70" />
            </button>
          </div>

          {messages.length > 0 && (
            <div ref={voiceScrollRef}
              className="absolute top-0 left-0 right-0 bottom-[380px] overflow-y-auto px-5 pt-16 pb-4 flex flex-col justify-end gap-2">
              {messages.slice(-6).map((m, i) => {
                const { text } = parseContent(m.content);
                if (!text) return null;
                return (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                      style={m.role === "user"
                        ? { background: "rgba(124,58,237,0.35)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(124,58,237,0.3)" }
                        : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      {text}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 h-[380px] flex flex-col items-center justify-center gap-6">
            <div onClick={handleOrbTap}
              className="relative w-36 h-36 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: phase.orbGrad, boxShadow: phase.orbShadow,
                transform: voicePhase === "listening" ? "scale(1.1)" : voicePhase === "speaking" ? "scale(1.05)" : "scale(1)",
                transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
              {voicePhase === "thinking"
                ? <div className="w-10 h-10 rounded-full border-4 border-white/20 border-t-white animate-spin" />
                : <Sparkles size={46} className="text-white drop-shadow-lg" />}
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

            {voicePhase === "listening" && (
              <div className="flex items-end justify-center gap-[3px] h-12">
                {WAVE_HEIGHTS.map((h, i) => (
                  <div key={i} className="rounded-full"
                    style={{ width: 3, height: h, background: "linear-gradient(to top, #7c3aed, #a78bfa)",
                      animation: `axiaWave ${0.5 + (i % 4) * 0.2}s ${i * 0.06}s ease-in-out infinite alternate` }} />
                ))}
              </div>
            )}
            {voicePhase === "speaking" && (
              <div className="flex items-center justify-center gap-[4px] h-12">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="rounded-full"
                    style={{ width: 4, background: "linear-gradient(to top, #10b981, #6ee7b7)",
                      animation: `axiaSpeak ${0.7 + (i % 3) * 0.3}s ${i * 0.09}s ease-in-out infinite alternate`,
                      height: 8 + (i % 6) * 7 }} />
                ))}
              </div>
            )}
            {voicePhase === "thinking" && (
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(j => (
                  <div key={j} className="w-2.5 h-2.5 rounded-full bg-[#F5A623]"
                    style={{ animation: `axiaDot 1s ${j * 0.2}s ease-in-out infinite` }} />
                ))}
              </div>
            )}

            <div className="text-center px-8">
              <p className="text-white font-bold text-xl tracking-wide">{phase.label}</p>
              {interimText
                ? <p className="text-white/60 text-sm mt-2 italic">« {interimText} »</p>
                : <p className="text-white/40 text-sm mt-2">{phase.sub}</p>}
            </div>
            <p className="text-white/25 text-[11px] pb-4">
              {voicePhase === "idle" ? "Tapez l'orbe pour parler"
                : voicePhase === "listening" ? "Je vous écoute activement"
                : voicePhase === "speaking" ? "Tapez l'orbe pour interrompre"
                : "Traitement en cours…"}
            </p>
          </div>
        </div>
      )}

      {/* ── Chat Panel ──────────────────────────────────────────────────────── */}
      {open && !voiceMode && (
        <div className="fixed right-4 sm:right-6 z-[9991] flex flex-col rounded-2xl overflow-hidden"
          style={{
            bottom: "88px",
            width: "min(480px, calc(100vw - 24px))",
            maxHeight: "min(700px, calc(100vh - 110px))",
            fontFamily: "'Poppins',system-ui,sans-serif",
            boxShadow: "0 24px 80px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.12), 0 0 0 1px rgba(124,58,237,0.15)",
            background: "#fff",
          }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #0f0223 0%, #1e0a4e 50%, #2d1065 100%)" }}>
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#7c3aed,#F5A623)", boxShadow: "0 0 16px rgba(124,58,237,0.5)" }}>
                <Sparkles size={16} className="text-white" />
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0f0223]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-white text-sm font-bold leading-none">AXIA</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wide"
                    style={{ background: "rgba(245,166,35,0.25)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.4)" }}>PRO</span>
                </div>
                <p className="text-white/45 text-[10px] mt-0.5">Agent e-commerce · En ligne</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setTtsOn(v => !v)} title="Réponses vocales"
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/15"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                {ttsOn ? <Volume2 size={12} className="text-white/80" /> : <VolumeX size={12} className="text-white/30" />}
              </button>
              <button onClick={openVoiceMode} title="Mode vocal"
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                style={{ background: "rgba(124,58,237,0.35)" }}>
                <Phone size={12} className="text-white" />
              </button>
              <button onClick={clearConversation} title="Effacer la conversation"
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/15"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                <Trash2 size={11} className="text-white/60" />
              </button>
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/15"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                <ChevronDown size={13} className="text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ minHeight: 0, background: "#f8f9fc" }}>

            {messages.length === 0 && (
              <div className="text-center pt-4 pb-2">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#0f0223,#2d1065)", boxShadow: "0 8px 24px rgba(124,58,237,0.3)" }}>
                  <Sparkles size={26} className="text-white" />
                </div>
                <p className="text-gray-900 font-bold text-[15px]">Bonjour, je suis AXIA</p>
                <p className="text-gray-400 text-xs mt-1.5 leading-relaxed max-w-[280px] mx-auto">
                  Je peux créer des produits, analyser tes ventes, lancer des campagnes, générer des images & vidéos IA — et bien plus.
                </p>
                <div className="flex flex-col gap-2 mt-5">
                  {SUGGESTIONS.map(s => (
                    <button key={s.label} onClick={() => sendMessage(s.label)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm text-left transition-all bg-white hover:border-violet-200 hover:bg-violet-50 group"
                      style={{ borderColor: "#e5e7eb" }}>
                      <span className="text-base flex-shrink-0">{s.emoji}</span>
                      <span className="font-medium text-gray-700 text-[13px] group-hover:text-violet-700 transition-colors">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => {
              const isUser = m.role === "user";
              const { text, images: pImgs, videos: pVids, audios: pAuds } = parseContent(m.content);
              const allImages = [...(pImgs ?? []), ...(m.images ?? [])];
              const allVideos = [...(pVids ?? []), ...(m.videos ?? [])];
              const allAudios = [...(pAuds ?? []), ...(m.audios ?? [])];
              const isLast = i === messages.length - 1;

              return (
                <div key={i} className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)" }}>
                      <Sparkles size={12} className="text-white" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2" style={{ maxWidth: "85%" }}>
                    {m.imageUrl && (
                      <div className={`rounded-xl overflow-hidden border border-gray-100 ${isUser ? "self-end" : ""}`}
                        style={{ maxWidth: 200 }}>
                        <img src={m.imageUrl} alt="Image" className="w-full object-cover" />
                      </div>
                    )}
                    {text && (
                      <div className="relative group">
                        <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          isUser ? "rounded-br-sm text-white" : "rounded-bl-sm bg-white border border-gray-100 text-gray-800 shadow-sm"
                        }`} style={isUser ? { background: "linear-gradient(135deg,#0f0223,#4c1d95)" } : {}}>
                          {isUser
                            ? <span className="whitespace-pre-wrap">{text}</span>
                            : <div className="axia-md" dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />}
                        </div>
                        {!isUser && (
                          <div className="absolute -bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button
                              onClick={() => { navigator.clipboard.writeText(text); setCopiedIdx(i); setTimeout(() => setCopiedIdx(null), 1500); }}
                              className="w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center"
                              title="Copier">
                              {copiedIdx === i ? <Check size={10} className="text-green-600" /> : <Copy size={10} className="text-gray-500" />}
                            </button>
                            {isLast && !loading && (
                              <button onClick={regenerateLast}
                                className="w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center"
                                title="Régénérer">
                                <RotateCcw size={10} className="text-gray-500" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Images */}
                    {allImages.length > 0 && (
                      <div className={`flex flex-wrap gap-2 ${isUser ? "justify-end" : ""}`}>
                        {allImages.map((url, j) => (
                          <div key={j} className="relative rounded-xl overflow-hidden border border-gray-100 shadow-md group"
                            style={{ width: 168, height: 168 }}>
                            <img src={url} alt="IA" className="w-full h-full object-cover" loading="lazy" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-end p-2">
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                                <ImageIcon size={9} /> IA
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Videos */}
                    {allVideos.map((url, j) => (
                      <div key={j} className="rounded-xl overflow-hidden border border-gray-100 shadow-md">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 border-b border-gray-100">
                          <Video size={11} className="text-violet-500" />
                          <span className="text-[10px] font-semibold text-gray-500">Vidéo IA générée</span>
                        </div>
                        <video src={url} controls className="w-full max-h-48 bg-black" />
                      </div>
                    ))}

                    {/* Audios */}
                    {allAudios.map((url, j) => (
                      <div key={j} className="rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-gray-100">
                          <Music size={11} className="text-violet-500" />
                          <span className="text-[10px] font-semibold text-gray-500">Audio généré par AXIA</span>
                        </div>
                        <audio src={url} controls className="w-full p-2" />
                      </div>
                    ))}

                    {/* Action badges */}
                    {m.actions && m.actions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {m.actions.map((a, j) => (
                          <span key={j} className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-lg font-medium">
                            <Zap size={9} /> {a}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading dots */}
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
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 transition-all"
              style={{ background: "#F5F3FF", border: "1.5px solid #e9d5ff" }}
              onFocusCapture={e => (e.currentTarget.style.borderColor = "#7c3aed")}
              onBlurCapture={e => (e.currentTarget.style.borderColor = "#e9d5ff")}>
              <button onClick={() => fileRef.current?.click()}
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(124,58,237,0.12)" }} title="Joindre une image">
                <Paperclip size={13} style={{ color: "#7c3aed" }} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <input ref={inputRef} value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                placeholder="Parle à AXIA…"
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none min-w-0" />
              {loading ? (
                <button onClick={stopGeneration}
                  className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#ef4444,#b91c1c)" }}
                  title="Arrêter">
                  <Square size={10} className="text-white" fill="white" />
                </button>
              ) : (
                <button onClick={handleSendChat} disabled={!input.trim() && !pendingImage}
                  className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#4c1d95)" }}>
                  <Send size={11} className="text-white" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Button ──────────────────────────────────────────────────── */}
      {!voiceMode && (
        <button onClick={() => setOpen(v => !v)} aria-label="AXIA"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9991] transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ filter: "drop-shadow(0 4px 24px rgba(124,58,237,0.5))" }}>
          <div className="flex items-center gap-2.5 transition-all duration-300 relative"
            style={{
              background: open
                ? "linear-gradient(135deg,#0f0223,#4c1d95)"
                : "linear-gradient(135deg,#0f0223 0%,#5b21b6 55%,#7c3aed 100%)",
              borderRadius: open ? "50%" : "60px",
              padding: open ? "14px" : "11px 20px",
              boxShadow: open
                ? "0 4px 20px rgba(124,58,237,0.55)"
                : "0 4px 28px rgba(124,58,237,0.6), 0 0 0 1px rgba(245,166,35,0.25), inset 0 1px 0 rgba(255,255,255,0.12)",
            }}>
            {/* Unread badge */}
            {!open && unread > 0 && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center z-10">
                <span className="text-white text-[9px] font-bold leading-none">{unread > 9 ? "9+" : unread}</span>
              </div>
            )}
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
        @keyframes axiaDot   { 0%,80%,100%{transform:scale(0.55);opacity:0.45} 40%{transform:scale(1);opacity:1} }
        @keyframes axiaWave  { to { transform: scaleY(0.12); } }
        @keyframes axiaSpeak { to { transform: scaleY(0.18); } }
        @keyframes axiaRing  { 0%,100%{transform:scale(1);opacity:0.22} 50%{transform:scale(1.07);opacity:0.09} }

        .axia-md { line-height:1.65; font-size:13.5px; }
        .axia-md .axia-p { margin:0 0 6px 0; }
        .axia-md .axia-p:last-child { margin-bottom:0; }
        .axia-md .axia-h1 { font-size:15px; font-weight:700; margin:10px 0 4px; color:#0f0223; }
        .axia-md .axia-h2 { font-size:14px; font-weight:700; margin:8px 0 3px; color:#1e0a4e; }
        .axia-md .axia-h3 { font-size:13px; font-weight:600; margin:6px 0 2px; color:#4c1d95; }
        .axia-md .axia-bq { border-left:3px solid #7c3aed; padding:4px 10px; margin:6px 0; background:#f5f3ff; border-radius:0 6px 6px 0; color:#4c1d95; font-style:italic; }
        .axia-md .axia-hr { border:none; border-top:1px solid #e9d5ff; margin:8px 0; }
        .axia-md .axia-link { color:#7c3aed; text-decoration:underline; text-underline-offset:2px; }
        .axia-md .axia-ul { margin:4px 0 4px 4px; padding:0; list-style:none; }
        .axia-md .axia-li { position:relative; padding-left:14px; margin:2px 0; }
        .axia-md .axia-li::before { content:"•"; position:absolute; left:2px; color:#7c3aed; font-weight:bold; }
        .axia-md .axia-li.axia-ol::before { content:"→"; }
        .axia-md .axia-pre { background:#f3f0ff; border:1px solid #e9d5ff; border-radius:10px; padding:10px 12px; margin:8px 0; overflow-x:auto; }
        .axia-md .axia-code { font-family:'Monaco','Menlo','Consolas',monospace; font-size:12px; color:#4c1d95; white-space:pre; }
        .axia-md .axia-inline-code { background:#f3f0ff; border:1px solid #e9d5ff; border-radius:4px; padding:1px 5px; font-family:'Monaco','Menlo',monospace; font-size:11px; color:#6d28d9; }
        .axia-md strong { font-weight:700; color:#111; }
        .axia-md em { font-style:italic; color:#4b5563; }
      `}</style>
    </>
  );
}
