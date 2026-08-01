import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fonctionnalités — Axso, la boutique en ligne africaine complète",
  description: "Catalogue multi-type, paiements mobile money, AXIA IA, livraison, affiliation, dropshipping, analytics — tout pour vendre en Afrique.",
};

const FEATURES = [
  {
    emoji: "🛍️",
    titre: "Catalogue multi-type",
    sous: "Produits physiques, digitaux et dropshipping",
    items: [
      "Produits physiques avec variantes (taille, couleur, matière)",
      "Produits digitaux (ebooks, formations, logiciels) avec accès immédiat",
      "Dropshipping : connecte tes fournisseurs AliExpress, CJ, Jumia ou locaux",
      "Stock en temps réel, alertes de réapprovisionnement",
      "Galerie photos + vidéos, descriptions IA",
    ],
    color: "#F5A623",
  },
  {
    emoji: "💸",
    titre: "Paiements Africa-first",
    sous: "Mobile money, cartes, virement",
    items: [
      "MTN Mobile Money, Orange Money, Wave, M-Pesa",
      "Campay (Cameroun), CinetPay (UEMOA/CEMAC), Flutterwave (pan-Afrique)",
      "Stripe pour les paiements carte internationale",
      "Codes promo et réductions",
      "Wallet marchand avec retrait mobile money automatique",
    ],
    color: "#10b981",
  },
  {
    emoji: "🤖",
    titre: "AXIA — IA intégrée",
    sous: "Agent IA sur ta boutique et côté acheteur",
    items: [
      "AXIA marchande : gère commandes, stock, clients via conversation",
      "AXIA acheteur : assistant intégré sur ta vitrine pour aider tes clients",
      "11 agents spécialisés (produits, marketing, analytics, livraison...)",
      "Génération de descriptions, images, posts sociaux par IA",
      "Analyse des avis, recommandations, alertes automatiques",
    ],
    color: "#7c3aed",
  },
  {
    emoji: "🚚",
    titre: "Logistique avancée",
    sous: "Livraison, tracking, retours",
    items: [
      "Moteur de frais de port : zones, poids, montant minimum",
      "Intégration livreurs internes + transporteurs (Campost, DHL, MTN Delivery)",
      "Suivi de livraison en temps réel pour les acheteurs",
      "RMA complet : remboursement, échange, avoir",
      "Stock réservé automatiquement lors du panier",
    ],
    color: "#3b82f6",
  },
  {
    emoji: "📣",
    titre: "Marketing & Croissance",
    sous: "Affiliation, automation, publicité",
    items: [
      "Programme d'affiliation avec commissions configurables",
      "Automation : panier abandonné, séquence bienvenue, relance inactifs",
      "Pixels Facebook, TikTok, Google Ads intégrés",
      "Campagnes email et SMS vers tes segments clients",
      "Popups et bandeaux comportementaux sur ta boutique",
    ],
    color: "#ef4444",
  },
  {
    emoji: "👤",
    titre: "Expérience acheteur",
    sous: "Compte client, avis, portail",
    items: [
      "Portail acheteur : compte, historique commandes, téléchargements",
      "Avis structurés vérifiés avec modération",
      "Suivi de commande public par numéro ou lien",
      "Téléchargement sécurisé des produits digitaux",
      "Widget Snap embeddable sur n'importe quel site",
    ],
    color: "#0ea5e9",
  },
  {
    emoji: "📊",
    titre: "Analytics & Veille",
    sous: "Données, performances, concurrents",
    items: [
      "Dashboard analytics : CA, commandes, clients, produits top",
      "Revenus en temps réel avec objectifs",
      "Veille concurrentielle avec alertes de prix",
      "Rapports de performance par produit, période, source",
      "Gamification marchande : badges, trophées, jalons",
    ],
    color: "#f59e0b",
  },
  {
    emoji: "🌐",
    titre: "Multi-canal & Connecteurs",
    sous: "WhatsApp, Instagram, réseaux sociaux",
    items: [
      "Messagerie centralisée WhatsApp + Instagram DM",
      "Scheduler de publications réseaux sociaux",
      "Studio vidéo IA pour créer des publicités",
      "Connecteurs Meta, Google, TikTok Ads",
      "API ouverte pour connecter tes propres outils",
    ],
    color: "#8b5cf6",
  },
];

const PLANS = [
  {
    nom: "Essentiel",
    prix: "1 200",
    devise: "XAF/mois",
    description: "Pour démarrer et tester",
    features: ["1 boutique", "50 produits", "Paiements mobile money", "AXIA basique"],
    cta: "Commencer gratuitement",
    highlight: false,
  },
  {
    nom: "Pro",
    prix: "5 000",
    devise: "XAF/mois",
    description: "Pour les marchands actifs",
    features: ["Boutique illimitée", "500 produits", "Dropshipping", "AXIA complet + agents", "Affiliation", "Analytics avancés"],
    cta: "Choisir Pro",
    highlight: true,
  },
  {
    nom: "Illimité",
    prix: "20 000",
    devise: "XAF/mois",
    description: "Pour les équipes et agences",
    features: ["Tout du Pro", "Produits illimités", "Multi-utilisateurs", "Support prioritaire", "API complète", "Onboarding dédié"],
    cta: "Contacter l'équipe",
    highlight: false,
  },
];

export default function FonctionnalitesPage() {
  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", color: "#111", background: "#FAFAFA", minHeight: "100vh" }}>
      {/* Nav */}
      <nav style={{ background: "white", borderBottom: "1px solid #F0F0F0", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ fontWeight: 800, fontSize: 20, color: "#111", textDecoration: "none" }}>
            ax<span style={{ color: "#F5A623" }}>so</span>
          </Link>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link href="/connexion" style={{ fontSize: 13, color: "#666", textDecoration: "none", padding: "8px 16px" }}>Connexion</Link>
            <Link href="/inscription" style={{ fontSize: 13, fontWeight: 600, color: "white", background: "#F5A623", padding: "8px 20px", borderRadius: 10, textDecoration: "none" }}>
              Créer ma boutique
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px 60px" }}>
        <div style={{ textAlign: "center", maxWidth: 700, margin: "0 auto" }}>
          <p style={{ display: "inline-block", background: "#FFF8EC", color: "#F5A623", fontWeight: 700, fontSize: 12, padding: "4px 12px", borderRadius: 99, marginBottom: 16, letterSpacing: 1 }}>
            FONCTIONNALITÉS COMPLÈTES
          </p>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
            Tout ce qu'il faut pour vendre<br />
            <span style={{ color: "#F5A623" }}>en Afrique</span>
          </h1>
          <p style={{ fontSize: 17, color: "#666", lineHeight: 1.6 }}>
            Axso combine boutique en ligne, paiements mobile money, IA marchande et outils marketing en une seule plateforme. Plus de 8 modules intégrés pour couvrir tout le cycle de vente.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
            <Link href="/inscription" style={{ fontSize: 15, fontWeight: 700, color: "white", background: "#F5A623", padding: "14px 28px", borderRadius: 12, textDecoration: "none" }}>
              Créer ma boutique gratuitement
            </Link>
            <Link href="/connexion" style={{ fontSize: 15, fontWeight: 600, color: "#111", background: "white", padding: "14px 28px", borderRadius: 12, textDecoration: "none", border: "1px solid #E5E5E5" }}>
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
          {FEATURES.map((f) => (
            <div key={f.titre} style={{ background: "white", border: "1px solid #F0F0F0", borderRadius: 20, padding: 28, boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                  {f.emoji}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>{f.titre}</p>
                  <p style={{ fontSize: 12, color: "#888" }}>{f.sous}</p>
                </div>
              </div>
              <ul style={{ margin: 0, padding: "0 0 0 16px", listStyle: "none" }}>
                {f.items.map((item) => (
                  <li key={item} style={{ fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 6, paddingLeft: 4, position: "relative" }}>
                    <span style={{ position: "absolute", left: -14, color: f.color, fontWeight: 700 }}>·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* AXIA spotlight */}
      <section style={{ background: "#111", padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <p style={{ display: "inline-block", background: "#7c3aed20", color: "#a78bfa", fontWeight: 700, fontSize: 12, padding: "4px 12px", borderRadius: 99, marginBottom: 16, letterSpacing: 1 }}>
            POWERED BY AI
          </p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, color: "white", marginBottom: 16, lineHeight: 1.2 }}>
            AXIA, ton agent IA e-commerce
          </h2>
          <p style={{ fontSize: 16, color: "#AAA", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 40px" }}>
            AXIA n'est pas un simple chatbot. C'est un vrai agent qui exécute des actions dans ta boutique : crée des produits, analyse tes ventes, répond à tes clients, génère du contenu et coordonne 11 agents spécialisés.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {[
              { emoji: "📦", titre: "Agent Produits", desc: "Crée, optimise, audite ton catalogue" },
              { emoji: "🎯", titre: "Agent Marketing", desc: "Campagnes, relances, séquences auto" },
              { emoji: "📊", titre: "Agent Analytics", desc: "KPIs, rapports, recommandations" },
              { emoji: "👥", titre: "Agent Clients", desc: "Segmentation, VIP, historique" },
              { emoji: "🚚", titre: "Agent Livraison", desc: "Suivi, assignation, alertes" },
              { emoji: "💰", titre: "Agent Revenus", desc: "Objectifs, wallet, commissions" },
              { emoji: "🎨", titre: "Agent Contenu", desc: "Vidéos IA, images, posts social" },
              { emoji: "📋", titre: "Agent Commandes", desc: "Traitement, RMA, facturation" },
              { emoji: "🌍", titre: "Agent Sourcing", desc: "Fournisseurs, marges, dropshipping" },
              { emoji: "🏪", titre: "Agent Boutique", desc: "Thème, SEO, configuration" },
              { emoji: "💳", titre: "Agent Wallet", desc: "Paiements, retraits, commissions" },
            ].map((a) => (
              <div key={a.titre} style={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 14, padding: 20, textAlign: "left" }}>
                <p style={{ fontSize: 22, marginBottom: 8 }}>{a.emoji}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 4 }}>{a.titre}</p>
                <p style={{ fontSize: 11, color: "#888" }}>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, marginBottom: 12 }}>Tarifs simples</h2>
          <p style={{ fontSize: 15, color: "#666" }}>Commence gratuitement. Évolue quand tu veux.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {PLANS.map((p) => (
            <div key={p.nom} style={{
              background: p.highlight ? "#111" : "white",
              border: p.highlight ? "none" : "1px solid #F0F0F0",
              borderRadius: 20,
              padding: 32,
              position: "relative",
              boxShadow: p.highlight ? "0 20px 60px rgba(0,0,0,.15)" : "0 1px 3px rgba(0,0,0,.04)",
            }}>
              {p.highlight && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#F5A623", color: "white", fontSize: 11, fontWeight: 700, padding: "3px 14px", borderRadius: 99, letterSpacing: 0.5 }}>
                  POPULAIRE
                </div>
              )}
              <p style={{ fontSize: 16, fontWeight: 700, color: p.highlight ? "white" : "#111", marginBottom: 4 }}>{p.nom}</p>
              <p style={{ fontSize: 11, color: p.highlight ? "#999" : "#888", marginBottom: 20 }}>{p.description}</p>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: p.highlight ? "white" : "#111" }}>{p.prix}</span>
                <span style={{ fontSize: 13, color: p.highlight ? "#888" : "#999" }}> {p.devise}</span>
              </div>
              <ul style={{ margin: "0 0 28px", padding: 0, listStyle: "none" }}>
                {p.features.map((f) => (
                  <li key={f} style={{ fontSize: 13, color: p.highlight ? "#CCC" : "#555", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#F5A623", fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/inscription" style={{
                display: "block", textAlign: "center", padding: "12px 0", borderRadius: 12,
                background: p.highlight ? "#F5A623" : "transparent",
                border: p.highlight ? "none" : "1px solid #E5E5E5",
                color: p.highlight ? "white" : "#111",
                fontWeight: 700, fontSize: 14, textDecoration: "none",
              }}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section style={{ background: "#F5A623", padding: "64px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 900, color: "white", marginBottom: 12 }}>
          Prêt à ouvrir ta boutique ?
        </h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,.8)", marginBottom: 32 }}>
          Crée ta boutique en 2 minutes. Aucune carte bancaire requise.
        </p>
        <Link href="/inscription" style={{ display: "inline-block", background: "white", color: "#F5A623", fontWeight: 800, fontSize: 16, padding: "16px 40px", borderRadius: 14, textDecoration: "none" }}>
          Créer ma boutique gratuitement
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ background: "#111", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: "white", marginBottom: 8 }}>
            ax<span style={{ color: "#F5A623" }}>so</span>
          </p>
          <p style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>La boutique en ligne africaine complète.</p>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
            {[["Fonctionnalités", "/fonctionnalites"], ["Inscription", "/inscription"], ["Connexion", "/connexion"]].map(([label, href]) => (
              <Link key={href} href={href} style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>{label}</Link>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "#444", marginTop: 24 }}>© {new Date().getFullYear()} Axso — Tous droits réservés</p>
        </div>
      </footer>
    </div>
  );
}
