import { HashRouter, MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Analytics from './pages/Analytics';
import Checklists from './pages/Checklists';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Replay from './pages/Replay';
import Sessions from './pages/Sessions';
import Settings from './pages/Settings';
import Strategies from './pages/Strategies';

// The hosted single-file preview runs in a sandboxed frame, so it routes in memory.
const Router = import.meta.env.MODE === 'artifact' ? MemoryRouter : HashRouter;

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/strategies" element={<Strategies />} />
          <Route path="/checklists" element={<Checklists />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/replay/:id" element={<Replay />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
