import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getSession, type Session as AuthSession } from '../lib/auth';
import { addDays, localDayKey, keyToMs } from '../lib/calendar';
import { bars5m, priceAt } from '../lib/market';
import { rAt } from '../lib/stats';
import type { Checklist, Session, Side, Strategy, Trade, UserProfile } from '../lib/types';
import { local } from '../lib/storage';
import { buildSeed, type SeedData } from './seed';

export const uid = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// Each account keeps its own dashboard data under its own key.
const LEGACY_KEY = 'backtest-dashboard:v1';
export const storeKey = (userId?: string) => `backtest-dashboard:v2:${userId ?? 'guest'}`;

export type Theme = 'dark' | 'light';

export interface NewSessionInput {
  name: string;
  balance: number;
  symbols: string[];
  startDate: string;
  endDate: string;
  strategyId?: string;
  checklistId?: string;
}

export interface PlaceTradeInput {
  sessionId: string;
  symbol: string;
  side: Side;
  sl: number;
  tp: number;
  risk: number;
  strategyId?: string;
}

interface State {
  user: UserProfile;
  strategies: Strategy[];
  checklists: Checklist[];
  sessions: Session[];
  trades: Trade[];
  dailySeconds: Record<string, number>;
  replayedMs: number;
  theme: Theme;
  sidebarCollapsed: boolean;
  hasDemoData: boolean;

  setTheme: (t: Theme) => void;
  toggleSidebar: () => void;
  updateUser: (patch: Partial<UserProfile>) => void;

  addStrategy: (s: Pick<Strategy, 'name' | 'description'>) => Strategy;
  updateStrategy: (id: string, patch: Partial<Pick<Strategy, 'name' | 'description'>>) => void;
  deleteStrategy: (id: string) => void;

  addChecklist: (c: Pick<Checklist, 'name' | 'items'>) => Checklist;
  updateChecklist: (id: string, patch: Partial<Pick<Checklist, 'name' | 'items'>>) => void;
  deleteChecklist: (id: string) => void;

  addSession: (input: NewSessionInput) => Session;
  updateSession: (id: string, patch: Partial<Session>) => void;
  deleteSession: (id: string) => void;

  placeTrade: (input: PlaceTradeInput) => Trade | null;
  closeTrade: (id: string, reason?: Trade['closeReason']) => void;
  setTradeNote: (id: string, note: string) => void;
  /** Move a session's replay cursor forward and settle any stop-loss / take-profit hits. */
  advance: (sessionId: string, nextCursor: number) => Trade[];

  addPracticeSeconds: (seconds: number) => void;

  clearAll: () => void;
  restoreDemo: () => void;
}

function settle(trade: Trade, exit: number, closeTime: number, reason: Trade['closeReason']): Trade {
  const r = Math.round(rAt(trade, exit) * 100) / 100;
  return {
    ...trade,
    status: 'closed',
    exit,
    closeTime,
    r,
    pnl: Math.round(r * trade.risk * 100) / 100,
    closeReason: reason,
    closedAt: Date.now(),
  };
}

type AccountData = SeedData & { hasDemoData: boolean };

/** Starting data for an account: the sample data for the demo account (and guests), empty for new accounts. */
function freshData(account: Pick<AuthSession, 'name' | 'demo'> | null): AccountData {
  if (!account || account.demo) return { ...buildSeed(), hasDemoData: true };
  const today = localDayKey();
  return {
    user: { name: account.name, plan: { name: 'دوره‌ی آزمایشی حرفه‌ای', startedAt: today, endsAt: addDays(today, 14) } },
    strategies: [],
    checklists: [],
    sessions: [],
    trades: [],
    dailySeconds: {},
    replayedMs: 0,
    hasDemoData: false,
  };
}

const bootSession = getSession();

// Dark by default; follow an explicit light theme set by an embedding host.
const initialTheme = (): Theme => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...freshData(bootSession),
      theme: initialTheme(),
      sidebarCollapsed: false,

      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      updateUser: (patch) => set((s) => ({ user: { ...s.user, ...patch } })),

      addStrategy: ({ name, description }) => {
        const strategy: Strategy = { id: uid('st'), name, description, createdAt: Date.now() };
        set((s) => ({ strategies: [strategy, ...s.strategies] }));
        return strategy;
      },
      updateStrategy: (id, patch) =>
        set((s) => ({ strategies: s.strategies.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteStrategy: (id) =>
        set((s) => ({
          strategies: s.strategies.filter((x) => x.id !== id),
          sessions: s.sessions.map((x) => (x.strategyId === id ? { ...x, strategyId: undefined } : x)),
          trades: s.trades.map((t) => (t.strategyId === id ? { ...t, strategyId: undefined } : t)),
        })),

      addChecklist: ({ name, items }) => {
        const checklist: Checklist = { id: uid('cl'), name, items, createdAt: Date.now() };
        set((s) => ({ checklists: [checklist, ...s.checklists] }));
        return checklist;
      },
      updateChecklist: (id, patch) =>
        set((s) => ({ checklists: s.checklists.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteChecklist: (id) =>
        set((s) => ({
          checklists: s.checklists.filter((x) => x.id !== id),
          sessions: s.sessions.map((x) => (x.checklistId === id ? { ...x, checklistId: undefined } : x)),
        })),

      addSession: (input) => {
        const session: Session = {
          id: uid('se'),
          ...input,
          cursor: keyToMs(input.startDate),
          timeframe: '15m',
          activeSymbol: input.symbols[0],
          createdAt: Date.now(),
        };
        set((s) => ({ sessions: [session, ...s.sessions] }));
        return session;
      },
      updateSession: (id, patch) =>
        set((s) => ({ sessions: s.sessions.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteSession: (id) =>
        set((s) => ({
          sessions: s.sessions.filter((x) => x.id !== id),
          trades: s.trades.filter((t) => t.sessionId !== id),
        })),

      placeTrade: (input) => {
        const session = get().sessions.find((s) => s.id === input.sessionId);
        if (!session) return null;
        const entry = priceAt(input.symbol, session.cursor);
        const trade: Trade = {
          id: uid('tr'),
          sessionId: session.id,
          strategyId: input.strategyId,
          symbol: input.symbol,
          side: input.side,
          entry,
          sl: input.sl,
          tp: input.tp,
          risk: input.risk,
          openTime: session.cursor,
          status: 'open',
          executedAt: Date.now(),
        };
        set((s) => ({ trades: [...s.trades, trade] }));
        return trade;
      },

      closeTrade: (id, reason = 'manual') => {
        const trade = get().trades.find((t) => t.id === id);
        if (!trade || trade.status !== 'open') return;
        const session = get().sessions.find((s) => s.id === trade.sessionId);
        if (!session) return;
        const exit = priceAt(trade.symbol, session.cursor);
        set((s) => ({ trades: s.trades.map((t) => (t.id === id ? settle(t, exit, session.cursor, reason) : t)) }));
      },

      setTradeNote: (id, note) => set((s) => ({ trades: s.trades.map((t) => (t.id === id ? { ...t, note } : t)) })),

      advance: (sessionId, nextCursor) => {
        const state = get();
        const session = state.sessions.find((s) => s.id === sessionId);
        if (!session || nextCursor <= session.cursor) return [];
        const from = session.cursor;
        const closed: Trade[] = [];

        const trades = state.trades.map((t) => {
          if (t.sessionId !== sessionId || t.status !== 'open') return t;
          for (const bar of bars5m(t.symbol, from, nextCursor)) {
            const hitSl = t.side === 'buy' ? bar.low <= t.sl : bar.high >= t.sl;
            const hitTp = t.side === 'buy' ? bar.high >= t.tp : bar.low <= t.tp;
            // When both levels sit inside one bar, assume the stop was hit first.
            if (hitSl || hitTp) {
              const done = settle(t, hitSl ? t.sl : t.tp, bar.time + 5 * 60_000, hitSl ? 'sl' : 'tp');
              closed.push(done);
              return done;
            }
          }
          return t;
        });

        set({
          trades,
          sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, cursor: nextCursor, lastOpenedAt: Date.now() } : s)),
          replayedMs: state.replayedMs + (nextCursor - from),
        });
        return closed;
      },

      addPracticeSeconds: (seconds) =>
        set((s) => {
          const day = localDayKey();
          return { dailySeconds: { ...s.dailySeconds, [day]: (s.dailySeconds[day] ?? 0) + seconds } };
        }),

      clearAll: () =>
        set((s) => ({
          strategies: [],
          checklists: [],
          sessions: [],
          trades: [],
          dailySeconds: {},
          replayedMs: 0,
          hasDemoData: false,
          user: { ...s.user },
        })),
      restoreDemo: () => set({ ...buildSeed(), hasDemoData: true }),
    }),
    {
      name: storeKey(bootSession?.userId),
      storage: createJSONStorage(() => local),
    },
  ),
);

// ---------- toasts (not persisted) ----------
export interface Toast {
  id: number;
  text: string;
  tone: 'info' | 'success' | 'error';
}

interface ToastState {
  toasts: Toast[];
  push: (text: string, tone?: Toast['tone']) => void;
  dismiss: (id: number) => void;
}

let toastId = 0;
export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (text, tone = 'success') => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, text, tone }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = (text: string, tone?: Toast['tone']) => useToasts.getState().push(text, tone);

/**
 * Point the dashboard store at another account's saved data (or the guest store on logout).
 * Keeps the current theme for accounts that have no saved data yet.
 */
export function switchAccount(account: Pick<AuthSession, 'userId' | 'name' | 'demo'> | null) {
  const key = storeKey(account?.userId);
  const { theme, sidebarCollapsed } = useStore.getState();
  useStore.persist.setOptions({ name: key });
  let raw = local.getItem(key);
  // Data saved before accounts existed belongs to the demo account.
  if (!raw && account?.demo) {
    const legacy = local.getItem(LEGACY_KEY);
    if (legacy) {
      local.setItem(key, legacy);
      local.removeItem(LEGACY_KEY);
      raw = legacy;
    }
  }
  if (raw) void useStore.persist.rehydrate();
  else useStore.setState({ ...freshData(account), theme, sidebarCollapsed });
}
