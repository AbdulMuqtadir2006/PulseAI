import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Inbox } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { getAlerts } from "../lib/api";
import { formatTimestamp } from "../lib/format";
import { staggerContainer, staggerItem } from "../components/ui/Reveal";

const STATUS_COLOR = {
  simulated: "text-white/55 border-white/10 bg-white/[0.03]",
  sent: "text-status-good border-status-good/30 bg-status-good/10",
  failed: "text-pulse border-pulse/30 bg-pulse/10",
};

export default function Alerts() {
  const [alerts, setAlerts] = useState(null);

  useEffect(() => {
    getAlerts().then(setAlerts);
  }, []);

  return (
    <PageShell
      eyebrow="History"
      title="Emergency alerts"
      intro="Every time a critical reading fired an escalation, it's logged here — including simulated ones."
    >
      {!alerts ? (
        <div className="glass-card h-40 animate-pulse" />
      ) : alerts.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-3 p-12 text-center">
          <Inbox className="text-white/40" size={32} />
          <p className="text-white/55">No alerts yet. Simulate a critical reading from the dashboard to see one here.</p>
        </div>
      ) : (
        <motion.ul className="space-y-4" variants={staggerContainer} initial="hidden" animate="show">
          {alerts.map((a) => (
            <motion.li key={a.id} variants={staggerItem} className="glass-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-pulse/30 bg-pulse/10 text-pulse">
                    <ShieldAlert size={18} />
                  </span>
                  <div>
                    <p className="font-semibold text-white">{a.recipient}</p>
                    <p className="font-mono text-xs text-white/40">{formatTimestamp(a.created_at)}</p>
                  </div>
                </div>
                <span className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wider ${STATUS_COLOR[a.status] ?? STATUS_COLOR.simulated}`}>
                  {a.status} · {a.channel}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{a.message}</p>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </PageShell>
  );
}
