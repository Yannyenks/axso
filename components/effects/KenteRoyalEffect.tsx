// Thème Kente Royal — géométries africaines dorées animées + filaments de soie
"use client";
import { useEffect, useRef } from "react";

export function KenteRoyalEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });

    // Particules dorées
    const N = 120;
    const particles = Array.from({ length: N }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2 + 0.8,
      phase: Math.random() * Math.PI * 2,
      shape: Math.floor(Math.random() * 3), // 0=cercle, 1=losange, 2=carré
      size: Math.random() * 4 + 2,
    }));

    // Bandes kente horizontales (motif géométrique)
    const BANDS = 8;

    function drawDiamond(x: number, y: number, size: number, alpha: number) {
      if (!ctx) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = `rgba(27, 79, 216, ${alpha})`;
      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.restore();
    }

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = Date.now() * 0.001;

      // Bandes géométriques animées
      for (let b = 0; b < BANDS; b++) {
        const y = (canvas.height / BANDS) * b;
        const h = canvas.height / BANDS;
        const shift = Math.sin(t * 0.3 + b * 0.8) * 30;
        const alpha = 0.02 + Math.sin(t * 0.5 + b) * 0.01;

        // Bande dorée alternée
        if (b % 3 === 0) {
          ctx.fillStyle = `rgba(27, 79, 216, ${alpha})`;
          ctx.fillRect(shift, y, canvas.width, h * 0.15);
        }
        if (b % 3 === 1) {
          ctx.fillStyle = `rgba(200, 134, 26, ${alpha * 0.7})`;
          ctx.fillRect(-shift, y + h * 0.5, canvas.width, h * 0.1);
        }
      }

      // Losanges kente flottants
      const LOZENGE_COUNT = 25;
      for (let i = 0; i < LOZENGE_COUNT; i++) {
        const phase = (i / LOZENGE_COUNT) * Math.PI * 2;
        const x = (Math.sin(phase + t * 0.2) * 0.4 + 0.5) * canvas.width;
        const y = (Math.cos(phase * 1.3 + t * 0.15) * 0.4 + 0.5) * canvas.height;
        const size = 6 + Math.sin(t + phase) * 3;
        const alpha = 0.08 + Math.sin(t * 0.8 + phase) * 0.05;
        drawDiamond(x, y, size, alpha);
      }

      // Particules dorées
      particles.forEach((p) => {
        // Répulsion douce de la souris
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          p.vx += (dx / dist) * 0.15;
          p.vy += (dy / dist) * 0.15;
        }

        p.vx *= 0.97;
        p.vy *= 0.97;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        p.x = Math.max(0, Math.min(canvas.width, p.x));
        p.y = Math.max(0, Math.min(canvas.height, p.y));

        const alpha = 0.25 + Math.sin(t * 1.5 + p.phase) * 0.2;

        if (p.shape === 1) {
          drawDiamond(p.x, p.y, p.size, alpha);
        } else if (p.shape === 2) {
          ctx.fillStyle = `rgba(27, 79, 216, ${alpha})`;
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        } else {
          // Halo doré
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
          grd.addColorStop(0, `rgba(27, 79, 216, ${alpha})`);
          grd.addColorStop(0.4, `rgba(200, 134, 26, ${alpha * 0.3})`);
          grd.addColorStop(1, "transparent");
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 220, 100, ${alpha + 0.15})`;
          ctx.fill();
        }
      });

      // Filaments de soie dorée
      ctx.save();
      ctx.globalAlpha = 0.05;
      for (let i = 0; i < 4; i++) {
        const x = Math.sin(t * 0.25 + i * 1.5) * canvas.width * 0.35 + canvas.width * 0.5;
        const grad = ctx.createLinearGradient(x - 60, 0, x + 60, canvas.height);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(0.3, "rgba(27, 79, 216, 0.6)");
        grad.addColorStop(0.7, "rgba(200, 134, 26, 0.4)");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(x - 50, 0, 100, canvas.height);
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
      style={{ opacity: 0.8 }}
    />
  );
}
