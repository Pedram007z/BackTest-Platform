import { useId } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import { useChartTheme, type ChartPalette } from '../../hooks/useChartTheme';
import { fmtCompact, fmtNum, fmtPct, fmtUsd } from '../../lib/format';

/* All charts render left-to-right inside `.chart-ltr`, as in the original design. */

const tick = (p: ChartPalette) => ({ fill: p.axis, fontSize: 11 });

function TipBox({ title, rows, p }: { title: string; rows: { label: string; value: string; color?: string }[]; p: ChartPalette }) {
  return (
    <div
      dir="rtl"
      className="rounded-lg border px-3 py-2 text-xs shadow-pop"
      style={{ background: p.tooltipBg, borderColor: p.tooltipBorder, color: p.text }}
    >
      <p className="mb-1 font-bold">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center gap-2">
          {r.color && <span className="h-2 w-2 rounded-sm" style={{ background: r.color }} />}
          <span style={{ color: p.axis }}>{r.label}</span>
          <span className="num ms-auto font-semibold">{r.value}</span>
        </p>
      ))}
    </div>
  );
}

function makeTip(p: ChartPalette, fn: (payload: any) => { title: string; rows: { label: string; value: string; color?: string }[] }) {
  return ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null;
    return <TipBox p={p} {...fn(payload[0].payload)} />;
  };
}

// ---------- vertical gradient bars (time invested / win rate) ----------
export function GradientBars({
  data,
  dataKey,
  color,
  yTicks,
  yFormat,
  tipTitle,
  tipLabel,
  tipFormat,
  height = 210,
}: {
  data: { label: string; [k: string]: number | string }[];
  dataKey: string;
  color: 'amber' | 'blue';
  yTicks: number[];
  yFormat: (v: number) => string;
  tipTitle: (row: any) => string;
  tipLabel: string;
  tipFormat: (v: number) => string;
  height?: number;
}) {
  const p = useChartTheme();
  const gid = useId().replace(/:/g, '');
  const top = color === 'amber' ? p.amber : p.blue;
  const bottom = color === 'amber' ? p.amberDeep : p.blueDeep;
  const domainMax = yTicks[yTicks.length - 1];

  return (
    <div className="chart-ltr" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 6, left: -6, bottom: 0 }} barCategoryGap="22%">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={top} stopOpacity={1} />
              <stop offset="100%" stopColor={bottom} stopOpacity={0.9} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={p.grid} strokeDasharray="4 4" />
          <XAxis dataKey="label" tick={tick(p)} tickLine={false} axisLine={{ stroke: p.grid }} interval="preserveStartEnd" minTickGap={4} />
          <YAxis
            ticks={yTicks}
            domain={[0, domainMax]}
            tickFormatter={yFormat}
            tick={tick(p)}
            tickLine={false}
            axisLine={false}
            width={52}
            allowDataOverflow
          />
          <Tooltip
            cursor={{ fill: p.cursor }}
            content={makeTip(p, (row) => ({ title: tipTitle(row), rows: [{ label: tipLabel, value: tipFormat(row[dataKey]), color: top }] }))}
          />
          <Bar dataKey={dataKey} fill={`url(#${gid})`} radius={[4, 4, 0, 0]} minPointSize={2} maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- horizontal bars (trades by symbol) ----------
export function SymbolBars({ data, height }: { data: { symbol: string; count: number }[]; height?: number }) {
  const p = useChartTheme();
  const gid = useId().replace(/:/g, '');
  const h = height ?? Math.max(160, data.length * 34 + 40);
  return (
    <div className="chart-ltr" style={{ height: h }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }} barCategoryGap="28%">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={p.violetDeep} stopOpacity={0.95} />
              <stop offset="100%" stopColor={p.violet} stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid horizontal={false} stroke={p.grid} strokeDasharray="4 4" />
          <XAxis type="number" tick={tick(p)} tickLine={false} axisLine={{ stroke: p.grid }} tickFormatter={(v) => fmtNum(v)} allowDecimals={false} />
          <YAxis type="category" dataKey="symbol" tick={tick(p)} tickLine={false} axisLine={false} width={74} />
          <Tooltip
            cursor={{ fill: p.cursor }}
            content={makeTip(p, (row) => ({ title: row.symbol, rows: [{ label: 'تعداد معاملات', value: fmtNum(row.count), color: p.violet }] }))}
          />
          <Bar dataKey="count" fill={`url(#${gid})`} radius={[0, 4, 4, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- equity curve ----------
export function EquityArea({
  data,
  height = 190,
  baseline,
  compact,
}: {
  data: { i: number; equity: number; label?: string }[];
  height?: number;
  baseline?: number;
  compact?: boolean;
}) {
  const p = useChartTheme();
  const gid = useId().replace(/:/g, '');
  const last = data[data.length - 1]?.equity ?? 0;
  const first = data[0]?.equity ?? 0;
  const up = last >= first;
  const stroke = compact ? (up ? p.gain : p.loss) : p.line;

  return (
    <div className="chart-ltr" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: compact ? 8 : -4, bottom: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {!compact && <CartesianGrid vertical={false} stroke={p.grid} strokeDasharray="4 4" />}
          <XAxis dataKey="i" hide={compact} tick={tick(p)} tickLine={false} axisLine={{ stroke: p.grid }} tickFormatter={(v) => fmtNum(v)} minTickGap={28} />
          <YAxis
            hide={compact}
            domain={['auto', 'auto']}
            tick={tick(p)}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmtCompact}
            width={54}
          />
          {baseline !== undefined && <ReferenceLine y={baseline} stroke={p.axis} strokeDasharray="3 3" strokeOpacity={0.6} />}
          <Tooltip
            cursor={{ stroke: p.axis, strokeDasharray: '3 3' }}
            content={makeTip(p, (row) => ({
              title: row.label ?? `معامله ${fmtNum(row.i)}`,
              rows: [{ label: 'موجودی', value: fmtUsd(row.equity), color: stroke }],
            }))}
          />
          <Area type="monotone" dataKey="equity" stroke={stroke} strokeWidth={2} fill={`url(#${gid})`} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: p.surface }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- signed P&L bars (monthly = horizontal, daily = vertical) ----------
export function PnlBars({
  data,
  layout,
  height = 190,
}: {
  data: { label: string; pnl: number; title?: string }[];
  layout: 'horizontal' | 'vertical';
  height?: number;
}) {
  const p = useChartTheme();
  const vertical = layout === 'vertical'; // recharts "vertical" = horizontal bars
  const tip = makeTip(p, (row) => ({
    title: row.title ?? row.label,
    rows: [{ label: 'سود / زیان', value: fmtUsd(row.pnl, 2, true), color: row.pnl >= 0 ? p.gain : p.loss }],
  }));

  return (
    <div className="chart-ltr" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={layout} margin={{ top: 8, right: 10, left: vertical ? 0 : -4, bottom: 0 }} barCategoryGap="26%">
          <CartesianGrid vertical={vertical} horizontal={!vertical} stroke={p.grid} strokeDasharray="4 4" />
          {vertical ? (
            <>
              <XAxis type="number" tick={tick(p)} tickLine={false} axisLine={{ stroke: p.grid }} tickFormatter={fmtCompact} />
              <YAxis type="category" dataKey="label" tick={tick(p)} tickLine={false} axisLine={false} width={56} />
            </>
          ) : (
            <>
              <XAxis dataKey="label" tick={tick(p)} tickLine={false} axisLine={{ stroke: p.grid }} interval={0} />
              <YAxis tick={tick(p)} tickLine={false} axisLine={false} tickFormatter={fmtCompact} width={54} />
            </>
          )}
          {vertical ? <ReferenceLine x={0} stroke={p.axis} strokeOpacity={0.7} /> : <ReferenceLine y={0} stroke={p.axis} strokeOpacity={0.7} />}
          <Tooltip cursor={{ fill: p.cursor }} content={tip} />
          <Bar dataKey="pnl" maxBarSize={vertical ? 22 : 30} radius={vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell
                key={d.label}
                fill={d.pnl >= 0 ? p.gain : p.loss}
                // round the outer end of negative bars too
                radius={(d.pnl >= 0 ? (vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]) : vertical ? [4, 0, 0, 4] : [0, 0, 4, 4]) as any}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- simple categorical bars (analytics) ----------
export function ValueBars({
  data,
  format = (v: number) => fmtNum(v),
  height = 220,
  signed,
  pct,
}: {
  data: { label: string; value: number; hint?: string }[];
  format?: (v: number) => string;
  height?: number;
  signed?: boolean;
  pct?: boolean;
}) {
  const p = useChartTheme();
  return (
    <div className="chart-ltr" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }} barCategoryGap="26%">
          <CartesianGrid vertical={false} stroke={p.grid} strokeDasharray="4 4" />
          <XAxis dataKey="label" tick={tick(p)} tickLine={false} axisLine={{ stroke: p.grid }} interval={0} />
          <YAxis
            tick={tick(p)}
            tickLine={false}
            axisLine={false}
            width={54}
            domain={pct ? [0, 100] : ['auto', 'auto']}
            tickFormatter={pct ? (v) => fmtPct(v, 0) : fmtCompact}
          />
          {signed && <ReferenceLine y={0} stroke={p.axis} strokeOpacity={0.7} />}
          <Tooltip
            cursor={{ fill: p.cursor }}
            content={makeTip(p, (row) => ({
              title: row.label,
              rows: [
                { label: 'مقدار', value: format(row.value), color: signed ? (row.value >= 0 ? p.gain : p.loss) : p.blue },
                ...(row.hint ? [{ label: 'توضیح', value: row.hint }] : []),
              ],
            }))}
          />
          <Bar dataKey="value" maxBarSize={36} radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.label} fill={signed ? (d.value >= 0 ? p.gain : p.loss) : p.blue} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
