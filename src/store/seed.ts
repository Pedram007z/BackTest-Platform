import { DAY_MS, addDays, keyToMs, localDayKey } from '../lib/calendar';
import { SYMBOL_MAP, priceAt, seededRng } from '../lib/market';
import type { Checklist, Session, Strategy, Trade, UserProfile } from '../lib/types';

/**
 * Example data so every page opens in a realistic working state.
 * Settings → "داده‌ها" can clear it or restore it.
 */
export interface SeedData {
  user: UserProfile;
  strategies: Strategy[];
  checklists: Checklist[];
  sessions: Session[];
  trades: Trade[];
  dailySeconds: Record<string, number>;
  replayedMs: number;
}

const FIVE_MIN = 5 * 60_000;

export function buildSeed(): SeedData {
  const rng = seededRng('demo-seed-v1');
  const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)];
  let idCounter = 0;
  const id = (p: string) => `${p}_demo_${(idCounter++).toString(36)}`;

  const today = localDayKey();
  const now = Date.now();

  const user: UserProfile = {
    name: 'آرش کریمی',
    plan: { name: 'اشتراک حرفه‌ای', startedAt: addDays(today, -17), endsAt: addDays(today, 13) },
  };

  const strategies: Strategy[] = [
    {
      id: id('st'),
      name: 'سوییپ نقدینگی + FVG',
      description: 'ورود پس از جمع‌آوری نقدینگی سقف/کف روز قبل و بازگشت به شکاف ارزش منصفانه در تایم ۵ دقیقه.',
      createdAt: now - 40 * DAY_MS,
    },
    {
      id: id('st'),
      name: 'شکست رنج آسیا',
      description: 'شکست سقف یا کف رنج سشن آسیا در شروع لندن، حد ضرر پشت رنج و حد سود دو برابر ریسک.',
      createdAt: now - 33 * DAY_MS,
    },
    {
      id: id('st'),
      name: 'پولبک میانگین ۲۰/۵۰',
      description: 'در روند صعودی یا نزولی تایم یک ساعته، ورود روی پولبک به ناحیه بین میانگین‌های ۲۰ و ۵۰.',
      createdAt: now - 12 * DAY_MS,
    },
  ];
  const [ict, asia, ma] = strategies;

  const checklists: Checklist[] = [
    {
      id: id('cl'),
      name: 'ویک‌ها',
      createdAt: now - 20 * DAY_MS,
      items: [
        { id: id('ci'), text: 'سوییپ سقف/کف روزانه، هفتگی یا ماهانه', required: true },
        { id: id('ci'), text: 'لگ تمیز بدون همپوشانی', required: false },
        { id: id('ci'), text: 'مدل ورود ۱۵ / ۵ دقیقه', required: false },
      ],
    },
    {
      id: id('cl'),
      name: 'قبل از ورود',
      createdAt: now - 9 * DAY_MS,
      items: [
        { id: id('ci'), text: 'خبر مهم در یک ساعت آینده نیست', required: true },
        { id: id('ci'), text: 'جهت روند تایم بالاتر مشخص است', required: true },
        { id: id('ci'), text: 'ریسک بیش از ۱٪ نیست', required: true },
        { id: id('ci'), text: 'حد سود حداقل ۲ برابر حد ضرر', required: false },
      ],
    },
  ];

  type Plan = {
    name: string;
    symbols: string[];
    start: string;
    end: string;
    balance: number;
    strategy?: Strategy;
    checklist?: Checklist;
    progress: number;
    trades: number;
    winP: number;
  };
  const plans: Plan[] = [
    { name: 'آشنایی با پلتفرم', symbols: ['NQ', 'ES'], start: '2024-10-01', end: '2024-10-29', balance: 10000, progress: 0.02, trades: 0, winP: 0.5 },
    { name: 'ES NQ | D1h5m', symbols: ['ES', 'NQ'], start: '2022-10-03', end: '2024-10-24', balance: 100000, strategy: ict, checklist: checklists[0], progress: 0.17, trades: 64, winP: 0.47 },
    { name: 'خوش آمدید به نسخه ۲', symbols: ['ES'], start: '2022-10-03', end: '2024-10-09', balance: 50000, progress: 0.13, trades: 14, winP: 0.42 },
    { name: '5mSnG | EU', symbols: ['EURUSD'], start: '2021-01-04', end: '2024-02-09', balance: 25000, strategy: asia, checklist: checklists[1], progress: 0.5, trades: 72, winP: 0.4 },
    { name: 'Wicks | GJ', symbols: ['GBPJPY'], start: '2021-03-01', end: '2023-10-10', balance: 10000, strategy: ict, checklist: checklists[0], progress: 0.62, trades: 46, winP: 0.44 },
    { name: 'طلا | اسکالپ نیویورک', symbols: ['XAUUSD', 'USDCHF', 'NZDUSD'], start: '2023-01-02', end: '2023-12-29', balance: 20000, strategy: ma, progress: 0.71, trades: 34, winP: 0.38 },
  ];

  // Wall-clock days the demo trades were "taken": the last 8 days, with two days off.
  const activeDays = [-7, -6, -5, -2, -1, 0];
  const dayWeights = [0.18, 0.22, 0.12, 0.28, 0.14, 0.06];
  const pickDay = () => {
    let x = rng();
    for (let i = 0; i < activeDays.length; i++) {
      x -= dayWeights[i];
      if (x <= 0) return activeDays[i];
    }
    return 0;
  };

  const sessions: Session[] = [];
  const trades: Trade[] = [];
  let replayedMs = 0;

  plans.forEach((p, si) => {
    const startMs = keyToMs(p.start);
    const endMs = keyToMs(p.end) + DAY_MS;
    const cursor = Math.floor((startMs + (endMs - startMs) * p.progress) / FIVE_MIN) * FIVE_MIN;
    const session: Session = {
      id: id('se'),
      name: p.name,
      balance: p.balance,
      symbols: p.symbols,
      startDate: p.start,
      endDate: p.end,
      strategyId: p.strategy?.id,
      checklistId: p.checklist?.id,
      cursor,
      timeframe: '15m',
      activeSymbol: p.symbols[0],
      createdAt: now - (30 - si * 4) * DAY_MS,
      lastOpenedAt: now - si * 3_600_000,
    };
    sessions.push(session);
    replayedMs += cursor - startMs;

    const span = cursor - startMs;
    for (let k = 0; k < p.trades; k++) {
      const symbol = pick(p.symbols);
      const info = SYMBOL_MAP[symbol];
      const holdMs = Math.floor((0.5 + rng() * 9) * 12) * FIVE_MIN;
      let openTime = Math.floor((startMs + (span * (k + rng() * 0.8)) / (p.trades + 1)) / FIVE_MIN) * FIVE_MIN + 8 * 3_600_000;
      const wd = new Date(openTime).getUTCDay();
      if (wd === 6) openTime += 2 * DAY_MS;
      if (wd === 0) openTime += DAY_MS;
      openTime = Math.min(openTime, cursor - holdMs - FIVE_MIN);
      const closeTime = openTime + holdMs;
      const side = rng() < 0.49 ? 'buy' : 'sell';
      const entry = priceAt(symbol, openTime);
      const slDist = info.defaultSl * info.pip * (0.7 + rng() * 0.8);
      const rr = pick([1.5, 2, 2, 2.5, 3]);
      const dir = side === 'buy' ? 1 : -1;
      const sl = entry - dir * slDist;
      const tp = entry + dir * slDist * rr;
      const manual = rng() < 0.12;
      const win = rng() < p.winP;
      const r = manual ? Math.round((rng() * 1.8 - 0.6) * 100) / 100 : win ? rr : -1;
      const exit = entry + dir * slDist * r;
      const risk = Math.round(p.balance * 0.01);
      const dayOffset = pickDay();
      const executedAt = new Date(`${addDays(today, dayOffset)}T00:00:00`).getTime() + (9 + rng() * 12) * 3_600_000;
      const closedAt = Math.min(now - 60_000, executedAt + (2 + rng() * 20) * 60_000);
      trades.push({
        id: id('tr'),
        sessionId: session.id,
        strategyId: p.strategy?.id,
        symbol,
        side,
        entry,
        sl,
        tp,
        risk,
        openTime,
        closeTime,
        exit,
        r,
        pnl: Math.round(r * risk * 100) / 100,
        status: 'closed',
        closeReason: manual ? 'manual' : win ? 'tp' : 'sl',
        executedAt: Math.min(executedAt, now - 120_000),
        closedAt,
      });
    }
  });

  // Practice minutes for the last 8 days.
  const minutes: Record<number, number> = { [-7]: 34, [-6]: 52, [-5]: 18, [-2]: 106, [-1]: 47, [0]: 21 };
  const dailySeconds: Record<string, number> = {};
  for (const [offset, m] of Object.entries(minutes)) dailySeconds[addDays(today, Number(offset))] = m * 60;

  return { user, strategies, checklists, sessions, trades, dailySeconds, replayedMs };
}
