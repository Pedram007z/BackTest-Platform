import { useEffect } from 'react';
import { HashRouter, MemoryRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Analytics from './pages/Analytics';
import AuthPage from './pages/Auth';
import Checklists from './pages/Checklists';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Landing from './pages/Landing';
import Replay from './pages/Replay';
import Sessions from './pages/Sessions';
import Settings from './pages/Settings';
import Strategies from './pages/Strategies';
import { useAuth } from './store/useAuth';
import { useStore } from './store/useStore';

// The hosted single-file preview runs in a sandboxed frame, so it routes in memory.
const Router = import.meta.env.MODE === 'artifact' ? MemoryRouter : HashRouter;

function ThemeSync() {
  const theme = useStore((s) => s.theme);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    root.setAttribute('data-theme', theme);
  }, [theme]);
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
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
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
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/forgot-password" element={<Navigate to="/login" replace />} />
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/strategies" element={<Strategies />} />
          <Route path="/checklists" element={<Checklists />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/replay/:id" element={<Replay />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
