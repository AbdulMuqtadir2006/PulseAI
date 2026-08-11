import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "../ui/Reveal";
import { useLang } from "../../i18n/LanguageContext";

const MEAL_KEYS = ["breakfast", "lunch", "dinner", "snacks", "hydration"];

export function DietPlan({ plan }) {
  const { t } = useLang();

  if (!plan) return null;

  return (
    <motion.div className="grid gap-3 sm:grid-cols-2" variants={staggerContainer} initial="hidden" animate="show">
      {MEAL_KEYS.map((key) => (
        <motion.div key={key} variants={staggerItem} className="glass-card p-5">
          <p className="eyebrow mb-2">{t(`selfcare.meal.${key}`)}</p>
          <p className="text-sm leading-relaxed text-white/70">{plan[key]}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}

export default DietPlan;
