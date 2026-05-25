"use client";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { schemaConnexion } from "@/lib/validations";
import type { z } from "zod";
import { Eye, EyeOff, Loader2, ShieldCheck, Zap, Globe, Star } from "lucide-react";

type FormConnexion = z.infer<typeof schemaConnexion>;

const FEATURES = [
  { icon: Zap, text: "Lancez votre boutique en 3 minutes" },
  { icon: Globe, text: "Acceptez Orange Money & Wave" },
  { icon: ShieldCheck, text: "Gestion complète de votre activité" },
];

function ConnexionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const inscriptionReussie = searchParams.get("inscription") === "success";

  const [showPass, setShowPass] = useState(false);
  const [erreur, setErreur] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormConnexion>({
    resolver: zodResolver(schemaConnexion),
  });

  const onSubmit = async (data: FormConnexion) => {
    setErreur("");
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setErreur("Email ou mot de passe incorrect");
      return;
    }

    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    const role = session?.user?.role;

    if (role === "livreur") {
      router.push("/livreur");
    } else {
      router.push(callbackUrl);
    }
    router.refresh();
  };

  return (
    <div
      className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100"
      style={{ boxShadow: "0 32px 64px -12px rgba(201,168,76,0.15), 0 0 0 1px rgba(201,168,76,0.05)" }}
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Bon retour 👋</h2>
      <p className="text-gray-400 text-sm mb-6">Connectez-vous à votre espace marchand</p>

      {inscriptionReussie && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm text-center mb-4 flex items-center justify-center gap-2">
          <ShieldCheck size={15} /> Boutique créée avec succès ! Connectez-vous.
        </div>
      )}

      {erreur && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm text-center mb-4">
          {erreur}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-gray-600 text-sm font-medium mb-1.5">Email</label>
          <input
            type="email"
            {...register("email")}
            placeholder="aminata@example.com"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/10 focus:outline-none transition-all"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-gray-600 text-sm font-medium mb-1.5">Mot de passe</label>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              {...register("password")}
              placeholder="••••••••"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/10 focus:outline-none transition-all pr-10"
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <div className="flex justify-end">
          <Link href="/mot-de-passe-oublie" className="text-[#F5A623] text-xs hover:underline font-medium">
            Mot de passe oublié ?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#F5A623] text-white font-bold py-3.5 rounded-xl hover:bg-[#D4911A] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#F5A623]/30 hover:shadow-[#F5A623]/50 hover:scale-[1.02] active:scale-95"
        >
          {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Connexion...</> : "Se connecter →"}
        </button>
      </form>

      <div className="mt-5 p-3.5 bg-amber-50 rounded-xl border border-amber-100">
        <p className="text-amber-700 text-[11px] font-semibold uppercase tracking-wider mb-1.5">Comptes de démo</p>
        <p className="text-amber-600 text-xs font-mono">aminata@modeaminata.sn / axso2024</p>
        <p className="text-amber-600 text-xs font-mono">grace@beautegrace.ci / axso2024</p>
      </div>

      <p className="text-center text-gray-400 text-sm mt-5">
        Pas encore de boutique ?{" "}
        <Link href="/inscription" className="text-[#F5A623] hover:underline font-semibold">Créer gratuitement</Link>
      </p>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50/20 to-white flex overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#F5A623]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-amber-100/60 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: `linear-gradient(#F5A623 1px, transparent 1px), linear-gradient(90deg, #F5A623 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }} />
      </div>

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] px-16 py-12 relative">
        <Link href="/">
          <img src="/logo.png" alt="axso" style={{ height: "60px", width: "auto", objectFit: "contain" }} />
        </Link>

        <div className="max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F5A623]/10 border border-[#F5A623]/25 rounded-full text-[#F5A623] text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] animate-pulse" />
            +1 247 boutiques actives en Afrique
          </div>

          <h1 className="text-4xl font-bold font-playfair text-gray-900 leading-tight mb-4">
            Gérez votre boutique<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5A623] to-[#E09015]">comme un pro</span>
          </h1>

          <p className="text-gray-500 text-base leading-relaxed mb-8">
            La plateforme e-commerce pensée pour les entrepreneurs africains. Simple, puissante, et adaptée à vos besoins.
          </p>

          <div className="space-y-4 mb-10">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#F5A623]/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-[#F5A623]" />
                </div>
                <span className="text-gray-600 text-sm">{text}</span>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div
            className="bg-white rounded-2xl p-5 border border-gray-100"
            style={{ boxShadow: "0 20px 40px -8px rgba(0,0,0,0.08), 0 0 0 1px rgba(201,168,76,0.08)" }}
          >
            <div className="flex gap-0.5 mb-3">
              {[1,2,3,4,5].map(i => <Star key={i} size={13} className="fill-[#F5A623] text-[#F5A623]" />)}
            </div>
            <p className="text-gray-700 text-sm leading-relaxed mb-3">
              "Axso a transformé mon activité. Je gère ma boutique depuis mon téléphone et les paiements arrivent directement."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#F5A623] flex items-center justify-center text-white text-xs font-bold">A</div>
              <div>
                <p className="text-gray-800 text-xs font-semibold">Aminata Kouyaté</p>
                <p className="text-gray-400 text-xs">Mode Aminata, Dakar</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-gray-400 text-xs">© 2026 Axso · Made for Africa</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        {/* Mobile logo */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 lg:hidden">
          <Link href="/">
            <img src="/logo.png" alt="axso" style={{ height: "48px", width: "auto", objectFit: "contain" }} />
          </Link>
        </div>

        <div className="w-full max-w-md pt-16 lg:pt-0">
          <Suspense fallback={
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 text-center text-gray-400 text-sm">
              Chargement...
            </div>
          }>
            <ConnexionForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
