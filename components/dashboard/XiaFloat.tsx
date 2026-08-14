"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles, X, Mic, Send, Volume2, VolumeX,
  Phone, Paperclip, ChevronDown, Zap, Image as ImageIcon,
  Trash2, Copy, Check, Square, RotateCcw, Video, Music,
  BarChart3, Target, Smartphone,
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
      `<pre class="xia-pre"><code class="xia-code">${code.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()}</code></pre>`)
    // Inline code
    .replace(/`([^`\n]+)`/g, '<code class="xia-inline-code">$1</code>')
    // Bold + italic
    .replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    // Headings
    .replace(/^### (.+)$/gm, '<p class="xia-h3">$1</p>')
    .replace(/^## (.+)$/gm, '<p class="xia-h2">$1</p>')
    .replace(/^# (.+)$/gm, '<p class="xia-h1">$1</p>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="xia-bq">$1</blockquote>')
    // Horizontal rule
    .replace(/^---+$/gm, '<hr class="xia-hr"/>')
    // Links
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="xia-link">$1</a>')
    // Lists
    .replace(/^[-•*] (.+)$/gm, '<li class="xia-li">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="xia-li xia-ol">$1</li>')
    // Paragraphs
    .replace(/\n\n+/g, '</p><p class="xia-p">')
    .replace(/\n/g, "<br/>");

  // Wrap list items
  s = s.replace(/(<li class="xia-li[^"]*">[\s\S]*?<\/li>)+/g, m => `<ul class="xia-ul">${m}</ul>`);
  return `<p class="xia-p">${s}</p>`;
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
const STORAGE_KEY = "xia_msgs_v1";
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
  idle:      { label: "Xia",           sub: "Appuyez pour parler",       orbGrad: "radial-gradient(circle at 35% 35%, #1B2A4A, #12203d)",    orbShadow: "0 0 40px rgba(27,42,74,0.35), inset 0 1px 1px rgba(255,255,255,0.12)", ringColor: "#1B2A4A" },
  listening: { label: "J'écoute…",     sub: "Parlez maintenant",         orbGrad: "radial-gradient(circle at 35% 35%, #3a5480, #1B2A4A)",    orbShadow: "0 0 90px rgba(27,42,74,0.75), 0 0 180px rgba(27,42,74,0.35), inset 0 1px 1px rgba(255,255,255,0.2)", ringColor: "#1B2A4A" },
  thinking:  { label: "Xia réfléchit…",sub: "Analyse en cours",         orbGrad: "radial-gradient(circle at 35% 35%, #F5A623, #d4820a)",    orbShadow: "0 0 80px rgba(245,166,35,0.6), 0 0 160px rgba(245,166,35,0.25)", ringColor: "#F5A623" },
  speaking:  { label: "Xia répond",    sub: "Touchez pour interrompre",  orbGrad: "radial-gradient(circle at 35% 35%, #10b981, #047857)",    orbShadow: "0 0 80px rgba(16,185,129,0.55), 0 0 160px rgba(16,185,129,0.25)", ringColor: "#10b981" },
};

// ── Thinking messages ─────────────────────────────────────────────────────────
const THINKING_MSGS = [
  "Xia réfléchit…",
  "Xia analyse les données…",
  "Xia vérifie ta boutique…",
  "Xia prépare sa réponse…",
  "Xia compare les options…",
  "Xia consulte le catalogue…",
  "Xia peaufine sa réponse…",
];

// Phrases courtes prononcées à voix haute pendant la réflexion, pour éviter tout silence mort
const THINKING_VOICE_FILLERS = [
  "Laisse-moi vérifier ça.",
  "Un instant, je regarde tes données.",
  "Je consulte ta boutique.",
  "Je jette un œil à ça tout de suite.",
];

// ── Suggestions ───────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { Icon: BarChart3,  label: "Rapport de mes ventes ce mois-ci" },
  { Icon: ImageIcon,  label: "Crée un produit avec photo IA" },
  { Icon: Target,     label: "Crée un code promo -20%" },
  { Icon: Smartphone, label: "Post Instagram pour ma boutique" },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function XiaFloat() {
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
  const [thinkingMsgIdx, setThinkingMsgIdx] = useState(0);

  const bottomRef      = useRef<HTMLDivElement>(null);
  const voiceScrollRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);
  const fileRef        = useRef<HTMLInputElement>(null);
  const recognRef      = useRef<any>(null);
  const audioRef       = useRef<HTMLAudioElement | null>(null);
  const bestVoiceRef   = useRef<SpeechSynthesisVoice | null>(null);
  const premiumTtsFailedRef = useRef(false);
  const abortRef       = useRef<AbortController | null>(null);
  const sendRef        = useRef<(text: string) => void>(() => {});
  const voiceModeRef   = useRef(voiceMode);
  const ttsRef         = useRef(ttsOn);
  const loadingRef     = useRef(loading);
  const messagesRef    = useRef(messages);

  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);
  useEffect(() => { ttsRef.current = ttsOn; }, [ttsOn]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => {
    if (!loading) { setThinkingMsgIdx(0); return; }
    const id = setInterval(() => setThinkingMsgIdx(i => (i + 1) % THINKING_MSGS.length), 2200);
    return () => clearInterval(id);
  }, [loading]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { voiceScrollRef.current?.scrollTo({ top: 9999, behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (open && !voiceMode) setTimeout(() => inputRef.current?.focus(), 250); }, [open, voiceMode]);

  // Sélectionne la meilleure voix française du navigateur (fallback si le TTS premium est indisponible)
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const pickBestVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const fr = voices.filter(v => v.lang?.toLowerCase().startsWith("fr"));
      if (!fr.length) return;
      const scored = fr.map(v => {
        let score = 0;
        if (/google/i.test(v.name)) score += 3;
        if (/natural|neural|enhanced|premium/i.test(v.name)) score += 3;
        if (/fr-FR/i.test(v.lang)) score += 1;
        if (v.localService === false) score += 1; // voix réseau = souvent meilleure qualité
        return { v, score };
      }).sort((a, b) => b.score - a.score);
      bestVoiceRef.current = scored[0]?.v ?? fr[0];
    };
    pickBestVoice();
    window.speechSynthesis.onvoiceschanged = pickBestVoice;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

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
  // `speak` prononce un texte puis appelle onDone (par défaut : rien). Réutilisé à la fois
  // pour la réponse finale (onDone = relancer l'écoute) et pour les phrases de remplissage
  // pendant la réflexion (onDone = rien, la phase reste "thinking" jusqu'à la vraie réponse).
  const speakBrowserFallback = useCallback((cleanText: string, onDone?: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis) { onDone?.(); return; }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(cleanText.slice(0, 600));
    utt.lang = "fr-FR"; utt.rate = 1.08; utt.pitch = 1.03;
    if (bestVoiceRef.current) utt.voice = bestVoiceRef.current;
    utt.onend = () => onDone?.();
    utt.onerror = () => onDone?.();
    window.speechSynthesis.speak(utt);
  }, []);

  const speak = useCallback((text: string, onDone?: () => void) => {
    if (typeof window === "undefined") return;
    window.speechSynthesis?.cancel();
    audioRef.current?.pause();
    if (!ttsRef.current) { onDone?.(); return; }
    const cleanText = text.replace(/[*_`#>\-]/g, "").trim();
    if (!cleanText) { onDone?.(); return; }

    // Voix premium (ElevenLabs) en priorité — bascule silencieusement sur la voix
    // navigateur si la clé n'est pas configurée ou en cas d'erreur réseau.
    if (premiumTtsFailedRef.current) { speakBrowserFallback(cleanText, onDone); return; }

    (async () => {
      try {
        const res = await fetch("/api/ai/xia/voix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texte: cleanText }),
        });
        if (!res.ok) throw new Error(`tts ${res.status}`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => { URL.revokeObjectURL(url); onDone?.(); };
        audio.onerror = () => { URL.revokeObjectURL(url); speakBrowserFallback(cleanText, onDone); };
        await audio.play();
      } catch {
        premiumTtsFailedRef.current = true; // évite de re-tenter le réseau à chaque tour si la clé est absente
        speakBrowserFallback(cleanText, onDone);
      }
    })();
  }, [speakBrowserFallback]);

  const speakThenListen = useCallback((text: string) => {
    setVoicePhase("speaking");
    speak(text, () => { if (voiceModeRef.current) setTimeout(() => startListening(), 250); });
  }, [speak]);

  // Annonce vocale courte pendant que Xia traite la demande (appel d'outils, délégation…),
  // pour ne jamais laisser un silence pendant les quelques secondes de traitement.
  const speakThinkingFiller = useCallback(() => {
    if (!ttsRef.current) return;
    const phrase = THINKING_VOICE_FILLERS[Math.floor(Math.random() * THINKING_VOICE_FILLERS.length)];
    speak(phrase);
  }, [speak]);

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
      const res = await fetch("/api/ai/xia", {
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
            throw new Error((evt.text as string) || "Erreur Xia");
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
    // On dérive nextMessages depuis messagesRef (toujours à jour) plutôt que de dépendre
    // du timing d'exécution du updater setMessages — sinon l'appel API peut partir avec
    // un tableau encore vide si le re-render n'a pas eu lieu avant callAI().
    const nextMessages = [...messagesRef.current, userMsg];
    messagesRef.current = nextMessages;
    setMessages(nextMessages);
    if (voiceModeRef.current) { setVoicePhase("thinking"); speakThinkingFiller(); }
    callAI(t, nextMessages, imgUrl);
  }, [callAI, speakThinkingFiller]);

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
    audioRef.current?.pause();
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
    audioRef.current?.pause();
    setVoiceMode(true);
    setVoicePhase("idle");
    setOpen(false);
    setTimeout(() => startListening(), 600);
  };
  const closeVoiceMode = () => {
    stopListening();
    window.speechSynthesis?.cancel();
    audioRef.current?.pause();
    setVoiceMode(false);
    setVoicePhase("idle");
    setInterimText("");
  };

  const handleOrbTap = () => {
    if (voicePhase === "speaking") { window.speechSynthesis?.cancel(); audioRef.current?.pause(); setTimeout(() => startListening(), 200); }
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
    if (inputRef.current) inputRef.current.style.height = "auto";
    const img = pendingImage;
    setPendingImage(null);
    if (t) sendMessage(t, img);
  };

  const autoGrowInput = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
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
                  animation: isOrb ? `xiaRing ${2.4 + i * 0.5}s ${i * 0.3}s ease-in-out infinite` : undefined,
                  transition: "opacity 0.6s" }} />
            ))}
          </div>

          <div className="absolute top-5 right-5 flex gap-2 z-20">
            <button onClick={() => setTtsOn(v => !v)}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.08)" }}>
              {ttsOn ? <Volume2 size={16} className="text-white/70" /> : <VolumeX size={16} className="text-white/30" />}
            </button>
            <button onClick={closeVoiceMode} type="button"
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.08)" }}>
              <X size={18} className="text-white/70" />
            </button>
          </div>

          {messages.length > 0 && (
            <div ref={voiceScrollRef}
              className="absolute top-0 left-0 right-0 bottom-[380px] overflow-y-auto px-5 pt-16 pb-4 flex flex-col justify-end gap-2 z-10 pointer-events-none">
              {messages.slice(-6).map((m, i) => {
                const { text } = parseContent(m.content);
                if (!text) return null;
                return (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                      style={m.role === "user"
                        ? { background: "rgba(27,42,74,0.35)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(27,42,74,0.3)" }
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
              className="relative w-36 h-36 rounded-full flex items-center justify-center cursor-pointer p-2"
              style={{ background: phase.orbGrad, boxShadow: phase.orbShadow,
                transform: voicePhase === "listening" ? "scale(1.1)" : voicePhase === "speaking" ? "scale(1.05)" : "scale(1)",
                transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
              {voicePhase === "thinking"
                ? <div className="w-10 h-10 rounded-full border-4 border-white/20 border-t-white animate-spin" />
                : (
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/25">
                    <img src="/xia-logo.jpg" alt="Xia" className="w-full h-full object-cover" />
                  </div>
                )}
              {voicePhase === "listening" && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg">
                  <Mic size={14} className="text-[#1B2A4A]" />
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
                    style={{ width: 3, height: h, background: "linear-gradient(to top, #1B2A4A, #FFD280)",
                      animation: `xiaWave ${0.5 + (i % 4) * 0.2}s ${i * 0.06}s ease-in-out infinite alternate` }} />
                ))}
              </div>
            )}
            {voicePhase === "speaking" && (
              <div className="flex items-center justify-center gap-[4px] h-12">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="rounded-full"
                    style={{ width: 4, background: "linear-gradient(to top, #10b981, #6ee7b7)",
                      animation: `xiaSpeak ${0.7 + (i % 3) * 0.3}s ${i * 0.09}s ease-in-out infinite alternate`,
                      height: 8 + (i % 6) * 7 }} />
                ))}
              </div>
            )}
            {voicePhase === "thinking" && (
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(j => (
                  <div key={j} className="w-2.5 h-2.5 rounded-full bg-[#F5A623]"
                    style={{ animation: `xiaDot 1s ${j * 0.2}s ease-in-out infinite` }} />
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
            boxShadow: "0 24px 80px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.12), 0 0 0 1px rgba(27,42,74,0.15)",
            background: "#fff",
          }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #0d1526 0%, #14213d 50%, #1B2A4A 100%)" }}>
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden flex-shrink-0"
                style={{ boxShadow: "0 0 16px rgba(27,42,74,0.5)" }}>
                <img src="/xia-logo.jpg" alt="Xia" className="w-full h-full object-cover" />
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0d1526]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-white text-sm font-bold leading-none">Xia</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wide"
                    style={{ background: "rgba(245,166,35,0.25)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.4)" }}>PRO</span>
                </div>
                <p className="text-white/45 text-[10px] mt-0.5">Assistante e-commerce · En ligne</p>
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
                style={{ background: "rgba(27,42,74,0.35)" }}>
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
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 overflow-hidden"
                  style={{ boxShadow: "0 8px 24px rgba(27,42,74,0.3)" }}>
                  <img src="/xia-logo.jpg" alt="Xia" className="w-full h-full object-cover" />
                </div>
                <p className="text-gray-900 font-bold text-[15px]">Bonjour, je suis Xia</p>
                <p className="text-gray-400 text-xs mt-1.5 leading-relaxed max-w-[280px] mx-auto">
                  Je peux créer des produits, analyser tes ventes, lancer des campagnes, générer des images & vidéos IA — et bien plus.
                </p>
                <div className="flex flex-col gap-2 mt-5">
                  {SUGGESTIONS.map(s => (
                    <button key={s.label} onClick={() => sendMessage(s.label)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm text-left transition-all bg-white hover:border-[#F5A623]/40 hover:bg-[#FFF8EC] group"
                      style={{ borderColor: "#e5e7eb" }}>
                      <s.Icon size={16} className="flex-shrink-0 text-[#6b7ea3] group-hover:text-[#F5A623] transition-colors" />
                      <span className="font-medium text-gray-700 text-[13px] group-hover:text-[#1B2A4A] transition-colors">{s.label}</span>
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
                    <div className="w-7 h-7 rounded-lg flex-shrink-0 overflow-hidden mt-0.5">
                      <img src="/xia-logo.jpg" alt="Xia" className="w-full h-full object-cover" />
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
                        }`} style={isUser ? { background: "linear-gradient(135deg,#0d1526,#12203d)" } : {}}>
                          {isUser
                            ? <span className="whitespace-pre-wrap">{text}</span>
                            : <div className="xia-md" dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />}
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
                          <Video size={11} className="text-[#1B2A4A]" />
                          <span className="text-[10px] font-semibold text-gray-500">Vidéo IA générée</span>
                        </div>
                        <video src={url} controls className="w-full max-h-48 bg-black" />
                      </div>
                    ))}

                    {/* Audios */}
                    {allAudios.map((url, j) => (
                      <div key={j} className="rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-gray-100">
                          <Music size={11} className="text-[#1B2A4A]" />
                          <span className="text-[10px] font-semibold text-gray-500">Audio généré par Xia</span>
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

            {/* Thinking indicator */}
            {loading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-lg flex-shrink-0 overflow-hidden">
                  <img src="/xia-logo.jpg" alt="Xia" className="w-full h-full object-cover" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-2.5">
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map(j => (
                      <div key={j} className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "#1B2A4A", animation: `xiaDot 1s ${j * 0.18}s ease-in-out infinite` }} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 transition-all duration-500">
                    {THINKING_MSGS[thinkingMsgIdx]}
                  </span>
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
            <div className="flex items-end gap-2 rounded-xl px-3 py-2 transition-all"
              style={{ background: "#EEF1F6", border: "1.5px solid #dde3ee" }}
              onFocusCapture={e => (e.currentTarget.style.borderColor = "#1B2A4A")}
              onBlurCapture={e => (e.currentTarget.style.borderColor = "#dde3ee")}>
              <button onClick={() => fileRef.current?.click()}
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mb-0.5"
                style={{ background: "rgba(27,42,74,0.12)" }} title="Joindre une image">
                <Paperclip size={13} style={{ color: "#1B2A4A" }} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <textarea ref={inputRef} value={input} rows={1}
                onChange={e => { setInput(e.target.value); autoGrowInput(e.target); }}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                placeholder="Parle à Xia… (Maj+Entrée pour une nouvelle ligne)"
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none min-w-0 resize-none py-0.5 leading-relaxed"
                style={{ maxHeight: 120 }} />
              {loading ? (
                <button onClick={stopGeneration}
                  className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mb-0.5"
                  style={{ background: "linear-gradient(135deg,#ef4444,#b91c1c)" }}
                  title="Arrêter">
                  <Square size={10} className="text-white" fill="white" />
                </button>
              ) : (
                <button onClick={handleSendChat} disabled={!input.trim() && !pendingImage}
                  className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-40 mb-0.5"
                  style={{ background: "linear-gradient(135deg,#1B2A4A,#12203d)" }}>
                  <Send size={11} className="text-white" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Button ──────────────────────────────────────────────────── */}
      {!voiceMode && (
        <button onClick={() => setOpen(v => !v)} aria-label="Xia"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9991] transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ filter: "drop-shadow(0 4px 24px rgba(27,42,74,0.5))" }}>
          <div className="flex items-center gap-2.5 transition-all duration-300 relative"
            style={{
              background: open
                ? "linear-gradient(135deg,#0d1526,#12203d)"
                : "linear-gradient(135deg,#0d1526 0%,#16294a 55%,#1B2A4A 100%)",
              borderRadius: open ? "50%" : "60px",
              padding: open ? "14px" : "11px 20px",
              boxShadow: open
                ? "0 4px 20px rgba(27,42,74,0.55)"
                : "0 4px 28px rgba(27,42,74,0.6), 0 0 0 1px rgba(245,166,35,0.25), inset 0 1px 0 rgba(255,255,255,0.12)",
            }}>
            {/* Unread badge */}
            {!open && unread > 0 && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center z-10">
                <span className="text-white text-[9px] font-bold leading-none">{unread > 9 ? "9+" : unread}</span>
              </div>
            )}
            {open ? <X size={18} className="text-white" /> : (
              <>
                <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                  <img src="/xia-logo.jpg" alt="Xia" className="w-full h-full object-cover" />
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse border border-[#0d1526]" />
                </div>
                <span className="text-white font-bold text-[13px] tracking-wider">Xia</span>
              </>
            )}
          </div>
        </button>
      )}

      <style>{`
        @keyframes xiaDot   { 0%,80%,100%{transform:scale(0.55);opacity:0.45} 40%{transform:scale(1);opacity:1} }
        @keyframes xiaWave  { to { transform: scaleY(0.12); } }
        @keyframes xiaSpeak { to { transform: scaleY(0.18); } }
        @keyframes xiaRing  { 0%,100%{transform:scale(1);opacity:0.22} 50%{transform:scale(1.07);opacity:0.09} }

        .xia-md { line-height:1.65; font-size:13.5px; }
        .xia-md .xia-p { margin:0 0 6px 0; }
        .xia-md .xia-p:last-child { margin-bottom:0; }
        .xia-md .xia-h1 { font-size:15px; font-weight:700; margin:10px 0 4px; color:#0d1526; }
        .xia-md .xia-h2 { font-size:14px; font-weight:700; margin:8px 0 3px; color:#14213d; }
        .xia-md .xia-h3 { font-size:13px; font-weight:600; margin:6px 0 2px; color:#12203d; }
        .xia-md .xia-bq { border-left:3px solid #1B2A4A; padding:4px 10px; margin:6px 0; background:#eef1f6; border-radius:0 6px 6px 0; color:#12203d; font-style:italic; }
        .xia-md .xia-hr { border:none; border-top:1px solid #dde3ee; margin:8px 0; }
        .xia-md .xia-link { color:#1B2A4A; text-decoration:underline; text-underline-offset:2px; }
        .xia-md .xia-ul { margin:4px 0 4px 4px; padding:0; list-style:none; }
        .xia-md .xia-li { position:relative; padding-left:14px; margin:2px 0; }
        .xia-md .xia-li::before { content:"•"; position:absolute; left:2px; color:#1B2A4A; font-weight:bold; }
        .xia-md .xia-li.xia-ol::before { content:"→"; }
        .xia-md .xia-pre { background:#eef1f6; border:1px solid #dde3ee; border-radius:10px; padding:10px 12px; margin:8px 0; overflow-x:auto; }
        .xia-md .xia-code { font-family:'Monaco','Menlo','Consolas',monospace; font-size:12px; color:#12203d; white-space:pre; }
        .xia-md .xia-inline-code { background:#eef1f6; border:1px solid #dde3ee; border-radius:4px; padding:1px 5px; font-family:'Monaco','Menlo',monospace; font-size:11px; color:#1B2A4A; }
        .xia-md strong { font-weight:700; color:#111; }
        .xia-md em { font-style:italic; color:#4b5563; }
      `}</style>
    </>
  );
}
