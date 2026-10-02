import clsx from 'clsx';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  CirclePlay,
  Gauge,
  Layers,
  ListChecks,
  Menu,
  Moon,
  NotebookPen,
  ChartColumn,
  Sun,
  Target,
  X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GradientBars, SymbolBars } from '../components/charts/Charts';
import { ReplayDemo } from '../components/landing/ReplayDemo';
import { Logo } from '../components/layout/Layout';
import { fmtNum, fmtPct } from '../lib/format';
import { GROUP_LABELS, SYMBOLS, type SymbolGroup } from '../lib/market';
import { useAuth } from '../store/useAuth';
import { useStore } from '../store/useStore';

const NAV = [
  { id: 'features', label: 'امکانات' },
  { id: 'how', label: 'روش کار' },
  { id: 'markets', label: 'بازارها' },
  { id: 'pricing', label: 'تعرفه‌ها' },
  { id: 'faq', label: 'سوالات متداول' },
];

// Section links scroll in place; the router owns the URL hash.
const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

function SectionHead({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className="mb-3 text-[13px] font-bold tracking-wide text-accent">{eyebrow}</p>
      <h2 className="font-display text-[28px] font-extrabold leading-[1.5] sm:text-[34px]">{title}</h2>
      {text && <p className="mt-4 text-[15px] leading-8 text-muted">{text}</p>}
    </div>
  );
}

const FEATURES: { icon: ReactNode; title: string; text: string }[] = [
  {
    icon: <CirclePlay size={20} />,
    title: 'بازپخش کندل به کندل',
    text: 'بازار را از هر تاریخی که بخواهی دوباره پخش کن. توقف، جلو رفتن یک کندل یا یک روز، و سرعت تا ۸ برابر.',
  },
  {
    icon: <Target size={20} />,
    title: 'سفارش با ریسک و RR',
    text: 'درصد ریسک، حد ضرر بر حسب پیپ و نسبت ریسک به ریوارد را بده؛ حد سود و ضرر با حرکت قیمت خودکار اجرا می‌شوند.',
  },
  {
    icon: <Layers size={20} />,
    title: 'آمار جدا برای هر استراتژی',
    text: 'هر معامله به یک استراتژی وصل می‌شود. تعداد معاملات، وین‌ریت، RR میانگین و منحنی اکوئیتی هر کدام را جدا ببین.',
  },
  {
    icon: <ListChecks size={20} />,
    title: 'چک‌لیست قبل از ورود',
    text: 'شرایط ورودت را چک‌لیست کن. تا آیتم‌های الزامی تیک نخورند، دکمه‌ی خرید و فروش فعال نمی‌شود.',
  },
  {
    icon: <NotebookPen size={20} />,
    title: 'ژورنال معاملات',
    text: 'همه‌ی معاملات با فیلتر جلسه، استراتژی، نماد و نتیجه. برای هر معامله یادداشت بنویس که چرا وارد شدی.',
  },
  {
    icon: <ChartColumn size={20} />,
    title: 'آنالیز عملکرد',
    text: 'فاکتور سود، امید ریاضی، بیشترین افت سرمایه، عملکرد هر نماد و هر روز هفته، و مقایسه‌ی خرید با فروش.',
  },
];

const STEPS = [
  { title: 'یک جلسه بساز', text: 'نام، موجودی حساب، نمادها و بازه‌ی تاریخی را انتخاب کن. استراتژی و چک‌لیست هم اختیاری‌اند.' },
  { title: 'بازار را پخش کن و معامله کن', text: 'کندل به کندل جلو برو، ستاپ را پیدا کن و با ریسک مشخص وارد شو. آینده‌ی چارت را نمی‌بینی.' },
  { title: 'نتیجه را بخوان', text: 'داشبورد، ژورنال و آنالیز نشان می‌دهند استراتژی‌ات کجا جواب داده و کجا نه.' },
];

type Billing = 'monthly' | 'yearly';
const PLANS: { id: string; name: string; monthly: number; note: string; features: string[]; cta: string; featured?: boolean }[] = [
  {
    id: 'free',
    name: 'رایگان',
    monthly: 0,
    note: 'برای آشنایی با بک‌تست',
    features: ['۲ جلسه‌ی فعال', 'نمادهای اصلی فارکس', 'تایم‌فریم ۱۵ دقیقه به بالا', 'داشبورد و ژورنال پایه'],
    cta: 'شروع رایگان',
  },
  {
    id: 'plus',
    name: 'پیشرفته',
    monthly: 490,
    note: 'برای تمرین روزانه',
    features: ['۲۰ جلسه‌ی فعال', 'همه‌ی نمادهای فارکس و طلا', 'همه‌ی تایم‌فریم‌ها', 'استراتژی و چک‌لیست نامحدود', 'آنالیز کامل'],
    cta: 'انتخاب پیشرفته',
    featured: true,
  },
  {
    id: 'pro',
    name: 'حرفه‌ای',
    monthly: 890,
    note: 'برای تریدرهای جدی',
    features: ['جلسه‌ی نامحدود', 'شاخص‌ها و کریپتو', 'سرعت پخش تا ۸ برابر', 'خروجی ژورنال', 'پشتیبانی اولویت‌دار'],
    cta: 'انتخاب حرفه‌ای',
  },
];

const FAQ = [
  { q: 'بک‌تست دستی چه فرقی با بک‌تست خودکار دارد؟', a: 'در بک‌تست خودکار یک کد قوانین را اجرا می‌کند. در بک‌تست دستی خودت روی چارت تصمیم می‌گیری، همان کاری که در بازار واقعی می‌کنی. برای همین هم استراتژی را می‌سنجد و هم مهارت اجرای تو را.' },
  { q: 'آینده‌ی چارت را می‌بینم؟', a: 'نه. در هر لحظه فقط کندل‌هایی که تا زمان فعلی جلسه بسته شده‌اند نمایش داده می‌شوند، پس نمی‌توانی ناخواسته از آینده خبر داشته باشی.' },
  { q: 'به نصب برنامه نیاز دارم؟', a: 'نه. همه‌چیز در مرورگر اجرا می‌شود؛ روی کامپیوتر، تبلت و موبایل.' },
  { q: 'کدام بازارها پشتیبانی می‌شوند؟', a: `در حال حاضر ${fmtNum(SYMBOLS.length)} نماد در فارکس، طلا، شاخص‌های آمریکا و بیت‌کوین، با تایم‌فریم‌های ۵ دقیقه تا روزانه.` },
  { q: 'اگر از پلن پولی راضی نبودم چه؟', a: 'هر زمان بخواهی می‌توانی تمدید خودکار را لغو کنی. تا پایان دوره‌ای که پرداخت کرده‌ای دسترسی‌ات باقی می‌ماند.' },
  { q: 'تاریخ‌ها شمسی است یا میلادی؟', a: 'هر دو. انتخاب تاریخ جلسه را می‌توانی با تقویم شمسی یا میلادی انجام بدهی و تاریخ‌ها در سراسر پنل شمسی نمایش داده می‌شوند.' },
];

// Example data for the dashboard preview section.
const PREVIEW_TIME = [
  { label: 'شنبه', minutes: 34 },
  { label: 'یک', minutes: 52 },
  { label: 'دو', minutes: 18 },
  { label: 'سه', minutes: 0 },
  { label: 'چهار', minutes: 0 },
  { label: 'پنج', minutes: 106 },
  { label: 'جمعه', minutes: 47 },
];
const PREVIEW_SYMBOLS = [
  { symbol: 'EURUSD', count: 72 },
  { symbol: 'GBPJPY', count: 46 },
  { symbol: 'NQ', count: 38 },
  { symbol: 'XAUUSD', count: 21 },
];

function Price({ toman }: { toman: number }) {
  if (toman === 0) return <span className="font-display text-4xl font-extrabold">رایگان</span>;
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="num font-display text-4xl font-extrabold">{fmtNum(toman)}</span>
      <span className="text-sm text-muted">هزار تومان / ماه</span>
    </span>
  );
}

export default function Landing() {
  const { theme, setTheme } = useStore();
  const navigate = useNavigate();
  const session = useAuth((s) => s.session);
  const loginDemo = useAuth((s) => s.loginDemo);
  const [demoLoading, setDemoLoading] = useState(false);
  const [menu, setMenu] = useState(false);
  // signed-in visitors go straight to their dashboard
  const startTo = session ? '/dashboard' : '/signup';
  const startLabel = session ? 'ورود به داشبورد' : 'شروع رایگان';

  const openDemo = async () => {
    if (session) return navigate('/dashboard');
    setDemoLoading(true);
    try {
      await loginDemo();
      navigate('/dashboard');
    } catch {
      setDemoLoading(false);
      navigate('/login');
    }
  };
  const [billing, setBilling] = useState<Billing>('yearly');
  const [faq, setFaq] = useState<number | null>(0);

  const groups = Object.keys(GROUP_LABELS) as SymbolGroup[];

  return (
    <div className="min-h-full bg-bg">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <button key={n.id} type="button" onClick={() => goTo(n.id)} className="rounded-lg px-3 py-2 text-sm text-muted transition hover:text-ink">
                {n.label}
              </button>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-1.5">
            <button
              type="button"
              className="icon-btn"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'حالت روشن' : 'حالت تیره'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {!session && (
              <Link to="/login" className="btn-ghost hidden sm:inline-flex">
                ورود
              </Link>
            )}
            <Link to={startTo} className="btn-primary hidden rounded-full px-4 sm:inline-flex">
              {startLabel}
            </Link>
            <button type="button" className="icon-btn lg:hidden" onClick={() => setMenu((m) => !m)} aria-label="منو" aria-expanded={menu}>
              {menu ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        {menu && (
          <div className="anim-fade border-t border-line/60 px-4 pb-4 pt-2 lg:hidden">
            {NAV.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  setMenu(false);
                  goTo(n.id);
                }}
                className="block w-full rounded-lg px-3 py-2.5 text-start text-sm text-muted hover:bg-raised hover:text-ink"
              >
                {n.label}
              </button>
            ))}
            <div className={clsx('mt-2 grid gap-2', session ? 'grid-cols-1' : 'grid-cols-2')}>
              {!session && (
                <Link to="/login" className="btn-soft">
                  ورود
                </Link>
              )}
              <Link to={startTo} className="btn-primary">
                {startLabel}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 70% 0%, rgb(var(--accent) / 0.18), transparent 70%), radial-gradient(ellipse 40% 40% at 10% 30%, rgb(var(--violet) / 0.10), transparent 70%)',
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:pt-20">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 text-xs font-semibold text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-gain" />
              بازپخش بازار، کندل به کندل
            </p>
            <h1 className="font-display text-[34px] font-extrabold leading-[1.45] sm:text-[44px]">
              استراتژی‌ات را روی <span className="text-accent">گذشته‌ی بازار</span> امتحان کن، نه روی سرمایه‌ات.
            </h1>
            <p className="mt-6 max-w-xl text-[16px] leading-8 text-muted">
              بک‌تست‌لب داده‌ی تاریخی فارکس، طلا، شاخص‌ها و کریپتو را کندل به کندل برایت پخش می‌کند تا معامله کنی، ژورنال بنویسی و با عدد ببینی کدام استراتژی واقعاً جواب می‌دهد.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={startTo} className="btn-primary rounded-full px-6 py-3 text-[15px]">
                {startLabel} <ArrowLeft size={17} />
              </Link>
              {!session && (
                <button type="button" onClick={openDemo} disabled={demoLoading} className="btn-soft rounded-full px-6 py-3 text-[15px]">
                  {demoLoading ? 'در حال ورود…' : 'دیدن داشبورد نمونه'}
                </button>
              )}
            </div>
            <p className="mt-4 text-xs text-faint">{session ? `وارد شده با ${session.email}` : 'بدون کارت بانکی • پلن رایگان بدون محدودیت زمانی'}</p>
          </div>
          <ReplayDemo />
        </div>
      </section>

      {/* Product facts */}
      <section className="border-y border-line/60 bg-side/60">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4">
          {[
            { v: fmtNum(SYMBOLS.length), l: 'نماد در ۴ بازار' },
            { v: '۵', l: 'تایم‌فریم، از ۵ دقیقه تا روزانه' },
            { v: '۱۳۹۳', l: 'شروع داده‌ی تاریخی (۲۰۱۵)' },
            { v: '۸×', l: 'بیشترین سرعت پخش' },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <dt className="sr-only">{s.l}</dt>
              <dd className="num font-display text-3xl font-extrabold">{s.v}</dd>
              <dd className="mt-1 text-xs text-muted">{s.l}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
        <SectionHead eyebrow="امکانات" title="هر چیزی که برای تمرین جدی لازم داری" text="از پخش بازار تا ثبت معامله و تحلیل نتیجه، همه در یک پنل فارسی." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article key={f.title} className="card p-6 transition hover:border-accent/50">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">{f.icon}</span>
              <h3 className="text-base font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="bg-side/60 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="mb-3 text-[13px] font-bold tracking-wide text-accent">داشبورد</p>
            <h2 className="font-display text-[28px] font-extrabold leading-[1.5] sm:text-[34px]">پیشرفتت را هر روز ببین</h2>
            <p className="mt-4 text-[15px] leading-8 text-muted">
              زمانی که برای تمرین گذاشته‌ای، مقدار زمان بازاری که بازپخش کرده‌ای، وین‌ریت هر روز و معاملات هر نماد. رکورد روزانه هم کمک می‌کند تمرین را رها نکنی.
            </p>
            <ul className="mt-6 flex flex-col gap-3 text-sm">
              {['زمان صرف‌شده و زمان تاریخی بازپخش‌شده', 'وین‌ریت کل و وین‌ریت هر روز', 'نسبت معاملات خرید به فروش', 'خلاصه‌ی هر جلسه با منحنی اکوئیتی'].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gain/15 text-gain">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <button type="button" onClick={openDemo} disabled={demoLoading} className="btn-soft mt-8 rounded-full px-5 py-2.5">
              {session ? 'باز کردن داشبورد' : 'باز کردن داشبورد نمونه'} <ArrowLeft size={15} />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="card p-4">
              <p className="text-xs text-muted">زمان صرف‌شده</p>
              <p className="num mt-1 text-lg font-bold">۴ ساعت و ۱۷ دقیقه</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-muted">وین‌ریت کل</p>
              <p className="num mt-1 text-lg font-bold">{fmtPct(43.91)}</p>
              <div className="mt-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
                <div className="rounded-full bg-gain" style={{ width: '44%' }} />
                <div className="flex-1 rounded-full bg-loss" />
              </div>
            </div>
            <div className="card p-4 sm:col-span-2">
              <p className="mb-2 text-xs font-semibold">زمان صرف‌شده به تفکیک روز (دقیقه)</p>
              <GradientBars
                data={PREVIEW_TIME}
                dataKey="minutes"
                color="amber"
                yTicks={[0, 30, 60, 90, 120]}
                yFormat={(v) => fmtNum(v)}
                tipTitle={(r) => r.label}
                tipLabel="دقیقه"
                tipFormat={(v) => fmtNum(v)}
                height={170}
              />
            </div>
            <div className="card p-4 sm:col-span-2">
              <p className="mb-2 text-xs font-semibold">معاملات به تفکیک نماد</p>
              <SymbolBars data={PREVIEW_SYMBOLS} height={150} />
            </div>
            <p className="text-[11px] text-faint sm:col-span-2">اعداد این بخش نمونه هستند.</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
        <SectionHead eyebrow="روش کار" title="در سه قدم از ایده تا نتیجه" />
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-line/70 p-6">
              <span className="num font-display text-5xl font-extrabold text-accent/25">{fmtNum(i + 1)}</span>
              <h3 className="mt-3 text-base font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Markets */}
      <section id="markets" className="scroll-mt-20 bg-side/60 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHead eyebrow="بازارها" title="بازارهایی که معامله می‌کنی" text="داده‌ی تاریخی از دی ۱۳۹۳ تا دیروز، با کندل‌های ۵ دقیقه تا روزانه." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {groups.map((g) => (
              <div key={g} className="card p-5">
                <h3 className="mb-3 text-sm font-bold">{GROUP_LABELS[g]}</h3>
                <ul className="flex flex-wrap gap-1.5">
                  {SYMBOLS.filter((s) => s.group === g).map((s) => (
                    <li key={s.id} className="rounded-md bg-raised px-2 py-1 text-xs font-bold" dir="ltr" title={s.name}>
                      {s.id}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
        <SectionHead eyebrow="تعرفه‌ها" title="رایگان شروع کن، هر وقت لازم شد ارتقا بده" />
        <div className="mb-10 flex justify-center">
          <div className="inline-flex rounded-full border border-line bg-surface p-1 text-sm font-semibold">
            {(['monthly', 'yearly'] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBilling(b)}
                aria-pressed={billing === b}
                className={clsx('rounded-full px-5 py-2 transition', billing === b ? 'bg-accent text-white' : 'text-muted hover:text-ink')}
              >
                {b === 'monthly' ? 'ماهانه' : 'سالانه'}
                {b === 'yearly' && <span className={clsx('ms-2 text-xs', billing === b ? 'text-white/80' : 'text-gain')}>۲۰٪ تخفیف</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const price = billing === 'yearly' ? Math.round(plan.monthly * 0.8) : plan.monthly;
            return (
              <article
                key={plan.id}
                className={clsx('relative flex flex-col rounded-2xl border p-7', plan.featured ? 'border-accent bg-accent/[0.06] shadow-[0_0_0_1px_rgb(var(--accent))]' : 'border-line/70 bg-surface')}
              >
                {plan.featured && <span className="absolute -top-3 right-7 rounded-full bg-accent px-3 py-0.5 text-xs font-bold text-white">محبوب‌ترین</span>}
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="mb-5 mt-1 text-sm text-muted">{plan.note}</p>
                <Price toman={price} />
                <p className="num mt-1 h-5 text-xs text-faint">{plan.monthly > 0 && billing === 'yearly' ? `پرداخت سالانه: ${fmtNum(price * 12)} هزار تومان` : ''}</p>
                <ul className="my-7 flex flex-1 flex-col gap-3 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check size={16} className="shrink-0 text-gain" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to={startTo} className={clsx('rounded-full py-3', plan.featured ? 'btn-primary' : 'btn-soft')}>
                  {plan.cta}
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 bg-side/60 py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHead eyebrow="سوالات متداول" title="جواب سوال‌های رایج" />
          <div className="flex flex-col gap-2">
            {FAQ.map((item, i) => {
              const open = faq === i;
              return (
                <div key={item.q} className="card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setFaq(open ? null : i)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-4 px-5 py-4 text-start text-[15px] font-semibold"
                  >
                    <span className="flex-1">{item.q}</span>
                    <ChevronDown size={18} className={clsx('shrink-0 text-muted transition', open && 'rotate-180')} />
                  </button>
                  {open && <p className="anim-fade px-5 pb-5 text-sm leading-8 text-muted">{item.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div
          className="relative overflow-hidden rounded-3xl border border-line px-6 py-14 text-center sm:px-12"
          style={{ background: 'radial-gradient(ellipse 70% 90% at 50% 0%, rgb(var(--accent) / 0.22), transparent 70%), rgb(var(--surface))' }}
        >
          <Gauge size={30} className="mx-auto mb-5 text-accent" />
          <h2 className="font-display text-[26px] font-extrabold leading-[1.5] sm:text-[32px]">صد معامله‌ی بعدی را اول اینجا بزن</h2>
          <p className="mx-auto mt-3 max-w-lg text-[15px] leading-8 text-muted">قبل از اینکه پول واقعی را ریسک کنی، بدان استراتژی‌ات در صد معامله چه نتیجه‌ای می‌دهد.</p>
          <Link to={startTo} className="btn-primary mt-8 rounded-full px-7 py-3 text-[15px]">
            {startLabel} <ArrowLeft size={17} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-7 text-muted">پلتفرم بک‌تست دستی و تمرین معامله روی داده‌ی تاریخی، به زبان فارسی.</p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold">محصول</h3>
            <ul className="flex flex-col gap-2 text-sm text-muted">
              {NAV.slice(0, 4).map((n) => (
                <li key={n.id}>
                  <button type="button" onClick={() => goTo(n.id)} className="hover:text-ink">
                    {n.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold">پنل کاربری</h3>
            <ul className="flex flex-col gap-2 text-sm text-muted">
              {[
                { to: '/dashboard', l: 'داشبورد' },
                { to: '/strategies', l: 'استراتژی‌ها' },
                { to: '/checklists', l: 'چک‌لیست‌ها' },
                { to: '/journal', l: 'ژورنال' },
              ].map((x) => (
                <li key={x.to}>
                  <Link to={x.to} className="hover:text-ink">
                    {x.l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-line/60 py-5 text-center text-xs text-faint">
          © ۱۴۰۵ بک‌تست‌لب. بک‌تست نتیجه‌ی آینده را تضمین نمی‌کند؛ معامله در بازارهای مالی ریسک از دست دادن سرمایه دارد.
        </div>
      </footer>
    </div>
  );
}
