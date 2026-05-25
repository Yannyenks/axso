// Thème Terre & Or — Motifs kente africains SVG avec parallaxe
"use client";
import { useEffect, useRef } from "react";

export function TerreEtOrEffect() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          if (svg) {
            svg.style.transform = `translateY(${scrollY * 0.3}px)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <svg
        ref={svgRef}
        width="100%"
        height="120%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.06, willChange: "transform" }}
      >
        <defs>
          {/* Motif kente de base */}
          <pattern id="kente-base" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            {/* Lignes horizontales */}
            <rect x="0" y="0" width="40" height="4" fill="#c2622d" />
            <rect x="0" y="8" width="40" height="2" fill="#F5A623" />
            <rect x="0" y="14" width="40" height="4" fill="#c2622d" />
            <rect x="0" y="22" width="40" height="2" fill="#8B4513" />
            <rect x="0" y="28" width="40" height="4" fill="#c2622d" />
            <rect x="0" y="36" width="40" height="2" fill="#F5A623" />
            {/* Lignes verticales */}
            <rect x="0" y="0" width="4" height="40" fill="#F5A623" opacity="0.5" />
            <rect x="10" y="0" width="2" height="40" fill="#8B4513" opacity="0.5" />
            <rect x="20" y="0" width="4" height="40" fill="#F5A623" opacity="0.5" />
            <rect x="32" y="0" width="2" height="40" fill="#8B4513" opacity="0.5" />
          </pattern>

          {/* Motif kente diamant */}
          <pattern id="kente-diamond" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <polygon points="30,2 58,30 30,58 2,30" fill="none" stroke="#c2622d" strokeWidth="2" />
            <polygon points="30,12 48,30 30,48 12,30" fill="none" stroke="#F5A623" strokeWidth="1.5" />
            <circle cx="30" cy="30" r="5" fill="#c2622d" />
            <circle cx="2" cy="2" r="3" fill="#F5A623" />
            <circle cx="58" cy="2" r="3" fill="#F5A623" />
            <circle cx="2" cy="58" r="3" fill="#F5A623" />
            <circle cx="58" cy="58" r="3" fill="#F5A623" />
          </pattern>

          {/* Motif adinkra (croissant) */}
          <pattern id="adinkra" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <circle cx="40" cy="40" r="25" fill="none" stroke="#c2622d" strokeWidth="2" />
            <circle cx="40" cy="40" r="15" fill="none" stroke="#F5A623" strokeWidth="1.5" />
            <line x1="40" y1="15" x2="40" y2="65" stroke="#8B4513" strokeWidth="1" />
            <line x1="15" y1="40" x2="65" y2="40" stroke="#8B4513" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Couches de motifs superposées */}
        <rect width="100%" height="100%" fill="url(#kente-base)" />
        <rect width="100%" height="100%" fill="url(#kente-diamond)" opacity="0.5" />

        {/* Bordures décoratives */}
        <rect x="0" y="0" width="100%" height="8" fill="#c2622d" opacity="0.8" />
        <rect x="0" y="8" width="100%" height="3" fill="#F5A623" opacity="0.6" />

        {/* Motifs adinkra aux coins */}
        {[0, 160, 320, 480, 640, 800, 960].map((x) =>
          [0, 200, 400, 600, 800, 1000].map((y) => (
            <use key={`${x}-${y}`} href="#adinkra" x={x} y={y} opacity="0.6" />
          ))
        )}
      </svg>

      {/* Gradient overlay pour atténuer */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(255, 248, 240, 0.4) 100%)",
        }}
      />
    </div>
  );
}
