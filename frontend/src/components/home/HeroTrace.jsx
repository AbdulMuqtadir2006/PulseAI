import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

const BEAT_PX = 300;
const AMP = 52;

function gaussian(x, center, width, amp) {
  const d = (x - center) / width;
  return amp * Math.exp(-d * d);
}

// One PQRST complex as a function of phase p in [0, 1).
function ekgHeight(p) {
  let h = 0;
  h += gaussian(p, 0.12, 0.028, 0.14); // P
  h -= gaussian(p, 0.22, 0.01, 0.22); // Q
  h += gaussian(p, 0.25, 0.014, 1); // R
  h -= gaussian(p, 0.28, 0.012, 0.42); // S
  h += gaussian(p, 0.44, 0.045, 0.3); // T
  return h;
}

function draw(ctx, width, height, offsetPx) {
  ctx.clearRect(0, 0, width, height);
  const baseY = height * 0.56;
  ctx.beginPath();
  for (let x = -2; x <= width + 2; x += 2) {
    const worldX = x + offsetPx;
    const p = ((worldX % BEAT_PX) + BEAT_PX) % BEAT_PX / BEAT_PX;
    const y = baseY - ekgHeight(p) * AMP;
    if (x === -2) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  // Soft glow pass, then a crisp core line on top.
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(255, 59, 92, 0.35)";
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.strokeStyle = "#FFE3E9";
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Hero centerpiece: a live-feeling EKG trace instead of a decorative 3D orb
// — it demonstrates the product (a continuous reading) rather than just
// filling space. Plain 2D canvas, no WebGL dependency.
export function HeroTrace({ className = "" }) {
  const canvasRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    let width = 0;
    let height = 0;
    let active = !document.hidden;
    let raf = null;
    let offsetPx = 0;
    let lastTs = null;
    const speedPxPerSec = 90;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx, width, height, offsetPx);
    }

    function tick(ts) {
      if (!active || reducedMotion) return;
      if (lastTs == null) lastTs = ts;
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;
      offsetPx += dt * speedPxPerSec;
      draw(ctx, width, height, offsetPx);
      raf = requestAnimationFrame(tick);
    }

    function onVis() {
      active = !document.hidden;
      if (active && !reducedMotion) {
        lastTs = null;
        raf = requestAnimationFrame(tick);
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    }

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVis);
    if (active && !reducedMotion) raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-20" aria-hidden="true" />

      <div className="absolute left-6 top-6 flex items-center gap-2 sm:left-8 sm:top-8">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-pulse" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-pulse" />
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/45">Live reading</span>
      </div>

      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

      <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8">
        <div className="flex items-baseline gap-2">
          <span className="animate-heartbeat font-display text-5xl font-bold text-white sm:text-6xl">
            72
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-white/40">bpm</span>
        </div>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-teal">Normal range</p>
      </div>
    </div>
  );
}
