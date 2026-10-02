import { create } from 'zustand';
import {
  DEMO_ACCOUNT,
  SESSION_KEY,
  clearSession,
  createSession,
  getSession,
  signup as signupUser,
  updateSessionName,
  verifyLogin,
  type Session,
} from '../lib/auth';
import { switchAccount } from './useStore';

interface AuthState {
  session: Session | null;
  login: (email: string, password: string, remember: boolean) => Promise<Session>;
  loginDemo: () => Promise<Session>;
  signup: (input: { name: string; email: string; password: string }, remember: boolean) => Promise<Session>;
  logout: () => void;
  rename: (name: string) => void;
}

// Make hashing feel deliberate and keep fast failures from flashing past.
const atLeast = async <T,>(ms: number, p: Promise<T>): Promise<T> => {
  const [v] = await Promise.all([p, new Promise((r) => setTimeout(r, ms))]);
  return v;
};

export const useAuth = create<AuthState>((set) => ({
  session: getSession(),

  login: async (email, password, remember) => {
    const user = await atLeast(450, verifyLogin(email, password));
    const s = createSession(user, remember);
    switchAccount(s);
    set({ session: s });
    return s;
  },

  loginDemo: async () => {
    const user = await atLeast(350, verifyLogin(DEMO_ACCOUNT.email, DEMO_ACCOUNT.password));
    const s = createSession(user, true);
    switchAccount(s);
    set({ session: s });
    return s;
  },

  signup: async (input, remember) => {
    const user = await atLeast(450, signupUser(input));
    const s = createSession(user, remember);
    switchAccount(s);
    set({ session: s });
    return s;
  },

  logout: () => {
    clearSession();
    switchAccount(null);
    set({ session: null });
  },

  rename: (name) => {
    updateSessionName(name);
    set({ session: getSession() });
  },
}));

// Signing in or out in another tab updates this one.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== SESSION_KEY && e.key !== null) return;
    const next = getSession();
    const prev = useAuth.getState().session;
    if (next?.userId === prev?.userId) return;
    switchAccount(next);
    useAuth.setState({ session: next });
  });
}
