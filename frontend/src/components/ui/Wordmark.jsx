import { useId } from "react";

// PulseGuard mark — a rounded badge with an EKG trace in the single brand
// accent. Solid color, not a rainbow gradient — the mark should look like
// it belongs to a product with one confident color, not a template default.
export function Wordmark({ className = "" }) {
  const gradientId = useId();
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true" className="shrink-0">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF3B5C" />
            <stop offset="100%" stopColor="#B8283F" />
          </linearGradient>
        </defs>
        <rect width="30" height="30" rx="9" fill={`url(#${gradientId})`} />
        <path
          d="M3.5 16h3.6l2.1-5.7 3.6 11.4 2.6-8.8 1.8 3.1h7.3"
          fill="none"
          stroke="white"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-display text-lg font-semibold tracking-tight text-white">
        PulseGuard<span className="text-pulse">.</span>
      </span>
    </span>
  );
}
