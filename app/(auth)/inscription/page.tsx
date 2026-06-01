"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight, ArrowLeft, Check, Loader2, Store, Sparkles,
  Bot, Send, CheckCircle2, Package, Truck, Palette, AlertCircle,
} from "lucide-react";
import type { PlanBoutique } from "@/lib/ai-agent";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const schemaCompte = z.object({
  name: z.string().min(2, "Minimum 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Minimum 6 caractères"),
  whatsapp: z.string().min(8, "Numéro WhatsApp requis"),
});

type CompteData = z.infer<typeof schemaCompte>;

const inputCls =
  "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/10 focus:outline-none transition-all";

// ─── Noms des thèmes ──────────────────────────────────────────────────────────

const THEMES: Record<string, { nom: string; emoji: string; couleur: string }> = {
  "noir-obsidien":   { nom: "Noir Obsidien",   emoji: "✨", couleur: "#F5A623" },
  "violet-cosmos":  { nom: "Violet Cosmos",    emoji: "💜", couleur: "#7c3aed" },
  "terre-et-or":    { nom: "Terre & Or",       emoji: "🌿", couleur: "#c2622d" },
  "kente-royal":    { nom: "Kente Royal",      emoji: "👑", couleur: "#D4AF37" },
  "ocean-atlantique": { nom: "Océan Atlantique", emoji: "🌊", couleur: "#0ea5e9" },
  "bwiti-forest":   { nom: "Bwiti Forest",     emoji: "🌱", couleur: "#16a34a" },
};

// ─── Plan preview card ────────────────────────────────────────────────────────

function PlanPreviewCard({
  plan,
  messageIA,
  onConfirmer,
  onModifier,
  loading,
}: {
  plan: PlanBoutique & { messageIA?: string };
  messageIA: string;
  onConfirmer: () => void;
  onModifier: () => void;
  loading: boolean;
}) {
  const theme = THEMES[plan.themeId] || THEMES["terre-et-or"];
  return (
    <div className="space-y-4">
      {/* Message IA */}
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#F5A623]/20 border border-[#F5A623]/30 flex items-center justify-center flex-shrink-0">
          <Bot size={14} className="text-[#F5A623]" />
        </div>
        <div className="flex-1 bg-amber-50 border border-[#F5A623]/20 rounded-2xl px-4 py-3">
          <p className="text-sm text-gray-700 leading-relaxed">{messageIA}</p>
        </div>
      </div>

      {/* Plan card */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        {/* Header boutique */}
        <div className="p-4 border-b border-gray-50" style={{ background: `linear-gradient(135deg, ${theme.couleur}10, ${theme.couleur}05)` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{ background: `${theme.couleur}20`, border: `2px solid ${theme.couleur}40` }}>
              {theme.emoji}
            </div>
            <div>
              <p className="font-bold text-gray-900">{plan.nomBoutique}</p>
              <p className="text-xs text-gray-400">{plan.categorie} · {plan.pays} · {plan.devise}</p>
            </div>
            <div className="ml-auto text-xs px-2 py-1 rounded-lg border font-medium"
              style={{ color: theme.couleur, borderColor: `${theme.couleur}30`, background: `${theme.couleur}10` }}>
              {theme.nom}
            </div>
          </div>
          {plan.description && (
            <p className="text-xs text-gray-500 mt-2">{plan.description}</p>
          )}
        </div>

        {/* Produits */}
        <div className="p-4 border-b border-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <Package size={13} className="text-gray-400" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {plan.produits.length} produits de démarrage
            </p>
          </div>
          <div className="space-y-2">
            {plan.produits.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{p.nom}</span>
                <span className="font-semibold text-gray-900">
                  {p.prix.toLocaleString()} {plan.devise}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Livraison */}
        {plan.livraison && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck size={13} className="text-gray-400" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Livraison configurée</p>
            </div>
            <div className="flex gap-4 text-xs text-gray-600">
              <span>Locale : {plan.livraison.locale.toLocaleString()} {plan.devise}</span>
              <span>Nationale : {plan.livraison.nationale.toLocaleString()} {plan.devise}</span>
            </div>
            {plan.livraison.gratuite > 0 && (
              <p className="text-xs text-green-600 mt-1">
                Livraison gratuite dès {plan.livraison.gratuite.toLocaleString()} {plan.devise}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Boutons */}
      <div className="flex gap-3">
        <button
          onClick={onModifier}
          disabled={loading}
          className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium disabled:opacity-40"
        >
          Modifier
        </button>
        <button
          onClick={onConfirmer}
          disabled={loading}
          className="flex-1 bg-[#F5A623] text-white font-bold py-3 rounded-xl hover:bg-[#D4911A] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#F5A623]/25 disabled:opacity-50 text-sm"
        >
          {loading ? (
            <><Loader2 size={15} className="animate-spin" /> Création en cours...</>
          ) : (
            <><Sparkles size={15} /> Créer ma boutique</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Étape IA ─────────────────────────────────────────────────────────────────

function EtapeIA({
  onBack,
  compte,
}: {
  onBack: () => void;
  compte: CompteData;
}) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");
  const [plan, setPlan] = useState<(PlanBoutique & { messageIA?: string }) | null>(null);
  const [messageIA, setMessageIA] = useState("");
  const [phase, setPhase] = useState<"saisie" | "plan" | "creation" | "succes">("saisie");
  const [progress, setProgress] = useState<string[]>([]);

  const analyser = async () => {
    if (!description.trim() || loading) return;
    setLoading(true);
    setErreur("");
    try {
      const res = await fetch("/api/ai/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "analyser", description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPlan(data.plan);
      setMessageIA(data.messageIA || data.plan.messageIA || "Voici ce que je vais créer pour vous !");
      setPhase("plan");
    } catch (err: any) {
      setErreur(err.message || "Erreur lors de l'analyse. Vérifiez votre clé ANTHROPIC_API_KEY.");
    } finally {
      setLoading(false);
    }
  };

  const executer = async () => {
    if (!plan) return;
    setLoading(true);
    setErreur("");
    setPhase("creation");

    const steps = [
      "Création de votre boutique...",
      "Configuration du thème...",
      "Ajout des produits...",
      "Configuration de la livraison...",
      "Finalisation...",
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setProgress((prev) => [...prev, steps[i]]);
        i++;
      }
    }, 600);

    try {
      const res = await fetch("/api/ai/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "executer", plan, compte }),
      });
      const data = await res.json();
      clearInterval(interval);
      if (!res.ok) throw new Error(data.message);
      setPhase("succes");
      setTimeout(() => router.push("/connexion?inscription=success"), 2500);
    } catch (err: any) {
      clearInterval(interval);
      setErreur(err.message || "Erreur lors de la création");
      setPhase("plan");
    } finally {
      setLoading(false);
    }
  };

  // Succès
  if (phase === "succes") {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Boutique créée !</h3>
        <p className="text-gray-500 text-sm">Vous allez être redirigé vers la connexion...</p>
        <div className="flex justify-center">
          <Loader2 size={20} className="animate-spin text-[#F5A623]" />
        </div>
      </div>
    );
  }

  // Création en cours
  if (phase === "creation") {
    return (
      <div className="py-6 space-y-4">
        <div className="text-center mb-4">
          <Sparkles size={24} className="text-[#F5A623] mx-auto mb-2" />
          <p className="font-semibold text-gray-900">L'IA construit votre boutique...</p>
        </div>
        <div className="space-y-2">
          {progress.map((step, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
              <span className="text-gray-700">{step}</span>
            </div>
          ))}
          {progress.length < 5 && (
            <div className="flex items-center gap-3 text-sm">
              <Loader2 size={16} className="text-[#F5A623] animate-spin flex-shrink-0" />
              <span className="text-gray-400">En cours...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h2 className="text-xl font-bold text-gray-900">L'IA crée votre boutique</h2>
        <p className="text-gray-400 text-sm mt-0.5">Décrivez votre business en quelques mots</p>
      </div>

      {/* Message IA initial */}
      {phase === "saisie" && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#F5A623]/20 border border-[#F5A623]/30 flex items-center justify-center flex-shrink-0">
            <Bot size={14} className="text-[#F5A623]" />
          </div>
          <div className="flex-1 bg-amber-50 border border-[#F5A623]/20 rounded-2xl px-4 py-3">
            <p className="text-sm text-gray-700">
              Bonjour {compte.name.split(" ")[0]} ! 👋 Décrivez votre business et je vais créer toute votre boutique automatiquement — nom, thème, produits, livraison. Par exemple : <em className="text-[#F5A623]">"Je vends des robes wax et boubous au Sénégal"</em>
            </p>
          </div>
        </div>
      )}

      {erreur && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
          <AlertCircle size={15} className="flex-shrink-0" />
          {erreur}
        </div>
      )}

      {/* Plan IA */}
      {phase === "plan" && plan && (
        <PlanPreviewCard
          plan={plan}
          messageIA={messageIA}
          onConfirmer={executer}
          onModifier={() => { setPlan(null); setPhase("saisie"); }}
          loading={loading}
        />
      )}

      {/* Zone de saisie */}
      {phase === "saisie" && (
        <>
          {/* Exemples */}
          <div className="flex flex-wrap gap-2">
            {[
              "Mode africaine au Cameroun",
              "Cosmétiques naturels au Sénégal",
              "Artisanat et bijoux au Maroc",
            ].map((ex) => (
              <button
                key={ex}
                onClick={() => setDescription(ex)}
                className="text-xs bg-gray-50 border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg hover:border-[#F5A623]/40 hover:text-[#F5A623] transition-all"
              >
                {ex}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), analyser())}
              placeholder="Décrivez votre business : produits, pays, clientèle cible..."
              rows={3}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/10 focus:outline-none transition-all resize-none"
              disabled={loading}
            />
            <button
              onClick={analyser}
              disabled={!description.trim() || loading}
              className="w-12 bg-[#F5A623] rounded-xl flex items-center justify-center hover:bg-[#D4911A] transition-colors disabled:opacity-40 self-end"
            >
              {loading ? <Loader2 size={16} className="animate-spin text-white" /> : <Send size={16} className="text-white" />}
            </button>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-sm font-medium"
            >
              <ArrowLeft size={15} /> Retour
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function InscriptionPage() {
  const router = useRouter();
  const [etape, setEtape] = useState(0);
  const [modeIA, setModeIA] = useState(false);
  const [compte, setCompte] = useState<CompteData | null>(null);

  const formCompte = useForm<CompteData>({ resolver: zodResolver(schemaCompte) });

  const onSubmitCompte = (data: CompteData) => {
    setCompte(data);
    setEtape(1);
    setModeIA(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50/20 to-white flex overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-24 left-1/4 w-80 h-80 bg-[#F5A623]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-16 right-16 w-64 h-64 bg-amber-100/50 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: `linear-gradient(#F5A623 1px, transparent 1px), linear-gradient(90deg, #F5A623 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }} />
      </div>

      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] px-14 py-12 relative">
        <Link href="/">
          <img src="/logo.png" alt="axso" style={{ height: "60px", width: "auto", objectFit: "contain" }} />
        </Link>

        <div className="max-w-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F5A623]/10 border border-[#F5A623]/25 rounded-full text-[#F5A623] text-xs font-semibold mb-6">
            <Sparkles size={11} /> Inscription gratuite · Propulsée par l'IA
          </div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-4">
            Décrivez votre business,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5A623] to-[#E09015]">l'IA crée tout</span>
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            En 2 étapes, votre boutique est en ligne — nom, thème, produits, livraison. Tout configuré automatiquement.
          </p>

          <div className="space-y-3">
            {[
              { icon: Store, label: "Votre compte", desc: "Email et mot de passe", done: etape > 0 },
              { icon: Bot, label: "L'IA configure tout", desc: "Décrivez votre business", done: false },
            ].map((s, i) => (
              <div key={i} className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all ${i === etape ? "bg-white border border-[#F5A623]/20 shadow-md" : i < etape ? "bg-[#F5A623]/5" : "opacity-40"}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${i <= etape ? "bg-[#F5A623] text-white" : "bg-gray-100 text-gray-400"}`}>
                  {s.done ? <Check size={14} /> : <s.icon size={14} />}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${i === etape ? "text-gray-900" : "text-gray-500"}`}>{s.label}</p>
                  <p className="text-xs text-gray-400">{s.desc}</p>
                </div>
                {i === etape && <div className="ml-auto w-2 h-2 rounded-full bg-[#F5A623] animate-pulse" />}
              </div>
            ))}
          </div>
        </div>

        <p className="text-gray-400 text-xs">© 2026 Axso · Made for Africa</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <div className="absolute top-8 left-6 lg:hidden">
          <Link href="/">
            <img src="/logo.png" alt="axso" style={{ height: "48px", width: "auto", objectFit: "contain" }} />
          </Link>
        </div>

        <div className="w-full max-w-md pt-16 lg:pt-0">
          {/* Mobile stepper */}
          <div className="flex items-center justify-center gap-2 mb-6 lg:hidden">
            {["Compte", "Boutique IA"].map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i <= etape ? "bg-[#F5A623] text-white" : "bg-gray-100 text-gray-400"}`}>
                  {i < etape ? <Check size={12} /> : i + 1}
                </div>
                <span className="text-xs text-gray-400 hidden sm:block">{label}</span>
                {i < 1 && <div className={`w-6 h-0.5 ${i < etape ? "bg-[#F5A623]" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          <div
            className="bg-white rounded-3xl p-8 border border-gray-100"
            style={{ boxShadow: "0 32px 64px -12px rgba(201,168,76,0.15), 0 0 0 1px rgba(201,168,76,0.05)" }}
          >
            {/* ÉTAPE 0 — Compte */}
            {etape === 0 && (
              <form onSubmit={formCompte.handleSubmit(onSubmitCompte)} className="space-y-4">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Créez votre compte</h2>
                  <p className="text-gray-400 text-sm mt-0.5">Gratuit, sans carte bancaire</p>
                </div>

                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-1.5">Votre nom</label>
                  <input {...formCompte.register("name")} placeholder="Aminata Diallo" className={inputCls} />
                  {formCompte.formState.errors.name && <p className="text-red-500 text-xs mt-1">{formCompte.formState.errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-1.5">Email</label>
                  <input {...formCompte.register("email")} type="email" placeholder="aminata@example.com" className={inputCls} />
                  {formCompte.formState.errors.email && <p className="text-red-500 text-xs mt-1">{formCompte.formState.errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-1.5">Mot de passe</label>
                  <input {...formCompte.register("password")} type="password" placeholder="Minimum 6 caractères" className={inputCls} />
                  {formCompte.formState.errors.password && <p className="text-red-500 text-xs mt-1">{formCompte.formState.errors.password.message}</p>}
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-1.5">WhatsApp</label>
                  <input {...formCompte.register("whatsapp")} placeholder="+221 77 123 45 67" className={inputCls} />
                  {formCompte.formState.errors.whatsapp && <p className="text-red-500 text-xs mt-1">{formCompte.formState.errors.whatsapp.message}</p>}
                </div>

                <button type="submit" className="w-full bg-[#F5A623] text-white font-bold py-3.5 rounded-xl hover:bg-[#D4911A] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#F5A623]/30 hover:scale-[1.02] active:scale-95 mt-2">
                  <Bot size={16} /> Continuer avec l'IA <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* ÉTAPE 1 — Onboarding IA */}
            {etape === 1 && compte && (
              <EtapeIA compte={compte} onBack={() => setEtape(0)} />
            )}
          </div>

          <p className="text-center text-gray-400 text-sm mt-5">
            Déjà un compte ?{" "}
            <Link href="/connexion" className="text-[#F5A623] hover:underline font-semibold">Se connecter</Link>
          </p>
          <p className="text-center text-gray-400 text-xs mt-2">
            Vous êtes livreur ?{" "}
            <Link href="/inscription/livreur" className="text-gray-500 hover:text-[#F5A623] transition-colors underline underline-offset-2">
              Rejoindre la plateforme →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
