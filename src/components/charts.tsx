import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { brl, compact } from "../lib/utils";

const axisProps = {
  stroke: "var(--line-strong)",
  tickLine: false,
  axisLine: false,
  tick: { fill: "var(--faint)", fontSize: 11 },
} as const;

const tooltipStyle = {
  contentStyle: {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: 14,
    boxShadow: "var(--shadow-pop)",
    fontSize: 12,
    color: "var(--ink)",
    padding: "8px 12px",
  },
  labelStyle: { color: "var(--muted)", fontSize: 11, marginBottom: 4 },
  itemStyle: { color: "var(--ink)", fontSize: 12, padding: 0 },
} as const;

export interface SeriesDef {
  key: string;
  label: string;
  color: string;
  format?: "currency" | "number" | "percent";
}

function formatValue(value: number, format?: SeriesDef["format"]): string {
  if (format === "currency") return brl(value);
  if (format === "percent") return `${value.toFixed(0)}%`;
  return compact(value);
}

export function TrendArea({
  data,
  series,
  xKey = "label",
  height = 240,
}: {
  data: Array<Record<string, number | string>>;
  series: SeriesDef[];
  xKey?: string;
  height?: number;
}) {
  const id = React.useId();
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`${id}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.42} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="4 6" vertical={false} />
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis
            {...axisProps}
            width={54}
            tickFormatter={(value: number) => compact(value)}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(value: number, name: string) => {
              const def = series.find((s) => s.key === name);
              return [formatValue(Number(value), def?.format), def?.label ?? name];
            }}
          />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={2.2}
              fill={`url(#${id}-${s.key})`}
              activeDot={{ r: 4, strokeWidth: 0 }}
              animationDuration={900}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarsGroup({
  data,
  series,
  xKey = "label",
  height = 240,
  stacked,
}: {
  data: Array<Record<string, number | string>>;
  series: SeriesDef[];
  xKey?: string;
  height?: number;
  stacked?: boolean;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="4 6" vertical={false} />
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} width={54} tickFormatter={(value: number) => compact(value)} />
          <Tooltip
            {...tooltipStyle}
            cursor={{ fill: "color-mix(in oklab, var(--muted) 10%, transparent)" }}
            formatter={(value: number, name: string) => {
              const def = series.find((s) => s.key === name);
              return [formatValue(Number(value), def?.format), def?.label ?? name];
            }}
          />
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              stackId={stacked ? "a" : undefined}
              fill={s.color}
              radius={stacked ? 0 : [6, 6, 2, 2]}
              maxBarSize={34}
              animationDuration={900}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Donut({
  data,
  height = 220,
  centerLabel,
  centerSub,
  format = "currency",
  showLegend = true,
}: {
  data: Array<{ label: string; value: number; color: string }>;
  height?: number;
  centerLabel?: string;
  centerSub?: string;
  format?: SeriesDef["format"];
  showLegend?: boolean;
}) {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  return (
    <div className="relative w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={3}
            stroke="none"
            animationDuration={900}
          >
            {data.map((item) => (
              <Cell key={item.label} fill={item.color} />
            ))}
          </Pie>
          <Tooltip
            {...tooltipStyle}
            formatter={(value: number, name: string) => [
              formatValue(Number(value), format),
              String(name),
            ]}
          />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ color: "var(--muted)", fontSize: 11.5 }}>{value}</span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      {centerLabel && (
        <div className="pointer-events-none absolute inset-x-0 top-[36%] text-center">
          <p className="num font-display text-lg font-bold">{centerLabel}</p>
          {centerSub && <p className="label-xs mt-0.5">{centerSub}</p>}
        </div>
      )}
      {!centerLabel && total === 0 && (
        <p className="absolute inset-0 grid place-items-center text-[12.5px] text-faint">
          Sem dados ainda
        </p>
      )}
    </div>
  );
}
