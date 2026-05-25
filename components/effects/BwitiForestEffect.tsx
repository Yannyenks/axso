// Thème Bwiti Forest — lucioles, spores forestières et profondeur équatoriale
"use client";
import { useEffect, useRef } from "react";

export function BwitiForestEffect() {
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

    // Lucioles
    const FIREFLIES = 80;
    const fireflies = Array.from({ length: FIREFLIES }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.4 - 0.1,
      r: Math.random() * 2.5 + 0.5,
      phase: Math.random() * Math.PI * 2,
      flashSpeed: Math.random() * 2 + 0.5,
      hue: 110 + Math.random() * 40, // vert-jaune
    }));

    // Spores flottantes plus petites
    const SPORES = 100;
    const spores = Array.from({ length: SPORES }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight + window.innerHeight * 0.3,
      vx: (Math.random() - 0.5) * 0.2,
      vy: -(Math.random() * 0.4 + 0.1),
      r: Math.random() * 1.2 + 0.3,
      phase: Math.random() * Math.PI * 2,
      life: Math.random(),
      maxLife: 1,
    }));

    // Nappes de brume verte
    const MIST = 6;
    const mists = Array.from({ length: MIST }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: canvas.height * (0.4 + i * 0.1),
      w: Math.random() * 400 + 200,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.2 + 0.05,
    }));

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = Date.now() * 0.001;

      // Dégradé de profondeur forestière
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "rgba(7, 26, 11, 0)");
      grad.addColorStop(0.5, "rgba(15, 40, 20, 0.04)");
      grad.addColorStop(1, "rgba(21, 128, 61, 0.05)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Nappes de brume
      mists.forEach((m) => {
        const drift = Math.sin(t * m.speed + m.phase) * 60;
        const mistGrad = ctx.createRadialGradient(m.x + drift, m.y, 0, m.x + drift, m.y, m.w);
        mistGrad.addColorStop(0, "rgba(74, 222, 128, 0.04)");
        mistGrad.addColorStop(0.5, "rgba(21, 128, 61, 0.02)");
        mistGrad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.ellipse(m.x + drift, m.y, m.w, m.w * 0.3, 0, 0, Math.PI * 2);
        ctx.fillStyle = mistGrad;
        ctx.fill();
      });

      // Spores ascendantes
      spores.forEach((s) => {
        s.x += s.vx + Math.sin(t * 0.4 + s.phase) * 0.15;
        s.y += s.vy;
        s.life -= 0.001;

        if (s.life <= 0 || s.y < -10) {
          s.x = Math.random() * canvas.width;
          s.y = canvas.height + 10;
          s.life = 1;
          s.vy = -(Math.random() * 0.4 + 0.1);
        }

        const alpha = s.life * 0.4;
        const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
        grd.addColorStop(0, `rgba(74, 222, 128, ${alpha})`);
        grd.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      });

      // Lucioles
      fireflies.forEach((f) => {
        // Mouvement organique
        const dx = f.x - mouse.x;
        const dy = f.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          f.vx += (dx / dist) * 0.12;
          f.vy += (dy / dist) * 0.08;
        }

        f.vx += Math.sin(t * 0.6 + f.phase) * 0.008;
        f.vy += Math.cos(t * 0.4 + f.phase * 1.3) * 0.005;
        f.vx *= 0.98;
        f.vy *= 0.98;
        f.x += f.vx;
        f.y += f.vy;

        if (f.x < 0) f.x = canvas.width;
        if (f.x > canvas.width) f.x = 0;
        if (f.y < 0) f.y = canvas.height;
        if (f.y > canvas.height) f.y = 0;

        // Flash naturel de luciole
        const flash = Math.pow(Math.max(0, Math.sin(t * f.flashSpeed + f.phase)), 3);
        const alpha = 0.1 + flash * 0.85;

        // Halo lumineux
        const grd = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 6);
        grd.addColorStop(0, `hsla(${f.hue}, 100%, 75%, ${alpha})`);
        grd.addColorStop(0.3, `hsla(${f.hue}, 90%, 55%, ${alpha * 0.5})`);
        grd.addColorStop(0.7, `hsla(${f.hue}, 80%, 35%, ${alpha * 0.15})`);
        grd.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 6, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Corps de la luciole
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${f.hue}, 100%, 90%, ${alpha + 0.1})`;
        ctx.fill();
      });

      // Connexions filament entre lucioles proches
      for (let i = 0; i < fireflies.length; i++) {
        for (let j = i + 1; j < fireflies.length; j++) {
          const dx = fireflies[i].x - fireflies[j].x;
          const dy = fireflies[i].y - fireflies[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 90) {
            ctx.beginPath();
            ctx.moveTo(fireflies[i].x, fireflies[i].y);
            ctx.lineTo(fireflies[j].x, fireflies[j].y);
            ctx.strokeStyle = `rgba(74, 222, 128, ${(1 - d / 90) * 0.08})`;
            ctx.lineWidth = 0.4;
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
      style={{ opacity: 0.8 }}
    />
  );
}
