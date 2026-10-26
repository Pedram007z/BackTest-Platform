import clsx from 'clsx';
import {
  ArrowLeft,
  CalendarClock,
  ChartColumn,
  Check,
  ChevronDown,
  CirclePlay,
  Clock3,
  CreditCard,
  Gauge,
  LayoutGrid,
  ListChecks,
  Menu,
  MessageSquareText,
  Moon,
  NotebookPen,
  Smartphone,
  Sun,
  Target,
  X,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { AnnouncementPopup } from '../components/AnnouncementPopup';
import { Link } from '../components/ui/AppLink';
import { GradientBars, SymbolBars } from '../components/charts/Charts';
import { MarketsSection } from '../components/landing/MarketsSection';
import { ReplayDemo } from '../components/landing/ReplayDemo';
import { BlogTeaser } from '../components/landing/BlogTeaser';
import { Logo } from '../components/brand/Brand';
import { fmtDayLong } from '../lib/calendar';
import { faDigits, fmtNum, fmtPct } from '../lib/format';
import { DATA_START, GROUP_LABELS, SYMBOLS, TIMEFRAMES } from '../lib/market';
import { backend } from '../services';
import { hasServer } from '../services/api';
import { DEFAULT_PLANS } from '../services/localBackend';
import type { Plan } from '../services/types';
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
    title: 'بازپخش روی چارت TradingView',
    text: 'از هر تاریخی شروع کن و کندل به کندل جلو برو؛ با نوار پخش شناور، سرعت تا ۲۰ کندل در ثانیه و بدون دیدن آینده‌ی چارت.',
  },
  {
    icon: <Target size={20} />,
    title: 'ابزار پوزیشن مثل TradingView',
    text: 'ورود، حد ضرر و حد سود را روی چارت بکش. نوع سفارش (مارکت، لیمیت، استاپ) و حجم لات از درصد ریسک خودکار حساب می‌شود.',
  },
  {
    icon: <CalendarClock size={20} />,
    title: 'تقویم اقتصادی ForexFactory',
    text: 'خبرهای مهم روی چارت علامت می‌خورند. فیلتر کشور و اهمیت داری و عدد واقعی هر خبر تا زمان انتشارش مخفی می‌ماند.',
  },
  {
    icon: <LayoutGrid size={20} />,
    title: 'تا ۴ چارت هم‌زمان',
    text: 'چند نماد یا چند تایم‌فریم را کنار هم ببین. حالت تمام‌صفحه فقط چارت، خرید و فروش و نوار پخش را نگه می‌دارد.',
  },
  {
    icon: <Clock3 size={20} />,
    title: 'پرش به سشن‌ها به وقت تهران',
    text: 'یک کلیک تا باز شدن سشن لندن یا نیویورک. زمان‌های دلخواهت را هم با نام و ساعت خودت ذخیره کن.',
  },
  {
    icon: <NotebookPen size={20} />,
    title: 'ژورنال با اسکرین‌شات',
    text: 'برای هر معامله عکس چارت، چک‌لیست، میزان اطمینان، امتیاز ستاره‌ای و یادداشت ثبت کن و بعداً با فیلتر پیدایش کن.',
  },
  {
    icon: <ListChecks size={20} />,
    title: 'چک‌لیست و استراتژی',
    text: 'شرایط ورود را چک‌لیست کن؛ تا آیتم‌های الزامی تیک نخورند معامله ثبت نمی‌شود. آمار هر استراتژی جدا نگه داشته می‌شود.',
  },
  {
    icon: <ChartColumn size={20} />,
    title: 'آنالیز و مونت‌کارلو',
    text: 'RR واقعی و ایده‌آل، عملکرد هر سشن و ساعت و روز هفته، تقویم سود و زیان و شبیه‌سازی مونت‌کارلو برای آینده‌ی حساب.',
  },
];

const STEPS = [
  { title: 'یک جلسه بساز', text: 'نام، موجودی حساب، نمادها و بازه‌ی تاریخی را انتخاب کن. استراتژی و چک‌لیست هم اختیاری‌اند.' },
  { title: 'بازار را پخش کن و معامله کن', text: 'کندل به کندل جلو برو، ستاپ را پیدا کن و با ریسک مشخص وارد شو. آینده‌ی چارت را نمی‌بینی.' },
  { title: 'نتیجه را بخوان', text: 'داشبورد، ژورنال و آنالیز نشان می‌دهند استراتژی‌ات کجا جواب داده و کجا نه.' },
];

const FAQ = [
  {
    q: 'بک‌تست دستی چه فرقی با بک‌تست خودکار دارد؟',
    a: 'در بک‌تست خودکار یک کد قوانین را اجرا می‌کند. در بک‌تست دستی خودت روی چارت تصمیم می‌گیری، همان کاری که در بازار واقعی می‌کنی. برای همین هم استراتژی را می‌سنجد و هم مهارت اجرای تو را.',
  },
  {
    q: 'آینده‌ی چارت را می‌بینم؟',
    a: 'نه. در هر لحظه فقط کندل‌هایی که تا زمان فعلی جلسه بسته شده‌اند نمایش داده می‌شوند. عدد واقعی خبرهای اقتصادی هم تا لحظه‌ی انتشارشان مخفی است.',
  },
  {
    q: 'کدام بازارها پشتیبانی می‌شوند؟',
    a: `${fmtNum(SYMBOLS.length)} نماد: جفت‌ارزهای اصلی، فرعی و اگزوتیک فارکس، طلا و نقره، نفت و گاز، شاخص‌های آمریکا، اروپا و آسیا و ارزهای دیجیتال اصلی؛ با تایم‌فریم‌های ۱ ثانیه تا روزانه.`,
  },
  { q: 'ثبت‌نام چطور است؟', a: 'فقط با شماره موبایل. کد تأیید با پیامک می‌آید و نیازی به ایمیل یا رمز عبور نیست.' },
  {
    q: 'پرداخت چطور انجام می‌شود؟',
    a: 'با همه‌ی کارت‌های عضو شتاب از طریق درگاه‌های شاپرکی (زرین‌پال، زیبال و…). تمدید خودکار نداریم؛ هر وقت خواستی پلن بعدی را بخر و روزهای باقی‌مانده‌ات به آن اضافه می‌شود.',
  },
  { q: 'به نصب برنامه نیاز دارم؟', a: 'نه. همه‌چیز در مرورگر اجرا می‌شود؛ روی کامپیوتر، تبلت و موبایل. اگر بخواهید، اپلیکیشن اندروید را نصب کنید یا سایت را از منوی مرورگر روی صفحه‌ی اصلی گوشی اضافه کنید. داده‌هایتان در حساب شما ذخیره می‌شود و در همه‌ی دستگاه‌ها یکی است.' },
  { q: 'ساعت‌ها و تاریخ‌ها به چه وقتی است؟', a: 'ساعت‌ها به وقت تهران و تاریخ‌ها شمسی نمایش داده می‌شوند. انتخاب تاریخ جلسه را می‌توانی با تقویم شمسی یا میلادی انجام بدهی.' },
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

/** Price per month, the full amount, and how much a longer plan saves against paying monthly. Fixed height so cards line up. */
function Price({ plan, monthly }: { plan: Plan; monthly?: number }) {
  const months = Math.max(1, Math.round(plan.durationDays / 30));
  const perMonth = plan.priceToman / months;
  const saved = monthly && months > 1 && plan.priceToman > 0 ? monthly * months - plan.priceToman : 0;
  return (
    <div className="min-h-[96px]">
      {plan.priceToman === 0 ? (
        <span className="block font-display text-4xl font-extrabold leading-[48px]">رایگان</span>
      ) : (
        <span className="flex items-baseline gap-1.5 leading-[48px]">
          <span className="num font-display text-4xl font-extrabold">{fmtNum(Math.round(perMonth / 1000))}</span>
          <span className="text-sm text-muted">هزار تومان / ماه</span>
        </span>
      )}
      <p className="num mt-1 text-xs text-faint">
        {plan.priceToman === 0 ? 'بدون محدودیت زمانی' : months > 1 ? `${fmtNum(plan.priceToman / 1000)} هزار تومان برای ${fmtNum(months)} ماه` : 'پرداخت ماه به ماه'}
      </p>
      {saved > 0 && <span className="num mt-2 inline-flex rounded-full bg-gain/15 px-2.5 py-0.5 text-[11px] font-bold text-gain">{fmtNum(saved / 1000)} هزار تومان صرفه‌جویی</span>}
    </div>
  );
}

export default function Landing() {
  const { theme, setTheme } = useStore();
  const session = useAuth((s) => s.session);
  const [menu, setMenu] = useState(false);
  // signed-in visitors go straight to their dashboard
  const startTo = session ? '/dashboard' : '/signup';
  const startLabel = session ? 'ورود به داشبورد' : 'شروع رایگان';

  const [faq, setFaq] = useState<number | null>(0);
  // Prices come from the admin panel; the defaults show until they load.
  const [plans, setPlans] = useState<Plan[]>(() => DEFAULT_PLANS.filter((p) => p.active));
  useEffect(() => {
    backend
      .plans()
      .then((p) => p.length && setPlans(p))
      .catch(() => undefined);
  }, []);
  const monthly = plans.find((p) => p.priceToman > 0 && Math.round(p.durationDays / 30) === 1)?.priceToman;
  const planTo = session ? '/billing' : '/signup';

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
            {hasServer && (
              <a href="/blog" className="rounded-lg px-3 py-2 text-sm text-muted transition hover:text-ink">
                بلاگ
              </a>
            )}
          </nav>
          <div className="ms-auto flex items-center gap-1.5">
            <button type="button" className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'حالت روشن' : 'حالت تیره'}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {!session && (
              <Link to="/login" className="btn-ghost hidden sm:inline-flex">
                <Smartphone size={16} /> ورود با موبایل
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
            {hasServer && (
              <a href="/blog" className="block w-full rounded-lg px-3 py-2.5 text-start text-sm text-muted hover:bg-raised hover:text-ink">
                بلاگ
              </a>
            )}
            <div className={clsx('mt-2 grid gap-2', session ? 'grid-cols-1' : 'grid-cols-2')}>
              {!session && (
                <Link to="/login" className="btn-soft">
                  ورود با موبایل
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
              بازپخش بازار روی چارت TradingView
            </p>
            <h1 className="font-display text-[34px] font-extrabold leading-[1.45] sm:text-[44px]">
              استراتژی‌ات را روی <span className="text-accent">گذشته‌ی بازار</span> امتحان کن، نه روی سرمایه‌ات.
            </h1>
            <p className="mt-6 max-w-xl text-[16px] leading-8 text-muted">
              بک‌تست‌لب داده‌ی تاریخی فارکس، طلا، نفت، شاخص‌ها و کریپتو را کندل به کندل برایت پخش می‌کند، همراه با خبرهای اقتصادی همان روز، تا معامله کنی، ژورنال بنویسی و با عدد
              ببینی کدام استراتژی واقعاً جواب می‌دهد.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={startTo} className="btn-primary rounded-full px-6 py-3 text-[15px]">
                {startLabel} <ArrowLeft size={17} />
              </Link>
            </div>
          </div>
          <ReplayDemo />
        </div>
      </section>

      {/* Product facts */}
      <section className="border-y border-line/60 bg-side/60">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4">
          {[
            { v: fmtNum(SYMBOLS.length), l: `نماد در ${fmtNum(Object.keys(GROUP_LABELS).length)} بازار` },
            { v: fmtNum(TIMEFRAMES.length), l: 'تایم‌فریم، از ۱ ثانیه تا روزانه' },
            { v: faDigits(DATA_START.slice(0, 4)), l: `شروع داده‌ی تاریخی (${fmtDayLong(DATA_START)})` },
            { v: '۴', l: 'چارت هم‌زمان در یک صفحه' },
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
        <SectionHead eyebrow="امکانات" title="هر چیزی که برای تمرین جدی لازم داری" text="از پخش بازار و خبرها تا ثبت معامله و تحلیل نتیجه، همه در یک پنل فارسی." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <article key={f.title} className="card group p-6 transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-glow">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent-ink transition group-hover:bg-accent group-hover:text-white">
                {f.icon}
              </span>
              <h3 className="text-base font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Made for Iran */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div
          className="grid gap-6 rounded-3xl border border-accent/30 p-6 sm:p-8 md:grid-cols-4"
          style={{ background: 'linear-gradient(135deg, rgb(var(--accent) / 0.14), rgb(var(--violet) / 0.06) 60%, transparent)' }}
        >
          <div className="md:col-span-1">
            <p className="text-[13px] font-bold text-accent-ink">ساخته‌شده برای ایران</p>
            <h2 className="mt-2 font-display text-xl font-extrabold leading-9">بدون VPN، بدون ارز، بدون دردسر</h2>
          </div>
          {[
            { icon: <MessageSquareText size={18} />, t: 'ورود با پیامک', d: 'ثبت‌نام و ورود فقط با شماره موبایل و کد یک‌بار مصرف.' },
            { icon: <CreditCard size={18} />, t: 'پرداخت ریالی', d: 'خرید اشتراک با کارت‌های شتابی از درگاه‌های شاپرکی.' },
            { icon: <Clock3 size={18} />, t: 'وقت تهران و تاریخ شمسی', d: 'سشن‌ها، خبرها و گزارش‌ها به ساعت و تقویم خودمان.' },
          ].map((x) => (
            <div key={x.t} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white">{x.icon}</span>
              <div>
                <h3 className="text-sm font-bold">{x.t}</h3>
                <p className="mt-1 text-[13px] leading-6 text-muted">{x.d}</p>
              </div>
            </div>
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
            <Link to={startTo} className="btn-soft mt-8 rounded-full px-5 py-2.5">
              {session ? 'باز کردن داشبورد' : 'شروع رایگان'} <ArrowLeft size={15} />
            </Link>
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
      <MarketsSection />

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
        <SectionHead eyebrow="تعرفه‌ها" title="رایگان شروع کن، هر وقت لازم شد ارتقا بده" text="قیمت‌ها به تومان است. هر خرید به روزهای باقی‌مانده‌ی اشتراک فعلی‌ات اضافه می‌شود." />
        <div className={clsx('grid gap-4 sm:grid-cols-2', plans.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
          {plans.map((plan) => {
            const featured = !!plan.badge && plan.badge.includes('محبوب');
            return (
              <article
                key={plan.id}
                className={clsx(
                  'relative flex flex-col rounded-2xl border p-6',
                  featured ? 'border-accent bg-accent/[0.07] shadow-[0_0_0_1px_rgb(var(--accent)),0_24px_60px_-30px_rgb(var(--accent)/0.7)]' : 'border-line/70 bg-surface',
                )}
              >
                {plan.badge && (
                  <span
                    className={clsx(
                      'absolute -top-3 right-6 rounded-full px-3 py-0.5 text-xs font-bold',
                      featured ? 'bg-accent text-white' : 'bg-raised text-accent-ink ring-1 ring-accent/40',
                    )}
                  >
                    {plan.badge}
                  </span>
                )}
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="mb-5 mt-1 min-h-[40px] text-sm leading-6 text-muted">{plan.description}</p>
                <Price plan={plan} monthly={monthly} />
                <ul className="my-6 flex flex-1 flex-col gap-3 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check size={16} className="mt-1 shrink-0 text-gain" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to={plan.priceToman === 0 ? startTo : planTo} className={clsx('rounded-full py-3', featured ? 'btn-primary' : 'btn-soft')}>
                  {plan.priceToman === 0 ? (session ? 'ورود به داشبورد' : 'شروع رایگان') : session ? 'خرید اشتراک' : 'ثبت‌نام و خرید'}
                </Link>
              </article>
            );
          })}
        </div>
        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-faint">
          <CreditCard size={14} /> پرداخت امن از طریق درگاه‌های شاپرکی · بدون تمدید خودکار
        </p>
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

      {/* Latest blog posts (with the server) */}
      <BlogTeaser />

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
              {hasServer && (
                <li>
                  <a href="/blog" className="hover:text-ink">
                    بلاگ
                  </a>
                </li>
              )}
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
      <AnnouncementPopup where="site" />
    </div>
  );
}
