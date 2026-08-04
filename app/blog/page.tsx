import { NavbarMarketing } from "@/components/marketing/NavbarMarketing";
import { FooterMarketing } from "@/components/marketing/FooterMarketing";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — AXSO",
  description: "Conseils, stratégies et actualités pour les entrepreneurs e-commerce africains.",
};

const ARTICLES = [
  {
    tag: "Stratégie", tagColor: "#F5A623",
    titre: "Comment lancer une boutique rentable en Afrique en 2026",
    extrait: "Les 7 étapes concrètes pour passer de l'idée à la première vente — sans code, sans serveur, sans budget pharaonique.",
    date: "15 juil. 2026", lecture: "8 min",
    image: "📦", featured: true,
  },
  {
    tag: "Mobile Money", tagColor: "#25D366",
    titre: "Wave, Orange Money, MTN MoMo : lequel choisir pour votre boutique ?",
    extrait: "Comparatif complet des frais, délais de virement et taux d'adoption par pays.",
    date: "10 juil. 2026", lecture: "6 min",
    image: "💳", featured: false,
  },
  {
    tag: "IA", tagColor: "#7c3aed",
    titre: "AXIA IA : comment l'intelligence artificielle booste vos ventes",
    extrait: "Descriptions auto-générées, réponses clients, suggestions de prix — voici comment l'IA travaille pour vous 24h/24.",
    date: "5 juil. 2026", lecture: "5 min",
    image: "🤖", featured: false,
  },
  {
    tag: "Livraison", tagColor: "#0ea5e9",
    titre: "Livraison en Afrique subsaharienne : les vrais défis et comment les dépasser",
    extrait: "Partenaires logistiques, tracking GPS, gestion des retours — le guide complet pour satisfaire vos clients.",
    date: "28 juin 2026", lecture: "10 min",
    image: "🚚", featured: false,
  },
  {
    tag: "Marketing", tagColor: "#ef4444",
    titre: "Dropshipping en Afrique : fournisseurs, marges et pièges à éviter",
    extrait: "Le dropshipping fonctionne-t-il vraiment en Afrique ? Nos retours d'expérience sur 6 mois de tests.",
    date: "20 juin 2026", lecture: "12 min",
    image: "🌍", featured: false,
  },
  {
    tag: "Tutoriel", tagColor: "#F5A623",
    titre: "Configurer WhatsApp Business avec AXSO en 10 minutes",
    extrait: "Guide pas à pas pour connecter votre numéro WhatsApp et automatiser vos réponses clients.",
    date: "12 juin 2026", lecture: "7 min",
    image: "📱", featured: false,
  },
];

export default function BlogPage() {
  const [featured, ...rest] = ARTICLES;
  return (
    <main className="bg-[#080808] text-white min-h-screen" style={{ fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif" }}>
      <NavbarMarketing />

      <section className="pt-36 pb-16 px-6 sm:px-10 lg:px-16 xl:px-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(245,166,35,0.09) 0%, transparent 65%)" }} />
        <div className="max-w-5xl mx-auto">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] mb-5" style={{ color: "#F5A623" }}>
            📝 Blog AXSO
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            Ressources pour<br />
            <span style={{ background: "linear-gradient(135deg,#F5A623,#d4880d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              les bâtisseurs d'empire
            </span>
          </h1>
          <p className="text-white/45 text-xl mb-16 max-w-2xl">Stratégie, mobile money, IA, livraison — tout ce qu'il faut pour vendre en ligne en Afrique.</p>

          {/* Article featured */}
          <div className="rounded-3xl border p-8 mb-10 relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
            style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.06) 0%, rgba(245,166,35,0.02) 100%)", borderColor: "rgba(245,166,35,0.25)" }}>
            <div className="absolute top-0 right-0 text-[120px] opacity-10 select-none leading-none pr-4 pt-2">{featured.image}</div>
            <span className="text-xs font-bold px-3 py-1 rounded-full inline-block mb-5"
              style={{ background: `${featured.tagColor}15`, color: featured.tagColor, border: `1px solid ${featured.tagColor}30` }}>
              ⭐ À la une · {featured.tag}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 max-w-2xl leading-snug">{featured.titre}</h2>
            <p className="text-white/50 leading-relaxed mb-5 max-w-xl">{featured.extrait}</p>
            <div className="flex items-center gap-4 text-sm text-white/35">
              <span>{featured.date}</span>
              <span>·</span>
              <span>{featured.lecture} de lecture</span>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map(a => (
              <div key={a.titre}
                className="rounded-2xl border p-6 cursor-pointer hover:-translate-y-0.5 transition-all duration-300 group"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="text-3xl mb-4">{a.image}</div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full inline-block mb-3"
                  style={{ background: `${a.tagColor}12`, color: a.tagColor, border: `1px solid ${a.tagColor}25` }}>
                  {a.tag}
                </span>
                <h3 className="font-bold text-white mb-2 leading-snug group-hover:text-[#F5A623] transition-colors">{a.titre}</h3>
                <p className="text-white/40 text-sm leading-relaxed mb-4">{a.extrait}</p>
                <div className="flex items-center gap-3 text-xs text-white/30">
                  <span>{a.date}</span><span>·</span><span>{a.lecture}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FooterMarketing />
    </main>
  );
}
