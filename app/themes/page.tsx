import { NavbarMarketing } from "@/components/marketing/NavbarMarketing";
import { FooterMarketing } from "@/components/marketing/FooterMarketing";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thèmes — AXSO",
  description: "Choisissez votre thème de boutique parmi notre collection de designs premium conçus pour l'Afrique.",
};

const THEMES = [
  {
    id: "noir-obsidien", nom: "Noir Obsidien", emoji: "✨",
    desc: "Élégance sombre, accents dorés. Le luxe à l'africaine.",
    accent: "#F5A623", bg: "#0a0a0a", surface: "#111",
    tags: ["Mode", "Luxe", "Bijoux"], popular: true,
  },
  {
    id: "kente-royal", nom: "Kente Royal", emoji: "👑",
    desc: "Inspiré des tissus Kente, couleurs riches et royales.",
    accent: "#D4AF37", bg: "#1a1000", surface: "#1f1500",
    tags: ["Artisanat", "Culture", "Mode"],
  },
  {
    id: "violet-cosmos", nom: "Violet Cosmos", emoji: "💜",
    desc: "Violet profond, ambiance cosmique et avant-gardiste.",
    accent: "#7c3aed", bg: "#0d0a1a", surface: "#120f22",
    tags: ["Tech", "Beauté", "Cosmétiques"],
  },
  {
    id: "terre-et-or", nom: "Terre & Or", emoji: "🌿",
    desc: "Tons chauds terreux, naturel et authentique.",
    accent: "#c2622d", bg: "#1a0f0a", surface: "#1f1510",
    tags: ["Food", "Bio", "Artisanat"],
  },
  {
    id: "ocean-atlantique", nom: "Océan Atlantique", emoji: "🌊",
    desc: "Bleu profond, fraîcheur et modernité coastale.",
    accent: "#0ea5e9", bg: "#050f1a", surface: "#08131f",
    tags: ["Sport", "Tech", "Électronique"],
  },
  {
    id: "bwiti-forest", nom: "Bwiti Forest", emoji: "🌱",
    desc: "Vert forêt, nature, bien-être et croissance.",
    accent: "#16a34a", bg: "#050f08", surface: "#07120a",
    tags: ["Bio", "Santé", "Agriculture"],
  },
];

export default function ThemesPage() {
  return (
    <main className="bg-[#080808] text-white min-h-screen" style={{ fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif" }}>
      <NavbarMarketing />

      <section className="pt-36 pb-24 px-6 sm:px-10 lg:px-16 xl:px-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(245,166,35,0.09) 0%, transparent 65%)" }} />
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] mb-5" style={{ color: "#F5A623" }}>
              🎨 Thèmes premium
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
              Votre boutique,<br />
              <span style={{ background: "linear-gradient(135deg,#F5A623,#d4880d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                votre identité
              </span>
            </h1>
            <p className="text-white/45 text-xl max-w-2xl mx-auto">
              {THEMES.length} thèmes conçus pour les marchés africains — tous inclus dans votre abonnement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {THEMES.map(theme => (
              <div key={theme.id}
                className="rounded-3xl overflow-hidden border group hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>

                {/* Aperçu simulé */}
                <div className="aspect-[4/3] relative overflow-hidden" style={{ background: theme.bg }}>
                  {/* Header fictif de boutique */}
                  <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between"
                    style={{ background: theme.surface, borderBottom: `1px solid ${theme.accent}25` }}>
                    <div className="flex items-center gap-2">
                      <span style={{ color: theme.accent }}>{theme.emoji}</span>
                      <span className="text-xs font-bold" style={{ color: theme.accent }}>Ma Boutique</span>
                    </div>
                    <div className="flex gap-1.5">
                      {["Accueil","Produits","Cart"].map(l => (
                        <span key={l} className="text-[10px] px-2 py-0.5 rounded"
                          style={{ background: `${theme.accent}12`, color: `${theme.accent}99` }}>{l}</span>
                      ))}
                    </div>
                  </div>
                  {/* Produits fictifs */}
                  <div className="absolute bottom-0 left-0 right-0 top-12 p-3 grid grid-cols-2 gap-2">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="rounded-xl overflow-hidden"
                        style={{ background: theme.surface, border: `1px solid ${theme.accent}15` }}>
                        <div className="aspect-square flex items-center justify-center text-2xl"
                          style={{ background: `${theme.accent}08` }}>🛍️</div>
                        <div className="p-2">
                          <div className="h-1.5 rounded mb-1" style={{ background: "rgba(255,255,255,0.1)", width: "70%" }} />
                          <div className="h-1.5 rounded" style={{ background: theme.accent, width: "45%", opacity: 0.6 }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Badge populaire */}
                  {theme.popular && (
                    <div className="absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full z-10"
                      style={{ background: `linear-gradient(135deg,#F5A623,#d4880d)`, color: "#080808" }}>
                      ⭐ Populaire
                    </div>
                  )}

                  {/* Overlay hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.6)" }}>
                    <Link href="/inscription"
                      className="font-bold px-5 py-2.5 rounded-xl text-sm transition-all hover:scale-105"
                      style={{ background: "linear-gradient(135deg,#F5A623,#d4880d)", color: "#080808" }}>
                      Choisir ce thème →
                    </Link>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-white">{theme.nom}</h3>
                    <span className="text-lg">{theme.emoji}</span>
                  </div>
                  <p className="text-white/45 text-sm mb-3">{theme.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {theme.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${theme.accent}10`, color: theme.accent, border: `1px solid ${theme.accent}20` }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <p className="text-white/40 text-sm mb-5">Tous les thèmes sont inclus dans tous les plans. Changez à tout moment.</p>
            <Link href="/inscription"
              className="inline-block font-bold px-10 py-4 rounded-2xl transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg,#F5A623,#d4880d)", color: "#080808", boxShadow: "0 8px 30px rgba(245,166,35,0.35)" }}>
              Créer ma boutique gratuitement →
            </Link>
          </div>
        </div>
      </section>

      <FooterMarketing />
    </main>
  );
}
