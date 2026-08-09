import { motion } from "framer-motion";
import { riskLevelMeta } from "../../lib/format";

export function RiskGauge({ riskScore, riskLevel, narrative, recommendation }) {
  const meta = riskLevelMeta[riskLevel] ?? riskLevelMeta.low;
  const R = 78;
  const C = 2 * Math.PI * R;
  const fraction = Math.min(1, Math.max(0, riskScore / 100));
  const offset = C * (1 - fraction);

  return (
    <div className="glass-card flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8">
      <div className="relative flex h-48 w-48 shrink-0 items-center justify-center self-center">
        <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
          <circle cx="90" cy="90" r={R} fill="none" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="12" />
          <motion.circle
            cx="90"
            cy="90"
            r={R}
            fill="none"
            stroke={meta.color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-mono text-3xl font-semibold tabular-nums text-white">{riskScore}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Risk / 100</span>
        </div>
      </div>

      <div className="flex-1">
        <p className="eyebrow text-white/55">Cardiac Risk</p>
        <p className="mt-2 font-display text-2xl font-bold" style={{ color: meta.color }}>
          {meta.label}
        </p>
        {narrative && <p className="mt-3 text-sm leading-relaxed text-white/70">{narrative}</p>}
        {recommendation && (
          <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-relaxed text-white/85">
            {recommendation}
          </p>
        )}
      </div>
    </div>
  );
}
