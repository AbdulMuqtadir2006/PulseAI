import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

// The two brand colors only — pulse weighted lower since it's the accent,
// not a background texture color.
const PALETTE = [
  [1.0, 0.23, 0.36], // pulse crimson
  [0.12, 0.85, 0.67], // teal
  [0.12, 0.85, 0.67], // teal (weighted 2:1 so the field reads cooler than the accent)
];

function Field({ count, reducedMotion }) {
  const pointsRef = useRef();
  const rotSpeed = useRef(0.006);

  const { positions, colors, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Spread through a wide, flattened volume so it reads as ambient depth
      // behind content rather than a globe or a box.
      positions[i * 3] = (Math.random() - 0.5) * 26;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14 - 4;
      const c = PALETTE[(Math.random() * PALETTE.length) | 0];
      colors[i * 3] = c[0];
      colors[i * 3 + 1] = c[1];
      colors[i * 3 + 2] = c[2];
      seeds[i] = Math.random() * Math.PI * 2;
    }
    return { positions, colors, seeds };
  }, [count]);

  useFrame(({ clock }) => {
    if (reducedMotion || !pointsRef.current) return;
    const t = clock.getElapsedTime();
    pointsRef.current.rotation.y = t * rotSpeed.current;
    pointsRef.current.rotation.x = Math.sin(t * 0.03) * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        vertexColors
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Persistent, fixed, full-viewport Three.js particle field mounted once at
// the app root (not per-page) so the WebGL context survives route changes
// instead of being torn down and recreated on every navigation. Pauses via
// the Page Visibility API when the tab isn't active, and freezes entirely
// under prefers-reduced-motion.
export function SiteAmbient() {
  const reducedMotion = usePrefersReducedMotion();
  // Assume visible on mount rather than trusting the synchronous
  // document.hidden read — some embedding contexts (and this app's own
  // browser-automation testing) report hidden=true even while actually
  // rendering, and frameloop="never" would block the very first paint
  // forever if we started from that. A real visibilitychange event during
  // the session is trustworthy for pausing, so only that flips it off.
  const [active, setActive] = useState(true);

  useEffect(() => {
    const onVis = () => setActive(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const count = useMemo(() => {
    const area = window.innerWidth * window.innerHeight;
    return Math.max(160, Math.min(420, Math.round(area / 4200)));
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 9], fov: 50 }}
        gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
        frameloop={!active ? "never" : reducedMotion ? "demand" : "always"}
      >
        <Field count={count} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
