// Filtre de grain de film partagé — défini une seule fois par page (id unique
// dans le DOM), référencé par toutes les cartes via url(#film-grain).
export function GrainFilterDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <filter id="film-grain" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={11} stitchTiles="stitch" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0" />
        </filter>
      </defs>
    </svg>
  );
}

export function GrainLayer() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.5, mixBlendMode: "overlay" }}>
      <rect width="100%" height="100%" filter="url(#film-grain)" />
    </svg>
  );
}
