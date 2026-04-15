"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  tw: number;
  twSpeed: number;
  hue: number;
};

export function StarfieldCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let stars: Star[] = [];
    let raf = 0;
    let w = 0;
    let h = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    function buildStars() {
      const area = w * h;
      const count = Math.min(240, Math.max(70, Math.floor(area / 8500)));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.35 + 0.25,
        vx: reducedMotion ? 0 : (Math.random() - 0.5) * 0.18,
        vy: reducedMotion ? 0 : (Math.random() - 0.5) * 0.14,
        tw: Math.random() * Math.PI * 2,
        twSpeed: reducedMotion ? 0.012 : 0.018 + Math.random() * 0.05,
        hue: Math.random() > 0.55 ? 188 + Math.random() * 55 : 205 + Math.random() * 25,
      }));
    }

    function resize() {
      const c = ref.current;
      if (!c || !ctx) return;
      w = window.innerWidth;
      h = window.innerHeight;
      c.width = w * DPR;
      c.height = h * DPR;
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      buildStars();
    }

    function tick() {
      if (!ctx || w === 0 || h === 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);

      for (const s of stars) {
        if (!reducedMotion) {
          s.x += s.vx;
          s.y += s.vy;
          if (s.x < -4) s.x = w + 4;
          if (s.x > w + 4) s.x = -4;
          if (s.y < -4) s.y = h + 4;
          if (s.y > h + 4) s.y = -4;
        }
        s.tw += s.twSpeed;
        const pulse = 0.32 + Math.sin(s.tw) * 0.48;
        ctx.beginPath();
        ctx.fillStyle = `hsla(${s.hue}, 85%, 72%, ${pulse})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={cn("pointer-events-none", className)}
      aria-hidden
    />
  );
}
