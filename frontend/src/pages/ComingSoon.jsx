import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Compass, ArrowLeft } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";

export default function ComingSoon() {
  return (
    <PageShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex h-24 w-24 items-center justify-center"
        >
          <span className="absolute inset-0 animate-pulse-ring rounded-full border border-teal/40" />
          <span className="relative flex h-24 w-24 items-center justify-center rounded-full border border-teal/25 bg-white/5 text-teal shadow-card">
            <Compass size={38} strokeWidth={1.5} />
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 font-display text-3xl font-bold text-white sm:text-4xl"
        >
          Nothing here yet
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="mt-4 max-w-md text-pretty text-slate-400"
        >
          This page doesn't exist. Head back to your dashboard.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.26 }}>
          <Link
            to="/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white transition duration-200 hover:border-teal/50"
          >
            <ArrowLeft size={18} /> Back to dashboard
          </Link>
        </motion.div>
      </div>
    </PageShell>
  );
}
