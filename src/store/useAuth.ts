import { create } from 'zustand';
import { SESSION_KEY, clearSession, createSession, getSession, updateSession, type Session } from '../lib/auth';
import { backend, BackendError, type AuthResult, type OtpRequest } from '../services';
import type { AccountUser } from '../services/types';
import { switchAccount, useStore } from './useStore';

interface AuthState {
  session: Session | null;
  requestOtp: (phone: string) => Promise<OtpRequest>;
  verifyOtp: (phone: string, code: string, name: string | undefined, remember: boolean) => Promise<AuthResult>;
  loginDemo: () => Promise<Session>;
  logout: () => void;
  rename: (name: string) => Promise<void>;
  /** Re-read the account from the backend (plan, role or ban changed). */
  refresh: () => Promise<void>;
}

/** Copy the account's name, phone and subscription into the dashboard data. */
async function applyAccount(user: AccountUser) {
  let planName = user.planId;
  try {
    planName = (await backend.plans()).find((p) => p.id === user.planId)?.name ?? planName;
  } catch {
    /* keep the id */
  }
  useStore.getState().updateUser({ name: user.name, phone: user.phone, plan: { id: user.planId, name: planName, startedAt: user.planStartedAt, endsAt: user.planEndsAt } });
}

function signIn(set: (p: Partial<AuthState>) => void, res: AuthResult, remember: boolean): Session {
  const s = createSession(res.user, res.token, remember);
  switchAccount(s);
  void applyAccount(res.user);
  set({ session: s });
  return s;
}

export const useAuth = create<AuthState>((set, get) => ({
  session: getSession(),

  requestOtp: (phone) => backend.requestOtp(phone),

  verifyOtp: async (phone, code, name, remember) => {
    const res = await backend.verifyOtp(phone, code, name);
    signIn(set, res, remember);
    return res;
  },

  loginDemo: async () => signIn(set, await backend.demoLogin(), true),

  logout: () => {
    void backend.logout().catch(() => undefined);
    clearSession();
    switchAccount(null);
    set({ session: null });
  },

  rename: async (name) => {
    const user = await backend.updateMe({ name });
    updateSession({ name: user.name });
    useStore.getState().updateUser({ name: user.name });
    set({ session: getSession() });
  },

  refresh: async () => {
    if (!get().session) return;
    try {
      const user = await backend.me();
      updateSession({ name: user.name, role: user.role });
      await applyAccount(user);
      set({ session: getSession() });
    } catch (e) {
      if (e instanceof BackendError && (e.code === 'unauthorized' || e.code === 'banned')) get().logout();
    }
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
