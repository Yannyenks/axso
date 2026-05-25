// Thème Océan Atlantique — vagues bioluminescentes et particules aquatiques
"use client";
import { useEffect, useRef } from "react";

export function OceanAtlantiqueEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let mouse = { x: -1000, y: -1000 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });

    // Particules bioluminescentes
    const N = 180;
    const particles = Array.from({ length: N }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.2 - 0.05,
      r: Math.random() * 2 + 0.5,
      phase: Math.random() * Math.PI * 2,
      hue: Math.random() * 40 + 180, // bleu-cyan
      drift: Math.random() * 0.02 + 0.005,
    }));

    // Vagues de fond
    const WAVE_COUNT = 5;
    const waves = Array.from({ length: WAVE_COUNT }, (_, i) => ({
      amplitude: 40 + i * 20,
      frequency: 0.003 + i * 0.001,
      speed: 0.4 + i * 0.15,
      y: canvas.height * (0.5 + i * 0.12),
      opacity: 0.04 - i * 0.005,
    }));

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = Date.now() * 0.001;

      // Dégradés de profondeur
      const depth = ctx.createRadialGradient(canvas.width / 2, canvas.height, 0, canvas.width / 2, canvas.height / 2, canvas.height);
      depth.addColorStop(0, "rgba(0, 119, 182, 0.06)");
      depth.addColorStop(0.5, "rgba(0, 180, 216, 0.03)");
      depth.addColorStop(1, "transparent");
      ctx.fillStyle = depth;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Vagues sinusoïdales
      waves.forEach((w) => {
        ctx.beginPath();
        ctx.moveTo(0, w.y);
        for (let x = 0; x <= canvas.width; x += 4) {
          const y = w.y + Math.sin(x * w.frequency + t * w.speed) * w.amplitude;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fillStyle = `rgba(0, 180, 216, ${w.opacity})`;
        ctx.fill();
      });

      // Particules bioluminescentes
      particles.forEach((p) => {
        // Attraction douce vers la souris (courant)
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          p.vx += (dx / dist) * 0.02;
          p.vy += (dy / dist) * 0.01;
        }

        // Mouvement de courant + friction
        p.vx += Math.sin(t * 0.3 + p.phase) * 0.005;
        p.vy += Math.cos(t * 0.2 + p.phase) * 0.003;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;

        // Wrap autour de l'écran
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const alpha = 0.3 + Math.sin(t * 1.2 + p.phase) * 0.25;
        const hue = p.hue + Math.sin(t * 0.5 + p.phase) * 20;

        // Halo bioluminescent
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        grd.addColorStop(0, `hsla(${hue}, 100%, 70%, ${alpha})`);
        grd.addColorStop(0.5, `hsla(${hue}, 90%, 50%, ${alpha * 0.4})`);
        grd.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 100%, 85%, ${alpha + 0.2})`;
        ctx.fill();
      });

      // Connexions aquatiques entre particules proches
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 70) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 180, 216, ${(1 - dist / 70) * 0.12})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

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
      style={{ opacity: 0.75 }}
    />
  );
}
