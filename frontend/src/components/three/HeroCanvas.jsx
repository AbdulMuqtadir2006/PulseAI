import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";

const BEAT_PERIOD = 1.15; // seconds — matches tailwind's `animate-heartbeat`

function gaussian(x, center, width, amp) {
  const d = (x - center) / width;
  return amp * Math.exp(-d * d);
}

// One period of a P-QRS-T trace, normalized to phase p in [0, 1). The tail
// end sits back at 0 so repeated copies tile with no visible seam.
function ekgHeight(p) {
  let h = 0;
  h += gaussian(p, 0.08, 0.02, 0.12); // P wave
  h -= gaussian(p, 0.16, 0.008, 0.18); // Q dip
  h += gaussian(p, 0.19, 0.012, 1.0); // R spike
  h -= gaussian(p, 0.22, 0.01, 0.35); // S dip
  h += gaussian(p, 0.34, 0.035, 0.28); // T wave
  return h;
}

const SAMPLES = 140;
const PERIOD_WIDTH = 4.2;
const REPEATS = 6;
const AMPLITUDE = 0.95;

function buildStripPoints() {
  const period = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const p = i / SAMPLES;
    period.push(new THREE.Vector3(p * PERIOD_WIDTH, ekgHeight(p) * AMPLITUDE, 0));
  }
  const strip = [];
  for (let r = 0; r < REPEATS; r++) {
    for (const pt of period) {
      strip.push(new THREE.Vector3(pt.x + r * PERIOD_WIDTH, pt.y, pt.z));
    }
  }
  return strip;
}

function EkgRibbon({ reducedMotion }) {
  const groupRef = useRef();
  const points = useMemo(() => buildStripPoints(), []);
  const totalWidth = PERIOD_WIDTH * REPEATS;

  useFrame((_, delta) => {
    if (reducedMotion || !groupRef.current) return;
    groupRef.current.position.x -= delta * 1.7;
    if (groupRef.current.position.x <= -PERIOD_WIDTH) {
      groupRef.current.position.x += PERIOD_WIDTH;
    }
  });

  return (
    <group ref={groupRef} position={[-totalWidth / 2, 0, 0]}>
      {/* glow pass — wide, dim, additive */}
      <Line points={points} color="#22E6B8" transparent opacity={0.25} lineWidth={7} />
      {/* core trace */}
      <Line points={points} color="#EAFFFB" transparent opacity={0.95} lineWidth={2} />
    </group>
  );
}

function HeartOrb({ reducedMotion }) {
  const coreRef = useRef();
  const glowRef = useRef();
  const ringRef = useRef();

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.getElapsedTime();
    const phase = (t % BEAT_PERIOD) / BEAT_PERIOD;
    const beat = Math.pow(Math.max(0, Math.sin(phase * Math.PI)), 8);
    const scale = 1 + beat * 0.22;
    if (coreRef.current) coreRef.current.scale.setScalar(scale);
    if (glowRef.current) glowRef.current.scale.setScalar(scale * 1.6);
    if (ringRef.current) {
      const ringScale = 1 + phase * 1.6;
      ringRef.current.scale.setScalar(ringScale);
      ringRef.current.material.opacity = Math.max(0, 0.45 * (1 - phase));
    }
  });

  return (
    <group position={[0, 0.1, -2.4]}>
      <mesh ref={ringRef} rotation={[0, 0, 0]}>
        <torusGeometry args={[1.05, 0.012, 8, 64]} />
        <meshBasicMaterial color="#FF3B5C" transparent opacity={0.4} depthWrite={false} />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.62, 24, 24]} />
        <meshBasicMaterial color="#FF3B5C" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.34, 32, 32]} />
        <meshBasicMaterial color="#FF3B5C" transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Scene({ reducedMotion }) {
  const groupRef = useRef();
  useFrame(({ clock }) => {
    if (reducedMotion || !groupRef.current) return;
    groupRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.12) * 0.05;
    groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.09) * 0.06;
  });

  return (
    <group ref={groupRef}>
      <HeartOrb reducedMotion={reducedMotion} />
      <EkgRibbon reducedMotion={reducedMotion} />
    </group>
  );
}

export default function HeroCanvas({ active, reducedMotion }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 5.4], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      frameloop={!active ? "never" : reducedMotion ? "demand" : "always"}
    >
      <Scene reducedMotion={reducedMotion} />
    </Canvas>
  );
}
