import { Banknote, CreditCard, LifeBuoy, MessageSquareText, UserPlus, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from '../../components/ui/AppLink';
import { Loading, PageHeader, Stat, tomanFmt, tomanShort, useLoad } from '../../components/admin/kit';
import { useChartTheme } from '../../hooks/useChartTheme';
import { fmtDayShort } from '../../lib/calendar';
import { fmtNum } from '../../lib/format';
import { backend } from '../../services';
import { PAYMENT_METHOD_NAMES } from '../../services/types';

export default function AdminOverview() {
  const { data, loading, reload } = useLoad(() => backend.admin.stats());
  const p = useChartTheme();
  const tick = { fill: p.axis, fontSize: 11 };

  return (
    <>
      <PageHeader title="نمای کلی" text="وضعیت کاربران، فروش اشتراک و پشتیبانی در ۳۰ روز اخیر." onReload={reload} loading={loading} />
      {!data ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            <Stat label="کل کاربران" value={fmtNum(data.users)} icon={<Users size={15} />} />
            <Stat label="ثبت‌نام ۳۰ روز" value={fmtNum(data.newUsers30d)} icon={<UserPlus size={15} />} />
            <Stat label="اشتراک فعال" value={fmtNum(data.activeSubscriptions)} icon={<CreditCard size={15} />} />
            <Stat label="فروش ۳۰ روز" value={tomanShort(data.revenueMonth)} hint="تومان" icon={<Banknote size={15} />} tone="gain" />
            <Stat label="تیکت باز" value={fmtNum(data.openTickets)} icon={<LifeBuoy size={15} />} tone={data.openTickets ? 'amber' : undefined} />
            <Stat label="پیامک ۳۰ روز" value={fmtNum(data.smsMonth)} icon={<MessageSquareText size={15} />} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="card p-5">
              <h2 className="mb-1 text-sm font-bold">فروش روزانه</h2>
              <p className="num mb-3 text-xs text-faint">کل فروش تاکنون: {tomanFmt(data.revenueTotal)}</p>
              <div className="chart-ltr h-[220px]">
                <ResponsiveContainer>
                  <BarChart data={data.revenueByDay} margin={{ top: 6, right: 6, left: -4, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={p.grid} strokeDasharray="4 4" />
                    <XAxis dataKey="day" tickFormatter={fmtDayShort} tick={tick} tickLine={false} axisLine={{ stroke: p.grid }} minTickGap={24} />
                    <YAxis tickFormatter={(v) => tomanShort(v)} tick={tick} tickLine={false} axisLine={false} width={64} />
                    <Tooltip cursor={{ fill: p.cursor }} contentStyle={{ background: p.tooltipBg, border: `1px solid ${p.tooltipBorder}`, borderRadius: 12, direction: 'rtl' }} labelFormatter={fmtDayShort} formatter={(v: number) => [tomanFmt(v), 'فروش']} />
                    <Bar dataKey="amount" fill={p.accent} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className="card p-5">
              <h2 className="mb-1 text-sm font-bold">ثبت‌نام روزانه</h2>
              <p className="num mb-3 text-xs text-faint">{fmtNum(data.newUsers30d)} کاربر جدید در ۳۰ روز</p>
              <div className="chart-ltr h-[220px]">
                <ResponsiveContainer>
                  <BarChart data={data.signupsByDay} margin={{ top: 6, right: 6, left: -16, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={p.grid} strokeDasharray="4 4" />
                    <XAxis dataKey="day" tickFormatter={fmtDayShort} tick={tick} tickLine={false} axisLine={{ stroke: p.grid }} minTickGap={24} />
                    <YAxis allowDecimals={false} tick={tick} tickLine={false} axisLine={false} width={40} />
                    <Tooltip cursor={{ fill: p.cursor }} contentStyle={{ background: p.tooltipBg, border: `1px solid ${p.tooltipBorder}`, borderRadius: 12, direction: 'rtl' }} labelFormatter={fmtDayShort} formatter={(v: number) => [fmtNum(v), 'ثبت‌نام']} />
                    <Bar dataKey="count" fill={p.blue} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className="card p-5">
              <h2 className="mb-3 text-sm font-bold">فروش به تفکیک درگاه</h2>
              <ul className="flex flex-col gap-3">
                {[...data.byGateway]
                  .sort((a, b) => b.amount - a.amount)
                  .map((g) => {
                    const max = Math.max(...data.byGateway.map((x) => x.amount), 1);
                    return (
                      <li key={g.gateway}>
                        <div className="num mb-1 flex justify-between text-[13px]">
                          <span className="font-semibold">{PAYMENT_METHOD_NAMES[g.gateway]}</span>
                          <span className="text-muted">
                            {tomanFmt(g.amount)} · {fmtNum(g.count)} تراکنش
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-raised">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${(g.amount / max) * 100}%` }} />
                        </div>
                      </li>
                    );
                  })}
              </ul>
              <Link to="/admin/payments" className="mt-4 inline-block text-xs font-semibold text-accent-ink hover:underline">
                همه‌ی تراکنش‌ها ←
              </Link>
            </section>
            <section className="card p-5">
              <h2 className="mb-3 text-sm font-bold">کاربران فعال هر پلن</h2>
              <div className="grid items-center gap-4 sm:grid-cols-[180px_1fr]">
                <div className="chart-ltr h-[180px]">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={data.planMix} dataKey="count" nameKey="name" innerRadius="58%" outerRadius="88%" stroke={p.surface} strokeWidth={2} isAnimationActive={false}>
                        {data.planMix.map((x, i) => (
                          <Cell key={x.planId} fill={[p.axis, p.accent, p.blue, p.violet][i % 4]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: p.tooltipBg, border: `1px solid ${p.tooltipBorder}`, borderRadius: 12, direction: 'rtl' }} formatter={(v: number, n: string) => [fmtNum(v), n]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="flex flex-col gap-2 text-[13px]">
                  {data.planMix.map((x, i) => (
                    <li key={x.planId} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: [p.axis, p.accent, p.blue, p.violet][i % 4] }} />
                      {x.name}
                      <span className="num ms-auto font-semibold">{fmtNum(x.count)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
