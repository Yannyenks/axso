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
  Store, Globe, Palette, User, Lock, Phone, Mail, ChevronRight,
  ChevronLeft, X, Bell, Info, AlertCircle,
} from "lucide-react";
import type { PlanBoutique } from "@/lib/ai-agent";
import { MANIFESTE_LIBRAIRIE } from "@/lib/axso-design-manifest";

// ─── Palette afrocentrique luxe claire ───────────────────────────────────────
const IVORY   = "#FAF6EF";
const LINEN   = "#F2E8D4";
const PARCH   = "#E0CEAA";
const GOLD    = "#B07D3E";
const GOLD_D  = "#7A5020";
const GOLD_L  = "#F0C070";
const TERRA   = "#8B3A1A";
const INK     = "#1A1208";
const MID     = "#5A3E22";
const MUTED   = "#9A7C5A";
const WHITE   = "#FFFFFF";
const SUCCESS = "#2A9D5C";

// ─── Styles CSS ───────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Outfit:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; }

  @keyframes fadeUp {
    from { opacity:0; transform:translateY(18px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes dotBlink {
    0%,80%,100% { opacity:.25; transform:scale(.75); }
    40%         { opacity:1;   transform:scale(1); }
  }
  @keyframes toastIn {
    from { opacity:0; transform:translateX(110%); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.55} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes scaleUp { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
  @keyframes heroIn {
    from { opacity:0; transform:translateY(28px) scale(.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }

  .msg-in   { animation: fadeUp  .48s cubic-bezier(.34,1.3,.64,1) both; }
  .fade-in  { animation: fadeIn  .5s ease both; }
  .scale-up { animation: scaleUp .4s cubic-bezier(.34,1.3,.64,1) both; }
  .hero-in  { animation: heroIn  .7s cubic-bezier(.22,1,.36,1) both; }
  .dot { animation: dotBlink 1.4s ease-in-out infinite; }

  .gold-btn {
    background: linear-gradient(135deg, ${GOLD} 0%, ${GOLD_D} 100%);
    color: ${WHITE}; border:none; cursor:pointer;
    transition: all .22s; font-family:'Outfit',sans-serif;
    font-weight:700; letter-spacing:.04em;
  }
  .gold-btn:hover:not(:disabled) {
    transform:translateY(-2px);
    box-shadow:0 10px 32px rgba(176,125,62,.38);
  }
  .gold-btn:active:not(:disabled) { transform:translateY(0); }
  .gold-btn:disabled { opacity:.5; cursor:not-allowed; }

  .ghost-btn {
    background:transparent;
    border:1.5px solid ${PARCH}; color:${MID};
    cursor:pointer; transition:all .18s;
    font-family:'Outfit',sans-serif; font-weight:500;
  }
  .ghost-btn:hover { border-color:${GOLD}; color:${GOLD}; }

  .field {
    width:100%; background:${WHITE};
    border:1.5px solid ${PARCH}; border-radius:12px;
    padding:13px 14px 13px 44px;
    font-family:'Outfit',sans-serif; font-size:14px;
    color:${INK}; outline:none;
    transition:border-color .18s, box-shadow .18s;
  }
  .field:focus { border-color:${GOLD}; box-shadow:0 0 0 3px rgba(176,125,62,.13); }
  .field::placeholder { color:${MUTED}; }

  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-track { background:${LINEN}; }
  ::-webkit-scrollbar-thumb { background:${PARCH}; border-radius:2px; }
`;

// ─── Pays ─────────────────────────────────────────────────────────────────────
const PAYS_LIST = [
  { code:"SN", nom:"Sénégal",       flag:"🇸🇳", devise:"XOF" },
  { code:"CI", nom:"Côte d'Ivoire", flag:"🇨🇮", devise:"XOF" },
  { code:"CM", nom:"Cameroun",      flag:"🇨🇲", devise:"XAF" },
  { code:"MA", nom:"Maroc",         flag:"🇲🇦", devise:"MAD" },
  { code:"NG", nom:"Nigeria",       flag:"🇳🇬", devise:"NGN" },
  { code:"GH", nom:"Ghana",         flag:"🇬🇭", devise:"GHS" },
  { code:"TG", nom:"Togo",          flag:"🇹🇬", devise:"XOF" },
  { code:"BJ", nom:"Bénin",         flag:"🇧🇯", devise:"XOF" },
  { code:"ML", nom:"Mali",          flag:"🇲🇱", devise:"XOF" },
  { code:"KE", nom:"Kenya",         flag:"🇰🇪", devise:"KES" },
  { code:"FR", nom:"France",        flag:"🇫🇷", devise:"EUR" },
  { code:"BE", nom:"Belgique",      flag:"🇧🇪", devise:"EUR" },
  { code:"CA", nom:"Canada",        flag:"🇨🇦", devise:"CAD" },
  { code:"US", nom:"États-Unis",    flag:"🇺🇸", devise:"USD" },
  { code:"AE", nom:"Émirats",       flag:"🇦🇪", devise:"AED" },
  { code:"GB", nom:"Royaume-Uni",   flag:"🇬🇧", devise:"GBP" },
  { code:"AU", nom:"Autre",         flag:"🌍",  devise:"XAF" },
];

// ─── Templates ────────────────────────────────────────────────────────────────
const THEMES = MANIFESTE_LIBRAIRIE.map(e => ({
  id: e.fichier, nom: e.nom, couleurs: e.couleurs, ambiance: e.ambiance,
}));

// ─── Schema ───────────────────────────────────────────────────────────────────
const schemaCompte = z.object({
  name:     z.string().min(2, "Minimum 2 caractères"),
  email:    z.string().email("Email invalide"),
  password: z.string().min(6, "Minimum 6 caractères"),
  whatsapp: z.string().min(8, "Numéro requis"),
});
type CompteData = z.infer<typeof schemaCompte>;

type Phase = "welcome"|"q-vente"|"q-pays"|"analyse"|"plan"|"q-compte"|"creation"|"succes";

const STEPS_CREATION = [
  "Provisionnement de ta boutique…",
  "Application du design sélectionné…",
  "Création de ta gamme de produits…",
  "Configuration des modes de paiement…",
  "Génération des premiers avis clients…",
  "Mise en ligne de ta boutique…",
];

// ─── TOAST NOTIFICATIONS ──────────────────────────────────────────────────────
type Toast = { id: number; type: "success"|"info"|"error"; msg: string };
let _toastId = 0;

function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: number) => void }) {
  return (
    <div style={{
      position:"fixed", top:20, right:20, zIndex:9999,
      display:"flex", flexDirection:"column", gap:10,
      pointerEvents:"none",
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display:"flex", alignItems:"center", gap:10,
          background: t.type==="success" ? "#EDFAF4" : t.type==="error" ? "#FEF0EC" : "#FBF8EE",
          border:`1.5px solid ${t.type==="success" ? "#A8E8C8" : t.type==="error" ? "#F5C8B8" : PARCH}`,
          borderLeft:`4px solid ${t.type==="success" ? SUCCESS : t.type==="error" ? TERRA : GOLD}`,
          borderRadius:12, padding:"11px 16px",
          maxWidth:320, minWidth:220,
          boxShadow:"0 6px 28px rgba(28,18,8,.14)",
          animation:"toastIn .35s cubic-bezier(.34,1.3,.64,1) both",
          pointerEvents:"all",
          fontFamily:"'Outfit',sans-serif",
        }}>
          {t.type==="success" && <CheckCircle2 size={16} color={SUCCESS} style={{flexShrink:0}}/>}
          {t.type==="info"    && <Info         size={16} color={GOLD}    style={{flexShrink:0}}/>}
          {t.type==="error"   && <AlertCircle  size={16} color={TERRA}   style={{flexShrink:0}}/>}
          <span style={{ fontSize:13, color:INK, flex:1, lineHeight:1.45 }}>{t.msg}</span>
          <button onClick={()=>onClose(t.id)} style={{ background:"none", border:"none", cursor:"pointer", color:MUTED, padding:"2px", flexShrink:0, pointerEvents:"all" }}>
            <X size={13}/>
          </button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((type: Toast["type"], msg: string, ms = 4500) => {
    const id = ++_toastId;
    setToasts(p => [...p, { id, type, msg }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), ms);
  }, []);
  const close = useCallback((id: number) => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, push, close };
}

// ─── Ornements ────────────────────────────────────────────────────────────────
function Diamond({ size=12, color=GOLD, opacity=0.5 }: { size?:number; color?:string; opacity?:number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" style={{flexShrink:0}}>
      <rect x="1" y="1" width="10" height="10" fill="none"
        stroke={color} strokeWidth="1" opacity={opacity} transform="rotate(45 6 6)" rx="1.5"/>
      <rect x="3.5" y="3.5" width="5" height="5" fill={color}
        opacity={opacity*0.6} transform="rotate(45 6 6)" rx="0.5"/>
    </svg>
  );
}

function Divider() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ flex:1, height:"1px", background:`linear-gradient(to right,transparent,${PARCH})` }}/>
      <Diamond size={14}/>
      <div style={{ flex:1, height:"1px", background:`linear-gradient(to left,transparent,${PARCH})` }}/>
    </div>
  );
}

// ─── Avatar Axia ──────────────────────────────────────────────────────────────
function AxiaAvatar({ size=38 }: { size?:number }) {
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <div style={{
        width:size, height:size, borderRadius:size*.27,
        background:"linear-gradient(135deg,#1B2A4A 0%,#2B3E66 100%)",
        border:"1.5px solid rgba(176,125,62,.4)",
        overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow:"0 4px 16px rgba(176,125,62,.22)",
      }}>
        <img src="/axia-icon.png" alt="Axia"
          style={{ width:"100%", height:"100%", objectFit:"cover" }}
          onError={e=>{ (e.currentTarget as HTMLImageElement).style.display="none"; }}/>
      </div>
      <div style={{
        position:"absolute", bottom:-2, right:-2,
        width:size*.3, height:size*.3, borderRadius:"50%",
        background:SUCCESS, border:`1.5px solid ${IVORY}`,
      }}/>
    </div>
  );
}

// ─── Bulles ───────────────────────────────────────────────────────────────────
function AxiaMsg({ children, delay=0 }: { children:React.ReactNode; delay?:number }) {
  return (
    <div className="msg-in" style={{ display:"flex", alignItems:"flex-start", gap:11, animationDelay:`${delay}ms` }}>
      <AxiaAvatar size={36}/>
      <div style={{
        background:WHITE, border:`1.5px solid ${PARCH}`,
        borderRadius:"4px 18px 18px 18px",
        padding:"12px 16px", maxWidth:"78%",
        color:INK, fontSize:14, lineHeight:1.7,
        boxShadow:"0 2px 14px rgba(28,18,8,.07)",
        fontFamily:"'Outfit',sans-serif",
      }}>{children}</div>
    </div>
  );
}

function UserMsg({ children }: { children:React.ReactNode }) {
  return (
    <div className="msg-in" style={{ display:"flex", justifyContent:"flex-end" }}>
      <div style={{
        background:`linear-gradient(135deg,${GOLD}18,${TERRA}08)`,
        border:`1.5px solid ${PARCH}`,
        borderRadius:"18px 4px 18px 18px",
        padding:"11px 16px", maxWidth:"72%",
        color:INK, fontSize:14, lineHeight:1.65,
        fontFamily:"'Outfit',sans-serif",
        boxShadow:"0 1px 8px rgba(28,18,8,.05)",
      }}>{children}</div>
    </div>
  );
}

function AxiaThinking() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:11 }}>
      <AxiaAvatar size={36}/>
      <div style={{
        background:WHITE, border:`1.5px solid ${PARCH}`,
        borderRadius:"4px 18px 18px 18px",
        padding:"14px 18px", display:"flex", gap:6, alignItems:"center",
        boxShadow:"0 2px 14px rgba(28,18,8,.07)",
      }}>
        {[0,1,2].map(i=>(
          <div key={i} className="dot" style={{
            width:7, height:7, borderRadius:"50%",
            background:GOLD, animationDelay:`${i*.18}s`,
          }}/>
        ))}
      </div>
    </div>
  );
}

// ─── Sélecteur de pays ────────────────────────────────────────────────────────
function PaysSelector({ onSelect }: { onSelect:(code:string,nom:string,devise:string)=>void }) {
  const [sel,setSel] = useState("");
  return (
    <div className="msg-in" style={{ paddingLeft:47 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, maxWidth:440 }}>
        {PAYS_LIST.map(p=>(
          <button key={p.code}
            onClick={()=>{ setSel(p.code); onSelect(p.code,p.nom,p.devise); }}
            style={{
              display:"flex", flexDirection:"column", alignItems:"center",
              gap:4, padding:"9px 4px", borderRadius:12,
              background:sel===p.code?`${GOLD}14`:WHITE,
              border:`1.5px solid ${sel===p.code?GOLD:PARCH}`,
              cursor:"pointer", transition:"all .15s",
              boxShadow:sel===p.code?`0 0 0 2.5px ${GOLD}20`:"none",
            }}>
            <span style={{ fontSize:19 }}>{p.flag}</span>
            <span style={{ fontSize:10, fontWeight:600, textAlign:"center", lineHeight:1.2, color:sel===p.code?GOLD_D:MID, fontFamily:"'Outfit',sans-serif" }}>{p.nom}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Carrousel de thèmes (iframe live + infos utilisateur) ────────────────────
function ThemeCarousel({
  selectedId, onSelect, nomBoutique, produits, devise,
}: {
  selectedId:string; onSelect:(id:string)=>void;
  nomBoutique?:string; produits?:{nom:string;prix:number;description?:string}[]; devise?:string;
}) {
  const [idx,setIdx] = useState(0);
  const total = THEMES.length;
  const visible = 3;

  const prev = () => setIdx(i=>(i-1+total)%total);
  const next = () => setIdx(i=>(i+1)%total);

  const produitsParam = encodeURIComponent(JSON.stringify((produits||[]).slice(0,6)));
  const nomParam  = encodeURIComponent(nomBoutique||"Ma Boutique");
  const devParam  = encodeURIComponent(devise||"XAF");

  const visibles = () => Array.from({length:visible},(_,i)=>THEMES[(idx+i)%total]);

  return (
    <div style={{ paddingLeft:47 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={prev} className="ghost-btn"
          style={{ width:38, height:38, borderRadius:"50%", padding:0, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <ChevronLeft size={16}/>
        </button>

        <div style={{ display:"flex", gap:12, flex:1, overflow:"hidden" }}>
          {visibles().map((t,i)=>{
            const sel = selectedId===t.id;
            const center = i===1;
            const url = `/api/preview-theme?fichier=${encodeURIComponent(t.id)}&nom=${nomParam}&devise=${devParam}&produits=${produitsParam}`;
            return (
              <button key={`${t.id}-${idx}-${i}`}
                onClick={()=>onSelect(t.id)}
                style={{
                  flex:1, padding:0, borderRadius:16, overflow:"hidden",
                  border:`2px solid ${sel?GOLD:PARCH}`,
                  cursor:"pointer",
                  boxShadow:sel ? `0 0 0 3px ${GOLD}30,0 10px 32px rgba(28,18,8,.16)`
                            : center ? "0 4px 16px rgba(28,18,8,.1)"
                            : "0 2px 8px rgba(28,18,8,.06)",
                  position:"relative", background:t.couleurs.fond||WHITE,
                  transform:center&&!sel?"scale(1.04)":"scale(1)",
                  transition:"all .25s cubic-bezier(.34,1.3,.64,1)",
                }}>
                {/* Iframe preview avec données utilisateur */}
                <div style={{ height:160, overflow:"hidden", position:"relative" }}>
                  <iframe
                    src={url} title={t.nom}
                    sandbox="allow-same-origin allow-scripts"
                    scrolling="no"
                    style={{
                      width:960, height:750, border:"none",
                      pointerEvents:"none",
                      transformOrigin:"top left",
                      transform:"scale(0.172)",
                      position:"absolute", top:0, left:0,
                    }}
                  />
                  <div style={{ position:"absolute", inset:0, zIndex:2 }}/>
                  {sel && (
                    <div style={{
                      position:"absolute", top:8, right:8, zIndex:3,
                      width:22, height:22, borderRadius:"50%",
                      background:`linear-gradient(135deg,${GOLD},${GOLD_D})`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      boxShadow:`0 2px 8px ${GOLD}55`,
                    }}>
                      <Check size={12} color={WHITE} strokeWidth={3}/>
                    </div>
                  )}
                  <div style={{
                    position:"absolute", bottom:0, left:0, right:0, zIndex:3,
                    padding:"20px 10px 6px",
                    background:"linear-gradient(to top,rgba(0,0,0,.5),transparent)",
                  }}>
                    <div style={{ fontSize:9, fontWeight:800, color:"rgba(255,255,255,.95)", letterSpacing:".1em", textTransform:"uppercase", fontFamily:"'Outfit',sans-serif" }}>
                      {t.nom}
                    </div>
                  </div>
                </div>
                <div style={{
                  background:sel?`${GOLD}0c`:LINEN,
                  borderTop:`1px solid ${sel?GOLD+"28":PARCH}`,
                  padding:"6px 10px",
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                }}>
                  <span style={{ fontSize:10, color:sel?GOLD_D:MID, fontWeight:700, fontFamily:"'Outfit',sans-serif" }}>
                    {t.ambiance[0]||""}
                  </span>
                  <div style={{
                    width:9, height:9, borderRadius:"50%",
                    background:t.couleurs.accent||GOLD,
                    boxShadow:sel?`0 0 8px ${t.couleurs.accent||GOLD}90`:"none",
                  }}/>
                </div>
              </button>
            );
          })}
        </div>

        <button onClick={next} className="ghost-btn"
          style={{ width:38, height:38, borderRadius:"50%", padding:0, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <ChevronRight size={16}/>
        </button>
      </div>

      {/* Dots */}
      <div style={{ display:"flex", justifyContent:"center", gap:6, marginTop:12 }}>
        {THEMES.map((_,i)=>(
          <button key={i} onClick={()=>setIdx(i)}
            style={{
              width:i===idx?20:6, height:6, borderRadius:3,
              background:i===idx?GOLD:PARCH,
              border:"none", cursor:"pointer", transition:"all .25s", padding:0,
            }}/>
        ))}
      </div>

      {selectedId && (
        <div style={{ textAlign:"center", marginTop:8, fontSize:12, color:GOLD_D, fontWeight:700, fontFamily:"'Outfit',sans-serif" }}>
          ✓ {THEMES.find(t=>t.id===selectedId)?.nom} sélectionné
        </div>
      )}
    </div>
  );
}

// ─── Plan card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, onConfirm, onThemeChange }: {
  plan: PlanBoutique & { messageIA?:string };
  onConfirm:()=>void; onThemeChange:(id:string)=>void;
}) {
  const t = THEMES.find(x=>x.id===plan.themeId)||THEMES[0];
  return (
    <div className="msg-in" style={{ paddingLeft:47, display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{
        background:WHITE, border:`1.5px solid ${PARCH}`,
        borderRadius:20, overflow:"hidden",
        boxShadow:"0 6px 28px rgba(28,18,8,.1)",
      }}>
        {/* Header */}
        <div style={{
          padding:"18px 22px",
          background:`linear-gradient(135deg,${LINEN} 0%,${IVORY} 100%)`,
          borderBottom:`1px solid ${PARCH}`,
          display:"flex", alignItems:"center", gap:14,
        }}>
          <div style={{
            width:48, height:48, borderRadius:15,
            background:`${t.couleurs.accent||GOLD}18`,
            border:`2px solid ${t.couleurs.accent||GOLD}40`,
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
          }}>
            <div style={{ width:22, height:22, borderRadius:"50%", background:t.couleurs.accent||GOLD }}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:INK }}>
              {plan.nomBoutique}
            </div>
            <div style={{ fontSize:11, color:MUTED, marginTop:2, fontFamily:"'Outfit',sans-serif" }}>
              {plan.categorie} · {plan.pays} · {plan.devise}
            </div>
          </div>
          <div style={{
            fontSize:10, fontWeight:800, padding:"4px 10px", borderRadius:999,
            color:t.couleurs.accent||GOLD_D, background:`${t.couleurs.accent||GOLD}14`,
            border:`1px solid ${t.couleurs.accent||GOLD}30`,
            letterSpacing:".07em", textTransform:"uppercase",
            fontFamily:"'Outfit',sans-serif", flexShrink:0,
          }}>{t.nom}</div>
        </div>

        {/* Produits */}
        <div style={{ padding:"14px 22px", borderBottom:`1px solid ${PARCH}` }}>
          <div style={{ fontSize:10, fontWeight:800, color:MUTED, textTransform:"uppercase", letterSpacing:".12em", marginBottom:10, fontFamily:"'Outfit',sans-serif" }}>
            {plan.produits.length} produits générés par Axia
          </div>
          {plan.produits.map((p,i)=>(
            <div key={i} style={{
              display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"7px 0", borderBottom:i<plan.produits.length-1?`1px solid ${PARCH}`:"none",
              fontFamily:"'Outfit',sans-serif",
            }}>
              <span style={{ fontSize:13, color:INK, opacity:.85 }}>{p.nom}</span>
              <span style={{ fontSize:13, fontWeight:700, color:GOLD_D }}>{p.prix.toLocaleString()} {plan.devise}</span>
            </div>
          ))}
        </div>

        {/* Carrousel design */}
        <div style={{ padding:"16px 0 16px" }}>
          <div style={{ fontSize:10, fontWeight:800, color:MUTED, textTransform:"uppercase", letterSpacing:".12em", marginBottom:14, paddingLeft:22, fontFamily:"'Outfit',sans-serif" }}>
            Aperçu live de ton site avec tes produits — choisis ton design
          </div>
          <ThemeCarousel
            selectedId={plan.themeId}
            onSelect={onThemeChange}
            nomBoutique={plan.nomBoutique}
            produits={plan.produits}
            devise={plan.devise}
          />
        </div>
      </div>

      <button onClick={onConfirm} className="gold-btn"
        style={{ padding:"15px 24px", borderRadius:14, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
        <Sparkles size={16}/> Ce design me convient — Créer ma boutique <ArrowRight size={16}/>
      </button>
    </div>
  );
}

// ─── Formulaire compte ────────────────────────────────────────────────────────
function CompteForm({ onSubmit, loading, erreur }: {
  onSubmit:(d:CompteData)=>void; loading:boolean; erreur?:string;
}) {
  const { register, handleSubmit, formState:{errors} } = useForm<CompteData>({ resolver:zodResolver(schemaCompte) });
  const fields = [
    { key:"name"     as const, Icon:User,  label:"Ton prénom",    type:"text",     ph:"Aminata" },
    { key:"email"    as const, Icon:Mail,  label:"Adresse email", type:"email",    ph:"aminata@example.com" },
    { key:"password" as const, Icon:Lock,  label:"Mot de passe",  type:"password", ph:"Minimum 6 caractères" },
    { key:"whatsapp" as const, Icon:Phone, label:"WhatsApp",      type:"tel",      ph:"+221 77 000 00 00" },
  ];
  return (
    <div className="msg-in" style={{ paddingLeft:47 }}>
      <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth:420, display:"flex", flexDirection:"column", gap:12 }}>
        {fields.map(f=>(
          <div key={f.key}>
            <label style={{ display:"block", fontSize:11, fontWeight:800, color:MID, textTransform:"uppercase", letterSpacing:".09em", marginBottom:5, fontFamily:"'Outfit',sans-serif" }}>
              {f.label}
            </label>
            <div style={{ position:"relative" }}>
              <div style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                <f.Icon size={14} color={MUTED}/>
              </div>
              <input {...register(f.key)} type={f.type} placeholder={f.ph} className="field"/>
            </div>
            {errors[f.key] && (
              <p style={{ color:TERRA, fontSize:11, marginTop:4, fontFamily:"'Outfit',sans-serif" }}>
                {errors[f.key]?.message}
              </p>
            )}
          </div>
        ))}
        {erreur && (
          <div style={{ padding:"10px 14px", background:`${TERRA}0d`, border:`1px solid ${TERRA}28`, borderRadius:10, fontSize:13, color:TERRA, fontFamily:"'Outfit',sans-serif" }}>
            {erreur}
          </div>
        )}
        <button type="submit" disabled={loading} className="gold-btn"
          style={{ marginTop:4, padding:"14px 24px", borderRadius:13, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
          {loading ? <><Loader2 size={16} className="animate-spin"/> Lancement…</>
                   : <><Sparkles size={16}/> Lancer ma boutique <ArrowRight size={16}/></>}
        </button>
      </form>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function InscriptionPage() {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toasts, push: toast, close: closeToast } = useToast();

  const [phase,setPhase]         = useState<Phase>("welcome");
  const [vente,setVente]         = useState("");
  const [venteInput,setVenteInput] = useState("");
  const [paysCode,setPaysCode]   = useState("");
  const [paysNom,setPaysNom]     = useState("");
  const [devise,setDevise]       = useState("XAF");
  const [plan,setPlan]           = useState<(PlanBoutique&{messageIA?:string})|null>(null);
  const [messageIA,setMessageIA] = useState("");
  const [erreur,setErreur]       = useState("");
  const [loading,setLoading]     = useState(false);
  const [steps,setSteps]         = useState<string[]>([]);

  useEffect(()=>{
    setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),100);
  },[phase,steps.length]);

  const submitVente = useCallback(()=>{
    if(!venteInput.trim()) return;
    setVente(venteInput.trim());
    toast("info","Axia analyse ton projet… ✨");
    setPhase("q-pays");
  },[venteInput,toast]);

  const submitPays = useCallback((code:string,nom:string,dev:string)=>{
    setPaysCode(code); setPaysNom(nom); setDevise(dev);
    toast("info",`Marché ${nom} détecté — devise ${dev} 🌍`);
    setTimeout(()=>setPhase("analyse"),600);
  },[toast]);

  useEffect(()=>{
    if(phase!=="analyse") return;
    const description = `${vente}. Pays: ${paysNom} (${paysCode}).`;
    fetch("/api/ai/onboarding",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({phase:"analyser",description}),
    })
    .then(r=>r.json())
    .then(data=>{
      if(data.plan){
        setPlan(data.plan);
        setMessageIA(data.messageIA||data.plan.messageIA||"Voici ce que j'ai préparé pour toi !");
        toast("success","Plan de boutique généré — choisis ton design !");
        setPhase("plan");
      }else{
        setErreur(data.message||"Erreur d'analyse.");
        toast("error","Erreur lors de l'analyse. Réessaie.");
        setPhase("q-vente");
      }
    })
    .catch(()=>{ setErreur("Erreur réseau."); toast("error","Erreur réseau."); setPhase("q-vente"); });
  },[phase,vente,paysCode,paysNom,toast]);

  const confirmPlan = useCallback(()=>{
    toast("info","Design sélectionné ! Crée ton compte pour lancer. 🚀");
    setPhase("q-compte");
  },[toast]);

  const launchCreation = useCallback(async(compteData:CompteData)=>{
    if(!plan) return;
    setLoading(true); setErreur("");
    setPhase("creation"); setSteps([]);
    toast("info","Lancement de ta boutique…");
    let i=0;
    const iv=setInterval(()=>{
      if(i<STEPS_CREATION.length){ setSteps(p=>[...p,STEPS_CREATION[i]]); i++; }
    },700);
    try{
      const res=await fetch("/api/ai/onboarding",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({phase:"executer",plan,compte:compteData}),
      });
      const data=await res.json();
      clearInterval(iv);
      if(!res.ok) throw new Error(data.message);
      setSteps(STEPS_CREATION);
      toast("success","🎉 Ta boutique est en ligne !");
      setPhase("succes");
      const lr=await signIn("credentials",{email:compteData.email,password:compteData.password,redirect:false});
      setTimeout(()=>router.push(lr?.ok?"/dashboard":"/connexion?inscription=success"),2000);
    }catch(err:any){
      clearInterval(iv);
      setErreur(err.message||"Erreur.");
      toast("error",err.message||"Erreur lors de la création.");
      setPhase("q-compte");
    }finally{ setLoading(false); }
  },[plan,router,toast]);

  return (
    <div style={{
      minHeight:"100vh",
      background:`radial-gradient(ellipse 150% 80% at 50% -5%,${LINEN} 0%,${IVORY} 55%,${WHITE} 100%)`,
      fontFamily:"'Outfit',sans-serif", color:INK,
      display:"flex", flexDirection:"column",
    }}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>

      {/* Pattern kente de fond */}
      <div style={{
        position:"fixed", inset:0, pointerEvents:"none", zIndex:0,
        backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cline x1='0' y1='0' x2='40' y2='40' stroke='%23B07D3E' stroke-width='.5' opacity='.07'/%3E%3Cline x1='40' y1='0' x2='0' y2='40' stroke='%23B07D3E' stroke-width='.5' opacity='.07'/%3E%3Crect x='16' y='16' width='8' height='8' fill='none' stroke='%23B07D3E' stroke-width='.6' opacity='.09' transform='rotate(45 20 20)'/%3E%3C/svg%3E")`,
      }}/>

      {/* Bande kente supérieure */}
      <div style={{
        height:5, position:"relative", zIndex:1,
        background:`repeating-linear-gradient(90deg,${GOLD} 0px,${GOLD} 8px,${TERRA} 8px,${TERRA} 16px,${GOLD_D} 16px,${GOLD_D} 24px,${TERRA} 24px,${TERRA} 32px,${GOLD_L} 32px,${GOLD_L} 40px)`,
      }}/>

      {/* Toasts */}
      <ToastContainer toasts={toasts} onClose={closeToast}/>

      {/* ── Header ── */}
      <header style={{
        position:"relative", zIndex:1,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        maxWidth:720, margin:"0 auto", width:"100%",
        padding:"18px 24px",
      }}>
        <Link href="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
          <img src="/logo.png" alt="Axso" style={{ height:28, objectFit:"contain" }}
            onError={e=>{ (e.currentTarget as HTMLImageElement).style.display="none"; }}/>
        </Link>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          {toasts.length>0 && (
            <div style={{ position:"relative" }}>
              <Bell size={18} color={GOLD}/>
              <div style={{
                position:"absolute", top:-5, right:-5,
                width:14, height:14, borderRadius:"50%",
                background:`linear-gradient(135deg,${TERRA},${GOLD_D})`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:8, color:WHITE, fontWeight:800,
                border:`1.5px solid ${IVORY}`,
              }}>{toasts.length}</div>
            </div>
          )}
          <Link href="/connexion" style={{ fontSize:13, color:MID, textDecoration:"none", fontWeight:500 }}>
            Déjà un compte ?{" "}
            <span style={{ color:GOLD_D, fontWeight:800 }}>Connexion</span>
          </Link>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{
        position:"relative", zIndex:1, flex:1,
        maxWidth:720, margin:"0 auto", width:"100%",
        padding:"8px 24px 160px",
        display:"flex", flexDirection:"column", gap:22,
      }}>

        {/* ── WELCOME ── */}
        {phase==="welcome" && (
          <div className="hero-in" style={{ paddingTop:28 }}>
            <div style={{ textAlign:"center" }}>
              {/* Médaillon */}
              <div style={{ display:"flex", justifyContent:"center", marginBottom:28 }}>
                <div style={{ position:"relative" }}>
                  <div style={{ position:"absolute", inset:-18, borderRadius:"50%", border:`1px solid ${GOLD}22`, background:`radial-gradient(circle,${GOLD}04 0%,transparent 70%)` }}/>
                  <div style={{ position:"absolute", inset:-9, borderRadius:"50%", border:`1px dashed ${GOLD}30` }}/>
                  <div style={{
                    width:100, height:100, borderRadius:"28%",
                    background:`linear-gradient(135deg,${LINEN} 0%,${PARCH} 100%)`,
                    border:`2.5px solid ${GOLD}45`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    boxShadow:`0 12px 44px rgba(176,125,62,.24),inset 0 1px 0 rgba(255,255,255,.8)`,
                  }}>
                    <img src="/axia-icon.png" alt="Axia"
                      style={{ width:"80%", height:"80%", objectFit:"cover", borderRadius:"22%" }}
                      onError={e=>{ (e.currentTarget as HTMLImageElement).style.display="none"; }}/>
                  </div>
                  {[[-7,-7],[106,-9],[106,92],[-9,94]].map(([x,y],i)=>(
                    <div key={i} style={{ position:"absolute", left:x, top:y, width:8, height:8, borderRadius:"50%", background:GOLD, opacity:.45 }}/>
                  ))}
                </div>
              </div>

              <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 14px", borderRadius:999, background:`${GOLD}12`, border:`1px solid ${GOLD}30`, marginBottom:18 }}>
                <Sparkles size={12} color={GOLD}/>
                <span style={{ fontSize:11, fontWeight:800, color:GOLD_D, letterSpacing:".08em", textTransform:"uppercase", fontFamily:"'Outfit',sans-serif" }}>Propulsé par l'IA</span>
              </div>

              <h1 style={{
                fontFamily:"'Cormorant Garamond',serif",
                fontSize:42, fontWeight:700, color:INK,
                lineHeight:1.1, margin:"0 0 14px", letterSpacing:"-.02em",
              }}>
                Crée ton empire e-commerce<br/>
                <em style={{ color:GOLD_D }}>avec Axia</em>
              </h1>

              <p style={{ fontSize:15, color:MID, lineHeight:1.8, maxWidth:480, margin:"0 auto 28px" }}>
                En quelques questions, Axia conçoit ton site e-commerce ultra haut de gamme. Design, produits, livraison — tout configuré automatiquement.
              </p>

              <Divider/>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, maxWidth:460, margin:"24px auto" }}>
                {[
                  { Icon:Palette,  label:"15 designs premium",  desc:"Afrocentriques & luxe" },
                  { Icon:Store,    label:"Site complet",         desc:"Produits · Livraison · SEO" },
                  { Icon:Globe,    label:"Mondial",              desc:"100+ pays, toutes devises" },
                  { Icon:Sparkles, label:"100% IA",              desc:"En ligne en 60 secondes" },
                ].map(({Icon,label,desc})=>(
                  <div key={label} style={{
                    background:WHITE, border:`1.5px solid ${PARCH}`,
                    borderRadius:16, padding:"14px 16px", textAlign:"left",
                    boxShadow:"0 2px 10px rgba(28,18,8,.06)",
                  }}>
                    <div style={{ width:32, height:32, borderRadius:10, background:`${GOLD}12`, border:`1px solid ${GOLD}28`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}>
                      <Icon size={15} color={GOLD}/>
                    </div>
                    <div style={{ fontWeight:700, fontSize:12, color:INK, marginBottom:3 }}>{label}</div>
                    <div style={{ fontSize:11, color:MUTED }}>{desc}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={()=>{ setPhase("q-vente"); toast("info","Bienvenue ! Axia est là pour toi. 👋"); }}
                className="gold-btn"
                style={{ padding:"17px 52px", borderRadius:18, fontSize:15, display:"inline-flex", alignItems:"center", gap:12, boxShadow:`0 12px 44px rgba(176,125,62,.32)` }}>
                <Sparkles size={18}/>
                Créer ma boutique gratuitement
                <ChevronRight size={18}/>
              </button>
              <p style={{ marginTop:12, fontSize:12, color:MUTED }}>
                Gratuit · Sans carte bancaire · En ligne en 60 secondes
              </p>

              <div style={{ marginTop:32 }}>
                <Divider/>
                <p style={{ fontSize:11, color:MUTED, margin:"12px 0 10px", textTransform:"uppercase", letterSpacing:".1em" }}>
                  Rejoint par 1 000+ boutiques en Afrique
                </p>
                <div style={{ display:"flex", justifyContent:"center", gap:8, flexWrap:"wrap" }}>
                  {["🇸🇳 Sénégal","🇨🇮 Côte d'Ivoire","🇨🇲 Cameroun","🇳🇬 Nigeria","🇬🇭 Ghana"].map(c=>(
                    <span key={c} style={{ fontSize:11, padding:"4px 12px", borderRadius:999, background:WHITE, border:`1px solid ${PARCH}`, color:MID }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CONVERSATION ── */}
        {phase!=="welcome" && (
          <>
            <AxiaMsg delay={0}>
              Bonjour ! 👋{" "}
              <strong style={{color:GOLD_D}}>Dis-moi ce que tu veux vendre.</strong>{" "}
              Plus tu es précis, plus ton site sera parfait.
            </AxiaMsg>

            {phase==="q-vente" && (
              <div className="msg-in" style={{ paddingLeft:47, display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {[
                    "Mode & vêtements africains","Cosmétiques naturels",
                    "Bijoux artisanaux","Formations en ligne",
                    "Électronique & gadgets","Alimentation & épices",
                  ].map(ex=>(
                    <button key={ex} onClick={()=>setVenteInput(ex)}
                      style={{
                        padding:"6px 14px", borderRadius:999, fontSize:12, fontWeight:500,
                        background:venteInput===ex?`${GOLD}14`:WHITE,
                        border:`1.5px solid ${venteInput===ex?GOLD:PARCH}`,
                        color:venteInput===ex?GOLD_D:MID,
                        cursor:"pointer", transition:"all .13s", fontFamily:"'Outfit',sans-serif",
                      }}>{ex}</button>
                  ))}
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <textarea
                    value={venteInput}
                    onChange={e=>setVenteInput(e.target.value)}
                    onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); submitVente(); } }}
                    placeholder="Ex: je vends des vêtements mode femme inspirés de la culture africaine, basée à Dakar…"
                    rows={3}
                    style={{
                      flex:1, background:WHITE, border:`1.5px solid ${PARCH}`,
                      borderRadius:14, padding:"12px 16px",
                      color:INK, fontSize:13, resize:"none", outline:"none",
                      lineHeight:1.6, fontFamily:"'Outfit',sans-serif",
                      transition:"border-color .18s",
                    }}
                    onFocus={e=>e.currentTarget.style.borderColor=GOLD}
                    onBlur={e=>e.currentTarget.style.borderColor=PARCH}
                  />
                  <button onClick={submitVente} disabled={!venteInput.trim()} className="gold-btn"
                    style={{ width:46, height:46, borderRadius:12, padding:0, display:"flex", alignItems:"center", justifyContent:"center", alignSelf:"flex-end", flexShrink:0, opacity:venteInput.trim()?1:.3 }}>
                    <Send size={16} color={WHITE}/>
                  </button>
                </div>
              </div>
            )}

            {vente&&phase!=="q-vente" && <UserMsg>{vente}</UserMsg>}

            {vente&&(phase==="q-pays"||paysCode) && (
              <AxiaMsg delay={80}>
                Dans quel pays es-tu basé ? Je vais adapter la devise, la livraison et le design à ton marché. 🌍
              </AxiaMsg>
            )}
            {phase==="q-pays" && <PaysSelector onSelect={submitPays}/>}
            {paysNom&&phase!=="q-pays" && <UserMsg>📍 {paysNom}</UserMsg>}

            {phase==="analyse" && (
              <>
                <AxiaMsg delay={0}>Laisse-moi analyser ton projet et concevoir ton site sur-mesure… ✨</AxiaMsg>
                <AxiaThinking/>
              </>
            )}

            {(phase==="plan"||phase==="q-compte"||phase==="creation"||phase==="succes") && plan && (
              <>
                <AxiaMsg delay={0}>
                  <strong style={{color:GOLD_D}}>Ton site est prêt à être lancé.</strong>{" "}{messageIA}
                </AxiaMsg>
                {phase==="plan" && (
                  <PlanCard
                    plan={plan}
                    onConfirm={confirmPlan}
                    onThemeChange={id=>setPlan(p=>p?{...p,themeId:id}:p)}
                  />
                )}
              </>
            )}

            {(phase==="q-compte"||phase==="creation"||phase==="succes") && (
              <>
                <AxiaMsg delay={100}>
                  Dernière étape — crée ton compte pour lancer ta boutique. 🚀
                </AxiaMsg>
                {phase==="q-compte" && (
                  <CompteForm onSubmit={launchCreation} loading={loading} erreur={erreur||undefined}/>
                )}
              </>
            )}

            {phase==="creation" && (
              <div className="msg-in scale-up" style={{ paddingLeft:47 }}>
                <div style={{
                  background:WHITE, border:`1.5px solid ${PARCH}`,
                  borderRadius:18, padding:"18px 22px",
                  boxShadow:"0 4px 22px rgba(28,18,8,.09)", maxWidth:440,
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                    <Loader2 size={18} color={GOLD} className="animate-spin"/>
                    <span style={{ fontWeight:700, fontSize:14, fontFamily:"'Cormorant Garamond',serif", color:INK }}>
                      Axia construit ta boutique…
                    </span>
                  </div>
                  {steps.map((s,i)=>(
                    <div key={i} className="msg-in" style={{ display:"flex", alignItems:"center", gap:10, fontSize:13, marginBottom:8 }}>
                      <CheckCircle2 size={14} color={SUCCESS} style={{flexShrink:0}}/>
                      <span style={{color:MID}}>{s}</span>
                    </div>
                  ))}
                  {steps.length<STEPS_CREATION.length && (
                    <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:13 }}>
                      <Loader2 size={14} color={GOLD} className="animate-spin" style={{flexShrink:0}}/>
                      <span style={{color:MUTED}}>En cours…</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {phase==="succes" && (
              <div className="scale-up" style={{ display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", gap:20, padding:"24px 0" }}>
                <div style={{
                  width:80, height:80, borderRadius:"50%",
                  background:"rgba(42,157,92,.1)", border:"2px solid rgba(42,157,92,.3)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  boxShadow:"0 10px 36px rgba(42,157,92,.18)",
                }}>
                  <CheckCircle2 size={40} color={SUCCESS}/>
                </div>
                <div>
                  <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:700, color:INK, margin:0 }}>
                    Ta boutique est en ligne ! 🎉
                  </h2>
                  <p style={{ color:MID, fontSize:14, marginTop:8 }}>
                    {plan?.nomBoutique&&<strong style={{color:GOLD_D}}>{plan.nomBoutique}</strong>} est prête. Redirection…
                  </p>
                </div>
                <Loader2 size={22} color={GOLD} className="animate-spin"/>
              </div>
            )}
          </>
        )}

        <div ref={bottomRef}/>
      </main>

      {/* Footer */}
      {phase==="welcome" && (
        <footer style={{
          position:"relative", zIndex:1, textAlign:"center",
          padding:"0 24px 32px", color:MUTED, fontSize:12,
        }}>
          <Divider/>
          <div style={{ marginTop:12 }}>
            Tu es livreur ?{" "}
            <Link href="/inscription/livreur" style={{ color:GOLD_D, fontWeight:800, textDecoration:"none" }}>
              Rejoindre la plateforme →
            </Link>
          </div>
        </footer>
      )}
    </div>
  );
}
