import { Award, ChartNoAxesColumn, CircleCheck, Flame, Plus } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { GradientBars, SymbolBars } from '../components/charts/Charts';
import { SessionList } from '../components/sessions/SessionList';
import { SessionModal } from '../components/sessions/SessionModal';
import { InfoTip } from '../components/ui/controls';
import { fmtDayLong, fmtDayShort, localDayKey } from '../lib/calendar';
import { fmtLongDuration, fmtMinutes, fmtNum, fmtPct } from '../lib/format';
import { lastDays, streakDays, summarize, tradesBySymbol, winRateByDay } from '../lib/stats';
import { useStore } from '../store/useStore';

function Tile({ title, icon, info, children, className = '' }: { title: string; icon?: ReactNode; info: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card relative flex flex-col p-5 ${className}`}>
      <div className="mb-3 flex items-start gap-2">
        <h3 className="flex items-center gap-2 text-[13px] font-semibold text-ink/90">
          {icon && <span className="text-muted">{icon}</span>}
          {title}
        </h3>
        <span className="ms-auto">
          <InfoTip text={info} />
        </span>
      </div>
      {children}
    </section>
  );
}

function niceTicks(max: number, steps: number[]): number[] {
  const step = steps.find((s) => max <= s * 4) ?? steps[steps.length - 1];
  const top = Math.max(step * 4, Math.ceil(max / step) * step);
  return Array.from({ length: top / step + 1 }, (_, i) => i * step);
}

export default function Dashboard() {
  const { user, trades, sessions, dailySeconds, replayedMs } = useStore();
  const [creating, setCreating] = useState(false);

  const today = localDayKey();
  const days = lastDays(8, today);
  const summary = useMemo(() => summarize(trades), [trades]);
  const totalMinutes = Object.values(dailySeconds).reduce((a, b) => a + b, 0) / 60;
  const streak = streakDays(dailySeconds);

  const timeByDay = days.map((d) => ({ label: fmtDayShort(d), day: d, minutes: Math.round((dailySeconds[d] ?? 0) / 60) }));
  const timeTicks = niceTicks(Math.max(...timeByDay.map((d) => d.minutes), 1), [15, 30, 60, 120]);
  const winByDay = winRateByDay(trades, days).map((d) => ({ ...d, label: fmtDayShort(d.day) }));
  const bySymbol = useMemo(() => tradesBySymbol(trades), [trades]);
  const buyPct = trades.length ? (summary.buys / trades.length) * 100 : 50;

  const recent = [...sessions].sort((a, b) => (b.lastOpenedAt ?? b.createdAt) - (a.lastOpenedAt ?? a.createdAt));

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="relative mb-7 flex flex-wrap items-start justify-between gap-4">
        <div className="relative">
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="mt-0.5 text-sm text-faint">{fmtDayLong(today, 'jalali', true)}</p>
        </div>
        <div className="relative flex items-center gap-3">
          {/* a soft glow centred on the streak, fading the same way on both sides */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-10 -inset-y-6"
            style={{ background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgb(var(--accent) / 0.2), transparent 100%)' }}
          />
          <div className="relative text-end">
            <p className="text-sm font-bold">{streak > 0 ? `${fmtNum(streak)} روز پشت سر هم بک‌تست گرفته‌اید!` : 'رکورد روزانه‌ی شما صفر است'}</p>
            <p className="text-xs text-muted">هر روز بک‌تست بگیرید تا رکوردتان صفر نشود.</p>
          </div>
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-amber/15 text-amber">
            <Flame size={22} />
          </span>
        </div>
      </header>

      {/* Stat grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile title="زمان صرف‌شده" icon={<ChartNoAxesColumn size={16} />} info="مجموع زمانی که در صفحه‌ی چارت مشغول بک‌تست بوده‌اید.">
          <p className="num text-[22px] font-bold">{fmtMinutes(totalMinutes)}</p>
        </Tile>
        <Tile title="زمان تاریخی بازپخش‌شده" icon={<CircleCheck size={16} />} info="مقدار زمان بازاری که در همه‌ی جلسات جلو برده‌اید.">
          <p className="num text-[22px] font-bold">{fmtLongDuration(replayedMs)}</p>
        </Tile>

        <Tile
          title="زمان صرف‌شده به تفکیک روز (دقیقه)"
          info="دقیقه‌های تمرین در ۸ روز اخیر."
          className="sm:col-span-2 lg:row-span-2"
        >
          <div className="flex-1">
            <GradientBars
              data={timeByDay}
              dataKey="minutes"
              color="amber"
              yTicks={timeTicks}
              yFormat={(v) => fmtNum(v)}
              tipTitle={(r) => fmtDayLong(r.day, 'jalali', true)}
              tipLabel="زمان"
              tipFormat={(v) => fmtMinutes(v)}
              height={230}
            />
          </div>
        </Tile>

        <Tile title="معاملات انجام‌شده" info="تعداد کل معاملات و نسبت خرید به فروش.">
          <p className="num text-[22px] font-bold">{fmtNum(trades.length)}</p>
          <div className="mt-3 flex h-1.5 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={`${fmtPct(buyPct)} خرید`}>
            <div className="rounded-full bg-gain" style={{ width: `${buyPct}%` }} />
            <div className="flex-1 rounded-full bg-loss" />
          </div>
          <p className="num mt-2 text-[11px]">
            <span className="text-gain">{fmtPct(buyPct)} خرید</span>
            <span className="mx-1.5 text-faint">•</span>
            <span className="text-loss">{fmtPct(100 - buyPct)} فروش</span>
          </p>
        </Tile>
        <Tile title="وین‌ریت کل" icon={<Award size={16} />} info="درصد معاملات بسته‌شده با سود.">
          <p className="num text-[22px] font-bold">{fmtPct(summary.winRate)}</p>
          <p className="num mt-1 text-xs text-muted">
            {fmtNum(summary.wins)} برد از {fmtNum(summary.total)} معامله
          </p>
        </Tile>

        <Tile title="وین‌ریت به تفکیک روز" info="درصد برد معاملاتی که در هر روز بسته شده‌اند." className="sm:col-span-2">
          <GradientBars
            data={winByDay}
            dataKey="winRate"
            color="blue"
            yTicks={[0, 20, 40, 60, 80, 100]}
            yFormat={(v) => fmtPct(v, 0)}
            tipTitle={(r) => `${fmtDayLong(r.day, 'jalali', true)} — ${fmtNum(r.trades)} معامله`}
            tipLabel="وین‌ریت"
            tipFormat={(v) => fmtPct(v)}
            height={220}
          />
        </Tile>
        <Tile title="معاملات به تفکیک نماد" info="تعداد معاملات انجام‌شده روی هر نماد." className="sm:col-span-2">
          {bySymbol.length ? <SymbolBars data={bySymbol} height={220} /> : <p className="py-16 text-center text-sm text-muted">هنوز معامله‌ای ثبت نشده.</p>}
        </Tile>
      </div>

      {/* Recent sessions */}
      <div className="mb-3 mt-10 flex items-center justify-between">
        <h2 className="text-base font-bold">جلسات اخیر</h2>
        <button type="button" className="btn-primary rounded-full px-4 py-1.5" onClick={() => setCreating(true)}>
          <Plus size={16} /> جلسه جدید
        </button>
      </div>
      <SessionList sessions={recent} emptyText="هنوز جلسه‌ای نساخته‌اید. با «جلسه جدید» اولین بک‌تست را شروع کنید." />

      <SessionModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
