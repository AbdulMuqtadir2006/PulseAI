import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

// Brand colors as rgb triples so we can build rgba() strings at arbitrary
// opacity without round-tripping through hex parsing every frame.
const LANE_COLORS = [
  [255, 59, 92], // pulse crimson
  [31, 216, 170], // teal
  [31, 216, 170],
  [255, 59, 92],
  [31, 216, 170],
];

// One EKG "lead" scrolling left at a fixed pixel speed. `y` is the lane's
// resting baseline (0..1 of viewport height), `beatPx` is the horizontal
// distance between heartbeats, `phase` staggers lanes so they don't all
// spike in unison.
function makeLane(index, laneCount) {
  return {
    y: (index + 0.5) / laneCount,
    color: LANE_COLORS[index % LANE_COLORS.length],
    beatPx: 340 + index * 47,
    phase: index * 137,
    speed: 34 + (index % 3) * 6,
    amp: 22 + (index % 2) * 10,
    opacity: index % 2 === 0 ? 0.1 : 0.06,
  };
}

// Procedural PQRST-ish complex: flat baseline, a small P bump, a sharp QRS
// spike, then a gentle T wave, repeating every `beatPx` pixels.
function ekgOffset(x, beatPx, amp) {
  const t = ((x % beatPx) + beatPx) % beatPx;
  const f = t / beatPx;
  if (f < 0.08) return -Math.sin((f / 0.08) * Math.PI) * amp * 0.12; // P wave
  if (f < 0.14) return 0;
  if (f < 0.18) return ((f - 0.14) / 0.04) * amp * 0.9; // Q->R rise
  if (f < 0.22) return amp * 0.9 - ((f - 0.18) / 0.04) * amp * 1.6; // R->S drop
  if (f < 0.26) return -amp * 0.7 + ((f - 0.22) / 0.04) * amp * 0.7; // S->baseline
  if (f < 0.4) return -Math.sin(((f - 0.26) / 0.14) * Math.PI) * amp * 0.22; // T wave
  return 0;
}

function drawFrame(ctx, width, height, lanes, x0) {
  ctx.clearRect(0, 0, width, height);
  for (const lane of lanes) {
    const baseY = lane.y * height;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(${lane.color[0]}, ${lane.color[1]}, ${lane.color[2]}, ${lane.opacity})`;
    ctx.lineWidth = 1.4;
    for (let x = 0; x <= width; x += 3) {
      const worldX = x + x0 * lane.speed + lane.phase;
      const y = baseY - ekgOffset(worldX, lane.beatPx, lane.amp);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

// Persistent, fixed, full-viewport ambient background — a handful of faint
// scrolling EKG traces instead of a generic particle field, tying the
// backdrop directly to the product (continuous cardiac monitoring) rather
// than a decorative starfield. Plain 2D canvas, no WebGL/Three.js needed.
// Pauses via the Page Visibility API when the tab isn't active, and freezes
// on a single static frame under prefers-reduced-motion.
export function SiteAmbient() {
  const canvasRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    let width = window.innerWidth;
    let height = window.innerHeight;
    let lanes = [];
    let active = !document.hidden;
    let raf = null;
    let elapsedPx = 0;
    let lastTs = null;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const laneCount = Math.max(4, Math.min(7, Math.round(height / 190)));
      lanes = Array.from({ length: laneCount }, (_, i) => makeLane(i, laneCount));
      drawFrame(ctx, width, height, lanes, elapsedPx);
    }

    function tick(ts) {
      if (!active) return;
      if (reducedMotion) return; // single static frame is enough
      if (lastTs == null) lastTs = ts;
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;
      elapsedPx += dt;
      drawFrame(ctx, width, height, lanes, elapsedPx);
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
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
