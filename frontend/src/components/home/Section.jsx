import { Reveal } from "../ui/Reveal";

// A numbered kicker ("01 — Why this matters") replaces the old pill+dot
// eyebrow badge that used to repeat identically on every section — one
// consistent, editorial marker instead of the same widget stamped five times.
export function Section({ id, kicker, eyebrow, title, intro, children, className = "" }) {
  return (
    <section id={id} className={`relative z-10 py-24 sm:py-32 ${className}`}>
      <div className="container-page">
        {(eyebrow || title) && (
          <div className="mb-14 max-w-2xl">
            {eyebrow && (
              <Reveal>
                <div className="mb-4 flex items-center gap-3">
                  {kicker && (
                    <span className="font-mono text-sm font-semibold text-pulse">{kicker}</span>
                  )}
                  <span className="h-px w-8 bg-white/15" aria-hidden="true" />
                  <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-white/45">
                    {eyebrow}
                  </p>
                </div>
              </Reveal>
            )}
            {title && (
              <Reveal delay={0.05}>
                <h2 className="text-balance font-display text-3xl font-bold leading-tight text-white sm:text-4xl md:text-[2.75rem]">
                  {title}
                </h2>
              </Reveal>
            )}
            {intro && (
              <Reveal delay={0.1}>
                <p className="mt-5 text-pretty text-base leading-relaxed text-white/55 sm:text-lg">{intro}</p>
              </Reveal>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
