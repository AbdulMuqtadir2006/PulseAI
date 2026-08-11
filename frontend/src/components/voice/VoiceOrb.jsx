import { AnimatePresence, motion } from "framer-motion";
import { Volume2 } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1];

// Reactive orb for the Voice page — pulses while speech is actively playing,
// and gives a small extra "bump" on each speech-boundary event (tick, driven
// by the hook's charIndex) for a livelier, word-synced feel.
export function VoiceOrb({ active = false, tick = 0 }) {
  return (
    <div className="relative flex h-40 w-40 items-center justify-center">
      <AnimatePresence>
        {active && (
          <motion.span
            key="ring-a"
            className="absolute inset-0 rounded-full border border-pulse/40"
            initial={{ scale: 0.85, opacity: 0.7 }}
            animate={{ scale: 1.6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && (
          <motion.span
            key="ring-b"
            className="absolute inset-0 rounded-full border border-pulse/25"
            initial={{ scale: 0.85, opacity: 0.7 }}
            animate={{ scale: 1.6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 0.7 }}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-pulse/40 bg-pulse/10 text-pulse shadow-glow-sm"
        animate={active ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={active ? { duration: 0.7, ease: EASE, repeat: Infinity } : { duration: 0.4, ease: EASE }}
      >
        {active && (
          <motion.span
            key={tick}
            className="absolute inset-0 rounded-full bg-pulse/25"
            initial={{ scale: 0.5, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          />
        )}
        <Volume2 size={30} strokeWidth={1.5} className="relative" />
      </motion.div>
    </div>
  );
}
