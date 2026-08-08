import { motion } from "framer-motion";
import { Hero } from "../components/home/Hero";
import { StatsSection } from "../components/home/StatsSection";
import { AgentFlowSection } from "../components/home/AgentFlowSection";
import { FeaturesSection } from "../components/home/FeaturesSection";
import { CtaSection } from "../components/home/CtaSection";

export default function Home() {
  return (
    <motion.main
      className="relative z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Hero />
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-30" aria-hidden="true" />
        <div className="relative">
          <StatsSection />
          <AgentFlowSection />
          <FeaturesSection />
          <CtaSection />
        </div>
      </div>
    </motion.main>
  );
}
