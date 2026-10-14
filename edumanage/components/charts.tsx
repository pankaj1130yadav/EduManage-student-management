"use client";

/** Pure SVG/CSS charts — no chart library needed. */

export function BarChart({
  data,
  height = 180,
  formatY,
}: {
  data: { label: string; value: number }[];
  height?: number;
  formatY?: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="flex items-end gap-3" style={{ height }}>
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-[11px] font-semibold text-ink-soft">
              {formatY ? formatY(d.value) : d.value}
            </span>
            <div
              className="w-full max-w-14 rounded-t-[3px] bg-gradient-to-t from-forest-deep to-forest-soft transition-all"
              style={{ height: `${Math.max(4, (d.value / max) * (height - 44))}px` }}
              title={`${d.label}: ${d.value}`}
            />
            <span className="text-[10px] font-medium uppercase tracking-wide text-ink-faint">
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Donut({
  pct,
  size = 148,
  label,
}: {
  pct: number;
  size?: number;
  label?: string;
}) {
  const r = 60;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e5dcc8" strokeWidth="14" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="#1d4a35"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${(clamped / 100) * c} ${c}`}
          transform="rotate(-90 70 70)"
        />
        <text x="70" y="66" textAnchor="middle" fontSize="24" fontWeight="700" fill="#22301f" fontFamily="Fraunces, serif">
          {clamped.toFixed(1)}%
        </text>
        {label && (
          <text x="70" y="88" textAnchor="middle" fontSize="11" fill="#7c8577">
            {label}
          </text>
        )}
      </svg>
    </div>
  );
}

export function HBar({ label, pct }: { label: string; pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 truncate text-sm font-medium text-ink-soft">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-paper-line/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-forest-soft to-gold-soft"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="w-14 text-right text-sm font-semibold text-ink">{clamped.toFixed(1)}%</span>
    </div>
  );
}

export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
