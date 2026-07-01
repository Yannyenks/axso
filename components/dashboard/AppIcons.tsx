/**
 * App icons — style macOS/iOS squircle
 * Chaque icône = fond gradient + glyphe SVG blanc précis
 */

interface IconProps {
  size?: number;
  className?: string;
}

// ─── Squircle helper (clip-path interne) ─────────────────────────────────────
// On utilise rx/ry élevés sur rect pour simuler le squircle Apple

function makeId() {
  return Math.random().toString(36).slice(2);
}

// ─── AXIA ─────────────────────────────────────────────────────────────────────
export function IconAxia({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="gAxia" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a855f7"/>
          <stop offset="100%" stopColor="#6d28d9"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#gAxia)"/>
      {/* Réseau neural / étoile */}
      <circle cx="16" cy="16" r="3.2" fill="white" opacity="0.95"/>
      <circle cx="16" cy="8.5" r="1.6" fill="white" opacity="0.7"/>
      <circle cx="22.5" cy="12" r="1.6" fill="white" opacity="0.7"/>
      <circle cx="22.5" cy="20" r="1.6" fill="white" opacity="0.7"/>
      <circle cx="16" cy="23.5" r="1.6" fill="white" opacity="0.7"/>
      <circle cx="9.5" cy="20" r="1.6" fill="white" opacity="0.7"/>
      <circle cx="9.5" cy="12" r="1.6" fill="white" opacity="0.7"/>
      <line x1="16" y1="12.8" x2="16" y2="8.5" stroke="white" strokeWidth="1.2" opacity="0.5"/>
      <line x1="18.8" y1="14.4" x2="22.5" y2="12" stroke="white" strokeWidth="1.2" opacity="0.5"/>
      <line x1="18.8" y1="17.6" x2="22.5" y2="20" stroke="white" strokeWidth="1.2" opacity="0.5"/>
      <line x1="16" y1="19.2" x2="16" y2="23.5" stroke="white" strokeWidth="1.2" opacity="0.5"/>
      <line x1="13.2" y1="17.6" x2="9.5" y2="20" stroke="white" strokeWidth="1.2" opacity="0.5"/>
      <line x1="13.2" y1="14.4" x2="9.5" y2="12" stroke="white" strokeWidth="1.2" opacity="0.5"/>
      {/* Shimmer top */}
      <rect width="32" height="14" rx="8" fill="white" opacity="0.06"/>
    </svg>
  );
}

// ─── Accueil / Dashboard ──────────────────────────────────────────────────────
export function IconAccueil({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="gHome" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3b82f6"/>
          <stop offset="100%" stopColor="#1d4ed8"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#gHome)"/>
      {/* Grille 2x2 */}
      <rect x="7" y="7" width="7.5" height="7.5" rx="2" fill="white" opacity="0.9"/>
      <rect x="17.5" y="7" width="7.5" height="7.5" rx="2" fill="white" opacity="0.6"/>
      <rect x="7" y="17.5" width="7.5" height="7.5" rx="2" fill="white" opacity="0.6"/>
      <rect x="17.5" y="17.5" width="7.5" height="7.5" rx="2" fill="white" opacity="0.9"/>
      <rect width="32" height="14" rx="8" fill="white" opacity="0.06"/>
    </svg>
  );
}

// ─── Boutique ─────────────────────────────────────────────────────────────────
export function IconBoutique({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="gBout" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f97316"/>
          <stop offset="100%" stopColor="#c2410c"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#gBout)"/>
      {/* Storefront */}
      <rect x="6" y="14" width="20" height="12" rx="2" fill="white" opacity="0.85"/>
      <path d="M6 14 L8 8 H24 L26 14 Z" fill="white" opacity="0.5"/>
      <rect x="13" y="18" width="6" height="8" rx="1.5" fill="#f97316" opacity="0.9"/>
      <rect x="8" y="18" width="4" height="4" rx="1" fill="#f97316" opacity="0.6"/>
      <rect x="20" y="18" width="4" height="4" rx="1" fill="#f97316" opacity="0.6"/>
      <rect width="32" height="14" rx="8" fill="white" opacity="0.07"/>
    </svg>
  );
}

// ─── Constructeur / Builder ───────────────────────────────────────────────────
export function IconBuilder({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="gBuild" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818cf8"/>
          <stop offset="100%" stopColor="#4338ca"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#gBuild)"/>
      {/* Baguette magique */}
      <line x1="9" y1="23" x2="21" y2="11" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="19.5" y="8" width="5.5" height="5.5" rx="1.5" fill="white" opacity="0.9" transform="rotate(45 22.25 10.75)"/>
      {/* Étoiles */}
      <circle cx="8" cy="10" r="1.2" fill="white" opacity="0.8"/>
      <circle cx="12" cy="7" r="0.9" fill="white" opacity="0.6"/>
      <circle cx="24" cy="23" r="1.2" fill="white" opacity="0.7"/>
      <circle cx="26" cy="18" r="0.8" fill="white" opacity="0.5"/>
      <rect width="32" height="14" rx="8" fill="white" opacity="0.06"/>
    </svg>
  );
}

// ─── Produits ─────────────────────────────────────────────────────────────────
export function IconProduits({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="gProd" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14b8a6"/>
          <stop offset="100%" stopColor="#0f766e"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#gProd)"/>
      {/* Boîte 3D */}
      <path d="M16 7 L25 12 L25 22 L16 27 L7 22 L7 12 Z" fill="white" opacity="0.15"/>
      <path d="M16 7 L25 12 L16 17 L7 12 Z" fill="white" opacity="0.85"/>
      <path d="M16 17 L25 12 L25 22 L16 27 Z" fill="white" opacity="0.55"/>
      <path d="M16 17 L7 12 L7 22 L16 27 Z" fill="white" opacity="0.4"/>
      <line x1="16" y1="17" x2="16" y2="27" stroke="white" strokeWidth="0.5" opacity="0.3"/>
      <rect width="32" height="14" rx="8" fill="white" opacity="0.06"/>
    </svg>
  );
}

// ─── Sourcing / Globe ─────────────────────────────────────────────────────────
export function IconSourcing({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="gSrc" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee"/>
          <stop offset="100%" stopColor="#0369a1"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#gSrc)"/>
      {/* Globe */}
      <circle cx="16" cy="16" r="8.5" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.1"/>
      <ellipse cx="16" cy="16" rx="4.5" ry="8.5" stroke="white" strokeWidth="1" fill="none" opacity="0.6"/>
      <line x1="7.5" y1="16" x2="24.5" y2="16" stroke="white" strokeWidth="1" opacity="0.6"/>
      <line x1="9" y1="11.5" x2="23" y2="11.5" stroke="white" strokeWidth="0.8" opacity="0.4"/>
      <line x1="9" y1="20.5" x2="23" y2="20.5" stroke="white" strokeWidth="0.8" opacity="0.4"/>
      <rect width="32" height="14" rx="8" fill="white" opacity="0.06"/>
    </svg>
  );
}

// ─── Commandes ───────────────────────────────────────────────────────────────
export function IconCommandes({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="gCmd" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399"/>
          <stop offset="100%" stopColor="#047857"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#gCmd)"/>
      {/* Sac shopping */}
      <path d="M10 13 H22 L20.5 24 H11.5 Z" fill="white" opacity="0.85"/>
      <path d="M12 13 C12 10 14 8 16 8 C18 8 20 10 20 13" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.9"/>
      <line x1="13.5" y1="17" x2="18.5" y2="17" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round"/>
      <rect width="32" height="14" rx="8" fill="white" opacity="0.07"/>
    </svg>
  );
}

// ─── Clients ─────────────────────────────────────────────────────────────────
export function IconClients({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="gCli" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f472b6"/>
          <stop offset="100%" stopColor="#be185d"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#gCli)"/>
      {/* 2 personnes */}
      <circle cx="12" cy="12" r="3.5" fill="white" opacity="0.9"/>
      <path d="M5 26 C5 21 8.5 18 12 18 C15.5 18 19 21 19 26" fill="white" opacity="0.7"/>
      <circle cx="21" cy="12" r="3" fill="white" opacity="0.6"/>
      <path d="M18 26 C18.5 22 21 19.5 24 19 C26 18.8 28 20 28 23 L28 26" fill="white" opacity="0.45"/>
      <rect width="32" height="14" rx="8" fill="white" opacity="0.06"/>
    </svg>
  );
}

// ─── Wallet ───────────────────────────────────────────────────────────────────
export function IconWallet({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="gWlt" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24"/>
          <stop offset="100%" stopColor="#d97706"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#gWlt)"/>
      {/* Carte + pièce */}
      <rect x="6" y="11" width="20" height="14" rx="3" fill="white" opacity="0.85"/>
      <rect x="6" y="15" width="20" height="3" fill="#fbbf24" opacity="0.5"/>
      <circle cx="23" cy="19" r="3.5" fill="#fbbf24" stroke="white" strokeWidth="1.5"/>
      <rect width="32" height="14" rx="8" fill="white" opacity="0.07"/>
    </svg>
  );
}

// ─── Revenus / Trending ───────────────────────────────────────────────────────
export function IconRevenus({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="gRev" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981"/>
          <stop offset="100%" stopColor="#065f46"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#gRev)"/>
      {/* Courbe montante */}
      <path d="M6 22 C9 22 10 15 13 13 C16 11 18 17 21 14 C23 12 25 9 26 8" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.9"/>
      <polyline points="22,8 26,8 26,12" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
      <rect width="32" height="14" rx="8" fill="white" opacity="0.06"/>
    </svg>
  );
}

// ─── Marketing ───────────────────────────────────────────────────────────────
export function IconMarketing({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="gMkt" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f87171"/>
          <stop offset="100%" stopColor="#dc2626"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#gMkt)"/>
      {/* Mégaphone */}
      <path d="M8 13 H12 L22 8 L22 24 L12 19 H8 V13 Z" fill="white" opacity="0.9"/>
      <rect x="8" y="19" width="4" height="5" rx="1" fill="white" opacity="0.5"/>
      {/* Ondes */}
      <path d="M24 12 C25.5 13.5 25.5 18.5 24 20" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7"/>
      <path d="M25.5 10 C28 12.5 28 19.5 25.5 22" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4"/>
      <rect width="32" height="14" rx="8" fill="white" opacity="0.07"/>
    </svg>
  );
}

// ─── Messages / Chat ──────────────────────────────────────────────────────────
export function IconMessages({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="gMsg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa"/>
          <stop offset="100%" stopColor="#2563eb"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#gMsg)"/>
      {/* Bulle principale */}
      <path d="M6 10 H22 C23.1 10 24 10.9 24 12 V20 C24 21.1 23.1 22 22 22 H13 L8 26 V22 H6 C4.9 22 4 21.1 4 20 V12 C4 10.9 4.9 10 6 10 Z" fill="white" opacity="0.85"/>
      {/* Lignes de texte */}
      <line x1="9" y1="15" x2="19" y2="15" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="9" y1="18.5" x2="15" y2="18.5" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Bulle secondaire */}
      <path d="M20 6 H27 C27.6 6 28 6.4 28 7 V13 C28 13.6 27.6 14 27 14 H25 L23 16 V14 H20 C19.4 14 19 13.6 19 13 V7 C19 6.4 19.4 6 20 6 Z" fill="white" opacity="0.5"/>
      <rect width="32" height="14" rx="8" fill="white" opacity="0.06"/>
    </svg>
  );
}

// ─── Contenus / Studio ───────────────────────────────────────────────────────
export function IconContenus({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="gCnt" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c084fc"/>
          <stop offset="100%" stopColor="#7e22ce"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#gCnt)"/>
      {/* Clap board */}
      <rect x="6" y="12" width="20" height="14" rx="2.5" fill="white" opacity="0.85"/>
      <rect x="6" y="8" width="20" height="5.5" rx="2" fill="white" opacity="0.5"/>
      {/* Rayures clap */}
      <line x1="10" y1="8" x2="8" y2="13.5" stroke="#c084fc" strokeWidth="2" strokeLinecap="round"/>
      <line x1="14" y1="8" x2="12" y2="13.5" stroke="#c084fc" strokeWidth="2" strokeLinecap="round"/>
      <line x1="18" y1="8" x2="16" y2="13.5" stroke="#c084fc" strokeWidth="2" strokeLinecap="round"/>
      <line x1="22" y1="8" x2="20" y2="13.5" stroke="#c084fc" strokeWidth="2" strokeLinecap="round"/>
      {/* Play button */}
      <path d="M14 17 L20 20.5 L14 24 Z" fill="#7e22ce" opacity="0.7"/>
      <rect width="32" height="14" rx="8" fill="white" opacity="0.06"/>
    </svg>
  );
}

// ─── Navigateur / Browser ────────────────────────────────────────────────────
export function IconNavigateur({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="gNav" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8"/>
          <stop offset="100%" stopColor="#075985"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#gNav)"/>
      {/* Fenêtre browser */}
      <rect x="5" y="8" width="22" height="17" rx="3" fill="white" opacity="0.85"/>
      <rect x="5" y="8" width="22" height="5.5" rx="3" fill="white" opacity="0.5"/>
      {/* Boutons toolbar */}
      <circle cx="9" cy="10.75" r="1.2" fill="#38bdf8" opacity="0.8"/>
      <circle cx="13" cy="10.75" r="1.2" fill="#38bdf8" opacity="0.5"/>
      <circle cx="17" cy="10.75" r="1.2" fill="#38bdf8" opacity="0.3"/>
      {/* URL bar */}
      <rect x="19.5" y="9.5" width="5.5" height="2.5" rx="1.2" fill="#38bdf8" opacity="0.35"/>
      {/* Page content lines */}
      <rect x="8" y="17" width="16" height="1.5" rx="0.75" fill="#38bdf8" opacity="0.3"/>
      <rect x="8" y="20" width="11" height="1.5" rx="0.75" fill="#38bdf8" opacity="0.2"/>
      <rect width="32" height="14" rx="8" fill="white" opacity="0.07"/>
    </svg>
  );
}

// ─── Livraisons / Truck ───────────────────────────────────────────────────────
export function IconLivraisons({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="gLiv" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb923c"/>
          <stop offset="100%" stopColor="#c2410c"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#gLiv)"/>
      {/* Camion */}
      <rect x="4" y="14" width="16" height="9" rx="2" fill="white" opacity="0.85"/>
      <path d="M20 17 H26 L28 21 L28 23 H20 V17 Z" fill="white" opacity="0.7"/>
      <rect x="21" y="17.5" width="4" height="4" rx="0.5" fill="#fb923c" opacity="0.5"/>
      {/* Roues */}
      <circle cx="9" cy="24.5" r="2.5" fill="white" opacity="0.9"/>
      <circle cx="9" cy="24.5" r="1" fill="#fb923c"/>
      <circle cx="23" cy="24.5" r="2.5" fill="white" opacity="0.9"/>
      <circle cx="23" cy="24.5" r="1" fill="#fb923c"/>
      <rect width="32" height="14" rx="8" fill="white" opacity="0.07"/>
    </svg>
  );
}

// ─── Analytics / Chart ───────────────────────────────────────────────────────
export function IconAnalytics({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="gAna" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a78bfa"/>
          <stop offset="100%" stopColor="#4c1d95"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#gAna)"/>
      {/* Barres */}
      <rect x="7" y="20" width="4" height="6" rx="1.5" fill="white" opacity="0.5"/>
      <rect x="14" y="14" width="4" height="12" rx="1.5" fill="white" opacity="0.75"/>
      <rect x="21" y="9" width="4" height="17" rx="1.5" fill="white" opacity="0.95"/>
      {/* Ligne de base */}
      <line x1="5" y1="26" x2="27" y2="26" stroke="white" strokeWidth="1.2" opacity="0.4"/>
      <rect width="32" height="14" rx="8" fill="white" opacity="0.06"/>
    </svg>
  );
}

// ─── Connecteurs / Link ───────────────────────────────────────────────────────
export function IconConnecteurs({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="gCon" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#94a3b8"/>
          <stop offset="100%" stopColor="#475569"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#gCon)"/>
      {/* Chain link */}
      <path d="M13 19 C11 21 8 21 6.5 19.5 C5 18 5 15 7 13 L11 9 C13 7 16 7 17.5 8.5 C19 10 19 13 17 15" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.9"/>
      <path d="M19 13 C21 11 24 11 25.5 12.5 C27 14 27 17 25 19 L21 23 C19 25 16 25 14.5 23.5 C13 22 13 19 15 17" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.65"/>
      <rect width="32" height="14" rx="8" fill="white" opacity="0.06"/>
    </svg>
  );
}

// ─── Abonnement / Crown ───────────────────────────────────────────────────────
export function IconAbonnement({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="gAbo" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fcd34d"/>
          <stop offset="100%" stopColor="#d97706"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#gAbo)"/>
      {/* Couronne */}
      <path d="M6 24 L7 14 L12 19 L16 9 L20 19 L25 14 L26 24 Z" fill="white" opacity="0.9"/>
      <rect x="6" y="24" width="20" height="3" rx="1.5" fill="white" opacity="0.6"/>
      {/* Gemmes */}
      <circle cx="16" cy="13" r="1.5" fill="#fcd34d" opacity="0.9"/>
      <circle cx="10" cy="18.5" r="1" fill="#fcd34d" opacity="0.7"/>
      <circle cx="22" cy="18.5" r="1" fill="#fcd34d" opacity="0.7"/>
      <rect width="32" height="14" rx="8" fill="white" opacity="0.07"/>
    </svg>
  );
}

// ─── Paramètres / Settings ───────────────────────────────────────────────────
export function IconParametres({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="gPrm" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#64748b"/>
          <stop offset="100%" stopColor="#1e293b"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#gPrm)"/>
      {/* Gear */}
      <path d="M16 10 L17.5 7 L14.5 7 L16 10 Z M16 10 C17.1 10 18 10.9 18 12" fill="white" opacity="0" />
      <path fillRule="evenodd" clipRule="evenodd"
        d="M16 12a4 4 0 100 8 4 4 0 000-8zm-6.9 2.5l-1.5-1 1-1.7 1.7.6a6 6 0 011.2-.7l.3-1.8h2l.3 1.8c.4.2.8.4 1.2.7l1.7-.6 1 1.7-1.5 1a6 6 0 010 1.4l1.5 1-1 1.7-1.7-.6a6 6 0 01-1.2.7l-.3 1.8h-2l-.3-1.8a6 6 0 01-1.2-.7l-1.7.6-1-1.7 1.5-1a6 6 0 010-1.4z"
        fill="white" opacity="0.85"/>
      <rect width="32" height="14" rx="8" fill="white" opacity="0.06"/>
    </svg>
  );
}

// ─── Paiements ───────────────────────────────────────────────────────────────
export function IconPaiements({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="gPai" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ade80"/>
          <stop offset="100%" stopColor="#166534"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#gPai)"/>
      <rect x="5" y="10" width="22" height="14" rx="3" fill="white" opacity="0.85"/>
      <rect x="5" y="14.5" width="22" height="4" fill="#4ade80" opacity="0.35"/>
      <rect x="8" y="19" width="5" height="2" rx="1" fill="#166534" opacity="0.5"/>
      <rect x="21" y="18.5" width="4" height="3" rx="1" fill="#166534" opacity="0.4"/>
      <rect width="32" height="14" rx="8" fill="white" opacity="0.06"/>
    </svg>
  );
}

// ─── Avis / Stars ────────────────────────────────────────────────────────────
export function IconAvis({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="gAvi" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24"/>
          <stop offset="100%" stopColor="#92400e"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#gAvi)"/>
      <path d="M16 7 L18.2 13.2 H24.8 L19.5 17 L21.7 23.2 L16 19.4 L10.3 23.2 L12.5 17 L7.2 13.2 H13.8 Z"
        fill="white" opacity="0.95"/>
      <rect width="32" height="14" rx="8" fill="white" opacity="0.07"/>
    </svg>
  );
}

// ─── IA / Intelligence ───────────────────────────────────────────────────────
export function IconIA({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="gIA" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e879f9"/>
          <stop offset="100%" stopColor="#701a75"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#gIA)"/>
      {/* Cerveau stylisé */}
      <path d="M16 8 C11 8 7 11.5 7 16 C7 19 8.5 21.5 11 23 L11 26 H14 L14 24 H18 L18 26 H21 L21 23 C23.5 21.5 25 19 25 16 C25 11.5 21 8 16 8 Z"
        fill="white" opacity="0.85"/>
      <line x1="16" y1="8" x2="16" y2="13" stroke="#e879f9" strokeWidth="1.5"/>
      <line x1="11" y1="10" x2="14" y2="14" stroke="#e879f9" strokeWidth="1" opacity="0.6"/>
      <line x1="21" y1="10" x2="18" y2="14" stroke="#e879f9" strokeWidth="1" opacity="0.6"/>
      <circle cx="16" cy="16" r="2" fill="#e879f9" opacity="0.7"/>
      <rect width="32" height="14" rx="8" fill="white" opacity="0.07"/>
    </svg>
  );
}

// ─── Thèmes / Palette ────────────────────────────────────────────────────────
export function IconThemes({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="gThm" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb7185"/>
          <stop offset="100%" stopColor="#9f1239"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#gThm)"/>
      {/* Palette */}
      <path d="M16 7 C11 7 7 11 7 16 C7 18.5 8 20.5 9.5 22 C11 23.5 13 24 14 23.5 C15 23 15 21.5 16 21.5 C20 21.5 25 19 25 16 C25 11 21 7 16 7 Z"
        fill="white" opacity="0.85"/>
      <circle cx="11.5" cy="13.5" r="1.8" fill="#ef4444" opacity="0.7"/>
      <circle cx="16" cy="11" r="1.8" fill="#3b82f6" opacity="0.7"/>
      <circle cx="20.5" cy="13.5" r="1.8" fill="#22c55e" opacity="0.7"/>
      <circle cx="20" cy="18" r="1.8" fill="#fbbf24" opacity="0.7"/>
      <circle cx="13" cy="20" r="1.5" fill="#a855f7" opacity="0.55"/>
      <rect width="32" height="14" rx="8" fill="white" opacity="0.06"/>
    </svg>
  );
}
