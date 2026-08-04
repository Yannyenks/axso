import { NavbarMarketing } from "@/components/marketing/NavbarMarketing";
import { FooterMarketing } from "@/components/marketing/FooterMarketing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation — AXSO",
  description: "Documentation complète AXSO : démarrage, boutique, paiements, livraison, IA, API.",
};

const SECTIONS = [
  { emoji: "🚀", titre: "Démarrage rapide", articles: ["Créer votre boutique en 3 étapes", "Configurer les paiements Mobile Money", "Ajouter vos premiers produits", "Personnaliser votre thème"], accent: "#F5A623" },
  { emoji: "🛍️", titre: "Boutique & produits", articles: ["Catalogue multi-type", "Gestion des variantes", "Produits digitaux", "Import en masse CSV"], accent: "#7c3aed" },
  { emoji: "💳", titre: "Paiements", articles: ["Wave, Orange Money, MTN MoMo", "Stripe — cartes internationales", "CinetPay & CampPay", "Gestion des remboursements"], accent: "#25D366" },
  { emoji: "🚚", titre: "Livraison", articles: ["Zones et tarifs de livraison", "Intégration livreurs", "Suivi GPS temps réel", "Livraison digitale automatique"], accent: "#0ea5e9" },
  { emoji: "🤖", titre: "AXIA — Intelligence artificielle", articles: ["Présentation d'AXIA", "Chatbot client automatique", "Génération de descriptions", "Onboarding boutique IA"], accent: "#ef4444" },
  { emoji: "🔌", titre: "API & intégrations", articles: ["API REST v1 — authentification", "Webhooks — événements", "Connecteurs WhatsApp Business", "SDK JavaScript"], accent: "#F5A623" },
];

export default function DocsPage() {
  return (
    <main className="bg-[#080808] text-white min-h-screen" style={{ fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif" }}>
      <NavbarMarketing />

      <section className="pt-36 pb-24 px-6 sm:px-10 lg:px-16 xl:px-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(245,166,35,0.09) 0%, transparent 65%)" }} />
        <div className="max-w-5xl mx-auto">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] mb-5" style={{ color: "#F5A623" }}>
            📚 Documentation
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            Tout ce qu'il faut savoir<br />
            <span style={{ background: "linear-gradient(135deg,#F5A623,#d4880d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              pour maîtriser AXSO
            </span>
          </h1>
          <p className="text-white/45 text-xl mb-5 max-w-2xl">Guides pas à pas, références API, tutoriels vidéo.</p>

          {/* Search */}
          <div className="relative max-w-lg mb-16">
            <input type="search" placeholder="Chercher dans la doc..."
              className="w-full rounded-2xl px-5 py-4 text-sm outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
              onFocus={e => { e.currentTarget.style.borderColor = "rgba(245,166,35,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(245,166,35,0.08)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 text-sm">⌘K</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SECTIONS.map(s => (
              <div key={s.titre} className="rounded-2xl border p-6 hover:-translate-y-0.5 transition-all duration-300"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-2xl">{s.emoji}</span>
                  <h3 className="font-bold text-white">{s.titre}</h3>
                </div>
                <ul className="space-y-2">
                  {s.articles.map(a => (
                    <li key={a}>
                      <a href="#" className="text-sm text-white/45 hover:text-white transition-colors flex items-center gap-2 group">
                        <span className="w-1 h-1 rounded-full flex-shrink-0 transition-colors" style={{ background: "rgba(255,255,255,0.2)" }} />
                        {a}
                      </a>
                    </li>
                  ))}
                </ul>
                <a href="#" className="inline-flex items-center gap-1.5 mt-5 text-xs font-bold transition-opacity hover:opacity-70"
                  style={{ color: s.accent }}>
                  Voir tout <span>→</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FooterMarketing />
    </main>
  );
}
