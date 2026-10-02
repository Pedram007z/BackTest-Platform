import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { localDayKey, keyToMs } from '../lib/calendar';
import { bars5m, priceAt } from '../lib/market';
import { rAt } from '../lib/stats';
import type { Checklist, Session, Side, Strategy, Trade, UserProfile } from '../lib/types';
import { buildSeed } from './seed';

export const uid = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// localStorage can be missing or throw (private windows, sandboxed previews); fall back to memory.
const memory = new Map<string, string>();
const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return window.localStorage.getItem(k);
    } catch {
      return memory.get(k) ?? null;
    }
  },
  setItem: (k, v) => {
    try {
      window.localStorage.setItem(k, v);
    } catch {
      memory.set(k, v);
    }
  },
  removeItem: (k) => {
    try {
      window.localStorage.removeItem(k);
    } catch {
      memory.delete(k);
    }
  },
};

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

const seed = buildSeed();

// Dark by default; follow an explicit light theme set by an embedding host.
const initialTheme = (): Theme => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...seed,
      theme: initialTheme(),
      sidebarCollapsed: false,
      hasDemoData: true,

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
      name: 'backtest-dashboard:v1',
      storage: createJSONStorage(() => safeStorage),
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
