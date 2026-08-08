import { ArrowRight } from "lucide-react";
import { Reveal } from "../ui/Reveal";
import { MagneticButton } from "../ui/MagneticButton";

export function CtaSection() {
  return (
    <section id="research" className="relative z-10 overflow-hidden py-28 sm:py-36">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pulse/10 blur-[120px]"
        aria-hidden="true"
      />
      <div className="container-page relative text-center">
        <Reveal>
          <p id="disclaimer" className="mx-auto mb-14 max-w-2xl text-pretty text-sm leading-relaxed text-slate-500">
            PulseGuard AI is a research-stage prototype exploring what continuous biometric
            monitoring could do for cardiac risk — it is not a diagnostic device, has not been
            clinically validated, and must never be relied on in a real emergency.
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <h2 className="mx-auto max-w-3xl text-balance font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl md:text-6xl">
            See your risk score, live.
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-10 flex justify-center">
            <MagneticButton to="/signup">
              Open the demo dashboard <ArrowRight size={18} />
            </MagneticButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
