// Thème Violet Cosmos — Nébuleuse GLSL shader via canvas 2D
"use client";
import { useEffect, useRef } from "react";

export function VioletCosmosEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Étoiles
    const stars = Array.from({ length: 150 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.2 + 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.5 + 0.2,
    }));

    // Nébuleuses (gradients aléatoires)
    const nebulae = Array.from({ length: 5 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 200 + 100,
      hue: Math.random() * 60 + 260, // violet–bleu
      phase: Math.random() * Math.PI * 2,
    }));

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = Date.now() * 0.0005;

      // Fond nébuleux
      nebulae.forEach((n) => {
        const drift = Math.sin(t + n.phase) * 20;
        const grad = ctx.createRadialGradient(n.x + drift, n.y + drift, 0, n.x + drift, n.y + drift, n.r);
        grad.addColorStop(0, `hsla(${n.hue}, 80%, 40%, 0.08)`);
        grad.addColorStop(0.5, `hsla(${n.hue + 20}, 70%, 30%, 0.04)`);
        grad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(n.x + drift, n.y + drift, n.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      // Étoiles scintillantes
      stars.forEach((s) => {
        const alpha = 0.4 + Math.sin(t * s.speed + s.phase) * 0.4;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240, 220, 255, ${Math.max(0, alpha)})`;
        ctx.fill();

        // Halo sur les grosses étoiles
        if (s.r > 0.9) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(160, 80, 255, ${alpha * 0.2})`;
          ctx.fill();
        }
      });

      // Filaments violets
      ctx.save();
      ctx.globalAlpha = 0.06;
      for (let i = 0; i < 3; i++) {
        const x = Math.sin(t * 0.3 + i * 2) * canvas.width * 0.3 + canvas.width * 0.5;
        const grad = ctx.createLinearGradient(x - 100, 0, x + 100, canvas.height);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(0.3, "rgba(124, 58, 237, 0.5)");
        grad.addColorStop(0.7, "rgba(167, 100, 255, 0.3)");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(x - 80, 0, 160, canvas.height);
      }
      ctx.restore();

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  );
}
