import { useId } from "react";

// PulseGuard mark — a rounded badge with an EKG trace, brand crimson->violet->teal
// gradient. `tone` switches the wordmark text colour between dark hero and light subpages.
export function Wordmark({ tone = "light", className = "" }) {
  const gradientId = useId();
  const text = tone === "dark" ? "text-depth" : "text-white";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" className="shrink-0">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF3B5C" />
            <stop offset="55%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#22E6B8" />
          </linearGradient>
        </defs>
        <rect width="34" height="34" rx="10" fill={`url(#${gradientId})`} />
        <path
          d="M4 18h4l2.4-6.5 4 13 3-10 2 3.5h8.6"
          fill="none"
          stroke="white"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={`font-display text-xl font-bold tracking-tight ${text}`}>
        PulseGuard<span className="text-pulse">.</span>
      </span>
    </span>
  );
}
