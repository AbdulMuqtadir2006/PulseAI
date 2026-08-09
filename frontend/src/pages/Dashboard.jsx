import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Activity, TriangleAlert, ShieldAlert } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { MetricCard } from "../components/dashboard/MetricCard";
import { TrendChart } from "../components/dashboard/TrendChart";
import { RiskGauge } from "../components/dashboard/RiskGauge";
import { useLatestVitals, useVitalsHistory } from "../hooks/useVitals";
import { simulateReading } from "../lib/api";
import { staggerContainer } from "../components/ui/Reveal";
import { formatTimeShort, formatTimestamp } from "../lib/format";

const METRIC_KEYS = ["heart_rate", "hrv", "spo2", "systolic", "diastolic"];

const SCENARIOS = [
  { id: "normal", label: "Normal reading", icon: Activity, className: "border-teal/30 text-teal hover:bg-teal/10" },
  { id: "elevated", label: "Elevated reading", icon: TriangleAlert, className: "border-status-watch/40 text-status-watch hover:bg-status-watch/10" },
  { id: "critical", label: "Simulate emergency", icon: ShieldAlert, className: "border-pulse/40 text-pulse hover:bg-pulse/10" },
];

function SkeletonGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="glass-card h-40 animate-pulse p-5">
          <div className="h-3 w-16 rounded bg-white/10" />
          <div className="mt-4 h-8 w-24 rounded bg-white/10" />
          <div className="mt-6 h-10 w-full rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [refresh, setRefresh] = useState(0);
  const [busyScenario, setBusyScenario] = useState(null);
  const [alertBanner, setAlertBanner] = useState(null);
  const { reading, loading } = useLatestVitals(refresh);
  const { history } = useVitalsHistory(24, refresh);

  const trends = useMemo(() => {
    const out = {};
    for (const key of METRIC_KEYS) {
      out[key] = history
        .filter((r) => r.risk)
        .map((r) => ({ time: formatTimeShort(r.timestamp), value: r[key] }));
    }
    return out;
  }, [history]);

  const runScenario = async (scenario) => {
    setBusyScenario(scenario);
    setAlertBanner(null);
    try {
      const result = await simulateReading(scenario);
      if (result.alerts_fired?.length) {
        setAlertBanner(result.alerts_fired);
      }
      setRefresh((n) => n + 1);
    } finally {
      setBusyScenario(null);
    }
  };

  return (
    <PageShell wide eyebrow="Live" title="Your dashboard" intro="Simulated readings — there's no real wearable behind this demo.">
      <AnimatePresence>
        {alertBanner && (
          <motion.div
            initial={{ opacity: 0, y: -12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden rounded-2xl border border-pulse/30 bg-pulse/10 p-4"
          >
            <p className="flex items-center gap-2 font-semibold text-pulse">
              <ShieldAlert size={18} /> Critical reading — emergency contacts notified
            </p>
            <ul className="mt-2 space-y-1 text-sm text-white/70">
              {alertBanner.map((a, i) => (
                <li key={i}>
                  {a.contact}: <span className="font-mono text-xs uppercase text-white/55">{a.status}</span> — {a.detail}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-6 flex flex-wrap gap-3">
        {SCENARIOS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => runScenario(s.id)}
              disabled={busyScenario !== null}
              className={`inline-flex items-center gap-2 rounded-full border bg-white/[0.02] px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${s.className}`}
            >
              {busyScenario === s.id ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
              {s.label}
            </button>
          );
        })}
      </div>

      {loading || !reading ? (
        <SkeletonGrid />
      ) : (
        <>
          <div className="mb-6">
            <p className="mb-3 font-mono text-xs text-white/40">Latest reading — {formatTimestamp(reading.timestamp)}</p>
            <RiskGauge
              riskScore={reading.risk.risk_score}
              riskLevel={reading.risk.risk_level}
              narrative={reading.risk.narrative}
              recommendation={reading.risk.recommendation}
            />
          </div>

          <motion.div
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            key={refresh}
          >
            {METRIC_KEYS.map((key) => (
              <MetricCard
                key={key}
                metricKey={key}
                biomarker={reading.risk.biomarkers[key]}
                trend={(trends[key] ?? []).map((d) => d.value)}
              />
            ))}
          </motion.div>

          <div className="mt-12">
            <h2 className="font-display text-xl font-bold text-white">Last 24 hours</h2>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {METRIC_KEYS.map((key) => (
              <TrendChart
                key={key}
                metricKey={key}
                data={trends[key] ?? []}
                range={[reading.risk.biomarkers[key].min, reading.risk.biomarkers[key].max]}
                unit={undefined}
                status={reading.risk.biomarkers[key].status}
              />
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}
