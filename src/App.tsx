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
import AdminLayout from './pages/admin/AdminLayout';
import { AdminCards } from './pages/admin/Cards';
import { AdminDiscounts, AdminGateways, AdminPayments, AdminPlans } from './pages/admin/Commerce';
import AdminOverview from './pages/admin/Overview';
import { AdminAudit, AdminMarket, AdminNews, AdminSettings, AdminSms, AdminTickets } from './pages/admin/System';
import AdminUsers from './pages/admin/Users';
import { PREVIEW, showPendingToast } from './lib/nav';
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
  }, []);
  return null;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

/** Dashboard pages need a signed-in account; others are sent to the login page and brought back after. */
function AppShell() {
  const session = useAuth((s) => s.session);
  const location = useLocation();
  if (!session) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
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
