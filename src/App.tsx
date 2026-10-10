import { useEffect } from 'react';
import { BrowserRouter, MemoryRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { PageErrorBoundary } from './components/ui/ErrorBoundary';
import Analytics from './pages/Analytics';
import AuthPage from './pages/Auth';
import Billing from './pages/Billing';
import CardPay from './pages/CardPay';
import Checklists from './pages/Checklists';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Landing from './pages/Landing';
import Replay from './pages/Replay';
import SandboxPay from './pages/SandboxPay';
import Sessions from './pages/Sessions';
import Settings from './pages/Settings';
import Strategies from './pages/Strategies';
import Support from './pages/Support';
import AdminLogin from './pages/AdminLogin';
import { AdminActivity } from './pages/admin/Activity';
import AdminLayout from './pages/admin/AdminLayout';
import { AdminAnnouncements } from './pages/admin/Announcements';
import { AdminBacktestUser, AdminBacktests } from './pages/admin/Backtests';
import { AdminBlog, AdminBlogEditor } from './pages/admin/Blog';
import { AdminCards } from './pages/admin/Cards';
import { AdminDiscounts, AdminGateways, AdminPayments, AdminPlans } from './pages/admin/Commerce';
import AdminOverview from './pages/admin/Overview';
import { AdminAudit, AdminMarket, AdminNews, AdminSettings, AdminSms, AdminTickets } from './pages/admin/System';
import AdminUsers from './pages/admin/Users';
import { PREVIEW, showPendingToast } from './lib/nav';
import { backend } from './services';
import { startBacktestSync } from './services/backtestSync';
import { startWorkspaceSync, useSyncStatus } from './services/workspaceSync';
import { loadSiteConfig } from './services/marketFeed';
import { useAuth } from './store/useAuth';
import { useStore } from './store/useStore';
import { local } from './lib/storage';

// Clean addresses (/dashboard); every page change is a full page load (lib/nav, components/ui/AppLink).
// The hosted single-file preview runs in a sandboxed frame, so it routes in memory.
const Router = PREVIEW ? MemoryRouter : BrowserRouter;

function ThemeSync() {
  const theme = useStore((s) => s.theme);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    root.setAttribute('data-theme', theme);
    // index.html applies this before the first paint, so page loads do not flash the other theme
    local.setItem('btl:theme', theme);
  }, [theme]);
  return null;
}

/** Re-reads the account once per load so plan changes and bans made elsewhere apply; reads the site settings. */
function AccountSync() {
  useEffect(() => {
    void useAuth.getState().refresh();
    void loadSiteConfig();
    showPendingToast();
    // with the API server, the user's data lives there (the same in every browser and device);
    // the demo keeps it in this browser, with a copy for its admin panel
    if (backend.mode === 'server') startWorkspaceSync();
    else startBacktestSync();
  }, []);
  return null;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  // braces: newer browsers return a Promise from scrollTo, and an effect's return value must be a cleanup
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** Dashboard pages need a signed-in account; others are sent to the login page and brought back after. */
function AppShell() {
  const session = useAuth((s) => s.session);
  const firstLoad = useSyncStatus((s) => s.firstLoad);
  const location = useLocation();
  if (!session) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  // the first visit in this browser: the account's data comes from the server before the pages show
  if (firstLoad)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg text-muted" role="status">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
        <p className="text-sm">در حال دریافت داده‌های حساب…</p>
      </div>
    );
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default function App() {
  return (
    <Router>
      <ThemeSync />
      <AccountSync />
      <ScrollToTop />
      <PageErrorBoundary>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          {/* the admin panel's sign-in page: its address holds a secret key the server checks */}
          <Route path="/k/:key" element={<AdminLogin />} />
          <Route path="/forgot-password" element={<Navigate to="/login" replace />} />
          <Route path="/pay/sandbox" element={<SandboxPay />} />
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/strategies" element={<Strategies />} />
            <Route path="/checklists" element={<Checklists />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/billing/card" element={<CardPay />} />
            <Route path="/support" element={<Support />} />
            <Route path="/replay/:id" element={<Replay />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="backtests" element={<AdminBacktests />} />
            <Route path="backtests/:userId" element={<AdminBacktestUser />} />
            <Route path="activity" element={<AdminActivity />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="blog" element={<AdminBlog />} />
            <Route path="blog/:id" element={<AdminBlogEditor />} />
            <Route path="plans" element={<AdminPlans />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="discounts" element={<AdminDiscounts />} />
            <Route path="gateways" element={<AdminGateways />} />
            <Route path="cards" element={<AdminCards />} />
            <Route path="sms" element={<AdminSms />} />
            <Route path="tickets" element={<AdminTickets />} />
            <Route path="news" element={<AdminNews />} />
            <Route path="market" element={<AdminMarket />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="audit" element={<AdminAudit />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageErrorBoundary>
    </Router>
  );
}
