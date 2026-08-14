"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight, ArrowLeft, Check, Loader2, Store, Sparkles,
  Bot, Send, CheckCircle2, Package, Truck, AlertCircle,
} from "lucide-react";
import type { PlanBoutique } from "@/lib/ai-agent";

const ACCENT      = "#F5A623";
const ACCENT_DARK = "#d4880d";

const schemaCompte = z.object({
  name:      z.string().min(2, "Minimum 2 caractères"),
  email:     z.string().email("Email invalide"),
  password:  z.string().min(6, "Minimum 6 caractères"),
  whatsapp:  z.string().min(8, "Numéro WhatsApp requis"),
});
type CompteData = z.infer<typeof schemaCompte>;

const inputCls =
  "w-full bg-white border border-[#E5E5E5] rounded-xl px-4 py-3.5 text-[#111111] text-sm " +
  "placeholder:text-[#999999] focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/15 focus:outline-none transition-all";

const THEMES: Record<string, { nom: string; couleur: string }> = {
  "noir-obsidien":    { nom: "Noir Obsidien",    couleur: "#F5A623" },
  "violet-cosmos":    { nom: "Violet Cosmos",    couleur: "#7c3aed" },
  "terre-et-or":      { nom: "Terre & Or",       couleur: "#c2622d" },
  "kente-royal":      { nom: "Kente Royal",      couleur: "#D4AF37" },
  "ocean-atlantique": { nom: "Océan Atlantique", couleur: "#0ea5e9" },
  "bwiti-forest":     { nom: "Bwiti Forest",     couleur: "#16a34a" },
};

function PlanPreviewCard({ plan, messageIA, onConfirmer, onModifier, loading }: {
  plan: PlanBoutique & { messageIA?: string };
  messageIA: string;
  onConfirmer: () => void;
  onModifier: () => void;
  loading: boolean;
}) {
  const theme = THEMES[plan.themeId] || THEMES["terre-et-or"];
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.25)" }}>
          <Bot size={14} style={{ color: ACCENT }} />
        </div>
        <div className="flex-1 rounded-2xl px-4 py-3"
          style={{ background: "rgba(245,166,35,0.07)", border: "1px solid rgba(245,166,35,0.15)" }}>
          <p className="text-sm text-[#3D3D3D] leading-relaxed">{messageIA}</p>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border" style={{ background: "#ffffff", borderColor: "rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)" }}>
        <div className="p-4 border-b" style={{ borderColor: "rgba(0,0,0,0.06)", background: `linear-gradient(135deg, ${theme.couleur}12, ${theme.couleur}06)` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${theme.couleur}20`, border: `2px solid ${theme.couleur}40` }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: theme.couleur }} />
            </div>
            <div>
              <p className="font-bold text-[#111111]">{plan.nomBoutique}</p>
              <p className="text-xs text-[#808080]">{plan.categorie} · {plan.pays} · {plan.devise}</p>
            </div>
            <div className="ml-auto text-xs px-2 py-1 rounded-lg border font-medium"
              style={{ color: theme.couleur, borderColor: `${theme.couleur}30`, background: `${theme.couleur}10` }}>
              {theme.nom}
            </div>
          </div>
          {plan.description && <p className="text-xs text-[#808080] mt-2">{plan.description}</p>}
        </div>

        <div className="p-4 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Package size={13} className="text-[#999999]" />
            <p className="text-xs font-semibold text-[#999999] uppercase tracking-wider">{plan.produits.length} produits</p>
          </div>
          <div className="space-y-2">
            {plan.produits.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-[#595959]">{p.nom}</span>
                <span className="font-semibold text-[#333333]">{p.prix.toLocaleString()} {plan.devise}</span>
              </div>
            ))}
          </div>
        </div>

        {plan.livraison && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck size={13} className="text-[#999999]" />
              <p className="text-xs font-semibold text-[#999999] uppercase tracking-wider">Livraison configurée</p>
            </div>
            <div className="flex gap-4 text-xs text-[#666666]">
              <span>Locale : {plan.livraison.locale.toLocaleString()} {plan.devise}</span>
              <span>Nationale : {plan.livraison.nationale.toLocaleString()} {plan.devise}</span>
            </div>
            {plan.livraison.gratuite > 0 && (
              <p className="text-xs text-green-400 mt-1">Gratuit dès {plan.livraison.gratuite.toLocaleString()} {plan.devise}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={onModifier} disabled={loading}
          className="flex-1 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
          style={{ border: "1px solid rgba(0,0,0,0.12)", color: "rgba(0,0,0,0.55)", background: "transparent" }}>
          Modifier
        </button>
        <button onClick={onConfirmer} disabled={loading}
          className="flex-1 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm hover:scale-[1.02]"
          style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`, color: "#080808", boxShadow: `0 8px 25px rgba(245,166,35,0.3)` }}>
          {loading ? <><Loader2 size={15} className="animate-spin" /> Création...</> : <><Sparkles size={15} /> Créer ma boutique</>}
        </button>
      </div>
    </div>
  );
}

function EtapeIA({ onBack, compte }: { onBack: () => void; compte: CompteData }) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [erreur,      setErreur]      = useState("");
  const [plan,        setPlan]        = useState<(PlanBoutique & { messageIA?: string }) | null>(null);
  const [messageIA,   setMessageIA]   = useState("");
  const [phase,       setPhase]       = useState<"saisie"|"plan"|"creation"|"succes">("saisie");
  const [progress,    setProgress]    = useState<string[]>([]);

  const analyser = async () => {
    if (!description.trim() || loading) return;
    setLoading(true); setErreur("");
    try {
      const res  = await fetch("/api/ai/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phase: "analyser", description }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPlan(data.plan);
      setMessageIA(data.messageIA || data.plan.messageIA || "Voici ce que je vais créer pour vous !");
      setPhase("plan");
    } catch (err: any) { setErreur(err.message || "Erreur lors de l'analyse."); }
    finally { setLoading(false); }
  };

  const executer = async () => {
    if (!plan) return;
    setLoading(true); setErreur(""); setPhase("creation");
    const steps = ["Création de votre boutique...", "Configuration du thème...", "Ajout des produits...", "Configuration de la livraison...", "Finalisation..."];
    let i = 0;
    const interval = setInterval(() => { if (i < steps.length) { setProgress(p => [...p, steps[i]]); i++; } }, 600);
    try {
      const res  = await fetch("/api/ai/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phase: "executer", plan, compte }) });
      const data = await res.json();
      clearInterval(interval);
      if (!res.ok) throw new Error(data.message);
      setPhase("succes");
      const loginResult = await signIn("credentials", { email: compte.email, password: compte.password, redirect: false });
      setTimeout(() => router.push(loginResult?.ok ? "/dashboard" : "/connexion?inscription=success"), 1500);
    } catch (err: any) { clearInterval(interval); setErreur(err.message || "Erreur"); setPhase("plan"); }
    finally { setLoading(false); }
  };

  if (phase === "succes") return (
    <div className="text-center py-8 space-y-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
        style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)" }}>
        <CheckCircle2 size={32} className="text-green-400" />
      </div>
      <h3 className="text-xl font-bold text-[#111111]">Boutique créée !</h3>
      <p className="text-[#808080] text-sm">Redirection vers votre dashboard...</p>
      <div className="flex justify-center"><Loader2 size={20} className="animate-spin" style={{ color: ACCENT }} /></div>
    </div>
  );

  if (phase === "creation") return (
    <div className="py-6 space-y-4">
      <div className="text-center mb-4">
        <Sparkles size={24} className="mx-auto mb-2" style={{ color: ACCENT }} />
        <p className="font-semibold text-[#111111]">L'IA construit votre boutique...</p>
      </div>
      <div className="space-y-2">
        {progress.map((step, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
            <span className="text-[#4D4D4D]">{step}</span>
          </div>
        ))}
        {progress.length < 5 && (
          <div className="flex items-center gap-3 text-sm">
            <Loader2 size={16} className="animate-spin flex-shrink-0" style={{ color: ACCENT }} />
            <span className="text-[#8C8C8C]">En cours...</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h2 className="text-xl font-bold text-[#111111]">L'IA crée votre boutique</h2>
        <p className="text-[#808080] text-sm mt-0.5">Décrivez votre business en quelques mots</p>
      </div>

      {phase === "saisie" && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.2)" }}>
            <Bot size={14} style={{ color: ACCENT }} />
          </div>
          <div className="flex-1 rounded-2xl px-4 py-3"
            style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.15)" }}>
            <p className="text-sm text-[#444444]">
              Bonjour {compte.name.split(" ")[0]} ! Décrivez votre business et je crée tout automatiquement —
              nom, thème, produits, livraison. Ex : <em style={{ color: ACCENT }}>"Je vends des vêtements mode à Dakar"</em> ou{" "}
              <em style={{ color: ACCENT }}>"Bijoux artisanaux au Maroc"</em>
            </p>
          </div>
        </div>
      )}

      {erreur && (
        <div className="flex items-center gap-2 rounded-xl p-3 text-sm"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          <AlertCircle size={15} className="flex-shrink-0" /> {erreur}
        </div>
      )}

      {phase === "plan" && plan && (
        <PlanPreviewCard plan={plan} messageIA={messageIA}
          onConfirmer={executer} onModifier={() => { setPlan(null); setPhase("saisie"); }} loading={loading} />
      )}

      {phase === "saisie" && (
        <>
          <div className="flex flex-wrap gap-2">
            {["Mode africaine au Cameroun", "Cosmétiques naturels au Sénégal", "Artisanat et bijoux au Maroc"].map(ex => (
              <button key={ex} onClick={() => setDescription(ex)}
                className="text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{ background: "rgba(245,166,35,0.07)", border: "1px solid rgba(245,166,35,0.18)", color: "rgba(0,0,0,0.5)" }}>
                {ex}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), analyser())}
              placeholder="Décrivez votre business : produits, pays, clientèle cible..."
              rows={3} disabled={loading} className={inputCls + " resize-none flex-1"} />
            <button onClick={analyser} disabled={!description.trim() || loading}
              className="w-12 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 self-end"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` }}>
              {loading ? <Loader2 size={16} className="animate-spin" style={{ color: "#080808" }} /> : <Send size={16} style={{ color: "#080808" }} />}
            </button>
          </div>
          <button type="button" onClick={onBack}
            className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
            style={{ border: "1px solid rgba(0,0,0,0.1)", color: "rgba(0,0,0,0.45)" }}>
            <ArrowLeft size={15} /> Retour
          </button>
        </>
      )}
    </div>
  );
}

export default function InscriptionPage() {
  const router   = useRouter();
  const [etape,  setEtape]  = useState(0);
  const [compte, setCompte] = useState<CompteData | null>(null);

  const formCompte = useForm<CompteData>({ resolver: zodResolver(schemaCompte) });
  const onSubmitCompte = (data: CompteData) => { setCompte(data); setEtape(1); };

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: "#ffffff", fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif" }}>
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/3 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(245,166,35,0.09) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.07) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 opacity-[0.018]"
          style={{ backgroundImage: "linear-gradient(rgba(245,166,35,1) 1px,transparent 1px),linear-gradient(90deg,rgba(245,166,35,1) 1px,transparent 1px)", backgroundSize: "52px 52px" }} />
      </div>

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] px-14 py-12 relative">
        <Link href="/">
          <img src="/logo.png" alt="axso"
            style={{ height: "34px", width: "auto", objectFit: "contain" }} />
        </Link>

        <div className="max-w-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-7"
            style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", color: ACCENT }}>
            <Sparkles size={11} /> Inscription gratuite · Propulsée par l'IA
          </div>
          <h1 className="text-3xl font-bold text-[#111111] leading-tight mb-4">
            Décrivez votre business,<br />
            <span style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              l'IA crée tout
            </span>
          </h1>
          <p className="text-[#737373] text-sm leading-relaxed mb-8">
            En 2 étapes, votre boutique est en ligne — nom, thème, produits, livraison. Tout configuré automatiquement.
          </p>

          <div className="space-y-3">
            {[
              { icon: Store, label: "Votre compte",       desc: "Email et mot de passe",     done: etape > 0 },
              { icon: Bot,   label: "L'IA configure tout", desc: "Décrivez votre business",  done: false },
            ].map((s, i) => (
              <div key={i}
                className="flex items-center gap-3 p-3.5 rounded-2xl transition-all"
                style={{
                  background: i === etape ? "rgba(245,166,35,0.06)" : i < etape ? "rgba(245,166,35,0.03)" : "transparent",
                  border: i === etape ? "1px solid rgba(245,166,35,0.2)" : "1px solid transparent",
                  opacity: i > etape ? 0.4 : 1,
                }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: i <= etape ? `linear-gradient(135deg,${ACCENT},${ACCENT_DARK})` : "rgba(0,0,0,0.06)", color: i <= etape ? "#080808" : "rgba(0,0,0,0.4)" }}>
                  {s.done ? <Check size={14} /> : <s.icon size={14} />}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: i === etape ? "#111111" : "rgba(0,0,0,0.45)" }}>{s.label}</p>
                  <p className="text-xs text-[#999999]">{s.desc}</p>
                </div>
                {i === etape && <div className="ml-auto w-2 h-2 rounded-full animate-pulse" style={{ background: ACCENT }} />}
              </div>
            ))}
          </div>
        </div>

        <p className="text-[#B3B3B3] text-xs">© 2026 Axso · Made for Africa</p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <div className="absolute top-8 left-6 lg:hidden">
          <Link href="/">
            <img src="/logo.png" alt="axso"
              style={{ height: "30px", width: "auto", objectFit: "contain" }} />
          </Link>
        </div>

        <div className="w-full max-w-md pt-16 lg:pt-0">
          {/* Mobile stepper */}
          <div className="flex items-center justify-center gap-2 mb-6 lg:hidden">
            {["Compte", "Boutique IA"].map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{ background: i <= etape ? `linear-gradient(135deg,${ACCENT},${ACCENT_DARK})` : "rgba(0,0,0,0.08)", color: i <= etape ? "#080808" : "rgba(0,0,0,0.4)" }}>
                  {i < etape ? <Check size={12} /> : i + 1}
                </div>
                <span className="text-xs text-[#8C8C8C] hidden sm:block">{label}</span>
                {i < 1 && <div className="w-6 h-0.5" style={{ background: i < etape ? ACCENT : "rgba(0,0,0,0.1)" }} />}
              </div>
            ))}
          </div>

          <div className="rounded-3xl p-8 border"
            style={{ background: "#ffffff", borderColor: "rgba(245,166,35,0.2)", boxShadow: "0 20px 60px rgba(0,0,0,0.08), 0 0 0 1px rgba(245,166,35,0.06)" }}>

            {/* ÉTAPE 0 — Compte */}
            {etape === 0 && (
              <form onSubmit={formCompte.handleSubmit(onSubmitCompte)} className="space-y-4">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-[#111111]">Créez votre compte</h2>
                  <p className="text-[#808080] text-sm mt-0.5">Gratuit · Pas de carte requise</p>
                </div>

                {[
                  { field: "name",     label: "Votre nom",     type: "text",     ph: "Aminata Diallo" },
                  { field: "email",    label: "Email",          type: "email",    ph: "aminata@example.com" },
                  { field: "password", label: "Mot de passe",   type: "password", ph: "Minimum 6 caractères" },
                  { field: "whatsapp", label: "WhatsApp",       type: "tel",      ph: "+221 77 123 45 67" },
                ].map(({ field, label, type, ph }) => (
                  <div key={field}>
                    <label className="block text-[#595959] text-sm font-medium mb-1.5">{label}</label>
                    <input {...formCompte.register(field as keyof CompteData)} type={type} placeholder={ph} className={inputCls} />
                    {formCompte.formState.errors[field as keyof CompteData] && (
                      <p className="text-red-400 text-xs mt-1">{formCompte.formState.errors[field as keyof CompteData]?.message}</p>
                    )}
                  </div>
                ))}

                <button type="submit"
                  className="w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 mt-2"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`, color: "#080808", boxShadow: `0 8px 30px rgba(245,166,35,0.3)` }}>
                  <Bot size={16} /> Continuer avec l'IA <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* ÉTAPE 1 — IA */}
            {etape === 1 && compte && <EtapeIA compte={compte} onBack={() => setEtape(0)} />}
          </div>

          <p className="text-center text-[#999999] text-sm mt-5">
            Déjà un compte ?{" "}
            <Link href="/connexion" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: ACCENT }}>
              Se connecter
            </Link>
          </p>
          <p className="text-center text-[#A6A6A6] text-xs mt-2">
            Vous êtes livreur ?{" "}
            <Link href="/inscription/livreur" className="underline underline-offset-2 hover:opacity-80 transition-opacity" style={{ color: "rgba(0,0,0,0.4)" }}>
              Rejoindre la plateforme →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
