"use client";
import { useEffect } from "react";

export default function ConfettiBurst({
  duration = 1500,
  colors = ["#22c55e", "#86efac", "#bbf7d0", "#34d399"],
}: { duration?: number; colors?: string[] }) {
  useEffect(() => {
    const canvas = document.createElement("canvas");
    Object.assign(canvas.style, {
      position: "fixed",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: "9999",
    } as CSSStyleDeclaration);
    document.body.appendChild(canvas);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ctx = canvas.getContext("2d")!;
    const resize = () => {
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
    };
    resize();
    addEventListener("resize", resize);

    const N = 180;
    const parts = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: -20 * Math.random(),
      vx: (Math.random() - 0.5) * 4 * dpr,
      vy: Math.random() * 3 * dpr + 2 * dpr,
      size: Math.random() * 6 * dpr + 3 * dpr,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      col: colors[(Math.random() * colors.length) | 0],
    }));

    let raf = 0;
    const start = performance.now();
    const frame = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05 * dpr;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.col;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      if (t - start < duration) raf = requestAnimationFrame(frame);
      else {
        removeEventListener("resize", resize);
        canvas.remove();
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      canvas.remove();
    };
  }, [duration, colors]);

  return null;
}
