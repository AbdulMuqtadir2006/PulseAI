import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea } from "recharts";
import { statusMeta, metricMeta } from "../../lib/format";

function LiveDot({ cx, cy, index, dataLength, color }) {
  if (cx == null || cy == null || index !== dataLength - 1) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={3.5} fill="none" stroke={color} strokeOpacity="0.6">
        <animate attributeName="r" values="3.5;11;3.5" dur="2s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values="0.55;0;0.55" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r={3.5} fill={color} stroke="#0A0710" strokeWidth={1.5} />
    </g>
  );
}

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-teal/20 bg-ink/95 px-3 py-2 shadow-card backdrop-blur">
      <p className="font-mono text-[11px] text-white/55">{label}</p>
      <p className="font-mono text-sm font-semibold text-white">
        {payload[0].value}
        {unit ? ` ${unit}` : ""}
      </p>
    </div>
  );
}

export function TrendChart({ metricKey, data, range, unit, status }) {
  const meta = metricMeta[metricKey];
  const color = statusMeta[status]?.color ?? statusMeta.good.color;
  const gid = `area-${metricKey}`;

  const values = data.map((d) => d.value);
  const dataMin = Math.min(...values, range[0]);
  const dataMax = Math.max(...values, range[1]);
  const pad = (dataMax - dataMin) * 0.15 || 1;

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-white">{meta.label}</h3>
        <span className="font-mono text-[11px] text-white/40">
          ref {range[0]}–{range[1]}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart key={`${data.length}:${data[data.length - 1]?.value}`} data={data} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#ffffff" strokeOpacity={0.06} vertical={false} />
            <ReferenceArea
              y1={range[0]}
              y2={range[1]}
              fill="#1FD8AA"
              fillOpacity={0.06}
              stroke="#1FD8AA"
              strokeOpacity={0.15}
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: "rgba(255,255,255,0.35)", fontFamily: "JetBrains Mono" }}
              tickLine={false}
              axisLine={{ stroke: "#ffffff22" }}
              minTickGap={24}
            />
            <YAxis
              domain={[Math.floor(dataMin - pad), Math.ceil(dataMax + pad)]}
              tick={{ fontSize: 11, fill: "rgba(255,255,255,0.35)", fontFamily: "JetBrains Mono" }}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip content={<ChartTooltip unit={unit} />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.25}
              fill={`url(#${gid})`}
              dot={<LiveDot dataLength={data.length} color={color} />}
              activeDot={{ r: 4, fill: color, stroke: "#0A0710", strokeWidth: 2 }}
              isAnimationActive
              animationDuration={1100}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
