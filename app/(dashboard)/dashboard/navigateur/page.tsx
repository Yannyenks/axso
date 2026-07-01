"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, RotateCw, Plus, X,
  Send, Loader2, Bot, ChevronLeft, AlertCircle, Zap,
  Maximize2, Minimize2, Play, CheckCircle2, XCircle,
  Radio, Cpu, Shield, SkipForward, ChevronRight,
} from "lucide-react";
import type { BrowserTab } from "@/lib/playwright-session";

const GlobeScene = dynamic(() => import("./_globe"), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
});

const APPS = [
  { l: "WhatsApp",  u: "https://web.whatsapp.com",         d: "web.whatsapp.com",     c: "#25D366", bg: "#e8f8ef" },
  { l: "Gmail",     u: "https://mail.google.com",           d: "mail.google.com",      c: "#EA4335", bg: "#fef2f2" },
  { l: "Mailchimp", u: "https://mailchimp.com/login/",      d: "mailchimp.com",        c: "#FFE01B", bg: "#fffce0" },
  { l: "Brevo",     u: "https://app.brevo.com",             d: "brevo.com",            c: "#0B96CC", bg: "#eff6ff" },
  { l: "Meta Ads",  u: "https://adsmanager.facebook.com",  d: "facebook.com",          c: "#0866FF", bg: "#eff6ff" },
  { l: "Instagram", u: "https://www.instagram.com",        d: "instagram.com",         c: "#E1306C", bg: "#fdf2f8" },
  { l: "TikTok",   u: "https://www.tiktok.com",            d: "tiktok.com",            c: "#010101", bg: "#f4f4f4" },
  { l: "Buffer",   u: "https://publish.buffer.com",         d: "buffer.com",           c: "#2C4BFF", bg: "#eff6ff" },
  { l: "YouTube",  u: "https://studio.youtube.com",        d: "youtube.com",           c: "#FF0000", bg: "#fef2f2" },
  { l: "LinkedIn", u: "https://www.linkedin.com",          d: "linkedin.com",          c: "#0077B5", bg: "#eff6ff" },
  { l: "Shopify",  u: "https://accounts.shopify.com",      d: "shopify.com",           c: "#96bf48", bg: "#f0f7ec" },
  { l: "AliExpress",u: "https://www.aliexpress.com",       d: "aliexpress.com",        c: "#e02e24", bg: "#fef2f2" },
];

function faviconUrl(d: string) {
  return `https://www.google.com/s2/favicons?domain=${d}&sz=64`;
}

const SUGGESTIONS = [
  { icon: "📧", text: "Crée une campagne email de promotion sur Mailchimp ou Brevo" },
  { icon: "📅", text: "Programme mes posts Instagram pour la semaine prochaine sur Buffer" },
  { icon: "💬", text: "Lis mes derniers messages WhatsApp non lus" },
  { icon: "📊", text: "Affiche les performances Meta Ads d'aujourd'hui" },
  { icon: "🎯", text: "Lance une campagne de reciblage sur Meta Ads Manager" },
];

const VP_W = 1280, VP_H = 800;

type ActionStep = { label: string; action: any; status?: "pending" | "running" | "ok" | "error"; detail?: string };
type Msg = { role: "user" | "axia"; content: string; thinking?: string; ts: number; steps?: ActionStep[] };

function NavigateurInner() {
  const searchParams   = useSearchParams();
  const [tabs, setTabs]               = useState<BrowserTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [screenshot, setShot]         = useState<string | null>(null);
  const [urlInput, setUrl]            = useState("");
  const [navLoading, setNavLoad]      = useState(false);
  const [openLoading, setOpenLoad]    = useState(false);
  const [sessionError, setError]      = useState<string | null>(null);
  const [hasSession, setSession]      = useState(false);
  const [axiaOpen, setAxia]           = useState(true);
  const [axiaInput, setAxiaIn]        = useState("");
  const [axiaLoading, setAxiaLoad]    = useState(false);
  const [chat, setChat]               = useState<Msg[]>([]);
  const [showThink, setShowThink]     = useState(false);
  const [scanY, setScanY]             = useState(0);
  const [fullscreen, setFullscreen]   = useState(false);
  const [autopilot, setAutopilot]     = useState(false);
  const [pendingPlan, setPendingPlan] = useState<{ thinking: string; steps: ActionStep[]; message: string } | null>(null);
  const [execLog, setExecLog]         = useState<ActionStep[]>([]);
  const [executing, setExecuting]     = useState(false);
  const [showLog, setShowLog]         = useState(false);

  const imgRef  = useRef<HTMLImageElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Scan line
  useEffect(() => {
    const id = setInterval(() => setScanY(v => (v + 0.4) % 100), 20);
    return () => clearInterval(id);
  }, []);

  // Deep-link : ?instruction=... and ?url=...
  useEffect(() => {
    const instr = searchParams.get("instruction");
    const url   = searchParams.get("url");
    if (instr) setAxiaIn(decodeURIComponent(instr));
    if (url) {
      openTab(decodeURIComponent(url)).then(() => {
        if (instr) setTimeout(() => sendAxia(decodeURIComponent(instr)), 1500);
      });
    }
  }, []); // eslint-disable-line

  const sync = useCallback((d: any) => {
    if (Array.isArray(d.tabs))                       setTabs(d.tabs);
    if (d.activeTabId)                               setActiveTabId(d.activeTabId);
    if (d.screenshot)                                setShot(d.screenshot);
    if (d.error)                                     setError(d.error);
    if (Array.isArray(d.tabs) && d.tabs.length > 0) setSession(true);
  }, []);

  // Screenshot polling
  useEffect(() => {
    if (!hasSession || executing) return;
    pollRef.current = setInterval(async () => {
      const r = await fetch("/api/navigateur/screenshot").catch(() => null);
      if (r?.ok) sync(await r.json());
    }, 800);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [hasSession, sync, executing]);

  useEffect(() => { chatRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat, pendingPlan]);

  // ── Actions navigateur ────────────────────────────────────────────────────
  const openTab = async (url?: string) => {
    setOpenLoad(true); setError(null);
    try {
      const r = await fetch("/api/navigateur/tabs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url || "https://www.google.com" }),
      });
      const d = await r.json();
      if (d.error && !d.tabs?.length) { setError(d.error); return; }
      sync(d); setUrl(url || "https://www.google.com");
    } catch (e: any) { setError(e.message); }
    finally { setOpenLoad(false); }
  };

  const switchTab = async (id: string) => {
    const r = await fetch("/api/navigateur/tabs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const d = await r.json(); sync(d);
    const t = d.tabs?.find((t: BrowserTab) => t.id === id);
    if (t) setUrl(t.url);
  };

  const closeTab = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const r = await fetch("/api/navigateur/tabs", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const d = await r.json(); sync(d);
    if (!d.tabs?.length) { setSession(false); setShot(null); if (pollRef.current) clearInterval(pollRef.current); }
  };

  const doAction = async (type: string, params: any = {}) => {
    const r = await fetch("/api/navigateur/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, params }) });
    if (r.ok) sync(await r.json());
  };

  const navigate = async (url: string) => {
    const n = url.startsWith("http") ? url : `https://${url}`;
    setUrl(n); setNavLoad(true);
    await doAction("navigate", { url: n });
    setNavLoad(false);
  };

  const click = useCallback(async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width)  * VP_W);
    const y = Math.round(((e.clientY - rect.top)  / rect.height) * VP_H);
    await doAction("click", { x, y });
  }, []); // eslint-disable-line

  const wheel = useCallback(async (e: React.WheelEvent<HTMLImageElement>) => {
    e.preventDefault();
    await doAction("scroll", { deltaX: 0, deltaY: e.deltaY });
  }, []); // eslint-disable-line

  const keydown = useCallback(async (e: React.KeyboardEvent) => {
    e.preventDefault();
    const MAP: Record<string, string> = {
      Enter: "Enter", Backspace: "Backspace", Tab: "Tab", Escape: "Escape",
      ArrowUp: "ArrowUp", ArrowDown: "ArrowDown", ArrowLeft: "ArrowLeft", ArrowRight: "ArrowRight", Delete: "Delete",
    };
    if (MAP[e.key]) await doAction("key", { key: MAP[e.key] });
    else if (e.key.length === 1) await doAction("type", { text: e.key });
  }, []); // eslint-disable-line

  // ── Envoi AXIA ────────────────────────────────────────────────────────────
  const sendAxia = async (instruction: string) => {
    if (!instruction.trim() || axiaLoading) return;
    setChat(h => [...h, { role: "user", content: instruction, ts: Date.now() }]);
    setAxiaIn(""); setAxiaLoad(true); setPendingPlan(null);

    try {
      const r = await fetch("/api/navigateur/axia", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction,
          preview: !autopilot,
          history: chat.slice(-6).map(m => ({ role: m.role === "axia" ? "assistant" : "user", content: m.content })),
        }),
      });
      const d = await r.json();
      sync(d);

      if (!autopilot && d.preview) {
        // Préparer le plan avec labels
        const steps: ActionStep[] = (d.actions || []).map((a: any, i: number) => ({
          label: d.stepLabels?.[i] || `${a.type}`,
          action: a,
          status: "pending" as const,
        }));
        setPendingPlan({ thinking: d.thinking || "", steps, message: d.message || "" });
        setChat(h => [...h, { role: "axia", content: d.message || "Voici mon plan d'action. Valide pour que j'exécute.", thinking: d.thinking, ts: Date.now() }]);
      } else {
        setChat(h => [...h, {
          role: "axia",
          content: d.message || d.error || "Tâche effectuée.",
          thinking: d.thinking,
          ts: Date.now(),
        }]);
      }
    } catch (e: any) {
      setChat(h => [...h, { role: "axia", content: `Erreur : ${e.message}`, ts: Date.now() }]);
    } finally { setAxiaLoad(false); }
  };

  // ── Exécuter un plan validé ───────────────────────────────────────────────
  const executePlan = async () => {
    if (!pendingPlan) return;
    setExecuting(true); setShowLog(true);
    const steps = pendingPlan.steps.map(s => ({ ...s, status: "pending" as const }));
    setExecLog(steps);
    setPendingPlan(null);

    for (let i = 0; i < steps.length; i++) {
      setExecLog(prev => prev.map((s, idx) => idx === i ? { ...s, status: "running" } : s));
      try {
        const r = await fetch("/api/navigateur/action", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: steps[i].action.type, params: steps[i].action.params || {} }),
        });
        const d = await r.json();
        if (d.screenshot) setShot(d.screenshot);
        sync(d);
        setExecLog(prev => prev.map((s, idx) => idx === i ? { ...s, status: "ok" } : s));
        if (["navigate", "click", "key"].includes(steps[i].action.type)) {
          await new Promise(res => setTimeout(res, 600));
        }
      } catch (e: any) {
        setExecLog(prev => prev.map((s, idx) => idx === i ? { ...s, status: "error", detail: e.message } : s));
      }
    }

    // Screenshot final
    const finalR = await fetch("/api/navigateur/screenshot").catch(() => null);
    if (finalR?.ok) { const d = await finalR.json(); sync(d); }

    setExecuting(false);
    setChat(h => [...h, { role: "axia", content: "✓ Toutes les actions ont été exécutées.", ts: Date.now(), steps: execLog }]);
  };

  // ── Container styles ──────────────────────────────────────────────────────
  const containerStyle = fullscreen
    ? { position: "fixed" as const, inset: 0, zIndex: 9999 }
    : { borderRadius: "16px", overflow: "hidden", minHeight: "calc(100vh - 180px)" };

  // ── SPLASH SCREEN ─────────────────────────────────────────────────────────
  if (!hasSession) {
    return (
      <div style={{ ...containerStyle, background: "#000008", position: fullscreen ? "fixed" : "relative", overflow: "hidden", fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif" }}>
        <button onClick={() => setFullscreen(v => !v)} style={{ position: "absolute", top: 14, right: 14, zIndex: 10,
          display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 10, cursor: "pointer",
          fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)",
          color: "#9ca3af", backdropFilter: "blur(8px)", fontFamily: "inherit" }}>
          {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          {fullscreen ? "Réduire" : "Plein écran"}
        </button>

        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}><GlobeScene /></div>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 70% 70% at 50% 45%, transparent 20%, #000008 85%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80, pointerEvents: "none",
          background: "linear-gradient(to bottom, #000008, transparent)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 160, pointerEvents: "none",
          background: "linear-gradient(to top, #000008 50%, transparent)" }} />

        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999,
              background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.22)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F5A623", boxShadow: "0 0 8px #F5A623", animation: "bpulse2 2s infinite" }} />
              <span style={{ fontSize: 9, fontWeight: 900, color: "#F5A623", letterSpacing: "0.35em", textTransform: "uppercase" }}>
                Axso Navigator · AXIA Prêt
              </span>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F5A623", boxShadow: "0 0 8px #F5A623", animation: "bpulse2 2s 0.5s infinite" }} />
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: -60 }}>
            <h1 style={{ fontSize: 52, fontWeight: 900, color: "#fff", textAlign: "center", margin: 0, lineHeight: 1.1,
              textShadow: "0 0 80px rgba(245,166,35,0.35)" }}>Navigateur</h1>
            <h1 style={{ fontSize: 52, fontWeight: 900, textAlign: "center", margin: 0, lineHeight: 1.1, color: "#F5A623",
              textShadow: "0 0 60px rgba(245,166,35,0.9), 0 0 120px rgba(245,166,35,0.4)" }}>Contrôlé par AXIA</h1>
            <p style={{ color: "#4b5563", fontSize: 13, marginTop: 12, textAlign: "center", lineHeight: 1.6, maxWidth: 400 }}>
              AXIA peut naviguer, remplir des formulaires, créer des campagnes<br />et programmer des posts à votre place
            </p>
          </div>

          <div style={{ width: "100%", maxWidth: 720, paddingBottom: 32, paddingLeft: 24, paddingRight: 24 }}>
            {sessionError && (
              <div style={{ marginBottom: 16, display: "flex", gap: 12, padding: "14px 16px", borderRadius: 16,
                background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <AlertCircle size={14} style={{ color: "#f87171", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#f87171", margin: 0 }}>Erreur de démarrage</p>
                  <p style={{ fontSize: 10, color: "rgba(248,113,113,0.6)", margin: "4px 0 0", fontFamily: "monospace" }}>{sessionError}</p>
                </div>
              </div>
            )}

            {/* Suggestions AXIA */}
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 9, color: "#374151", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 4px" }}>
                — AXIA peut faire ça pour vous —
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i}
                    onClick={() => { setAxiaIn(s.text); openTab("https://www.google.com"); }}
                    style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 14,
                      background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
                      cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,166,35,0.35)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
                    <span style={{ fontSize: 10, color: "#6b7280", lineHeight: 1.5 }}>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* App grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginBottom: 14 }}>
              {APPS.map(app => (
                <button key={app.l} onClick={() => openTab(app.u)} disabled={openLoading}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, padding: "10px 4px",
                    borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.025)",
                    cursor: "pointer", opacity: openLoading ? 0.4 : 1, fontFamily: "inherit" }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = app.c + "70"; el.style.background = app.c + "12"; }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = "rgba(255,255,255,0.06)"; el.style.background = "rgba(255,255,255,0.025)"; }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: app.bg, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: `0 2px 8px ${app.c}30` }}>
                    <img src={faviconUrl(app.d)} alt={app.l} width={26} height={26} style={{ objectFit: "contain" }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{app.l}</span>
                </button>
              ))}
            </div>

            {/* URL bar */}
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
                borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(245,166,35,0.15)", backdropFilter: "blur(12px)" }}>
                <span style={{ fontSize: 14 }}>🌐</span>
                <input value={urlInput} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && openTab(urlInput)}
                  placeholder="URL ou demande à AXIA..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: "#fff", fontFamily: "inherit" }} />
              </div>
              <button onClick={() => openTab(urlInput)} disabled={openLoading}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 22px", borderRadius: 16, border: "none", cursor: "pointer",
                  fontWeight: 900, fontSize: 13, background: "linear-gradient(135deg,#F5A623,#c97a10)", color: "#000",
                  boxShadow: "0 0 32px rgba(245,166,35,0.35)", opacity: openLoading ? 0.5 : 1, fontFamily: "inherit" }}>
                {openLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={14} />}
                {openLoading ? "Démarrage..." : "Ouvrir"}
              </button>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes bpulse2 { 0%,100%{opacity:.4;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }
          @keyframes spin { to{transform:rotate(360deg)} }
        `}</style>
      </div>
    );
  }

  // ── BROWSER UI ─────────────────────────────────────────────────────────────
  const activeTab = tabs.find(t => t.id === activeTabId);
  const PANEL_W = axiaOpen ? 380 : 0;

  return (
    <div style={{ ...containerStyle, display: "flex", flexDirection: "column", overflow: "hidden",
      background: "#000010", fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif" }}>

      {/* Top neon line */}
      <div style={{ height: 2, flexShrink: 0, background: "linear-gradient(90deg,transparent,#F5A623 30%,#00D4FF 70%,transparent)" }} />

      {/* Chrome bar */}
      <div style={{ flexShrink: 0, background: "rgba(0,0,18,0.99)", borderBottom: "1px solid rgba(245,166,35,0.1)" }}>

        {/* Tab bar */}
        <div style={{ display: "flex", alignItems: "flex-end", padding: "6px 8px 0", gap: 2, overflowX: "auto" }}>
          <a href="/dashboard" style={{ flexShrink: 0, display: "flex", alignItems: "center", padding: "6px 8px", color: "#374151", textDecoration: "none", marginRight: 4 }}>
            <ChevronLeft size={13} />
          </a>
          {tabs.map(tab => {
            const active = tab.id === activeTabId;
            return (
              <div key={tab.id} onClick={() => switchTab(tab.id)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                  fontSize: 11, cursor: "pointer", maxWidth: 180, flexShrink: 0, borderRadius: "10px 10px 0 0",
                  background: active ? "rgba(245,166,35,0.08)" : "transparent",
                  border: active ? "1px solid rgba(245,166,35,0.2)" : "1px solid transparent",
                  borderBottom: active ? "1px solid rgba(0,0,18,0.99)" : "1px solid transparent",
                  color: active ? "#F5A623" : "#374151" }}>
                {tab.favicon
                  ? <img src={tab.favicon} alt="" style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0 }} onError={e => (e.currentTarget.style.display = "none")} />
                  : <span style={{ fontSize: 11, opacity: 0.5 }}>🌐</span>}
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, maxWidth: 100 }}>
                  {tab.title || "Chargement..."}
                </span>
                <button onClick={e => closeTab(tab.id, e)}
                  style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: "inherit", opacity: 0.5, padding: 0, display: "flex" }}>
                  <X size={10} />
                </button>
              </div>
            );
          })}
          <button onClick={() => openTab()}
            style={{ flexShrink: 0, width: 26, height: 26, marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "center",
              background: "none", border: "none", cursor: "pointer", color: "#374151", borderRadius: 8 }}>
            <Plus size={12} />
          </button>
        </div>

        {/* Address bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px" }}>
          <button onClick={() => doAction("back")}    style={navBtn}><ArrowLeft    size={13} /></button>
          <button onClick={() => doAction("forward")} style={navBtn}><ArrowRight   size={13} /></button>
          <button onClick={() => doAction("reload")}  style={navBtn}>
            {navLoading ? <Loader2 size={13} style={{ color: "#F5A623", animation: "spin 1s linear infinite" }} /> : <RotateCw size={13} />}
          </button>

          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
            borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(245,166,35,0.12)" }}
            onFocusCapture={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,166,35,0.45)"}
            onBlurCapture={e  => (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,166,35,0.12)"}>
            <span style={{ fontSize: 11 }}>🌐</span>
            <input value={urlInput} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && navigate(urlInput)}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 11, color: "#9ca3af", fontFamily: "inherit" }}
              placeholder="URL..." />
          </div>

          {/* Quick apps */}
          {APPS.slice(0, 6).map(app => (
            <button key={app.l} title={app.l} onClick={() => navigate(app.u)}
              style={{ ...navBtn, padding: 4, borderRadius: 8, overflow: "hidden" }}>
              <img src={faviconUrl(app.d)} alt={app.l} width={18} height={18} style={{ objectFit: "contain", display: "block" }}
                onError={e => { (e.target as HTMLImageElement).style.opacity = "0.3"; }} />
            </button>
          ))}

          {/* AXIA toggle */}
          <button onClick={() => setAxia(v => !v)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 10,
            fontSize: 10, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase",
            cursor: "pointer", fontFamily: "inherit",
            ...(axiaOpen
              ? { background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.35)", color: "#00D4FF", boxShadow: "0 0 20px rgba(0,212,255,0.2)" }
              : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#4b5563" }),
          }}>
            <Bot size={10} /> AXIA
          </button>

          <button onClick={() => setFullscreen(v => !v)} style={{ ...navBtn, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
            {fullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, position: "relative", display: "flex", overflow: "hidden" }}>

        {/* Browser viewport */}
        <div style={{ flex: 1, position: "relative", outline: "none" }} tabIndex={0} onKeyDown={keydown}>
          {screenshot ? (
            <>
              <img ref={imgRef} src={screenshot} alt="browser" draggable={false}
                onClick={click} onWheel={wheel}
                style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "top",
                  userSelect: "none", cursor: "crosshair", imageRendering: "crisp-edges", background: "#0a0a0a" }} />

              {/* Scan line */}
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", mixBlendMode: "overlay" }}>
                <div style={{ position: "absolute", left: 0, right: 0, height: 1, top: `${scanY}%`,
                  background: "linear-gradient(90deg,transparent,rgba(245,166,35,0.35) 25%,rgba(0,212,255,0.25) 75%,transparent)" }} />
              </div>

              {/* HUD corners */}
              {(["tl","tr","bl","br"] as const).map(id => (
                <div key={id} style={{ position: "absolute",
                  top:    id.includes("t") ? 8 : "auto", bottom: id.includes("b") ? 8 : "auto",
                  left:   id.includes("l") ? 8 : "auto", right:  id.includes("r") ? 8 : "auto",
                  width: 24, height: 24, pointerEvents: "none",
                  borderTop:    id.includes("t") ? "1px solid rgba(245,166,35,0.4)" : "none",
                  borderBottom: id.includes("b") ? "1px solid rgba(245,166,35,0.4)" : "none",
                  borderLeft:   id.includes("l") ? "1px solid rgba(245,166,35,0.4)" : "none",
                  borderRight:  id.includes("r") ? "1px solid rgba(245,166,35,0.4)" : "none",
                }} />
              ))}

              {/* Status bar */}
              <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
                display: "flex", alignItems: "center", gap: 12, padding: "5px 16px", borderRadius: 999, pointerEvents: "none",
                background: "rgba(0,0,24,0.88)", border: "1px solid rgba(245,166,35,0.14)" }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
                <span style={{ fontSize: 9, color: "#4ade80", fontFamily: "monospace", letterSpacing: "0.15em" }}>LIVE</span>
                <span style={{ width: 1, height: 10, background: "rgba(255,255,255,0.1)" }} />
                <span style={{ fontSize: 9, color: "#4b5563", fontFamily: "monospace", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {activeTab?.url || "—"}
                </span>
                {executing && <>
                  <span style={{ width: 1, height: 10, background: "rgba(255,255,255,0.1)" }} />
                  <span style={{ fontSize: 9, color: "#F5A623", fontFamily: "monospace" }}>AXIA EN ACTION</span>
                </>}
              </div>
            </>
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#000010" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px", background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)" }}>
                  <Loader2 size={22} style={{ color: "#F5A623", animation: "spin 1s linear infinite" }} />
                </div>
                <p style={{ fontSize: 11, color: "#374151", fontFamily: "monospace", letterSpacing: "0.2em" }}>INITIALISATION...</p>
              </div>
            </div>
          )}

          {/* AXIA working overlay */}
          {(axiaLoading || executing) && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-start", justifyContent: "center",
              pointerEvents: "none", paddingTop: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px", borderRadius: 24,
                background: "rgba(0,5,30,0.97)", border: "1px solid rgba(0,212,255,0.3)", boxShadow: "0 0 40px rgba(0,212,255,0.15)" }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)" }}>
                  <Cpu size={16} style={{ color: "#00D4FF" }} />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 900, color: "#fff", margin: 0 }}>
                    {axiaLoading ? "AXIA analyse..." : "AXIA exécute..."}
                  </p>
                  {executing && execLog.length > 0 && (
                    <p style={{ fontSize: 9, color: "#4b5563", margin: "3px 0 0", fontFamily: "monospace" }}>
                      {execLog.filter(s => s.status === "ok").length}/{execLog.length} actions
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", gap: 3 }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{ height: 3, width: 16, borderRadius: 2, background: "rgba(0,212,255,0.25)",
                      animation: `bpulse 1s ${i*0.12}s ease-in-out infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AXIA Panel */}
        <div style={{
          width: PANEL_W, flexShrink: 0, overflow: "hidden",
          transition: "width 0.3s ease", background: "rgba(0,0,22,0.99)",
          borderLeft: axiaOpen ? "1px solid rgba(0,212,255,0.15)" : "none",
          display: "flex", flexDirection: "column",
        }}>
          {axiaOpen && (
            <>
              {/* Header mini-globe */}
              <div style={{ flexShrink: 0, height: 90, position: "relative", borderBottom: "1px solid rgba(0,212,255,0.08)", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}><GlobeScene compact /></div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 36, background: "linear-gradient(to bottom, transparent, rgba(0,0,22,0.99))" }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Bot size={13} style={{ color: "#00D4FF" }} />
                      <span style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>AXIA</span>
                    </div>
                    <span style={{ fontSize: 8, padding: "2px 8px", borderRadius: 999, fontFamily: "monospace",
                      background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)",
                      display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 4px #4ade80" }} />
                      ACTIVE
                    </span>
                  </div>
                </div>
              </div>

              {/* Autopilot toggle */}
              <div style={{ flexShrink: 0, padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)",
                display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Radio size={12} style={{ color: autopilot ? "#4ade80" : "#374151" }} />
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 800, color: autopilot ? "#4ade80" : "#6b7280", margin: 0 }}>
                      AUTOPILOTE {autopilot ? "ON" : "OFF"}
                    </p>
                    <p style={{ fontSize: 8, color: "#1f2937", margin: 0, fontFamily: "monospace" }}>
                      {autopilot ? "Exécution immédiate" : "Validation requise"}
                    </p>
                  </div>
                </div>
                <button onClick={() => setAutopilot(v => !v)} style={{
                  width: 42, height: 22, borderRadius: 11, border: "none", cursor: "pointer", position: "relative",
                  background: autopilot ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.07)",
                  boxShadow: autopilot ? "0 0 12px rgba(74,222,128,0.3)" : "none",
                  transition: "all 0.2s",
                }}>
                  <div style={{
                    position: "absolute", top: 3, left: autopilot ? 22 : 4, width: 16, height: 16,
                    borderRadius: "50%", background: autopilot ? "#4ade80" : "#374151",
                    transition: "all 0.2s", boxShadow: autopilot ? "0 0 8px #4ade80" : "none",
                  }} />
                </button>
              </div>

              {/* Contrôles secondaires */}
              <div style={{ flexShrink: 0, padding: "6px 14px", borderBottom: "1px solid rgba(255,255,255,0.03)",
                display: "flex", gap: 6 }}>
                <button onClick={() => setShowThink(v => !v)} style={{ fontSize: 9, padding: "3px 8px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                  ...(showThink ? { background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)", color: "#a855f7" }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#4b5563" }) }}>
                  💭 Raisonnement
                </button>
                {execLog.length > 0 && (
                  <button onClick={() => setShowLog(v => !v)} style={{ fontSize: 9, padding: "3px 8px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                    ...(showLog ? { background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.3)", color: "#F5A623" }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#4b5563" }) }}>
                    📋 Journal
                  </button>
                )}
              </div>

              {/* Journal d'exécution */}
              {showLog && execLog.length > 0 && (
                <div style={{ flexShrink: 0, margin: "8px 12px", padding: "10px 12px", borderRadius: 14,
                  background: "rgba(0,212,255,0.03)", border: "1px solid rgba(0,212,255,0.1)", maxHeight: 180, overflowY: "auto" }}>
                  <p style={{ fontSize: 9, color: "#374151", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "monospace", margin: "0 0 8px" }}>
                    Journal d'actions
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {execLog.map((step, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {step.status === "ok"      && <CheckCircle2 size={11} style={{ color: "#4ade80", flexShrink: 0 }} />}
                        {step.status === "error"   && <XCircle      size={11} style={{ color: "#f87171", flexShrink: 0 }} />}
                        {step.status === "running" && <Loader2      size={11} style={{ color: "#F5A623", flexShrink: 0, animation: "spin 1s linear infinite" }} />}
                        {step.status === "pending" && <div style={{ width: 11, height: 11, borderRadius: "50%", border: "1px solid #374151", flexShrink: 0 }} />}
                        <span style={{ fontSize: 10, color: step.status === "ok" ? "#4ade80" : step.status === "error" ? "#f87171" : step.status === "running" ? "#F5A623" : "#374151" }}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plan en attente de validation */}
              {pendingPlan && (
                <div style={{ flexShrink: 0, margin: "8px 12px", borderRadius: 16,
                  background: "rgba(245,166,35,0.04)", border: "1px solid rgba(245,166,35,0.25)" }}>
                  <div style={{ padding: "10px 12px 8px", borderBottom: "1px solid rgba(245,166,35,0.1)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <Shield size={11} style={{ color: "#F5A623" }} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: "#F5A623", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        Plan d'action · {pendingPlan.steps.length} étapes
                      </span>
                    </div>
                    {pendingPlan.steps.map((step, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 5 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#4b5563", fontFamily: "monospace", flexShrink: 0, minWidth: 16 }}>{i + 1}.</span>
                        <span style={{ fontSize: 10, color: "#9ca3af", lineHeight: 1.4 }}>{step.label}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "8px 12px", display: "flex", gap: 8 }}>
                    <button onClick={executePlan} style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "9px 12px", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit",
                      fontWeight: 900, fontSize: 11, background: "linear-gradient(135deg,#F5A623,#c97a10)", color: "#000",
                      boxShadow: "0 0 20px rgba(245,166,35,0.3)",
                    }}>
                      <Play size={11} /> Valider & Exécuter
                    </button>
                    <button onClick={() => setPendingPlan(null)} style={{
                      padding: "9px 12px", borderRadius: 12, border: "1px solid rgba(239,68,68,0.25)", cursor: "pointer",
                      fontFamily: "inherit", fontSize: 10, background: "rgba(239,68,68,0.06)", color: "#f87171",
                    }}>
                      <X size={11} />
                    </button>
                  </div>
                </div>
              )}

              {/* Chat */}
              <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
                {chat.length === 0 && !pendingPlan && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 4 }}>
                    <p style={{ fontSize: 9, color: "#374151", textAlign: "center", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 6px" }}>
                      — instructions —
                    </p>
                    {SUGGESTIONS.map((s, i) => (
                      <button key={i} onClick={() => sendAxia(s.text)}
                        style={{ fontSize: 10, textAlign: "left", lineHeight: 1.5, padding: "9px 12px", borderRadius: 12,
                          background: "rgba(0,212,255,0.03)", border: "1px solid rgba(0,212,255,0.08)",
                          color: "#4b5563", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "flex-start", gap: 8 }}
                        onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = "rgba(0,212,255,0.3)"; el.style.color = "#9ca3af"; }}
                        onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = "rgba(0,212,255,0.08)"; el.style.color = "#4b5563"; }}>
                        <span style={{ flexShrink: 0 }}>{s.icon}</span>
                        <span>{s.text}</span>
                      </button>
                    ))}
                  </div>
                )}

                {chat.map((msg, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "96%" }}>
                      {msg.role === "axia" && showThink && msg.thinking && (
                        <div style={{ marginBottom: 6, padding: "8px 12px", borderRadius: 12, fontSize: 10, lineHeight: 1.6,
                          background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)", color: "#a855f7" }}>
                          <span style={{ display: "block", fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "monospace", opacity: 0.6, marginBottom: 3 }}>thinking</span>
                          {msg.thinking}
                        </div>
                      )}
                      <div style={{ padding: "9px 13px", fontSize: 11, lineHeight: 1.6, borderRadius: 16,
                        ...(msg.role === "user"
                          ? { background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.18)", color: "#fde68a", borderTopRightRadius: 4 }
                          : { background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.1)", color: "#cbd5e1", borderTopLeftRadius: 4 }) }}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}

                {axiaLoading && (
                  <div style={{ display: "flex" }}>
                    <div style={{ padding: "9px 14px", borderRadius: 16, borderTopLeftRadius: 4, display: "flex", alignItems: "center", gap: 5,
                      background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.1)" }}>
                      {[0,1,2].map(j => (
                        <div key={j} style={{ width: 5, height: 5, borderRadius: "50%", background: "#00D4FF",
                          boxShadow: "0 0 6px #00D4FF", animation: `dot 1.2s ${j*0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatRef} />
              </div>

              {/* Input */}
              <div style={{ flexShrink: 0, padding: "10px 12px", borderTop: "1px solid rgba(0,212,255,0.08)" }}>
                {!autopilot && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, padding: "5px 10px", borderRadius: 8,
                    background: "rgba(245,166,35,0.04)", border: "1px solid rgba(245,166,35,0.12)" }}>
                    <Shield size={10} style={{ color: "#F5A623", flexShrink: 0 }} />
                    <span style={{ fontSize: 9, color: "#6b7280" }}>AXIA proposera un plan · vous validez</span>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <textarea
                    value={axiaInput}
                    onChange={e => setAxiaIn(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAxia(axiaInput); } }}
                    placeholder={autopilot ? "Instruis AXIA — exécution immédiate..." : "Instruis AXIA..."}
                    rows={2}
                    style={{ flex: 1, fontSize: 11, color: "#fff", padding: "9px 12px", borderRadius: 12, lineHeight: 1.6,
                      resize: "none", outline: "none", fontFamily: "inherit",
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,212,255,0.14)" }}
                    onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(0,212,255,0.45)"}
                    onBlur={e  => (e.target as HTMLElement).style.borderColor = "rgba(0,212,255,0.14)"}
                  />
                  <button onClick={() => sendAxia(axiaInput)} disabled={axiaLoading || !axiaInput.trim() || executing}
                    style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 11, border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: autopilot ? "linear-gradient(135deg,#4ade80,#22c55e)" : "linear-gradient(135deg,#00D4FF,#006699)",
                      boxShadow: autopilot ? "0 0 16px rgba(74,222,128,0.35)" : "0 0 16px rgba(0,212,255,0.3)",
                      opacity: (axiaLoading || !axiaInput.trim() || executing) ? 0.3 : 1 }}>
                    {axiaLoading ? <Loader2 size={13} style={{ color: "#fff", animation: "spin 1s linear infinite" }} /> : <Send size={12} style={{ color: "#fff" }} />}
                  </button>
                </div>
                <p style={{ fontSize: 8, color: "#111827", textAlign: "center", marginTop: 5, fontFamily: "monospace" }}>⏎ envoyer · shift+⏎ saut de ligne</p>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes dot { 0%,80%,100%{transform:scale(.5);opacity:.3} 40%{transform:scale(1);opacity:1} }
        @keyframes bpulse { 0%,100%{opacity:.15;transform:scaleX(.5)} 50%{opacity:1;transform:scaleX(1)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes bpulse2 { 0%,100%{opacity:.4;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }
      `}</style>
    </div>
  );
}

export default function NavigateurPage() {
  return (
    <Suspense fallback={<div style={{ height: "100vh", background: "#000008", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 size={32} style={{ color: "#F5A623", animation: "spin 1s linear infinite" }} />
    </div>}>
      <NavigateurInner />
    </Suspense>
  );
}

const navBtn: React.CSSProperties = {
  width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
  background: "none", border: "none", cursor: "pointer", color: "#4b5563", borderRadius: 8, flexShrink: 0,
};
