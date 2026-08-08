import { Section } from "./Section";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { Reveal, staggerContainer, staggerItem } from "../ui/Reveal";
import { motion } from "framer-motion";

const stats = [
  {
    value: 18,
    suffix: "M+",
    label: "Cardiovascular deaths worldwide each year",
    note: "World Health Organization",
  },
  {
    value: 1,
    prefix: "#",
    label: "Leading cause of death globally",
    note: "Ahead of every cancer combined",
  },
  {
    value: 0,
    display: "Minutes",
    label: "Is often the entire warning window",
    note: "Before symptoms are noticed or acted on",
  },
];

export function StatsSection() {
  return (
    <Section
      id="why"
      eyebrow="Why This Matters"
      title="Most warning signs go unnoticed — that's the actual problem."
      intro="Cardiac events rarely arrive without warning. The signal is usually there in heart rate, HRV, oxygen, and blood pressure hours before — the gap is that nobody's watching continuously."
    >
      <motion.div
        className="grid gap-6 sm:grid-cols-3"
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "0px 0px -15% 0px" }}
      >
        {stats.map((s) => (
          <motion.div key={s.label} variants={staggerItem} className="glass-card p-7">
            <p className="font-mono text-4xl font-bold text-white sm:text-5xl">
              {s.prefix}
              {s.display ? s.display : <AnimatedNumber value={s.value} />}
              {s.suffix}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{s.label}</p>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-slate-500">{s.note}</p>
          </motion.div>
        ))}
      </motion.div>

      <Reveal delay={0.2}>
        <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-slate-500">
          These figures describe cardiovascular disease broadly, not results from PulseGuard AI
          itself — this is a research prototype, not a clinically validated product.
        </p>
      </Reveal>
    </Section>
  );
}
