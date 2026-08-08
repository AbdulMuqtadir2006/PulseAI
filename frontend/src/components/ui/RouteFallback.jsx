export function RouteFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink">
      <div className="flex flex-col items-center gap-4">
        <span className="relative flex h-10 w-10">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pulse/40" />
          <span className="relative inline-flex h-10 w-10 rounded-full border-2 border-pulse/30 border-t-pulse animate-spin" />
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">Loading</span>
      </div>
    </div>
  );
}
