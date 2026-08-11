import { useLang } from "../../i18n/LanguageContext";
import { formatTimestamp } from "../../lib/format";

// This document is screenshotted live (html2canvas) for the PDF export, so
// it is deliberately styled as a printed page — white background, dark
// text — and never uses the app's dark-theme tokens. The Tailwind config's
// palette override (ink/surface/pulse/teal/amber/status.*) has no light
// "paper" tones, so every color here is a literal hex value instead of a
// Tailwind color utility.
const METRIC_KEYS = ["heart_rate", "hrv", "spo2", "systolic", "diastolic"];

const METRIC_UNITS = {
  heart_rate: "bpm",
  hrv: "ms",
  spo2: "%",
  systolic: "mmHg",
  diastolic: "mmHg",
};

// Darker, print-safe variants of the app's status hues (teal/amber/pulse) —
// the on-screen tokens are tuned for a near-black background and read too
// light/low-contrast against white paper.
const PRINT_STATUS = {
  good: { fg: "#0B7A5F", bg: "#E6F7F1", border: "#B7E9DA" },
  watch: { fg: "#A16207", bg: "#FEF3DC", border: "#F5D999" },
  critical: { fg: "#B8283F", bg: "#FDE8EB", border: "#F5B8C2" },
};
const PRINT_STATUS_DEFAULT = { fg: "#334155", bg: "#F1F5F9", border: "#E2E8F0" };

const INK = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";
const FAINT_BG = "#F8FAFC";

export function PrintableReport({ report, reading, lang }) {
  const { t } = useLang();
  const dir = lang === "ar" ? "rtl" : "ltr";

  if (!report || !reading) return null;

  const biomarkers = reading.risk?.biomarkers ?? {};

  return (
    <div
      dir={dir}
      style={{ backgroundColor: "#FFFFFF", color: INK }}
      className="mx-auto w-full max-w-3xl rounded-2xl p-10 font-body"
    >
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-6" style={{ borderColor: BORDER }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#FF3B5C" }}>
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: "#FFFFFF" }} />
            </span>
            <span className="font-display text-lg font-bold" style={{ color: INK }}>
              PulseGuard AI
            </span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight" style={{ color: INK }}>
            {report.headline}
          </h1>
        </div>
        <p className="whitespace-nowrap font-mono text-xs" style={{ color: MUTED }}>
          {t("report.generatedOn")} {formatTimestamp(new Date().toISOString())}
        </p>
      </header>

      {/* Overall summary */}
      {report.overallSummary && (
        <p className="mt-6 text-base leading-relaxed" style={{ color: INK }}>
          {report.overallSummary}
        </p>
      )}

      {/* Biomarker table */}
      <table className="mt-8 w-full border-collapse text-sm" style={{ color: INK }}>
        <thead>
          <tr>
            {["metric", "value", "range", "status"].map((col) => (
              <th
                key={col}
                className="border-b py-2 text-start font-mono text-xs font-semibold uppercase tracking-wider"
                style={{ borderColor: BORDER, color: MUTED }}
              >
                {t(`report.metricTable.${col}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {METRIC_KEYS.map((key) => {
            const bio = biomarkers[key];
            if (!bio) return null;
            const palette = PRINT_STATUS[bio.status] ?? PRINT_STATUS_DEFAULT;
            const unit = METRIC_UNITS[key];
            return (
              <tr key={key}>
                <td className="border-b py-3 font-medium" style={{ borderColor: BORDER }}>
                  {t(`common.metric.${key}`)}
                </td>
                <td className="border-b py-3 font-mono tabular-nums" style={{ borderColor: BORDER }}>
                  {bio.value}
                  {unit ? ` ${unit}` : ""}
                </td>
                <td className="border-b py-3 font-mono tabular-nums" style={{ borderColor: BORDER, color: MUTED }}>
                  {bio.min}–{bio.max}
                  {unit ? ` ${unit}` : ""}
                </td>
                <td className="border-b py-3" style={{ borderColor: BORDER }}>
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{ backgroundColor: palette.bg, color: palette.fg, border: `1px solid ${palette.border}` }}
                  >
                    {t(`common.status.${bio.status}`)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Health areas */}
      {Array.isArray(report.areas) && report.areas.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {report.areas.map((area) => {
            const palette = PRINT_STATUS[area.status] ?? PRINT_STATUS_DEFAULT;
            return (
              <div
                key={area.id}
                className="rounded-xl p-4"
                style={{ backgroundColor: palette.bg, border: `1px solid ${palette.border}` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold" style={{ color: palette.fg }}>
                    {area.name}
                  </p>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: palette.fg, backgroundColor: "#FFFFFF" }}
                  >
                    {area.status}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: INK }}>
                  {area.note}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Recommendation */}
      {report.recommendation && (
        <div className="mt-8 rounded-xl p-5" style={{ backgroundColor: FAINT_BG, border: `1px solid ${BORDER}` }}>
          <p className="font-mono text-xs font-semibold uppercase tracking-wider" style={{ color: MUTED }}>
            {t("report.recommendation")}
          </p>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: INK }}>
            {report.recommendation}
          </p>
        </div>
      )}

      {/* Disclaimer footer */}
      {report.disclaimer && (
        <footer className="mt-10 border-t pt-4" style={{ borderColor: BORDER }}>
          <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
            {report.disclaimer}
          </p>
        </footer>
      )}
    </div>
  );
}
