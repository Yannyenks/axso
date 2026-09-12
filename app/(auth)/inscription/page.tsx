"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight, Check, Loader2, Sparkles, Send, CheckCircle2,
  Store, Globe, Palette, User, Lock, Phone, Mail,
} from "lucide-react";
import type { PlanBoutique } from "@/lib/ai-agent";
import { MANIFESTE_LIBRAIRIE } from "@/lib/axso-design-manifest";

// ─── Design tokens ────────────────────────────────────────────────────────────
const ACCENT = "#F5A623";
const ACCENT_D = "#C8760A";
const BG = "#06090F";
const SURFACE = "#0C1018";
const CARD = "#101520";
const BORDER = "rgba(255,255,255,0.07)";
const BORDER_ACCENT = "rgba(245,166,35,0.25)";
const TEXT = "#F0F0F0";
const MUTED = "#6B7280";

// ─── Pays ─────────────────────────────────────────────────────────────────────
const PAYS_LIST = [
  { code: "SN", nom: "Sénégal",       flag: "🇸🇳" },
  { code: "CI", nom: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "CM", nom: "Cameroun",      flag: "🇨🇲" },
  { code: "MA", nom: "Maroc",         flag: "🇲🇦" },
  { code: "NG", nom: "Nigeria",       flag: "🇳🇬" },
  { code: "GH", nom: "Ghana",         flag: "🇬🇭" },
  { code: "TG", nom: "Togo",          flag: "🇹🇬" },
  { code: "BJ", nom: "Bénin",         flag: "🇧🇯" },
  { code: "ML", nom: "Mali",          flag: "🇲🇱" },
  { code: "KE", nom: "Kenya",         flag: "🇰🇪" },
  { code: "FR", nom: "France",        flag: "🇫🇷" },
  { code: "BE", nom: "Belgique",      flag: "🇧🇪" },
  { code: "CA", nom: "Canada",        flag: "🇨🇦" },
  { code: "US", nom: "États-Unis",    flag: "🇺🇸" },
  { code: "AE", nom: "Émirats",       flag: "🇦🇪" },
  { code: "GB", nom: "Royaume-Uni",   flag: "🇬🇧" },
];

// ─── Templates from AXSO Design Library ──────────────────────────────────────
const THEMES = MANIFESTE_LIBRAIRIE.map((e) => ({
  id: e.fichier,
  nom: e.nom,
  couleurs: e.couleurs,
  ambiance: e.ambiance,
}));

// ─── Schema compte ────────────────────────────────────────────────────────────
const schemaCompte = z.object({
  name:     z.string().min(2, "Minimum 2 caractères"),
  email:    z.string().email("Email invalide"),
  password: z.string().min(6, "Minimum 6 caractères"),
  whatsapp: z.string().min(8, "Numéro requis"),
});
type CompteData = z.infer<typeof schemaCompte>;

// ─── Phase machine ────────────────────────────────────────────────────────────
type Phase =
  | "welcome"
  | "q-vente"
  | "q-pays"
  | "q-theme"
  | "analyse"
  | "plan"
  | "q-compte"
  | "creation"
  | "succes";

// ─── CSS animations (injected once) ──────────────────────────────────────────
const ANIMATION_CSS = `
@keyframes msgIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes dotBlink {
  0%,80%,100% { opacity: 0.2; transform: scale(0.85); }
  40%         { opacity: 1;   transform: scale(1); }
}
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
@keyframes pulse-ring {
  0%   { transform: scale(1);    opacity: 0.6; }
  50%  { transform: scale(1.15); opacity: 0.2; }
  100% { transform: scale(1);    opacity: 0.6; }
}
.msg-in { animation: msgIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
.dot-blink { animation: dotBlink 1.2s ease-in-out infinite; }
`;

// ─── Components ───────────────────────────────────────────────────────────────

function AxiaAvatar({ size = 36 }: { size?: number }) {
  return (
    <div className="flex-shrink-0 relative" style={{ width: size, height: size }}>
      <div
        style={{
          width: size, height: size, borderRadius: "30%",
          background: `linear-gradient(135deg, #1B2A4A, #2d4270)`,
          border: `1.5px solid ${BORDER_ACCENT}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 ${size * 0.5}px rgba(245,166,35,0.15)`,
        }}
      >
        <img src="/axia-icon.png" alt="Axia" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
      </div>
      <div style={{
        position: "absolute", bottom: -2, right: -2,
        width: size * 0.32, height: size * 0.32,
        borderRadius: "50%", background: "#22C55E",
        border: `1.5px solid ${BG}`,
      }} />
    </div>
  );
}

function AxiaThinking() {
  return (
    <div className="flex items-center gap-3">
      <AxiaAvatar size={32} />
      <div style={{
        background: CARD, border: `1px solid ${BORDER}`,
        borderRadius: "0 16px 16px 16px", padding: "12px 16px",
        display: "flex", gap: 5, alignItems: "center",
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="dot-blink" style={{
            width: 6, height: 6, borderRadius: "50%",
            background: ACCENT, animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

function AxiaMsg({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div className="msg-in flex items-start gap-3" style={{ animationDelay: `${delay}ms` }}>
      <AxiaAvatar size={32} />
      <div style={{
        background: CARD, border: `1px solid ${BORDER}`,
        borderRadius: "0 16px 16px 16px",
        padding: "13px 16px", maxWidth: "82%",
        color: TEXT, fontSize: 14, lineHeight: 1.6,
      }}>
        {children}
      </div>
    </div>
  );
}

function UserMsg({ children }: { children: React.ReactNode }) {
  return (
    <div className="msg-in flex justify-end">
      <div style={{
        background: `linear-gradient(135deg, ${ACCENT}22, ${ACCENT}14)`,
        border: `1px solid ${BORDER_ACCENT}`,
        borderRadius: "16px 0 16px 16px",
        padding: "12px 16px", maxWidth: "75%",
        color: TEXT, fontSize: 14, lineHeight: 1.6,
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Pays selector ──────────────────────────────────────────────────────────────
function PaysSelector({ onSelect }: { onSelect: (code: string, nom: string) => void }) {
  const [selected, setSelected] = useState("");
  return (
    <div className="msg-in">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, maxWidth: 420 }}>
        {PAYS_LIST.map(p => (
          <button key={p.code}
            onClick={() => { setSelected(p.code); onSelect(p.code, p.nom); }}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 4, padding: "10px 6px", borderRadius: 12,
              background: selected === p.code ? `${ACCENT}18` : CARD,
              border: `1px solid ${selected === p.code ? BORDER_ACCENT : BORDER}`,
              cursor: "pointer", transition: "all 0.15s",
              color: TEXT, fontSize: 11, fontWeight: 600,
            }}
          >
            <span style={{ fontSize: 22 }}>{p.flag}</span>
            <span style={{ color: selected === p.code ? ACCENT : MUTED, lineHeight: 1.2, textAlign: "center" }}>{p.nom}</span>
            {selected === p.code && <Check size={10} color={ACCENT} />}
          </button>
        ))}
        <button
          onClick={() => { setSelected("AU"); onSelect("AU", "Autre"); }}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 4, padding: "10px 6px", borderRadius: 12,
            background: selected === "AU" ? `${ACCENT}18` : CARD,
            border: `1px solid ${selected === "AU" ? BORDER_ACCENT : BORDER}`,
            cursor: "pointer", transition: "all 0.15s",
            color: TEXT, fontSize: 11, fontWeight: 600,
          }}
        >
          <span style={{ fontSize: 22 }}>🌍</span>
          <span style={{ color: selected === "AU" ? ACCENT : MUTED }}>Autre</span>
        </button>
      </div>
    </div>
  );
}

// ── Theme selector avec vrais aperçus iframes ──────────────────────────────────
function ThemeSelector({
  selectedId, onSelect, nomBoutique, produits, devise,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  nomBoutique?: string;
  produits?: { nom: string; prix: number; description?: string }[];
  devise?: string;
}) {
  const produitsParam = encodeURIComponent(JSON.stringify((produits || []).slice(0, 6)));
  const nomParam = encodeURIComponent(nomBoutique || "Ma Boutique");
  const deviseParam = encodeURIComponent(devise || "XAF");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, maxWidth: 500 }}>
      {THEMES.slice(0, 9).map(t => {
        const c = t.couleurs;
        const sel = selectedId === t.id;
        const previewUrl = `/api/preview-theme?fichier=${encodeURIComponent(t.id)}&nom=${nomParam}&devise=${deviseParam}&produits=${produitsParam}`;

        return (
          <button key={t.id} onClick={() => onSelect(t.id)}
            style={{
              padding: 0, borderRadius: 14, overflow: "hidden",
              border: `2px solid ${sel ? (c.accent || ACCENT) : BORDER}`,
              cursor: "pointer", transition: "all 0.18s",
              boxShadow: sel ? `0 0 0 4px ${(c.accent || ACCENT)}30, 0 8px 24px rgba(0,0,0,0.4)` : "0 2px 8px rgba(0,0,0,0.3)",
              position: "relative", background: c.fond || "#fff",
            }}
          >
            {/* Iframe live preview */}
            <div style={{ position: "relative", height: 130, overflow: "hidden" }}>
              <iframe
                src={previewUrl}
                title={t.nom}
                sandbox="allow-same-origin allow-scripts"
                scrolling="no"
                style={{
                  width: 900, height: 700,
                  border: "none", pointerEvents: "none",
                  transformOrigin: "top left",
                  transform: "scale(0.185)",
                  position: "absolute", top: 0, left: 0,
                }}
              />
              {/* Overlay to capture clicks */}
              <div style={{ position: "absolute", inset: 0, zIndex: 2 }} />
              {/* Selection badge */}
              {sel && (
                <div style={{
                  position: "absolute", top: 8, right: 8, zIndex: 3,
                  width: 22, height: 22, borderRadius: "50%",
                  background: c.accent || ACCENT,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 2px 8px ${(c.accent || ACCENT)}60`,
                }}>
                  <Check size={12} color="#fff" strokeWidth={3} />
                </div>
              )}
            </div>

            {/* Label */}
            <div style={{
              background: CARD, borderTop: `1px solid ${sel ? (c.accent || ACCENT) + "40" : BORDER}`,
              padding: "7px 9px", display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: sel ? (c.accent || ACCENT) : TEXT, letterSpacing: "0.06em", textTransform: "uppercase" }}>{t.nom}</div>
                <div style={{ fontSize: 9, color: MUTED, marginTop: 1 }}>{t.ambiance[0]}</div>
              </div>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: c.accent || ACCENT, flexShrink: 0,
                boxShadow: sel ? `0 0 6px ${(c.accent || ACCENT)}80` : "none",
              }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Plan card ──────────────────────────────────────────────────────────────────
function PlanCard({ plan, onConfirm, onThemeChange, loading }: {
  plan: PlanBoutique & { messageIA?: string };
  onConfirm: () => void;
  onThemeChange: (id: string) => void;
  loading: boolean;
}) {
  const t = THEMES.find(t => t.id === plan.themeId) || THEMES[0];
  const c = t?.couleurs || {};
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 440 }}>
      {/* Store preview */}
      <div style={{
        background: CARD, border: `1px solid ${BORDER_ACCENT}`,
        borderRadius: 16, overflow: "hidden",
      }}>
        <div style={{
          padding: "14px 16px",
          background: `linear-gradient(135deg, ${c.fond || "#111"}22, transparent)`,
          borderBottom: `1px solid ${BORDER}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: `${c.accent || ACCENT}22`,
              border: `2px solid ${c.accent || ACCENT}50`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: c.accent || ACCENT }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: TEXT }}>{plan.nomBoutique}</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{plan.categorie} · {plan.pays} · {plan.devise}</div>
            </div>
            <div style={{
              marginLeft: "auto", fontSize: 10, fontWeight: 700,
              padding: "4px 10px", borderRadius: 999,
              color: c.accent || ACCENT,
              background: `${c.accent || ACCENT}18`,
              border: `1px solid ${c.accent || ACCENT}30`,
              letterSpacing: "0.06em",
            }}>
              {t.nom}
            </div>
          </div>
          {plan.description && (
            <div style={{ marginTop: 10, fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{plan.description}</div>
          )}
        </div>

        {/* Products */}
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
            {plan.produits.length} produits générés
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {plan.produits.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                <span style={{ color: TEXT, opacity: 0.8 }}>{p.nom}</span>
                <span style={{ color: c.accent || ACCENT, fontWeight: 700 }}>{p.prix.toLocaleString()} {plan.devise}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Theme picker */}
        <div style={{ padding: "12px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
            Choisir le design — aperçu avec tes produits
          </div>
          <ThemeSelector
            selectedId={plan.themeId}
            onSelect={onThemeChange}
            nomBoutique={plan.nomBoutique}
            produits={plan.produits}
            devise={plan.devise}
          />
        </div>
      </div>

      <button onClick={onConfirm} disabled={loading}
        style={{
          width: "100%", padding: "15px 24px",
          borderRadius: 14, border: "none", cursor: loading ? "not-allowed" : "pointer",
          background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_D})`,
          color: "#050608", fontSize: 14, fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: `0 8px 30px ${ACCENT}35`, opacity: loading ? 0.6 : 1,
          transition: "all 0.15s",
        }}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        Ce design me convient — Créer ma boutique
      </button>
    </div>
  );
}

// ── Compte form ────────────────────────────────────────────────────────────────
function CompteForm({ onSubmit, loading }: { onSubmit: (d: CompteData) => void; loading: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm<CompteData>({ resolver: zodResolver(schemaCompte) });
  const fields = [
    { key: "name" as const,     Icon: User,  label: "Ton prénom",          type: "text",     ph: "Aminata" },
    { key: "email" as const,    Icon: Mail,  label: "Adresse email",       type: "email",    ph: "aminata@example.com" },
    { key: "password" as const, Icon: Lock,  label: "Mot de passe",        type: "password", ph: "Minimum 6 caractères" },
    { key: "whatsapp" as const, Icon: Phone, label: "Numéro WhatsApp",     type: "tel",      ph: "+221 77 000 00 00" },
  ];
  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: 420 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {fields.map(f => (
          <div key={f.key}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              {f.label}
            </label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <f.Icon size={14} color={MUTED} />
              </div>
              <input
                {...register(f.key)} type={f.type} placeholder={f.ph}
                style={{
                  width: "100%", paddingLeft: 40, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
                  background: CARD, border: `1px solid ${errors[f.key] ? "rgba(239,68,68,0.5)" : BORDER}`,
                  borderRadius: 12, color: TEXT, fontSize: 13, outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            {errors[f.key] && (
              <p style={{ color: "#f87171", fontSize: 11, marginTop: 4 }}>{errors[f.key]?.message}</p>
            )}
          </div>
        ))}

        <button type="submit" disabled={loading}
          style={{
            marginTop: 6, padding: "14px 24px", borderRadius: 14, border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_D})`,
            color: "#050608", fontSize: 14, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: `0 8px 30px ${ACCENT}35`, opacity: loading ? 0.6 : 1,
            width: "100%",
          }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <><Sparkles size={16} /> Lancer ma boutique <ArrowRight size={16} /></>}
        </button>
      </div>
    </form>
  );
}

// ─── Progress steps during creation ───────────────────────────────────────────
const CREATION_STEPS = [
  "Provisionnement de la boutique…",
  "Application du design choisi…",
  "Création de tes produits…",
  "Configuration de la livraison…",
  "Génération des avis clients…",
  "Finalisation en cours…",
];

// ─── Main page ────────────────────────────────────────────────────────────────
export default function InscriptionPage() {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>("welcome");
  const [vente, setVente] = useState("");
  const [paysCode, setPaysCode] = useState("");
  const [paysNom, setPaysNom] = useState("");
  const [plan, setPlan] = useState<(PlanBoutique & { messageIA?: string }) | null>(null);
  const [messageIA, setMessageIA] = useState("");
  const [erreur, setErreur] = useState("");
  const [compte, setCompte] = useState<CompteData | null>(null);
  const [venteInput, setVenteInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [creationSteps, setCreationSteps] = useState<string[]>([]);
  const [showThinking, setShowThinking] = useState(false);

  // Scroll to bottom when new content appears
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [phase, showThinking, creationSteps]);

  const submitVente = useCallback(() => {
    if (!venteInput.trim()) return;
    setVente(venteInput.trim());
    setPhase("q-pays");
  }, [venteInput]);

  const submitPays = useCallback((code: string, nom: string) => {
    setPaysCode(code);
    setPaysNom(nom);
    // Small delay so user sees their selection before next phase
    setTimeout(() => setPhase("analyse"), 400);
  }, []);

  // Call AI onboarding API — "analyser" phase
  useEffect(() => {
    if (phase !== "analyse") return;
    setShowThinking(true);
    const description = `${vente}. Pays: ${paysNom} (${paysCode}).`;
    fetch("/api/ai/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase: "analyser", description }),
    })
      .then(r => r.json())
      .then(data => {
        setShowThinking(false);
        if (data.plan) {
          setPlan(data.plan);
          setMessageIA(data.messageIA || data.plan.messageIA || "Voici ce que j'ai préparé pour toi !");
          setPhase("plan");
        } else {
          setErreur(data.message || "Erreur lors de l'analyse.");
          setPhase("q-vente");
        }
      })
      .catch(() => {
        setShowThinking(false);
        setErreur("Erreur réseau — réessaie.");
        setPhase("q-vente");
      });
  }, [phase, vente, paysCode, paysNom]);

  const confirmPlan = useCallback(() => {
    setPhase("q-compte");
  }, []);

  const launchCreation = useCallback(async (compteData: CompteData) => {
    if (!plan) return;
    setCompte(compteData);
    setLoading(true);
    setPhase("creation");
    setCreationSteps([]);

    // Animate steps
    let i = 0;
    const interval = setInterval(() => {
      if (i < CREATION_STEPS.length) {
        setCreationSteps(prev => [...prev, CREATION_STEPS[i]]);
        i++;
      }
    }, 700);

    try {
      const res = await fetch("/api/ai/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "executer", plan, compte: compteData }),
      });
      const data = await res.json();
      clearInterval(interval);
      if (!res.ok) throw new Error(data.message);
      setCreationSteps(CREATION_STEPS);
      setPhase("succes");
      const loginResult = await signIn("credentials", {
        email: compteData.email,
        password: compteData.password,
        redirect: false,
      });
      setTimeout(() => router.push(loginResult?.ok ? "/dashboard" : "/connexion?inscription=success"), 1800);
    } catch (err: any) {
      clearInterval(interval);
      setErreur(err.message || "Erreur lors de la création.");
      setPhase("plan");
    } finally {
      setLoading(false);
    }
  }, [plan, router]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh", background: BG,
      fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif",
      color: TEXT, display: "flex", flexDirection: "column",
    }}>
      <style dangerouslySetInnerHTML={{ __html: ANIMATION_CSS }} />

      {/* ── Ambient background ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)", width: 800, height: 400, borderRadius: "50%", background: `radial-gradient(ellipse, ${ACCENT}09 0%, transparent 70%)` }} />
        <div style={{ position: "absolute", bottom: 0, right: 0, width: 400, height: 400, background: `radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)` }} />
        <div style={{ position: "absolute", inset: 0, opacity: 0.015, backgroundImage: `linear-gradient(${ACCENT} 1px,transparent 1px),linear-gradient(90deg,${ACCENT} 1px,transparent 1px)`, backgroundSize: "48px 48px" }} />
      </div>

      {/* ── Header ── */}
      <div style={{ position: "relative", zIndex: 1, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 640, margin: "0 auto", width: "100%" }}>
        <Link href="/">
          <img src="/logo.png" alt="Axso" style={{ height: 30, objectFit: "contain" }}
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement;
              el.style.display = "none";
              const span = document.createElement("span");
              span.textContent = "AXSO";
              span.style.cssText = `color:${ACCENT};font-weight:900;font-size:18px;letter-spacing:0.12em;`;
              el.parentNode?.appendChild(span);
            }}
          />
        </Link>
        <Link href="/connexion" style={{ fontSize: 13, color: MUTED, textDecoration: "none" }}>
          Déjà un compte ? <span style={{ color: ACCENT, fontWeight: 600 }}>Connexion</span>
        </Link>
      </div>

      {/* ── Chat container ── */}
      <div style={{
        position: "relative", zIndex: 1, flex: 1,
        maxWidth: 640, margin: "0 auto", width: "100%",
        padding: "0 20px 120px",
        display: "flex", flexDirection: "column", gap: 20,
      }}>

        {/* ── WELCOME ── */}
        {phase === "welcome" && (
          <div className="msg-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 60, gap: 24 }}>
            {/* Axia avatar large */}
            <div style={{ position: "relative" }}>
              <div style={{ width: 80, height: 80, borderRadius: "28%", background: "linear-gradient(135deg,#1B2A4A,#2d4270)", border: `2px solid ${BORDER_ACCENT}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 60px ${ACCENT}20` }}>
                <img src="/axia-icon.png" alt="Axia" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
              </div>
              <div style={{ position: "absolute", bottom: -4, right: -4, width: 24, height: 24, borderRadius: "50%", background: "#22C55E", border: `2px solid ${BG}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={12} color="#fff" />
              </div>
            </div>

            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, lineHeight: 1.2 }}>
                Je suis <span style={{ background: `linear-gradient(135deg,${ACCENT},${ACCENT_D})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Axia</span>.
              </h1>
              <p style={{ fontSize: 16, color: MUTED, marginTop: 10, lineHeight: 1.6, maxWidth: 380, margin: "10px auto 0" }}>
                En quelques questions, je vais créer ton site e-commerce ultra haut de gamme — design, produits, configuration complète.
              </p>
            </div>

            {/* Features */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", maxWidth: 400 }}>
              {[
                { icon: Palette, label: "15 designs premium", desc: "Sur mesure pour ton secteur" },
                { icon: Store,   label: "Boutique complète",  desc: "Produits + livraison + SEO" },
                { icon: Globe,   label: "Mondial",            desc: "100+ pays, toutes devises" },
                { icon: Sparkles,label: "100% IA",            desc: "Généré en 30 secondes" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "12px 14px", textAlign: "left" }}>
                  <Icon size={16} color={ACCENT} />
                  <div style={{ fontWeight: 700, fontSize: 12, marginTop: 6 }}>{label}</div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{desc}</div>
                </div>
              ))}
            </div>

            <button onClick={() => setPhase("q-vente")}
              style={{
                padding: "16px 40px", borderRadius: 16, border: "none",
                background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_D})`,
                color: "#050608", fontSize: 15, fontWeight: 800, cursor: "pointer",
                boxShadow: `0 12px 40px ${ACCENT}40`, display: "flex", alignItems: "center", gap: 10,
                transition: "transform 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.03)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              <Sparkles size={18} /> Créer ma boutique gratuitement <ArrowRight size={18} />
            </button>

            <p style={{ fontSize: 12, color: MUTED }}>Gratuit · Pas de carte bancaire · En ligne en 60 secondes</p>
          </div>
        )}

        {/* ── QUESTION VENTE ── */}
        {phase !== "welcome" && (
          <AxiaMsg delay={0}>
            Dis-moi ce que tu veux vendre. Plus tu es précis, meilleur sera ton site. 🎯
          </AxiaMsg>
        )}

        {(phase === "q-vente") && (
          <div className="msg-in" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {erreur && (
              <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, fontSize: 13, color: "#f87171" }}>
                {erreur}
              </div>
            )}
            {/* Quick examples */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                "Mode & vêtements africains",
                "Cosmétiques naturels",
                "Bijoux artisanaux",
                "Formations en ligne",
                "Électronique & gadgets",
                "Alimentation & épices",
              ].map(ex => (
                <button key={ex} onClick={() => setVenteInput(ex)}
                  style={{
                    padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 500,
                    background: venteInput === ex ? `${ACCENT}22` : CARD,
                    border: `1px solid ${venteInput === ex ? BORDER_ACCENT : BORDER}`,
                    color: venteInput === ex ? ACCENT : MUTED,
                    cursor: "pointer", transition: "all 0.12s",
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <textarea
                value={venteInput}
                onChange={e => setVenteInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitVente(); } }}
                placeholder="Ex : Je vends des vêtements mode femme inspirés de la culture africaine..."
                rows={3}
                style={{
                  flex: 1, background: CARD, border: `1px solid ${BORDER}`,
                  borderRadius: 14, padding: "12px 16px", color: TEXT, fontSize: 13,
                  resize: "none", outline: "none", lineHeight: 1.6,
                  fontFamily: "inherit",
                }}
              />
              <button onClick={submitVente} disabled={!venteInput.trim()}
                style={{
                  width: 44, height: 44, borderRadius: 12, border: "none",
                  background: venteInput.trim() ? `linear-gradient(135deg,${ACCENT},${ACCENT_D})` : BORDER,
                  cursor: venteInput.trim() ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  alignSelf: "flex-end", flexShrink: 0,
                }}
              >
                <Send size={16} color={venteInput.trim() ? "#050608" : MUTED} />
              </button>
            </div>
          </div>
        )}

        {/* ── USER ANSWER VENTE ── */}
        {vente && phase !== "q-vente" && (
          <UserMsg>{vente}</UserMsg>
        )}

        {/* ── QUESTION PAYS ── */}
        {(phase === "q-pays" || (paysCode && phase !== "q-vente")) && phase !== "welcome" && vente && (
          <>
            <AxiaMsg delay={100}>
              Super ! Dans quel pays es-tu basé ? Je vais adapter la devise, la livraison et le design à ton marché. 🌍
            </AxiaMsg>
            {phase === "q-pays" && <PaysSelector onSelect={submitPays} />}
          </>
        )}

        {/* ── USER ANSWER PAYS ── */}
        {paysNom && phase !== "q-pays" && phase !== "welcome" && (
          <UserMsg>📍 {paysNom}</UserMsg>
        )}

        {/* ── ANALYSE ── */}
        {phase === "analyse" && (
          <>
            <AxiaMsg delay={0}>
              Parfait ! Laisse-moi analyser ton projet et concevoir ton site… ✨
            </AxiaMsg>
            <AxiaThinking />
          </>
        )}

        {showThinking && phase === "analyse" && null}

        {/* ── PLAN PREVIEW ── */}
        {(phase === "plan" || phase === "q-compte" || phase === "creation" || phase === "succes") && plan && (
          <>
            <AxiaMsg delay={0}>
              <strong style={{ color: ACCENT }}>Ton site est prêt à être lancé.</strong>{" "}
              {messageIA}
            </AxiaMsg>
            {phase === "plan" && (
              <div className="msg-in">
                <PlanCard
                  plan={plan}
                  onConfirm={confirmPlan}
                  onThemeChange={(id) => setPlan(p => p ? { ...p, themeId: id } : p)}
                  loading={false}
                />
              </div>
            )}
          </>
        )}

        {/* ── QUESTION COMPTE ── */}
        {(phase === "q-compte" || phase === "creation" || phase === "succes") && (
          <>
            <AxiaMsg delay={100}>
              Dernière étape — crée ton compte pour lancer ta boutique. 🚀
            </AxiaMsg>
            {phase === "q-compte" && (
              <div className="msg-in">
                <CompteForm onSubmit={launchCreation} loading={loading} />
                {erreur && (
                  <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, fontSize: 13, color: "#f87171" }}>
                    {erreur}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── CREATION ── */}
        {phase === "creation" && (
          <div className="msg-in" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: CARD, border: `1px solid ${BORDER_ACCENT}`, borderRadius: 16, padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <Loader2 size={18} color={ACCENT} className="animate-spin" />
                <span style={{ fontWeight: 700, fontSize: 14 }}>Axia construit ta boutique…</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {creationSteps.map((s, i) => (
                  <div key={i} className="msg-in" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                    <CheckCircle2 size={14} color="#22C55E" style={{ flexShrink: 0 }} />
                    <span style={{ color: TEXT, opacity: 0.8 }}>{s}</span>
                  </div>
                ))}
                {creationSteps.length < CREATION_STEPS.length && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                    <Loader2 size={14} color={ACCENT} className="animate-spin" style={{ flexShrink: 0 }} />
                    <span style={{ color: MUTED }}>En cours…</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SUCCÈS ── */}
        {phase === "succes" && (
          <div className="msg-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 20, paddingTop: 20 }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "2px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={36} color="#22C55E" />
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Ta boutique est en ligne ! 🎉</h2>
              <p style={{ color: MUTED, fontSize: 14, marginTop: 8 }}>
                {plan?.nomBoutique && <strong style={{ color: ACCENT }}>{plan.nomBoutique}</strong>} est prête. Redirection vers ton dashboard…
              </p>
            </div>
            <Loader2 size={22} color={ACCENT} className="animate-spin" />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Footer ── */}
      {phase === "welcome" && (
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 20px 32px", color: MUTED, fontSize: 12 }}>
          Tu es livreur ?{" "}
          <Link href="/inscription/livreur" style={{ color: ACCENT, textDecoration: "none", fontWeight: 600 }}>
            Rejoindre la plateforme →
          </Link>
        </div>
      )}
    </div>
  );
}
