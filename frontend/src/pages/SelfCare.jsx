import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CheckCircle2, Eye, AlertTriangle, Sparkles } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { Coach } from "../components/selfcare/Coach";
import { DietPlan } from "../components/selfcare/DietPlan";
import { MealTimeline } from "../components/selfcare/MealTimeline";
import { getSelfCare } from "../lib/api";
import { useLang } from "../i18n/LanguageContext";
import { staggerContainer, staggerItem } from "../components/ui/Reveal";

const STATUS_ICON = {
  good: CheckCircle2,
  watch: Eye,
  critical: AlertTriangle,
};

const STATUS_CLASS = {
  good: "border-status-good/30 bg-status-good/10 text-status-good",
  watch: "border-status-watch/30 bg-status-watch/10 text-status-watch",
  critical: "border-status-critical/30 bg-status-critical/10 text-status-critical",
};

function SkeletonPlan() {
  return (
    <div className="space-y-6">
      <div className="glass-card h-40 animate-pulse" />
      <div className="glass-card h-40 animate-pulse" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card h-24 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function SelfCare() {
  const { lang, t } = useLang();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noReading, setNoReading] = useState(false);

  const loadPlan = useCallback(() => {
    setLoading(true);
    setNoReading(false);
    return getSelfCare(lang)
      .then((r) => {
        setPlan(r);
      })
      .catch((err) => {
        if (/no reading/i.test(err.message || "")) {
          setNoReading(true);
        }
        setPlan(null);
      })
      .finally(() => setLoading(false));
  }, [lang]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  return (
    <PageShell wide eyebrow={t("selfcare.eyebrow")} title={t("selfcare.title")} intro={t("selfcare.intro")}>
      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <SkeletonPlan />
          <div className="glass-card h-96 animate-pulse" />
        </div>
      ) : noReading || !plan ? (
        <div className="glass-card flex flex-col items-center gap-4 p-12 text-center">
          <Link to="/dashboard" className="text-white/60 underline decoration-white/20 underline-offset-4 transition hover:text-pulse hover:decoration-pulse/40">
            {t("common.noReading")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <motion.div className="space-y-6" variants={staggerContainer} initial="hidden" animate="show">
            <motion.div
              variants={staggerItem}
              className="relative overflow-hidden rounded-2xl border border-pulse/25 bg-gradient-to-br from-pulse/15 via-surface to-surface p-6 shadow-glow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="eyebrow flex items-center gap-2 text-pulse">
                  <Sparkles size={14} /> {t("selfcare.todaysFocus")}
                </p>
                <span
                  className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wider ${
                    plan.source === "ai"
                      ? "border-teal/30 bg-teal/10 text-teal"
                      : "border-white/10 bg-white/[0.03] text-white/55"
                  }`}
                >
                  {plan.source === "ai" ? t("common.aiBadge") : t("common.fallbackBadge")}
                </span>
              </div>
              <h2 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">{plan.focusTitle}</h2>
              <p className="mt-3 text-pretty text-sm leading-relaxed text-white/70 sm:text-base">{plan.focusBody}</p>
              {plan.source !== "ai" && <p className="mt-4 text-xs text-white/40">{t("common.aiOfflineNote")}</p>}
            </motion.div>

            <motion.div variants={staggerItem}>
              <MealTimeline plan={plan} />
            </motion.div>

            <motion.div variants={staggerItem}>
              <h3 className="mb-3 font-display text-lg font-bold text-white">{t("selfcare.dietPlan")}</h3>
              <DietPlan plan={plan.dietPlan} />
            </motion.div>

            <motion.div variants={staggerItem}>
              <h3 className="mb-3 font-display text-lg font-bold text-white">{t("selfcare.areaTips")}</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {(plan.areaTips || []).map((area) => {
                  const Icon = STATUS_ICON[area.status] ?? Eye;
                  return (
                    <div key={area.id} className="glass-card p-4">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${
                          STATUS_CLASS[area.status] ?? STATUS_CLASS.watch
                        }`}
                      >
                        <Icon size={15} />
                      </span>
                      <p className="mt-3 font-semibold text-white">{area.name}</p>
                      <p className="mt-1 text-sm leading-relaxed text-white/60">{area.tip}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>

          <Coach lang={lang} t={t} onContextChange={loadPlan} />
        </div>
      )}
    </PageShell>
  );
}
