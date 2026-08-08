import { statusMeta } from "../../lib/format";

export function StatusBadge({ status, pulse = true }) {
  const meta = statusMeta[status] ?? statusMeta.good;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: `${meta.color}1f`, color: meta.color }}
    >
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
            style={{ backgroundColor: meta.color }}
          />
        )}
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
      </span>
      {meta.label}
    </span>
  );
}
