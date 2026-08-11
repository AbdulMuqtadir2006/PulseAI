import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, Download, Inbox, Loader2 } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { PrintableReport } from "../components/reports/PrintableReport";
import { generateReportPdf } from "../components/reports/generateReportPdf";
import { useLang } from "../i18n/LanguageContext";
import { getReport } from "../lib/api";
import { useLatestVitals } from "../hooks/useVitals";
import { staggerContainer, staggerItem } from "../components/ui/Reveal";

export default function Reports() {
  const { lang, t } = useLang();
  const { reading, loading: readingLoading } = useLatestVitals();
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState(null);
  const [downloadState, setDownloadState] = useState("idle"); // idle | downloading | done | error

  const docRef = useRef(null);
  const clearTimer = useRef(null);

  // Fetch a fresh report whenever the language changes.
  useEffect(() => {
    let alive = true;
    setReportLoading(true);
    setReportError(null);
    getReport(lang)
      .then((r) => {
        if (alive) setReport(r);
      })
      .catch((e) => {
        if (alive) setReportError(e);
      })
      .finally(() => {
        if (alive) setReportLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [lang]);

  useEffect(() => () => clearTimeout(clearTimer.current), []);

  const handleDownload = async () => {
    if (!docRef.current) return;
    setDownloadState("downloading");
    try {
      const stamp = reading?.timestamp
        ? new Date(reading.timestamp).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
      await generateReportPdf(docRef.current, `pulseguard-report-${lang}-${stamp}.pdf`);
      setDownloadState("done");
    } catch {
      setDownloadState("error");
    } finally {
      clearTimer.current = setTimeout(() => setDownloadState("idle"), 4000);
    }
  };

  const loading = readingLoading || reportLoading;
  const noReading = !loading && (!reading || !report || reportError);

  return (
    <PageShell eyebrow={t("report.eyebrow")} title={t("report.title")} intro={t("report.intro")}>
      {loading ? (
        <div className="glass-card h-96 animate-pulse" />
      ) : noReading ? (
        <div className="glass-card flex flex-col items-center gap-3 p-12 text-center">
          <Inbox className="text-white/40" size={32} />
          <p className="max-w-md text-white/55">{t("common.noReading")}</p>
          <Link
            to="/dashboard"
            className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition duration-200 hover:border-teal/50"
          >
            {t("common.goToDashboard")}
          </Link>
        </div>
      ) : (
        <motion.div className="space-y-6" variants={staggerContainer} initial="hidden" animate="show">
          <motion.div
            variants={staggerItem}
            className="glass-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <span
                className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wider ${
                  report.source === "ai"
                    ? "border-teal/30 bg-teal/10 text-teal"
                    : "border-white/10 bg-white/[0.03] text-white/55"
                }`}
              >
                {report.source === "ai" ? t("common.aiBadge") : t("common.fallbackBadge")}
              </span>
              {report.source === "fallback" && <p className="mt-2 text-xs text-white/40">{t("common.aiOfflineNote")}</p>}
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloadState === "downloading"}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloadState === "downloading" ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> {t("report.downloading")}
                  </>
                ) : downloadState === "done" ? (
                  <>
                    <Check size={16} /> {t("report.downloaded")}
                  </>
                ) : (
                  <>
                    <Download size={16} /> {t("report.download")}
                  </>
                )}
              </button>
              {downloadState === "error" && <p className="text-xs text-pulse">{t("report.downloadFailed")}</p>}
            </div>
          </motion.div>

          <motion.div variants={staggerItem} className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-8">
            <div ref={docRef}>
              <PrintableReport report={report} reading={reading} lang={lang} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </PageShell>
  );
}
