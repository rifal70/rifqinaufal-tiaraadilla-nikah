"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  size: number;
  color: string;
  twinkle: number;
}

export default function WeddingFireworks() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Cek preferensi aksesibilitas pengguna
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let animationFrameId: number;
    let isVisible = true;
    let width = 0;
    let height = 0;

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const particles: Particle[] = [];

    // Warna emas & sampanye khas royal wedding yang hangat & anggun
    const goldPalette = [
      "rgba(255, 248, 220,", // Cornsilk / Warm White
      "rgba(255, 244, 196,", // Light Gold
      "rgba(240, 217, 160,", // Champagne Gold
      "rgba(212, 175, 55,",  // Royal Gold
      "rgba(255, 223, 128,", // Bright Gold
    ];

    // Fungsi menciptakan satu letupan petasan kembang api lembut
    const createBurst = (originX?: number, originY?: number) => {
      if (width === 0 || height === 0) return;

      // Area letupan: terpusat anggun di sekitar teks nama & ornamen atas
      const x = originX ?? width * (0.22 + Math.random() * 0.56);
      const y = originY ?? height * (0.2 + Math.random() * 0.38);

      // Jumlah partikel kecil (18 - 26 butir) agar tidak heboh / tidak berantakan
      const count = 18 + Math.floor(Math.random() * 9);
      const baseColor = goldPalette[Math.floor(Math.random() * goldPalette.length)];

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const speed = 1.2 + Math.random() * 2.4;

        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          decay: 0.012 + Math.random() * 0.012, // Perlahan memudar ~1.5 detik
          size: 1.2 + Math.random() * 1.8,
          color: Math.random() > 0.35 ? baseColor : goldPalette[Math.floor(Math.random() * goldPalette.length)],
          twinkle: Math.random() * Math.PI * 2,
        });
      }
    };

    let lastBurstTime = 0;
    // Interval letupan: santai tiap 2.4 - 3.8 detik
    let nextBurstDelay = 1200;

    const render = (time: number) => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Otomatis meletupkan kembang api lembut secara berkala
      if (time - lastBurstTime > nextBurstDelay) {
        createBurst();
        lastBurstTime = time;
        nextBurstDelay = 2400 + Math.random() * 1400; // 2.4 - 3.8 detik sekali
      }

      // Update & gambar partikel
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.965; // Hambatan udara halus
        p.vy = p.vy * 0.965 + 0.035; // Gravitasi jatuh lembut
        p.alpha -= p.decay;
        p.twinkle += 0.2;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Efek kerlap-kerlip halus khas kembang api emas
        const currentAlpha = Math.max(0, p.alpha * (0.75 + Math.sin(p.twinkle) * 0.25));

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${currentAlpha})`;
        ctx.shadowColor = "rgba(212, 175, 55, 0.6)";
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    // Amati visibilitas section agar hemat CPU/baterai saat user scroll ke bawah
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );

    observer.observe(canvas);
    animationFrameId = requestAnimationFrame(render);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[15] h-full w-full select-none"
    />
  );
}
