import clsx from 'clsx';
import {
  ArrowRight,
  BadgePercent,
  CalendarClock,
  CandlestickChart,
  CreditCard,
  Gauge,
  Landmark,
  LifeBuoy,
  MessageSquareText,
  Moon,
  PanelRightOpen,
  Receipt,
  ScrollText,
  Settings2,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Logo } from '../../components/layout/Layout';
import { backend } from '../../services';
import { useAuth } from '../../store/useAuth';
import { useStore, useToasts } from '../../store/useStore';

const NAV = [
  { to: '/admin', label: 'نمای کلی', icon: Gauge, end: true },
  { to: '/admin/users', label: 'کاربران', icon: Users },
  { to: '/admin/plans', label: 'پلن‌ها و اشتراک', icon: Receipt },
  { to: '/admin/payments', label: 'تراکنش‌ها', icon: CreditCard },
  { to: '/admin/discounts', label: 'کدهای تخفیف', icon: BadgePercent },
  { to: '/admin/gateways', label: 'درگاه‌های پرداخت', icon: Landmark },
  { to: '/admin/sms', label: 'پیامک', icon: MessageSquareText },
  { to: '/admin/tickets', label: 'تیکت‌ها', icon: LifeBuoy },
  { to: '/admin/news', label: 'تقویم اقتصادی', icon: CalendarClock },
  { to: '/admin/market', label: 'نمادها و داده‌ی بازار', icon: CandlestickChart },
  { to: '/admin/settings', label: 'تنظیمات سایت', icon: Settings2 },
  { to: '/admin/audit', label: 'گزارش فعالیت', icon: ScrollText },
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx('flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition', isActive ? 'bg-accent/15 text-ink' : 'text-muted hover:bg-raised/60 hover:text-ink')
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={18} strokeWidth={1.9} className={isActive ? 'text-accent-ink' : undefined} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="pointer-events-none fixed bottom-4 left-4 right-4 z-[60] flex flex-col items-center gap-2 sm:right-auto sm:items-start">
      {toasts.map((t) => (
        <button key={t.id} type="button" onClick={() => dismiss(t.id)} className="anim-pop pointer-events-auto flex items-center gap-2 rounded-xl border border-line bg-raised px-4 py-2.5 text-sm font-medium shadow-pop">
          <span className={clsx('h-2 w-2 rounded-full', t.tone === 'success' && 'bg-gain', t.tone === 'error' && 'bg-loss', t.tone === 'info' && 'bg-accent')} />
          {t.text}
        </button>
      ))}
    </div>
  );
}

/** Admin area: its own navigation, only for accounts with the admin role. */
export default function AdminLayout() {
  const session = useAuth((s) => s.session);
  const { theme, setTheme } = useStore();
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();
  useEffect(() => setDrawer(false), [location.pathname]);

  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (session.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-full flex-col bg-bg">
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-line/70 bg-side/95 px-3 backdrop-blur sm:px-4">
        <button type="button" className="icon-btn lg:hidden" onClick={() => setDrawer(true)} aria-label="منو">
          <PanelRightOpen size={19} />
        </button>
        <Logo />
        <span className="rounded-lg bg-accent/15 px-2 py-0.5 text-[12px] font-bold text-accent-ink">پنل مدیریت</span>
        {backend.mode === 'demo' && <span className="hidden rounded-lg bg-amber/15 px-2 py-0.5 text-[11px] font-semibold text-amber sm:inline">حالت نمایشی — داده‌ها در همین مرورگر</span>}
        <div className="ms-auto flex items-center gap-1">
          <Link to="/dashboard" className="btn-ghost py-1.5">
            <ArrowRight size={15} /> داشبورد کاربری
          </Link>
          <button type="button" className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'حالت روشن' : 'حالت تیره'}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-[248px] shrink-0 border-l border-line/70 bg-side lg:block">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
            <Nav />
          </div>
        </aside>
        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="anim-fade absolute inset-0 bg-black/60" onClick={() => setDrawer(false)} />
            <aside className="anim-pop absolute inset-y-0 right-0 w-[272px] max-w-[85vw] overflow-y-auto border-l border-line bg-side">
              <div className="flex h-14 items-center justify-between border-b border-line/70 px-4">
                <Logo />
                <button type="button" className="icon-btn" onClick={() => setDrawer(false)} aria-label="بستن منو">
                  <X size={18} />
                </button>
              </div>
              <Nav onNavigate={() => setDrawer(false)} />
            </aside>
          </div>
        )}
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
