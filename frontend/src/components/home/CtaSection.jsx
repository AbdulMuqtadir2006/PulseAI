import { ArrowRight } from "lucide-react";
import { Reveal } from "../ui/Reveal";
import { MagneticButton } from "../ui/MagneticButton";
import { RiskGauge } from "../dashboard/RiskGauge";

export function CtaSection() {
  return (
    <section id="research" className="relative z-10 overflow-hidden py-28 sm:py-36">
      <div className="container-page grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Reveal>
            <h2 className="text-balance font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              See your risk score, live.
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p id="disclaimer" className="mt-6 max-w-lg text-pretty text-sm leading-relaxed text-white/40">
              PulseGuard AI is a research-stage prototype exploring what continuous biometric
              monitoring could do for cardiac risk — it is not a diagnostic device, has not been
              clinically validated, and must never be relied on in a real emergency.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-9">
              <MagneticButton to="/signup">
                Open the demo dashboard <ArrowRight size={18} />
              </MagneticButton>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="relative">
            <p className="mb-3 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-white/35">
              Sample reading
            </p>
            <RiskGauge
              riskScore={12}
              riskLevel="low"
              recommendation="All vitals within reference range. Next check-in: 6 hours."
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
