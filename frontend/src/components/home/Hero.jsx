import { ArrowRight, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { Reveal } from "../ui/Reveal";
import { MagneticButton } from "../ui/MagneticButton";
import { HeroPulse3D } from "../three/HeroPulse";

export function Hero() {
  return (
    <section className="relative z-10 overflow-hidden pb-20 pt-36 sm:pt-44">
      <div className="container-page grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-teal">
              <Activity size={13} /> Research-stage wearable AI
            </span>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="mt-6 text-balance font-display text-5xl font-extrabold leading-[1.03] tracking-tight text-white sm:text-6xl md:text-7xl">
              Catch it <span className="text-gradient">before</span> it happens.
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-white/55">
              PulseGuard AI watches your heart rate, HRV, SpO2, and blood pressure in real time,
              scores your cardiac risk against reference ranges, and escalates to your emergency
              contact the moment a reading turns critical.
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <MagneticButton to="/signup">
                Try the demo dashboard <ArrowRight size={18} />
              </MagneticButton>
              <a href="#pipeline" className="btn-ghost">
                See how it works
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.32}>
            <p className="mt-8 max-w-md text-xs leading-relaxed text-white/40">
              Not a medical device. This is a research prototype for exploring continuous cardiac
              monitoring — it has not been clinically validated.
            </p>
          </Reveal>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="relative h-[320px] sm:h-[420px] lg:h-[480px]"
        >
          <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br from-pulse/10 via-transparent to-teal/10 blur-2xl" />
          <HeroPulse3D className="h-full w-full" />
        </motion.div>
      </div>
    </section>
  );
}
