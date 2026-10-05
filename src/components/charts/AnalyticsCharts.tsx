import { useId } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import { useChartTheme, type ChartPalette } from '../../hooks/useChartTheme';
import { fmtCompact, fmtNum, fmtPct, fmtUsd } from '../../lib/format';

/*
 * Analytics charts. Always left-to-right inside `.chart-ltr`. Profit and loss use green / red AND
 * position (above / below or right / left of zero) plus signed numbers, so polarity never relies on
 * color alone.
 */

const tick = (p: ChartPalette) => ({ fill: p.axis, fontSize: 11 });

type Row = { label: string; value: string; color?: string };

function TipBox({ title, rows, p }: { title: string; rows: Row[]; p: ChartPalette }) {
  return (
    <div dir="rtl" className="min-w-[150px] rounded-xl border px-3 py-2 text-xs shadow-pop" style={{ background: p.tooltipBg, borderColor: p.tooltipBorder, color: p.text }}>
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

function tip(p: ChartPalette, fn: (row: any) => { title: string; rows: Row[] }) {
  return ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null;
    return <TipBox p={p} {...fn(payload[0].payload)} />;
  };
}

const dateLabel = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' });
const dateTime = (ms: number) => new Date(ms).toISOString().slice(0, 16).replace('T', ' ');

// ---------- balance & equity over time ----------
export function BalanceEquityChart({ data, height = 280 }: { data: { time: number; balance: number; equity: number }[]; height?: number }) {
  const p = useChartTheme();
  const gid = useId().replace(/:/g, '');
  return (
    <div className="chart-ltr" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 8, left: -4, bottom: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={p.accent} stopOpacity={0.32} />
              <stop offset="100%" stopColor={p.accent} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={p.grid} strokeDasharray="4 4" />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={dateLabel}
            tick={tick(p)}
            tickLine={false}
            axisLine={{ stroke: p.grid }}
            minTickGap={40}
          />
          <YAxis domain={['auto', 'auto']} tickFormatter={fmtCompact} tick={tick(p)} tickLine={false} axisLine={false} width={58} />
          <Tooltip
            cursor={{ stroke: p.axis, strokeDasharray: '3 3' }}
            content={tip(p, (r) => ({
              title: dateTime(r.time),
              rows: [
                { label: 'اکوئیتی', value: fmtUsd(r.equity), color: p.line },
                { label: 'بالانس', value: fmtUsd(r.balance), color: p.axis },
              ],
            }))}
          />
          <Legend
            verticalAlign="top"
            align="right"
            height={26}
            iconType="plainline"
            formatter={(v) => <span style={{ color: p.text, fontSize: 12 }}>{v === 'equity' ? 'اکوئیتی' : 'بالانس'}</span>}
          />
          <Area
            type="monotone"
            dataKey="equity"
            stroke={p.line}
            strokeWidth={2}
            fill={`url(#${gid})`}
            dot={false}
            activeDot={{ r: 4, stroke: p.surface, strokeWidth: 2 }}
            isAnimationActive={false}
          />
          <Line type="stepAfter" dataKey="balance" stroke={p.axis} strokeWidth={1.5} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- daily P&L (signed bars) ----------
export function DailyPnlChart({ data, height = 280 }: { data: { day: string; pnl: number; count: number }[]; height?: number }) {
  const p = useChartTheme();
  return (
    <div className="chart-ltr" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: -4, bottom: 0 }} barCategoryGap={1}>
          <CartesianGrid vertical={false} stroke={p.grid} strokeDasharray="4 4" />
          <XAxis dataKey="day" tick={tick(p)} tickLine={false} axisLine={{ stroke: p.grid }} minTickGap={40} tickFormatter={(d: string) => d.slice(2, 7)} />
          <YAxis tickFormatter={fmtCompact} tick={tick(p)} tickLine={false} axisLine={false} width={58} />
          <ReferenceLine y={0} stroke={p.axis} strokeOpacity={0.7} />
          <Tooltip
            cursor={{ fill: p.cursor }}
            content={tip(p, (r) => ({
              title: r.day,
              rows: [
                { label: 'سود / زیان', value: fmtUsd(r.pnl, 2, true), color: r.pnl >= 0 ? p.gain : p.loss },
                { label: 'معاملات', value: fmtNum(r.count) },
              ],
            }))}
          />
          <Bar dataKey="pnl" maxBarSize={10} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.day} fill={d.pnl >= 0 ? p.gain : p.loss} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- sparkline ----------
export function Sparkline({ data, height = 56, signed }: { data: { i: number; v: number }[]; height?: number; signed?: boolean }) {
  const p = useChartTheme();
  const gid = useId().replace(/:/g, '');
  return (
    <div className="chart-ltr" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={p.line} stopOpacity={0.35} />
              <stop offset="100%" stopColor={p.line} stopOpacity={0} />
            </linearGradient>
          </defs>
          {signed && <ReferenceLine y={0} stroke={p.grid} />}
          <Tooltip
            cursor={{ stroke: p.axis, strokeDasharray: '3 3' }}
            content={tip(p, (r) => ({ title: `معامله ${fmtNum(r.i + 1)}`, rows: [{ label: 'مقدار', value: fmtNum(r.v, 2) }] }))}
          />
          <Area type="monotone" dataKey="v" stroke={p.line} strokeWidth={1.5} fill={`url(#${gid})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- side split donut ----------
export function SideDonut({ buys, sells, height = 220 }: { buys: number; sells: number; height?: number }) {
  const p = useChartTheme();
  const total = buys + sells || 1;
  const data = [
    { name: 'خرید', value: buys, color: p.gain },
    { name: 'فروش', value: sells, color: p.loss },
  ];
  return (
    <div className="chart-ltr relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={tip(p, (r) => ({ title: r.name, rows: [{ label: 'تعداد', value: `${fmtNum(r.value)} (${fmtPct((r.value / total) * 100, 1)})`, color: r.color }] }))} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="58%"
            outerRadius="82%"
            startAngle={90}
            endAngle={-270}
            stroke={p.surface}
            strokeWidth={2}
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center" dir="rtl">
        <span className="num text-lg font-bold">{fmtNum(buys + sells)}</span>
        <span className="text-[11px] text-muted">معامله</span>
      </div>
    </div>
  );
}

// ---------- win rate per side (two rings) ----------
export function SideWinRings({ buy, sell, height = 220 }: { buy: number; sell: number; height?: number }) {
  const p = useChartTheme();
  const ring = (v: number, color: string, name: string) => [
    { name, value: v, color },
    { name: `${name} (باخت)`, value: 100 - v, color: p.grid },
  ];
  return (
    <div className="chart-ltr" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={tip(p, (r) => ({ title: r.name, rows: [{ label: 'درصد', value: fmtPct(r.value, 1), color: r.color }] }))} />
          <Pie data={ring(buy, p.gain, 'وین‌ریت خرید')} dataKey="value" innerRadius="70%" outerRadius="84%" startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
            {ring(buy, p.gain, '').map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Pie
            data={ring(sell, p.loss, 'وین‌ریت فروش')}
            dataKey="value"
            innerRadius="50%"
            outerRadius="64%"
            startAngle={90}
            endAngle={-270}
            stroke="none"
            isAnimationActive={false}
          >
            {ring(sell, p.loss, '').map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- market-session radar ----------
export function SessionRadar({ data, format, height = 220 }: { data: { label: string; value: number }[]; format: (v: number) => string; height?: number }) {
  const p = useChartTheme();
  return (
    <div className="chart-ltr" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke={p.grid} />
          <PolarAngleAxis dataKey="label" tick={{ fill: p.text, fontSize: 11 }} />
          <PolarRadiusAxis tick={false} axisLine={false} />
          <Tooltip content={tip(p, (r) => ({ title: r.label, rows: [{ label: 'مقدار', value: format(r.value), color: p.accent }] }))} />
          <Radar dataKey="value" stroke={p.accent} strokeWidth={2} fill={p.accent} fillOpacity={0.28} dot={{ r: 3, fill: p.accent }} isAnimationActive={false} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- hour of day ----------
export function HourChart({
  data,
  mode,
  height = 260,
}: {
  data: { hour: number; gain: number; loss: number; avgR: number; pct: number; count: number }[];
  mode: 'pnl' | 'rr' | 'pct';
  height?: number;
}) {
  const p = useChartTheme();
  const label = (h: number) => `${String(h).padStart(2, '0')}:00`;
  const fmt = mode === 'pnl' ? (v: number) => fmtUsd(v, 0, true) : mode === 'rr' ? (v: number) => `${fmtNum(v, 2)}R` : (v: number) => fmtPct(v, 2);
  const key = mode === 'rr' ? 'avgR' : 'pct';
  return (
    <div className="chart-ltr" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: -4, bottom: 0 }} stackOffset="sign" barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke={p.grid} strokeDasharray="4 4" />
          <XAxis dataKey="hour" tickFormatter={label} tick={tick(p)} tickLine={false} axisLine={{ stroke: p.grid }} interval={1} />
          <YAxis tickFormatter={mode === 'pnl' ? fmtCompact : (v) => fmtNum(v, 1)} tick={tick(p)} tickLine={false} axisLine={false} width={52} />
          <ReferenceLine y={0} stroke={p.axis} strokeOpacity={0.7} />
          <Tooltip
            cursor={{ fill: p.cursor }}
            content={tip(p, (r) =>
              mode === 'pnl'
                ? {
                    title: `${label(r.hour)} · ${fmtNum(r.count)} معامله`,
                    rows: [
                      { label: 'سود', value: fmtUsd(r.gain, 0, true), color: p.gain },
                      { label: 'زیان', value: fmtUsd(r.loss, 0, true), color: p.loss },
                      { label: 'خالص', value: fmtUsd(r.gain + r.loss, 0, true) },
                    ],
                  }
                : {
                    title: `${label(r.hour)} · ${fmtNum(r.count)} معامله`,
                    rows: [{ label: mode === 'rr' ? 'میانگین R' : 'بازده', value: fmt(r[key]), color: r[key] >= 0 ? p.gain : p.loss }],
                  },
            )}
          />
          {mode === 'pnl' ? (
            <>
              <Bar dataKey="gain" stackId="s" fill={p.gain} radius={[4, 4, 0, 0]} maxBarSize={26} isAnimationActive={false} />
              <Bar dataKey="loss" stackId="s" fill={p.loss} radius={[0, 0, 4, 4]} maxBarSize={26} isAnimationActive={false} />
            </>
          ) : (
            <Bar dataKey={key} maxBarSize={26} radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.hour} fill={(d as any)[key] >= 0 ? p.gain : p.loss} radius={((d as any)[key] >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4]) as any} />
              ))}
            </Bar>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- weekday (horizontal, diverging) ----------
export function WeekdayChart({ data, height = 280 }: { data: { label: string; gain: number; loss: number; net: number; count: number }[]; height?: number }) {
  const p = useChartTheme();
  return (
    <div className="chart-ltr" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" stackOffset="sign" margin={{ top: 4, right: 12, left: 4, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid horizontal={false} stroke={p.grid} strokeDasharray="4 4" />
          <XAxis type="number" tickFormatter={(v) => fmtPct(v, 0)} tick={tick(p)} tickLine={false} axisLine={{ stroke: p.grid }} />
          <YAxis type="category" dataKey="label" tick={tick(p)} tickLine={false} axisLine={false} width={64} />
          <ReferenceLine x={0} stroke={p.axis} strokeOpacity={0.7} />
          <Tooltip
            cursor={{ fill: p.cursor }}
            content={tip(p, (r) => ({
              title: `${r.label} · ${fmtNum(r.count)} معامله`,
              rows: [
                { label: 'سود', value: fmtPct(r.gain, 2), color: p.gain },
                { label: 'زیان', value: fmtPct(r.loss, 2), color: p.loss },
                { label: 'خالص', value: fmtPct(r.net, 2) },
              ],
            }))}
          />
          <Bar dataKey="gain" stackId="w" fill={p.gain} radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false} />
          <Bar dataKey="loss" stackId="w" fill={p.loss} radius={[4, 0, 0, 4]} maxBarSize={22} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- monthly % bars (one year) ----------
export function MonthBars({ data, height = 200 }: { data: { label: string; value: number | null }[]; height?: number }) {
  const p = useChartTheme();
  return (
    <div className="chart-ltr" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: -4, bottom: 0 }} barCategoryGap="24%">
          <CartesianGrid vertical={false} stroke={p.grid} strokeDasharray="4 4" />
          <XAxis dataKey="label" tick={tick(p)} tickLine={false} axisLine={{ stroke: p.grid }} interval={0} />
          <YAxis tickFormatter={(v) => fmtPct(v, 0)} tick={tick(p)} tickLine={false} axisLine={false} width={48} />
          <ReferenceLine y={0} stroke={p.axis} strokeOpacity={0.7} />
          <Tooltip
            cursor={{ fill: p.cursor }}
            content={tip(p, (r) => ({
              title: r.label,
              rows: [{ label: 'بازده', value: r.value === null ? 'بدون معامله' : fmtPct(r.value, 2), color: (r.value ?? 0) >= 0 ? p.gain : p.loss }],
            }))}
          />
          <Bar dataKey="value" maxBarSize={30} radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.label} fill={(d.value ?? 0) >= 0 ? p.gain : p.loss} radius={((d.value ?? 0) >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4]) as any} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- Monte Carlo fan ----------
export function MonteCarloChart({
  bands,
  samples,
  start,
  height = 320,
}: {
  bands: { i: number; p5: number; p25: number; p50: number; p75: number; p95: number }[];
  samples: number[][];
  start: number;
  height?: number;
}) {
  const p = useChartTheme();
  const data = bands.map((b) => {
    const row: Record<string, number | number[]> = { i: b.i, outer: [b.p5, b.p95], inner: [b.p25, b.p75], p50: b.p50 };
    samples.forEach((s, k) => (row[`s${k}`] = s[b.i]));
    return row;
  });
  return (
    <div className="chart-ltr" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 8, left: -4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={p.grid} strokeDasharray="4 4" />
          <XAxis dataKey="i" tick={tick(p)} tickLine={false} axisLine={{ stroke: p.grid }} tickFormatter={(v) => fmtNum(v)} minTickGap={30} />
          <YAxis domain={['auto', 'auto']} tickFormatter={fmtCompact} tick={tick(p)} tickLine={false} axisLine={false} width={58} />
          <ReferenceLine y={start} stroke={p.axis} strokeDasharray="3 3" strokeOpacity={0.7} />
          <Tooltip
            cursor={{ stroke: p.axis, strokeDasharray: '3 3' }}
            content={tip(p, (r: any) => ({
              title: `بعد از ${fmtNum(r.i)} معامله`,
              rows: [
                { label: 'صدک ۹۵', value: fmtUsd(r.outer[1], 0) },
                { label: 'صدک ۷۵', value: fmtUsd(r.inner[1], 0) },
                { label: 'میانه', value: fmtUsd(r.p50, 0), color: p.accent },
                { label: 'صدک ۲۵', value: fmtUsd(r.inner[0], 0) },
                { label: 'صدک ۵', value: fmtUsd(r.outer[0], 0) },
              ],
            }))}
          />
          <Area dataKey="outer" stroke="none" fill={p.accent} fillOpacity={0.12} isAnimationActive={false} />
          <Area dataKey="inner" stroke="none" fill={p.accent} fillOpacity={0.22} isAnimationActive={false} />
          {samples.map((_, k) => (
            <Line key={k} dataKey={`s${k}`} stroke={p.axis} strokeOpacity={0.28} strokeWidth={1} dot={false} isAnimationActive={false} activeDot={false} />
          ))}
          <Line dataKey="p50" stroke={p.accent} strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
