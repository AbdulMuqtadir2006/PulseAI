import { Suspense, lazy, useEffect, useState } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { FlowErrorBoundary } from "../home/AgentFlow3D/FlowErrorBoundary";

const HeroCanvas = lazy(() => import("./HeroCanvas"));

// Static fallback if WebGL is unavailable — a CSS-only heartbeat glyph so
// the hero never blanks.
function StaticHeroFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <span className="animate-heartbeat text-8xl text-pulse/70">♥</span>
    </div>
  );
}

// Hero centerpiece: lives above the fold, so unlike AgentFlow3D this loads
// immediately rather than waiting for scroll — but the chunk itself still
// only downloads via lazy() so it's split from the main bundle, and it still
// pauses its render loop when the tab isn't visible.
export function HeroPulse3D({ className = "" }) {
  const reducedMotion = usePrefersReducedMotion();
  // See SiteAmbient.jsx — start active rather than trusting the synchronous
  // document.hidden read, so the hero never starts permanently blank.
  const [active, setActive] = useState(true);

  useEffect(() => {
    const onVis = () => setActive(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <div className={`relative ${className}`} aria-hidden="true">
      <FlowErrorBoundary fallback={<StaticHeroFallback />}>
        <Suspense fallback={<div className="h-full w-full" />}>
          <HeroCanvas active={active} reducedMotion={reducedMotion} />
        </Suspense>
      </FlowErrorBoundary>
    </div>
  );
}
