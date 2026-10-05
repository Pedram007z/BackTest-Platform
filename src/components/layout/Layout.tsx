import clsx from 'clsx';
import {
  ChartColumn,
  CheckCheck,
  CreditCard,
  House,
  Layers,
  LifeBuoy,
  List,
  LogOut,
  Moon,
  NotebookPen,
  PanelRightClose,
  PanelRightOpen,
  Settings,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Link, NavLink } from '../ui/AppLink';
import { diffDays } from '../../lib/calendar';
import { fmtNum } from '../../lib/format';
import { planDaysLeft } from '../../lib/stats';
import { useAuth } from '../../store/useAuth';
import { toast, useStore, useToasts } from '../../store/useStore';
import { Avatar } from '../ui/Avatar';
import { Meter } from '../ui/controls';

const NAV = [
  { to: '/dashboard', label: 'داشبورد', icon: House, end: true },
  { to: '/sessions', label: 'جلسات', icon: List },
  { to: '/strategies', label: 'استراتژی‌ها', icon: Layers },
  { to: '/checklists', label: 'چک‌لیست‌ها', icon: CheckCheck },
  { to: '/journal', label: 'ژورنال', icon: NotebookPen },
  { to: '/analytics', label: 'آنالیز', icon: ChartColumn },
];

const ACCOUNT_NAV = [
  { to: '/billing', label: 'اشتراک و پرداخت', icon: CreditCard },
  { to: '/support', label: 'پشتیبانی', icon: LifeBuoy },
  { to: '/settings', label: 'تنظیمات حساب', icon: Settings },
];

export function Logo() {
  return (
    <div className="flex items-center gap-2 select-none">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
        <rect x="1" y="1" width="24" height="24" rx="7" fill="rgb(var(--accent))" />
        <rect x="6" y="13" width="2.6" height="7" rx="1" fill="#fff" opacity="0.55" />
        <rect x="10.2" y="9" width="2.6" height="11" rx="1" fill="#fff" opacity="0.8" />
        <path d="M15.5 8.2v9.6l6-4.8z" fill="#fff" />
      </svg>
      <span className="text-[17px] font-extrabold tracking-tight">
        بک‌تست<span className="text-accent">لب</span>
      </span>
    </div>
  );
}

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const user = useStore((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const isAdmin = useAuth((s) => s.session?.role === 'admin');
  const navigate = useNavigate();
  const left = planDaysLeft(user.plan.endsAt);
  const total = Math.max(1, diffDays(user.plan.startedAt, user.plan.endsAt));
  const remaining = left / total;

  return (
    <div className="flex h-full flex-col">
      <nav className="flex flex-col gap-1 p-3">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition',
                collapsed && 'justify-center px-0',
                isActive ? 'bg-raised text-ink' : 'text-muted hover:bg-raised/60 hover:text-ink',
              )
            }
          >
            <Icon size={18} strokeWidth={1.9} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-line/70 p-3">
        {[...ACCOUNT_NAV, ...(isAdmin ? [{ to: '/admin', label: 'پنل مدیریت', icon: ShieldCheck }] : [])].map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              clsx(
                'mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition',
                collapsed && 'justify-center px-0',
                isActive ? 'bg-raised text-ink' : clsx('hover:bg-raised/60 hover:text-ink', to === '/admin' ? 'text-accent-ink' : 'text-muted'),
              )
            }
          >
            <Icon size={18} strokeWidth={1.9} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/login', { replace: true, state: { notice: 'از حساب خارج شدید.' } });
            toast('از حساب خارج شدید', 'info');
          }}
          title={collapsed ? 'خروج از حساب' : undefined}
          className={clsx(
            'mb-3 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium text-muted transition hover:bg-loss/10 hover:text-loss',
            collapsed && 'justify-center px-0',
          )}
        >
          <LogOut size={18} strokeWidth={1.9} />
          {!collapsed && <span>خروج از حساب</span>}
        </button>

        {/* Profile + subscription */}
        <NavLink to="/settings" onClick={onNavigate} className={clsx('block rounded-xl bg-raised/70 transition hover:bg-raised', collapsed ? 'p-2' : 'p-3')}>
          <div className={clsx('flex items-center gap-3', collapsed && 'justify-center')}>
            <Avatar user={user} size={collapsed ? 36 : 42} />
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{user.name}</p>
                <p className="truncate text-xs text-muted">{user.plan.name}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted">روزهای باقی‌مانده</span>
                <span className="num font-bold">{fmtNum(left)} روز</span>
              </div>
              <Meter value={remaining} tone={remaining < 0.2 ? 'loss' : remaining < 0.4 ? 'amber' : 'gain'} />
            </div>
          )}
          {collapsed && <Meter value={remaining} className="mt-2" tone={remaining < 0.2 ? 'loss' : 'gain'} />}
        </NavLink>
      </div>
    </div>
  );
}

function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="pointer-events-none fixed bottom-4 left-4 right-4 z-[60] flex flex-col items-center gap-2 sm:right-auto sm:items-start">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismiss(t.id)}
          className={clsx('anim-pop pointer-events-auto flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium shadow-pop', 'border-line bg-raised text-ink')}
        >
          <span className={clsx('h-2 w-2 rounded-full', t.tone === 'success' && 'bg-gain', t.tone === 'error' && 'bg-loss', t.tone === 'info' && 'bg-accent')} />
          {t.text}
        </button>
      ))}
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { theme, setTheme, sidebarCollapsed, toggleSidebar } = useStore();
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();

  useEffect(() => setDrawer(false), [location.pathname]);

  return (
    <div className="flex min-h-full flex-col bg-bg">
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-line/70 bg-side/95 px-3 backdrop-blur sm:px-4">
        <button type="button" className="icon-btn hidden lg:inline-flex" onClick={toggleSidebar} aria-label={sidebarCollapsed ? 'باز کردن منو' : 'جمع کردن منو'}>
          {sidebarCollapsed ? <PanelRightOpen size={19} /> : <PanelRightClose size={19} />}
        </button>
        <button type="button" className="icon-btn lg:hidden" onClick={() => setDrawer(true)} aria-label="منو">
          <PanelRightOpen size={19} />
        </button>
        <Link to="/" aria-label="صفحه اصلی">
          <Logo />
        </Link>
        <button
          type="button"
          className="icon-btn ms-auto"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? 'حالت روشن' : 'حالت تیره'}
          title={theme === 'dark' ? 'حالت روشن' : 'حالت تیره'}
        >
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>
      </header>

      <div className="flex flex-1">
        <aside className={clsx('hidden shrink-0 border-l border-line/70 bg-side transition-[width] duration-200 lg:block', sidebarCollapsed ? 'w-[76px]' : 'w-[248px]')}>
          <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
            <SidebarContent collapsed={sidebarCollapsed} />
          </div>
        </aside>

        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="anim-fade absolute inset-0 bg-black/60" onClick={() => setDrawer(false)} />
            <aside className="anim-pop absolute inset-y-0 right-0 flex w-[272px] max-w-[85vw] flex-col border-l border-line bg-side">
              <div className="flex h-14 items-center justify-between border-b border-line/70 px-4">
                <Logo />
                <button type="button" className="icon-btn" onClick={() => setDrawer(false)} aria-label="بستن منو">
                  <X size={18} />
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <SidebarContent collapsed={false} onNavigate={() => setDrawer(false)} />
              </div>
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
