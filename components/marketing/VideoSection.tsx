"use client";
// Section vidéo Highfield IA — intégration ultra haut de gamme
// Remplace HIGHFIELD_VIDEO_URL par l'URL de ta vidéo générée par Highfield

import { useEffect, useRef, useState } from "react";
import { CartParallax } from "./CartParallax";

// ─── CONFIGURATION ───────────────────────────────────────────────────────────
// Colle ici l'URL de ta vidéo Highfield (MP4 direct) ou l'embed iframe URL
const HIGHFIELD_VIDEO_URL = "";
// Si tu as un lien YouTube/Vimeo embed, mets-le ici à la place
const HIGHFIELD_IFRAME_URL = "";
// ─────────────────────────────────────────────────────────────────────────────

const VIDEO_CARTS = [
  { size: 600, top: "5%",  duration: 20, delay: 0,  opacity: 0.05, direction: "rtl" as const },
  { size: 400, top: "60%", duration: 16, delay: 5,  opacity: 0.04, direction: "ltr" as const },
  { size: 280, top: "38%", duration: 28, delay: 11, opacity: 0.055, direction: "rtl" as const },
];

export function VideoSection() {
  const [visible, setVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [playing, setPlaying] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          if (videoRef.current && HIGHFIELD_VIDEO_URL) {
            videoRef.current.play().catch(() => {});
            setPlaying(true);
          }
        }
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const hasVideo = !!HIGHFIELD_VIDEO_URL;
  const hasIframe = !!HIGHFIELD_IFRAME_URL;

  return (
    <section
      id="video-demo"
      ref={sectionRef}
      className="relative py-28 overflow-hidden bg-gradient-to-b from-white to-blue-50/30"
    >
      <CartParallax carts={VIDEO_CARTS} color="#1B4FD8" />

      {/* Glows ambiants */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(27,79,216,0.08) 0%, transparent 65%)" }}
        />
      </div>

      <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 relative z-10">

        {/* Header */}
        <div
          className="text-center mb-16"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "none" : "translateY(30px)",
            transition: "all 0.8s cubic-bezier(0.23,1,0.32,1)",
          }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 bg-[#1B4FD8]/10 border border-[#1B4FD8]/25 text-[#1B4FD8]">
            <span className="w-2 h-2 rounded-full bg-[#1B4FD8] animate-pulse"/>
            Démo en direct
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-playfair text-gray-900 mb-5 leading-tight">
            Voyez l'IA créer une boutique
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #1B4FD8, #1440BE, #7B9EFF)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "shimmer 3s linear infinite",
              }}
            >
              en temps réel
            </span>
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            En 60 secondes, l'IA comprend votre business et génère votre boutique complète, vos produits, vos prix, votre marketing.
          </p>
        </div>

        {/* ─── Player vidéo ultra premium ─── */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible
              ? `translateY(${-scrollY * 0.04}px) perspective(1200px) rotateX(${Math.min(scrollY * 0.005, 4)}deg)`
              : "translateY(60px) perspective(1200px) rotateX(8deg)",
            transition: visible ? "opacity 0.9s 0.2s, transform 0.9s 0.2s cubic-bezier(0.23,1,0.32,1)" : "none",
            willChange: "transform",
          }}
        >
          {/* Outer glow */}
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(27,79,216,0.2), transparent)",
              filter: "blur(30px)",
              transform: "translateY(20px) scale(1.05)",
            }}
          />

          {/* Frame principal */}
          <div
            className="relative rounded-3xl overflow-hidden border"
            style={{
              borderColor: "rgba(27,79,216,0.2)",
              boxShadow: "0 0 80px rgba(27,79,216,0.12), 0 40px 100px rgba(0,0,0,0.15), 0 0 0 1px rgba(27,79,216,0.08)",
              background: "#f9fafb",
            }}
          >
            {/* Browser chrome */}
            <div className="bg-white px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-red-400/80"/>
                <div className="w-3.5 h-3.5 rounded-full bg-yellow-400/80"/>
                <div className="w-3.5 h-3.5 rounded-full bg-green-400/80"/>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl px-4 py-2 flex items-center gap-2 border border-gray-200/80">
                <span className="text-gray-300 text-sm">🔒</span>
                <span className="text-sm text-gray-400 flex-1 text-center">app.axso.africa — Démo IA en direct</span>
              </div>
              <span
                className="text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: "rgba(27,79,216,0.1)", color: "#1B4FD8" }}
              >
                ● LIVE
              </span>
            </div>

            {/* Zone vidéo */}
            <div className="relative bg-gray-950" style={{ aspectRatio: "16/9" }}>
              {hasVideo && (
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  src={HIGHFIELD_VIDEO_URL}
                  muted
                  loop
                  playsInline
                  autoPlay
                />
              )}

              {hasIframe && !hasVideo && (
                <iframe
                  className="w-full h-full"
                  src={HIGHFIELD_IFRAME_URL}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  style={{ border: "none" }}
                />
              )}

              {!hasVideo && !hasIframe && (
                /* Placeholder — à remplacer par la vidéo Highfield */
                <div className="absolute inset-0 flex flex-col items-center justify-center"
                  style={{ background: "linear-gradient(145deg, #0d0e1a, #111228, #0e0c1a)" }}
                >
                  {/* Animated rings */}
                  <div className="relative flex items-center justify-center mb-8">
                    {[1,2,3].map((i) => (
                      <div
                        key={i}
                        className="absolute rounded-full border"
                        style={{
                          width: `${i * 80}px`,
                          height: `${i * 80}px`,
                          borderColor: `rgba(27,79,216,${0.3 / i})`,
                          animation: `ripple ${1.5 + i * 0.5}s ease-out ${i * 0.3}s infinite`,
                        }}
                      />
                    ))}
                    <div
                      className="relative w-20 h-20 rounded-full flex items-center justify-center text-4xl cursor-pointer z-10 transition-transform hover:scale-110"
                      style={{
                        background: "linear-gradient(135deg, #1B4FD8, #1440BE)",
                        boxShadow: "0 0 40px rgba(27,79,216,0.5)",
                      }}
                    >
                      ▶
                    </div>
                  </div>
                  <p className="text-white/60 text-lg font-medium mb-2">Vidéo Highfield IA</p>
                  <p className="text-white/35 text-sm text-center max-w-xs px-4">
                    Collez votre URL Highfield dans <code className="text-[#1B4FD8]">VideoSection.tsx</code> ligne 10
                  </p>

                  {/* Fake progress bar */}
                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: "35%",
                          background: "linear-gradient(90deg, #1B4FD8, #7B9EFF)",
                          animation: "progressLoop 8s linear infinite",
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-white/30 text-xs">0:00</span>
                      <div className="flex items-center gap-3">
                        <span className="text-white/30 text-xs">HD</span>
                        <span className="text-white/30 text-xs">⛶</span>
                      </div>
                      <span className="text-white/30 text-xs">0:58</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Overlay gradient subtil en bas */}
              {(hasVideo || hasIframe) && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)" }}
                />
              )}
            </div>

            {/* Bottom bar */}
            <div className="bg-white px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#1B4FD8]/10 flex items-center justify-center text-sm">🤖</div>
                <div>
                  <p className="text-xs font-semibold text-gray-700">Agent Onboarding</p>
                  <p className="text-[10px] text-gray-400">Boutique créée en 58 secondes</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-semibold">✓ Boutique live</span>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#1B4FD8]/10 text-[#1B4FD8] font-semibold">3 produits créés</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trois points de réassurance sous la vidéo */}
        <div
          className="grid grid-cols-3 gap-8 mt-16 text-center"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 1s 0.6s",
          }}
        >
          {[
            { icon: "⚡", title: "60 secondes", desc: "Du brief à la boutique live" },
            { icon: "🤖", title: "7 agents IA", desc: "Travaillent en parallèle pour vous" },
            { icon: "🌍", title: "10 pays", desc: "Paiements et livraisons localisés" },
          ].map((item) => (
            <div key={item.title} className="group">
              <div
                className="text-4xl mb-3 inline-block transition-transform duration-300 group-hover:scale-125"
                style={{ filter: "drop-shadow(0 0 12px rgba(27,79,216,0.3))" }}
              >
                {item.icon}
              </div>
              <p className="font-bold text-gray-900 mb-1">{item.title}</p>
              <p className="text-sm text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ripple {
          0%   { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes progressLoop {
          0%   { width: 0%;   }
          100% { width: 100%; }
        }
      `}</style>
    </section>
  );
}
