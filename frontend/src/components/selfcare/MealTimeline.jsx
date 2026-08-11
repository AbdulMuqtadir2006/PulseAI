import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Coffee, Sun, Moon, Apple } from "lucide-react";
import { useLang } from "../../i18n/LanguageContext";

const DAY_START = 6;
const DAY_END = 23.5;

const MEALS = [
  { id: "breakfast", icon: Coffee, start: 6, end: 10, at: 8 },
  { id: "lunch", icon: Sun, start: 12, end: 14, at: 13 },
  { id: "snacks", icon: Apple, start: 15, end: 16.5, at: 15.5 },
  { id: "dinner", icon: Moon, start: 18, end: 20.5, at: 19 },
];

const MACRO_MAX = { protein_g: 45, carbs_g: 95, fat_g: 40 };

function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function pickMeal(nowH) {
  const current = MEALS.find((m) => nowH >= m.start && nowH < m.end);
  if (current) return current;
  const upcoming = MEALS.filter((m) => m.start > nowH).sort((a, b) => a.start - b.start)[0];
  if (upcoming) return upcoming;
  return MEALS[0];
}

function pct(h) {
  const p = ((h - DAY_START) / (DAY_END - DAY_START)) * 100;
  return Math.min(100, Math.max(0, p));
}

export function MealTimeline({ plan }) {
  const { t } = useLang();
  const now = useNow();
  const nowH = now.getHours() + now.getMinutes() / 60;

  const activeMeal = useMemo(() => pickMeal(nowH), [nowH]);
  const nowPct = pct(nowH);

  const nutrition = plan?.nutrition?.find((n) => n.meal === activeMeal.id);

  const macros = nutrition
    ? [
        { key: "protein_g", label: t("selfcare.nutrition.protein"), value: nutrition.protein_g, max: MACRO_MAX.protein_g },
        { key: "carbs_g", label: t("selfcare.nutrition.carbs"), value: nutrition.carbs_g, max: MACRO_MAX.carbs_g },
        { key: "fat_g", label: t("selfcare.nutrition.fat"), value: nutrition.fat_g, max: MACRO_MAX.fat_g },
      ]
    : [];

  return (
    <div className="glass-card p-5">
      <div className="relative mt-3 h-2 rounded-full bg-white/[0.06]">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-pulse/50"
          initial={{ width: 0 }}
          animate={{ width: `${nowPct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
        {MEALS.map((m) => {
          const Icon = m.icon;
          const isActive = m.id === activeMeal.id;
          return (
            <div
              key={m.id}
              className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
              style={{ left: `${pct(m.at)}%` }}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
                  isActive
                    ? "border-pulse bg-pulse text-white shadow-glow-sm"
                    : "border-white/15 bg-surface text-white/50"
                }`}
              >
                <Icon size={13} />
              </span>
              <span className={`font-mono text-[10px] uppercase tracking-wider ${isActive ? "text-white" : "text-white/40"}`}>
                {t(`selfcare.meal.${m.id}`)}
              </span>
            </div>
          );
        })}
      </div>

      {nutrition && (
        <div className="mt-10 border-t border-white/[0.08] pt-5">
          <div className="flex items-baseline justify-between">
            <p className="font-display text-lg font-bold text-white">{t(`selfcare.meal.${activeMeal.id}`)}</p>
            <p className="font-mono text-sm text-white/55">
              <span className="text-white">{nutrition.calories}</span> {t("selfcare.nutrition.calories")}
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {macros.map((macro) => (
              <div key={macro.key}>
                <div className="mb-1 flex items-center justify-between font-mono text-xs text-white/55">
                  <span>{macro.label}</span>
                  <span className="text-white/70">{macro.value}g</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-1.5 rounded-full bg-teal"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (macro.value / macro.max) * 100)}%` }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            ))}
          </div>

          {nutrition.micros?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {nutrition.micros.map((m) => (
                <span
                  key={m}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-white/55"
                >
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MealTimeline;
