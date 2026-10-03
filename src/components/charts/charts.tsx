"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "@/lib/format";

/*
 * Shared chart primitives. Colors come from --chart-* tokens (validated for
 * color-vision deficiency and contrast in light and dark). Every chart has an
 * accessible summary and a hidden data table for screen readers.
 */

export type SeriesDef = { key: string; label: string; color?: 1 | 2 | 3 };

const color = (n: 1 | 2 | 3 = 1) => `var(--chart-${n})`;
const axisProps = {
  tick: { fill: "var(--muted-foreground)", fontSize: 12 },
  tickLine: false,
  axisLine: false,
} as const;

function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string; dataKey: string }[];
  label?: string;
  valueFormatter: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ background: p.color }} aria-hidden />
          {p.name}: <span className="font-semibold tabular-nums text-foreground">{valueFormatter(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

function DataTable<T extends Record<string, string | number>>({ data, xKey, series, caption }: { data: T[]; xKey: string; series: SeriesDef[]; caption: string }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{xKey}</th>
          {series.map((s) => (
            <th key={s.key} scope="col">{s.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            <td>{row[xKey]}</td>
            {series.map((s) => (
              <td key={s.key}>{row[s.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Change over time (one or two series). */
export function TimeSeriesChart<T extends Record<string, string | number>>({
  data,
  xKey,
  series,
  height = 240,
  ariaLabel,
  valueFormatter = formatNumber,
}: {
  data: T[];
  xKey: string;
  series: SeriesDef[];
  height?: number;
  ariaLabel: string;
  valueFormatter?: (v: number) => string;
}) {
  const id = React.useId().replace(/:/g, "");
  return (
    <figure aria-label={ariaLabel} className="w-full">
      <div style={{ height }} aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key} id={`${id}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color(s.color)} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={color(s.color)} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey={xKey} {...axisProps} minTickGap={24} />
            <YAxis {...axisProps} allowDecimals={false} width={44} />
            <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} cursor={{ stroke: "var(--border-strong)" }} />
            {series.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />}
            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={color(s.color)}
                strokeWidth={2}
                fill={`url(#${id}-${s.key})`}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <DataTable data={data} xKey={xKey} series={series} caption={ariaLabel} />
    </figure>
  );
}

/** Magnitude comparison across categories (horizontal bars read well on phones). */
export function BarListChart<T extends Record<string, string | number>>({
  data,
  labelKey,
  valueKey,
  valueLabel,
  ariaLabel,
  valueFormatter = formatNumber,
  max,
}: {
  data: T[];
  labelKey: string;
  valueKey: string;
  valueLabel: string;
  ariaLabel: string;
  valueFormatter?: (v: number) => string;
  max?: number;
}) {
  const height = Math.max(120, data.length * 36 + 16);
  return (
    <figure aria-label={ariaLabel} className="w-full">
      <div style={{ height }} aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, left: 0, bottom: 4 }} barCategoryGap={10}>
            <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
            <XAxis type="number" {...axisProps} domain={[0, max ?? "auto"]} allowDecimals={false} hide />
            <YAxis type="category" dataKey={labelKey} {...axisProps} width={150} tickFormatter={(v: string) => (v.length > 22 ? `${v.slice(0, 21)}…` : v)} />
            <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} cursor={{ fill: "var(--surface-muted)" }} />
            <Bar
              dataKey={valueKey}
              name={valueLabel}
              fill={color(1)}
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
              label={{ position: "right", fill: "var(--muted-foreground)", fontSize: 12, formatter: (v: unknown) => valueFormatter(Number(v)) }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTable data={data} xKey={labelKey} series={[{ key: valueKey, label: valueLabel }]} caption={ariaLabel} />
    </figure>
  );
}

/** Vertical bars for ordered buckets (e.g. score distribution, per-lesson completion). */
export function ColumnChart<T extends Record<string, string | number>>({
  data,
  xKey,
  series,
  height = 220,
  ariaLabel,
  valueFormatter = formatNumber,
}: {
  data: T[];
  xKey: string;
  series: SeriesDef[];
  height?: number;
  ariaLabel: string;
  valueFormatter?: (v: number) => string;
}) {
  return (
    <figure aria-label={ariaLabel} className="w-full">
      <div style={{ height }} aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={2}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey={xKey} {...axisProps} minTickGap={8} />
            <YAxis {...axisProps} allowDecimals={false} width={44} />
            <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} cursor={{ fill: "var(--surface-muted)" }} />
            {series.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />}
            {series.map((s) => (
              <Bar key={s.key} dataKey={s.key} name={s.label} fill={color(s.color)} radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTable data={data} xKey={xKey} series={series} caption={ariaLabel} />
    </figure>
  );
}
