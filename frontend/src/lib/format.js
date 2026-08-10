export const metricMeta = {
  heart_rate: { label: "Heart Rate", unit: "bpm", dp: 0 },
  hrv: { label: "HRV (RMSSD)", unit: "ms", dp: 0 },
  spo2: { label: "SpO2", unit: "%", dp: 0 },
  systolic: { label: "Systolic BP", unit: "mmHg", dp: 0 },
  diastolic: { label: "Diastolic BP", unit: "mmHg", dp: 0 },
};

// Colors mirror tailwind.config.js's `teal`/`amber`/`pulse`/`pulse.dim`
// tokens exactly — kept as plain hex here (not imported from the Tailwind
// config) because these values feed non-Tailwind consumers (inline SVG/
// Recharts props), but they must never drift from the token source of truth.
export const statusMeta = {
  good: { label: "Normal", color: "#1FD8AA" },
  watch: { label: "Watch", color: "#F2A93E" },
  critical: { label: "Critical", color: "#FF3B5C" },
};

export const riskLevelMeta = {
  low: { label: "Low risk", color: "#1FD8AA" },
  moderate: { label: "Moderate risk", color: "#F2A93E" },
  high: { label: "High risk", color: "#B8283F" },
  critical: { label: "Critical risk", color: "#FF3B5C" },
};

export function formatTimestamp(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTimeShort(iso) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
