import { motion } from "framer-motion";
import { StatusBadge } from "./StatusBadge";
import { Sparkline } from "./Sparkline";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { statusMeta, metricMeta } from "../../lib/format";
import { staggerItem } from "../ui/Reveal";

export function MetricCard({ metricKey, biomarker, trend }) {
  const meta = metricMeta[metricKey];
  const color = statusMeta[biomarker.status]?.color ?? statusMeta.good.color;

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="glass-card group p-5 transition-shadow duration-300 hover:shadow-lift"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-slate-400">{meta.label}</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <AnimatedNumber
              value={biomarker.value}
              decimals={meta.dp}
              duration={900}
              className="font-mono text-3xl font-semibold tabular-nums text-white"
            />
            {meta.unit && <span className="font-mono text-sm text-slate-500">{meta.unit}</span>}
          </div>
        </div>
        <StatusBadge status={biomarker.status} />
      </div>

      <div className="mt-4">
        <Sparkline data={trend} color={color} width={180} height={40} />
      </div>

      <p className="mt-3 font-mono text-[11px] text-slate-500">
        Reference {biomarker.min}–{biomarker.max}
        {meta.unit ? ` ${meta.unit}` : ""}
      </p>
    </motion.div>
  );
}
