"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ArrowLeft, Check, Loader2, Store, Globe, Palette, Sparkles } from "lucide-react";
import { slugify } from "@/lib/utils";

const etapes = ["Votre compte", "Votre boutique", "Votre thème"];

const schemaCompte = z.object({
  name: z.string().min(2, "Minimum 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Minimum 6 caractères"),
});

const schemaBoutique = z.object({
  nomBoutique: z.string().min(2, "Minimum 2 caractères"),
  categorie: z.string().min(1, "Choisissez une catégorie"),
  pays: z.string().min(1, "Choisissez un pays"),
  whatsapp: z.string().min(8, "Numéro WhatsApp requis"),
});

const categories = [
  "Mode & Vêtements", "Beauté & Cosmétiques", "Alimentation & Épicerie",
  "Artisanat & Art", "Électronique", "Maison & Décoration",
  "Santé & Bien-être", "Sport & Loisirs", "Autre",
];

const pays = [
  { code: "SN", nom: "Sénégal", devise: "XOF", flag: "🇸🇳" },
  { code: "CM", nom: "Cameroun", devise: "XAF", flag: "🇨🇲" },
  { code: "CI", nom: "Côte d'Ivoire", devise: "XOF", flag: "🇨🇮" },
  { code: "GH", nom: "Ghana", devise: "GHS", flag: "🇬🇭" },
  { code: "NG", nom: "Nigeria", devise: "NGN", flag: "🇳🇬" },
  { code: "KE", nom: "Kenya", devise: "KES", flag: "🇰🇪" },
  { code: "MA", nom: "Maroc", devise: "MAD", flag: "🇲🇦" },
  { code: "TG", nom: "Togo", devise: "XOF", flag: "🇹🇬" },
  { code: "BJ", nom: "Bénin", devise: "XOF", flag: "🇧🇯" },
  { code: "ML", nom: "Mali", devise: "XOF", flag: "🇲🇱" },
];

const themes = [
  { id: "noir-obsidien", nom: "Noir Obsidien", desc: "Mode & Luxe", fond: "#0a0a0a", accent: "#F5A623", emoji: "✨", preview: "Sombre & élégant" },
  { id: "violet-cosmos", nom: "Violet Cosmos", desc: "Beauté & Cosmétiques", fond: "#1a0a2e", accent: "#7c3aed", emoji: "💜", preview: "Mystérieux & premium" },
  { id: "terre-et-or", nom: "Terre & Or", desc: "Artisanat & Terroir", fond: "#fff8f0", accent: "#c2622d", emoji: "🌿", preview: "Chaleureux & naturel" },
];

const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/10 focus:outline-none transition-all";

export default function InscriptionPage() {
  const router = useRouter();
  const [etape, setEtape] = useState(0);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");
  const [themeChoisi, setThemeChoisi] = useState("terre-et-or");
  const [donneesCompte, setDonneesCompte] = useState<z.infer<typeof schemaCompte> | null>(null);
  const [donneesBoutique, setDonneesBoutique] = useState<z.infer<typeof schemaBoutique> | null>(null);

  const formCompte = useForm<z.infer<typeof schemaCompte>>({ resolver: zodResolver(schemaCompte) });
  const formBoutique = useForm<z.infer<typeof schemaBoutique>>({ resolver: zodResolver(schemaBoutique) });

  const onSubmitCompte = (data: z.infer<typeof schemaCompte>) => { setDonneesCompte(data); setEtape(1); };
  const onSubmitBoutique = (data: z.infer<typeof schemaBoutique>) => { setDonneesBoutique(data); setEtape(2); };

  const finaliserInscription = async () => {
    if (!donneesCompte || !donneesBoutique) return;
    setLoading(true);
    setErreur("");
    try {
      const slug = slugify(donneesBoutique.nomBoutique);
      const paysCible = pays.find((p) => p.code === donneesBoutique.pays);
      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...donneesCompte, ...donneesBoutique, slug, themeId: themeChoisi, devise: paysCible?.devise || "XOF" }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Erreur lors de la création");
      }
      router.push("/connexion?inscription=success");
    } catch (err: any) {
      setErreur(err.message);
      setLoading(false);
    }
  };

  const stepIcons = [Store, Globe, Palette];

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
            <Sparkles size={11} /> Inscription gratuite
          </div>
          <h1 className="text-3xl font-bold font-playfair text-gray-900 leading-tight mb-4">
            Lancez votre boutique<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5A623] to-[#E09015]">en 3 minutes</span>
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Rejoignez plus de 1 247 marchands africains qui vendent en ligne avec Axso. Sans carte bancaire, sans engagement.
          </p>

          {/* Step visual */}
          <div className="space-y-3">
            {etapes.map((e, i) => {
              const Icon = stepIcons[i];
              return (
                <div key={i} className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all ${i === etape ? "bg-white border border-[#F5A623]/20 shadow-md" : i < etape ? "bg-[#F5A623]/5" : "opacity-40"}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${i <= etape ? "bg-[#F5A623] text-white" : "bg-gray-100 text-gray-400"}`}>
                    {i < etape ? <Check size={14} /> : <Icon size={14} />}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${i === etape ? "text-gray-900" : "text-gray-500"}`}>{e}</p>
                    {i === etape && <p className="text-xs text-[#F5A623]">En cours</p>}
                  </div>
                  {i === etape && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-[#F5A623] animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-gray-400 text-xs">© 2026 Axso · Made for Africa</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        {/* Mobile logo */}
        <div className="absolute top-8 left-6 lg:hidden">
          <Link href="/">
            <img src="/logo.png" alt="axso" style={{ height: "48px", width: "auto", objectFit: "contain" }} />
          </Link>
        </div>

        <div className="w-full max-w-md pt-16 lg:pt-0">
          {/* Mobile stepper */}
          <div className="flex items-center justify-center gap-2 mb-6 lg:hidden">
            {etapes.map((e, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i <= etape ? "bg-[#F5A623] text-white" : "bg-gray-100 text-gray-400"}`}>
                  {i < etape ? <Check size={12} /> : i + 1}
                </div>
                {i < etapes.length - 1 && <div className={`w-6 h-0.5 ${i < etape ? "bg-[#F5A623]" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          <div
            className="bg-white rounded-3xl p-8 border border-gray-100"
            style={{ boxShadow: "0 32px 64px -12px rgba(201,168,76,0.15), 0 0 0 1px rgba(201,168,76,0.05)" }}
          >
            {erreur && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm text-center mb-4">
                {erreur}
              </div>
            )}

            {/* ÉTAPE 1 */}
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

                <button type="submit" className="w-full bg-[#F5A623] text-white font-bold py-3.5 rounded-xl hover:bg-[#D4911A] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#F5A623]/30 hover:scale-[1.02] active:scale-95 mt-2">
                  Continuer <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* ÉTAPE 2 */}
            {etape === 1 && (
              <form onSubmit={formBoutique.handleSubmit(onSubmitBoutique)} className="space-y-4">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Votre boutique</h2>
                  <p className="text-gray-400 text-sm mt-0.5">Configurable à tout moment</p>
                </div>

                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-1.5">Nom de la boutique</label>
                  <input {...formBoutique.register("nomBoutique")} placeholder="Mode Aminata" className={inputCls} />
                  {formBoutique.formState.errors.nomBoutique && <p className="text-red-500 text-xs mt-1">{formBoutique.formState.errors.nomBoutique.message}</p>}
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-1.5">Catégorie</label>
                  <select {...formBoutique.register("categorie")} className={inputCls}>
                    <option value="">Sélectionnez une catégorie...</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {formBoutique.formState.errors.categorie && <p className="text-red-500 text-xs mt-1">{formBoutique.formState.errors.categorie.message}</p>}
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-1.5">Pays</label>
                  <select {...formBoutique.register("pays")} className={inputCls}>
                    <option value="">Sélectionnez votre pays...</option>
                    {pays.map((p) => <option key={p.code} value={p.code}>{p.flag} {p.nom}</option>)}
                  </select>
                  {formBoutique.formState.errors.pays && <p className="text-red-500 text-xs mt-1">{formBoutique.formState.errors.pays.message}</p>}
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-1.5">Numéro WhatsApp</label>
                  <input {...formBoutique.register("whatsapp")} placeholder="+221 77 123 45 67" className={inputCls} />
                  {formBoutique.formState.errors.whatsapp && <p className="text-red-500 text-xs mt-1">{formBoutique.formState.errors.whatsapp.message}</p>}
                </div>

                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setEtape(0)}
                    className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                    <ArrowLeft size={15} /> Retour
                  </button>
                  <button type="submit"
                    className="flex-1 bg-[#F5A623] text-white font-bold py-3 rounded-xl hover:bg-[#D4911A] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#F5A623]/25 hover:scale-[1.02] active:scale-95 text-sm">
                    Continuer <ArrowRight size={15} />
                  </button>
                </div>
              </form>
            )}

            {/* ÉTAPE 3 */}
            {etape === 2 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Choisissez votre thème</h2>
                  <p className="text-gray-400 text-sm mt-0.5">Modifiable à tout moment depuis le tableau de bord</p>
                </div>

                <div className="space-y-3">
                  {themes.map((t) => (
                    <button key={t.id} type="button" onClick={() => setThemeChoisi(t.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                        themeChoisi === t.id ? "border-[#F5A623] bg-amber-50/50 shadow-md shadow-[#F5A623]/10" : "border-gray-100 hover:border-gray-200 bg-gray-50/50"
                      }`}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-inner"
                        style={{ backgroundColor: t.fond, border: `2px solid ${t.accent}` }}>
                        {t.emoji}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-semibold text-sm">{t.nom}</p>
                        <p className="text-gray-400 text-xs">{t.desc}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: t.accent }}>{t.preview}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        themeChoisi === t.id ? "bg-[#F5A623] border-[#F5A623]" : "border-gray-300"
                      }`}>
                        {themeChoisi === t.id && <Check size={11} className="text-white" />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={() => setEtape(1)}
                    className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                    <ArrowLeft size={15} /> Retour
                  </button>
                  <button onClick={finaliserInscription} disabled={loading}
                    className="flex-1 bg-[#F5A623] text-white font-bold py-3 rounded-xl hover:bg-[#D4911A] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#F5A623]/25 hover:scale-[1.02] active:scale-95 text-sm">
                    {loading ? <><Loader2 size={15} className="animate-spin" /> Création...</> : <><Sparkles size={15} /> Créer ma boutique</>}
                  </button>
                </div>
              </div>
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
