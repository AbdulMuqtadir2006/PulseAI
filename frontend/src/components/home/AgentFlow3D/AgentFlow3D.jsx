import {
  Suspense,
  forwardRef,
  lazy,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePrefersReducedMotion } from "../../../hooks/usePrefersReducedMotion";
import { createAgentFlowBus } from "./useAgentFlowEvents";
import { FlowErrorBoundary } from "./FlowErrorBoundary";
import { StaticFallback } from "./StaticFallback";

const Canvas3D = lazy(() => import("./Canvas3D"));

const IO_OPTIONS = { rootMargin: "200px 0px", threshold: 0.01 };

/**
 * 3D visualization of the real backend pipeline (data-driven from
 * src/data/agentFlow.js): Sensor Capture -> Risk Engine -> Guidance
 * (manager) -> Dashboard Alert / Emergency Contact. A traveling pulse per
 * arc reads as "data is flowing right now."
 *
 * Imperative API (via ref): fireEvent(edgeId) fires a one-off bright pulse
 * along a specific connection.
 */
export const AgentFlow3D = forwardRef(function AgentFlow3D(_props, ref) {
  const containerRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const bus = useMemo(() => createAgentFlowBus(), []);

  useImperativeHandle(ref, () => ({
    fireEvent: (edgeId, detail) => bus.fire(edgeId, detail),
  }));

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    }, IO_OPTIONS);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (inView) setHasLoaded(true);
  }, [inView]);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <FlowErrorBoundary fallback={<StaticFallback />}>
        {hasLoaded ? (
          <Suspense fallback={<div className="h-full w-full" aria-hidden="true" />}>
            <Canvas3D active={inView} reducedMotion={reducedMotion} bus={bus} />
          </Suspense>
        ) : (
          <div className="h-full w-full" aria-hidden="true" />
        )}
      </FlowErrorBoundary>
    </div>
  );
});
