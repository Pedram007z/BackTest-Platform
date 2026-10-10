import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getSession, type Session as AuthSession } from '../lib/auth';
import { addDays, keyToMs, localDayKey } from '../lib/calendar';
import { BAR_MS, SYMBOL_MAP, pointValueUsd, priceAt, replayBars, roundToTick } from '../lib/market';
import { closeLots, followIdeal, lotsForRisk, processBar, type FillEvent } from '../lib/trading';
import type { ChartPane, Checklist, GoToPreset, JournalEntry, LayoutId, NewsFilters, OrderType, Session, Side, Strategy, Trade, UserProfile } from '../lib/types';
import { local } from '../lib/storage';
import { buildSeed, type SeedData } from './seed';
import type { WorkspaceBase } from '../services/workspace';

export const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// Each account keeps its own dashboard data under its own key.
const LEGACY_KEY = 'backtest-dashboard:v1';
export const storeKey = (userId?: string) => `backtest-dashboard:v2:${userId ?? 'guest'}`;
const STORE_VERSION = 3;

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

export interface PlaceOrderInput {
  sessionId: string;
  symbol: string;
  side: Side;
  orderType: OrderType;
  entry: number;
  sl: number;
  tp: number;
  riskPct: number;
  strategyId?: string;
  journal?: JournalEntry;
}

export const DEFAULT_NEWS_FILTERS: NewsFilters = { currencies: [], showPast: true, showFuture: true, impacts: ['high'] };

/**
 * Where this browser stands with the account's data on the server (services/workspaceSync). Saved with
 * the data itself, so the two always match after a reload.
 */
export interface SyncMeta {
  /** The server's copy as last agreed (null: this browser has not synced with the account yet). */
  base: WorkspaceBase | null;
  /** Changes sent whose answer has not come back: `base` is what the server has once they arrive. */
  inflight?: { pid: string; base: WorkspaceBase };
}

interface State {
  user: UserProfile;
  strategies: Strategy[];
  checklists: Checklist[];
  sessions: Session[];
  trades: Trade[];
  dailySeconds: Record<string, number>;
  replayedMs: number;
  goToPresets: GoToPreset[];
  newsFilters: NewsFilters;
  theme: Theme;
  sidebarCollapsed: boolean;
  hasDemoData: boolean;
  sync?: SyncMeta;

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
  setLayout: (id: string, layout: LayoutId, panes: ChartPane[]) => void;

  /** Market orders open at the current price; limit and stop orders wait for price. */
  placeOrder: (input: PlaceOrderInput) => Trade | null;
  cancelOrder: (id: string) => void;
  modifyTrade: (id: string, patch: Partial<Pick<Trade, 'sl' | 'tp' | 'entry'>>) => void;
  /** Close `lots` (all when omitted) of an open position at the replay price. */
  closePosition: (id: string, lots?: number) => Trade | null;
  saveJournal: (tradeId: string, entry: JournalEntry) => void;
  deleteJournal: (tradeId: string) => void;
  deleteTrade: (tradeId: string) => void;
  /** Move a session's replay cursor forward, filling orders and settling stops / targets on the way. */
  advance: (sessionId: string, nextCursor: number) => FillEvent[];

  addGoToPreset: (p: Omit<GoToPreset, 'id'>) => void;
  updateGoToPreset: (id: string, patch: Partial<GoToPreset>) => void;
  deleteGoToPreset: (id: string) => void;
  setNewsFilters: (patch: Partial<NewsFilters>) => void;

  addPracticeSeconds: (seconds: number) => void;

  clearAll: () => void;
  restoreDemo: () => void;
}

type AccountData = SeedData & { hasDemoData: boolean };

/** Starting data for an account: the sample data for the demo account (and guests), empty for new accounts. */
function freshData(account: Pick<AuthSession, 'name' | 'demo'> | null): AccountData {
  if (!account || account.demo) return { ...buildSeed(), hasDemoData: true };
  const today = localDayKey();
  return {
    user: { name: account.name, plan: { name: 'دوره‌ی آزمایشی', startedAt: today, endsAt: addDays(today, 7) } },
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

/** Follow an explicit theme set by an embedding host, then the system preference; dark otherwise. */
const initialTheme = (): Theme => {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  try {
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light';
  } catch {
    /* ignore */
  }
  return 'dark';
};

/** Trades saved before version 3 had no order type, lots or partial closes. */
function migrateTrade(t: any): Trade {
  if (t.orderType && t.partials) return t as Trade;
  const pv = pointValueUsd(t.symbol, t.openTime);
  const dist = Math.abs(t.entry - t.sl) || 1;
  const lots = t.risk / (dist * pv) || 0.01;
  const closed = t.status === 'closed';
  return {
    ...t,
    orderType: 'market',
    placedTime: t.openTime,
    lots: closed ? 0 : lots,
    initialLots: lots,
    pointValue: pv,
    riskPct: 1,
    partials: closed ? [{ time: t.closeTime ?? t.openTime, price: t.exit ?? t.entry, lots, pnl: t.pnl ?? 0 }] : [],
    journal: t.note ? { screenshots: [], checked: [], confidence: 50, rating: 0, notes: t.note, tags: [], updatedAt: t.closedAt ?? t.executedAt } : undefined,
  };
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...freshData(bootSession),
      goToPresets: [],
      newsFilters: DEFAULT_NEWS_FILTERS,
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
      updateStrategy: (id, patch) => set((s) => ({ strategies: s.strategies.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
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
      updateChecklist: (id, patch) => set((s) => ({ checklists: s.checklists.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteChecklist: (id) =>
        set((s) => ({
          checklists: s.checklists.filter((x) => x.id !== id),
          sessions: s.sessions.map((x) => (x.checklistId === id ? { ...x, checklistId: undefined } : x)),
        })),

      addSession: (input) => {
        const session: Session = {
          id: uid('se'),
          ...input,
          notes: '',
          cursor: keyToMs(input.startDate),
          timeframe: '15m',
          activeSymbol: input.symbols[0],
          layout: '1',
          panes: [{ symbol: input.symbols[0], timeframe: '15m' }],
          createdAt: Date.now(),
        };
        set((s) => ({ sessions: [session, ...s.sessions] }));
        return session;
      },
      updateSession: (id, patch) => set((s) => ({ sessions: s.sessions.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteSession: (id) =>
        set((s) => ({
          sessions: s.sessions.filter((x) => x.id !== id),
          trades: s.trades.filter((t) => t.sessionId !== id),
        })),
      setLayout: (id, layout, panes) =>
        set((s) => ({
          sessions: s.sessions.map((x) => (x.id === id ? { ...x, layout, panes, activeSymbol: panes[0]?.symbol ?? x.activeSymbol } : x)),
        })),

      placeOrder: (input) => {
        const state = get();
        const session = state.sessions.find((s) => s.id === input.sessionId);
        if (!session) return null;
        const market = priceAt(input.symbol, session.cursor);
        const isMarket = input.orderType === 'market';
        const entry = roundToTick(input.symbol, isMarket ? market : input.entry);
        // a market order keeps the stop and target distances the trader drew
        const shift = isMarket ? entry - input.entry : 0;
        const sl = roundToTick(input.symbol, input.sl + shift);
        const tp = roundToTick(input.symbol, input.tp + shift);
        const balance = sessionBalanceOf(session, state.trades);
        const lots = lotsForRisk(input.symbol, (balance * input.riskPct) / 100, entry, sl, session.cursor);
        const pointValue = pointValueUsd(input.symbol, session.cursor);
        const trade: Trade = {
          id: uid('tr'),
          sessionId: session.id,
          strategyId: input.strategyId,
          symbol: input.symbol,
          side: input.side,
          orderType: input.orderType,
          status: isMarket ? 'open' : 'pending',
          entry,
          sl,
          tp,
          lots,
          initialLots: lots,
          pointValue,
          risk: Math.round(Math.abs(entry - sl) * pointValue * lots * 100) / 100,
          riskPct: input.riskPct,
          placedTime: session.cursor,
          openTime: session.cursor,
          partials: [],
          bestPrice: entry,
          maxR: 0,
          executedAt: Date.now(),
          journal: input.journal,
        };
        set((s) => ({ trades: [...s.trades, trade] }));
        return trade;
      },

      cancelOrder: (id) =>
        set((s) => ({
          trades: s.trades.map((t) => (t.id === id && t.status === 'pending' ? { ...t, status: 'cancelled', closedAt: Date.now() } : t)),
        })),

      modifyTrade: (id, patch) =>
        set((s) => ({
          trades: s.trades.map((t) => {
            if (t.id !== id || (t.status !== 'open' && t.status !== 'pending')) return t;
            const next = { ...t };
            if (patch.sl !== undefined) next.sl = roundToTick(t.symbol, patch.sl);
            if (patch.tp !== undefined) next.tp = roundToTick(t.symbol, patch.tp);
            if (patch.entry !== undefined && t.status === 'pending') {
              next.entry = roundToTick(t.symbol, patch.entry);
              next.risk = Math.round(Math.abs(next.entry - next.sl) * t.pointValue * t.lots * 100) / 100;
            }
            if (t.status === 'pending' && patch.sl !== undefined) {
              next.risk = Math.round(Math.abs(next.entry - next.sl) * t.pointValue * t.lots * 100) / 100;
            }
            return next;
          }),
        })),

      closePosition: (id, lots) => {
        const state = get();
        const trade = state.trades.find((t) => t.id === id);
        if (!trade || trade.status !== 'open') return null;
        const session = state.sessions.find((s) => s.id === trade.sessionId);
        if (!session) return null;
        const price = priceAt(trade.symbol, session.cursor);
        const next = closeLots(trade, lots ?? trade.lots, price, session.cursor, 'manual');
        set((s) => ({ trades: s.trades.map((t) => (t.id === id ? next : t)) }));
        return next;
      },

      saveJournal: (tradeId, entry) => set((s) => ({ trades: s.trades.map((t) => (t.id === tradeId ? { ...t, journal: { ...entry, updatedAt: Date.now() } } : t)) })),
      deleteJournal: (tradeId) => set((s) => ({ trades: s.trades.map((t) => (t.id === tradeId ? { ...t, journal: undefined } : t)) })),
      deleteTrade: (tradeId) => set((s) => ({ trades: s.trades.filter((t) => t.id !== tradeId) })),

      advance: (sessionId, nextCursor) => {
        const state = get();
        const session = state.sessions.find((s) => s.id === sessionId);
        if (!session || nextCursor <= session.cursor) return [];
        const from = session.cursor;
        const events: FillEvent[] = [];

        const trades = state.trades.map((t) => {
          if (t.sessionId !== sessionId) return t;
          const live = t.status === 'open' || t.status === 'pending';
          const following = t.status === 'closed' && !t.idealDone;
          if (!live && !following) return t;
          let trade = t;
          for (const bar of replayBars(t.symbol, from, nextCursor)) {
            if (trade.status === 'open' || trade.status === 'pending') {
              if (trade.status === 'pending' && bar.time < trade.placedTime) continue;
              trade = processBar(trade, bar, events);
            } else if (trade.status === 'closed' && !trade.idealDone) {
              trade = followIdeal(trade, bar);
            } else break;
          }
          return trade;
        });

        set({
          trades,
          sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, cursor: nextCursor, lastOpenedAt: Date.now() } : s)),
          replayedMs: state.replayedMs + (nextCursor - from),
        });
        return events;
      },

      addGoToPreset: (p) => set((s) => ({ goToPresets: [...s.goToPresets, { ...p, id: uid('g') }] })),
      updateGoToPreset: (id, patch) =>
        set((s) => {
          const exists = s.goToPresets.some((g) => g.id === id);
          // built-in presets are stored only once they are edited
          return {
            goToPresets: exists ? s.goToPresets.map((g) => (g.id === id ? { ...g, ...patch } : g)) : [...s.goToPresets, { ...(patch as GoToPreset), id }],
          };
        }),
      deleteGoToPreset: (id) => set((s) => ({ goToPresets: s.goToPresets.filter((g) => g.id !== id) })),
      setNewsFilters: (patch) => set((s) => ({ newsFilters: { ...s.newsFilters, ...patch } })),

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
      version: STORE_VERSION,
      // an account's sync state comes only from its own saved data (never left over from another account)
      merge: (persisted, current) => ({ ...current, ...(persisted as Partial<State>), sync: (persisted as Partial<State> | undefined)?.sync }),
      migrate: (persisted: any, version) => {
        if (!persisted) return persisted;
        if (version < 3) {
          // sample data is rebuilt in the new shape; the trader's own trades are converted
          if (persisted.hasDemoData) return { ...persisted, ...buildSeed(), hasDemoData: true };
          persisted.trades = (persisted.trades ?? []).map(migrateTrade);
          persisted.sessions = (persisted.sessions ?? []).map((s: Session) => ({
            ...s,
            notes: s.notes ?? '',
            layout: s.layout ?? '1',
            panes: s.panes ?? [{ symbol: s.activeSymbol, timeframe: s.timeframe }],
          }));
        }
        return persisted;
      },
    },
  ),
);

function sessionBalanceOf(session: Session, trades: Trade[]): number {
  return session.balance + trades.filter((t) => t.sessionId === session.id).reduce((sum, t) => sum + t.partials.reduce((a, p) => a + p.pnl, 0), 0);
}

/** Current price of a session's symbol (helper for components). */
export const marketPrice = (symbol: string, cursor: number) => priceAt(symbol, cursor);
export const symbolDigits = (symbol: string) => SYMBOL_MAP[symbol]?.digits ?? 2;
export const BAR = BAR_MS;

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
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, text, tone }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3600);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = (text: string, tone?: Toast['tone']) => useToasts.getState().push(text, tone);

// ---------- UI state that is not saved ----------
interface UiState {
  /** Chart page fills the whole window (sidebar and header hidden). */
  chartExpanded: boolean;
  setChartExpanded: (v: boolean) => void;
}
export const useUi = create<UiState>((set) => ({
  chartExpanded: false,
  setChartExpanded: (chartExpanded) => set({ chartExpanded }),
}));

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
  else useStore.setState({ ...freshData(account), goToPresets: [], newsFilters: DEFAULT_NEWS_FILTERS, theme, sidebarCollapsed, sync: undefined });
}
