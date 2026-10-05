import { DAY_MS, addDays, keyToMs, localDayKey } from '../lib/calendar';
import { BAR_MS, atr, pointValueUsd, priceAt, roundToTick, seededRng, synthetic } from '../lib/market';
import { lotsForRisk, simulateHistorical } from '../lib/trading';
import type { Checklist, JournalEntry, Session, Strategy, Trade, UserProfile } from '../lib/types';

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

const HOUR = 3_600_000;

const NOTES = [
  'ورود بعد از سوییپ کف آسیا و بازگشت به داخل رنج. حد ضرر پشت ویک.',
  'روند تایم بالاتر هم‌جهت بود. صبر کردم تا کندل تأیید بسته شود.',
  'زود وارد شدم؛ باید منتظر شکست ساختار در ۵ دقیقه می‌ماندم.',
  'خبر CPI نزدیک بود و حجم را نصف کردم.',
  'ستاپ تمیز بود ولی حد سود را خیلی دور گذاشتم.',
  'معامله طبق پلن. نیمی از حجم در ۱R بسته شد.',
  'احساس عجله داشتم؛ چک‌لیست را کامل رعایت نکردم.',
  'شکست سقف لندن با کندل قوی. ورود روی پولبک.',
];
const TAGS = ['ورود مارکت', 'پولبک', 'شکست', 'خلاف روند', 'سشن لندن', 'سشن نیویورک', 'قبل از خبر'];

/** Sample data for the demo account, always on the synthetic prices it was designed for. */
export const buildSeed = (): SeedData => synthetic(buildSampleData);

function buildSampleData(): SeedData {
  const rng = seededRng('demo-seed-v3');
  const pick = <T>(arr: T[]) => arr[Math.floor(rng() * arr.length)];
  let idCounter = 0;
  const id = (p: string) => `${p}_demo_${(idCounter++).toString(36)}`;

  const today = localDayKey();
  const now = Date.now();

  const user: UserProfile = {
    name: 'آرش کریمی',
    phone: '09121234567',
    plan: { id: 'pro', name: 'اشتراک حرفه‌ای', startedAt: addDays(today, -17), endsAt: addDays(today, 13) },
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
        { id: id('ci'), text: 'ریسک بیش از ۱٪ نیست', required: false },
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
    edge: number;
    notes: string;
  };
  const plans: Plan[] = [
    {
      name: 'شاخص‌های آمریکا | D1h5m',
      symbols: ['NAS100', 'SPX500', 'US30'],
      start: '2022-10-03',
      end: '2024-10-24',
      balance: 100000,
      strategy: ict,
      checklist: checklists[0],
      progress: 0.21,
      trades: 70,
      edge: 0.34,
      notes: 'فقط سشن نیویورک. هدف این جلسه: ۱۰۰ معامله با ریسک ثابت ۱٪ و بررسی اینکه سوییپ کف آسیا روی نزدک بهتر جواب می‌دهد یا اس‌اندپی.',
    },
    {
      name: 'شکست لندن | EURUSD',
      symbols: ['EURUSD', 'GBPUSD'],
      start: '2021-01-04',
      end: '2024-02-09',
      balance: 25000,
      strategy: asia,
      checklist: checklists[1],
      progress: 0.5,
      trades: 66,
      edge: 0.24,
      notes: 'رنج آسیا را از ۰۰:۰۰ تا ۰۷:۰۰ UTC علامت می‌زنم. اگر رنج بزرگ‌تر از ۴۰ پیپ بود معامله نمی‌کنم.',
    },
    {
      name: 'Wicks | GJ',
      symbols: ['GBPJPY'],
      start: '2021-03-01',
      end: '2023-10-10',
      balance: 10000,
      strategy: ict,
      checklist: checklists[0],
      progress: 0.62,
      trades: 44,
      edge: 0.28,
      notes: '',
    },
    {
      name: 'طلا | اسکالپ نیویورک',
      symbols: ['XAUUSD', 'XAGUSD'],
      start: '2023-01-02',
      end: '2023-12-29',
      balance: 20000,
      strategy: ma,
      progress: 0.71,
      trades: 38,
      edge: 0.2,
      notes: 'ورود فقط در جهت روند یک ساعته. بعد از دو ضرر پشت سر هم آن روز را تمام می‌کنم.',
    },
    {
      name: 'بیت‌کوین آخر هفته',
      symbols: ['BTCUSD', 'ETHUSD'],
      start: '2023-06-03',
      end: '2024-03-30',
      balance: 15000,
      progress: 0.36,
      trades: 22,
      edge: 0.16,
      notes: '',
    },
    {
      name: 'آشنایی با پلتفرم',
      symbols: ['EURUSD', 'USDJPY'],
      start: '2024-09-02',
      end: '2024-10-29',
      balance: 10000,
      progress: 0.03,
      trades: 0,
      edge: 0,
      notes: '',
    },
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
    let cursor = Math.floor((startMs + (endMs - startMs) * p.progress) / BAR_MS) * BAR_MS;
    // land on a weekday afternoon (UTC) so the chart opens on a live market
    const wdc = new Date(cursor).getUTCDay();
    if (wdc === 6) cursor += 2 * DAY_MS;
    if (wdc === 0) cursor += DAY_MS;
    cursor = Math.floor(cursor / DAY_MS) * DAY_MS + 14 * HOUR + 35 * 60_000;
    const session: Session = {
      id: id('se'),
      name: p.name,
      balance: p.balance,
      symbols: p.symbols,
      startDate: p.start,
      endDate: p.end,
      strategyId: p.strategy?.id,
      checklistId: p.checklist?.id,
      notes: p.notes,
      cursor,
      timeframe: '15m',
      activeSymbol: p.symbols[0],
      layout: '1',
      panes: [{ symbol: p.symbols[0], timeframe: '15m' }],
      createdAt: now - (30 - si * 4) * DAY_MS,
      lastOpenedAt: now - si * 3_600_000,
    };
    sessions.push(session);
    replayedMs += cursor - startMs;

    let balance = p.balance;
    const span = cursor - startMs - 3 * DAY_MS;
    for (let k = 0; k < p.trades; k++) {
      const symbol = pick(p.symbols);
      // entries spread over the trading day, busier around London and New York
      const hour = pick([1, 3, 7, 8, 8, 9, 10, 12, 13, 13, 14, 14, 15, 16, 18, 21]);
      let openTime = Math.floor((startMs + (span * (k + rng() * 0.8)) / (p.trades + 1)) / DAY_MS) * DAY_MS + hour * HOUR + Math.floor(rng() * 12) * BAR_MS;
      const wd = new Date(openTime).getUTCDay();
      if (wd === 6 && symbol !== 'BTCUSD' && symbol !== 'ETHUSD') openTime += 2 * DAY_MS;
      if (wd === 0 && symbol !== 'BTCUSD' && symbol !== 'ETHUSD') openTime += DAY_MS;
      const entry = priceAt(symbol, openTime);
      const ahead = priceAt(symbol, openTime + 8 * HOUR);
      const side = rng() < p.edge + 0.5 ? (ahead >= entry ? 'buy' : 'sell') : rng() < 0.5 ? 'buy' : 'sell';
      const dir = side === 'buy' ? 1 : -1;
      const slDist = atr(symbol, '15m', openTime) * (1.2 + rng() * 1.4);
      const rr = pick([1.5, 2, 2, 2.5, 3]);
      const sl = roundToTick(symbol, entry - dir * slDist);
      const tp = roundToTick(symbol, entry + dir * slDist * rr);
      const riskPct = pick([0.5, 1, 1, 1, 1.5]);
      const lots = lotsForRisk(symbol, (balance * riskPct) / 100, entry, sl, openTime);
      const pointValue = pointValueUsd(symbol, openTime);
      const dayOffset = pickDay();
      const executedAt = Math.min(now - 120_000, new Date(`${addDays(today, dayOffset)}T00:00:00`).getTime() + (9 + rng() * 12) * HOUR);

      let t = simulateHistorical(
        {
          id: id('tr'),
          sessionId: session.id,
          strategyId: p.strategy?.id,
          symbol,
          side,
          orderType: rng() < 0.7 ? 'market' : rng() < 0.5 ? 'limit' : 'stop',
          entry,
          sl,
          tp,
          initialLots: lots,
          pointValue,
          risk: Math.round(Math.abs(entry - sl) * pointValue * lots * 100) / 100,
          riskPct,
          placedTime: openTime,
          openTime,
          executedAt,
        },
        (6 + rng() * 40) * HOUR,
      );
      t = { ...t, closedAt: Math.min(now - 60_000, executedAt + (2 + rng() * 25) * 60_000) };
      if (rng() < 0.45) {
        const cl = p.checklist;
        const journal: JournalEntry = {
          screenshots: [],
          checklistId: cl?.id,
          checked: cl ? cl.items.filter((it) => it.required || rng() < 0.6).map((it) => it.id) : [],
          confidence: Math.round(30 + rng() * 65),
          rating: 1 + Math.floor(rng() * 5),
          notes: pick(NOTES),
          tags: [pick(TAGS), ...(rng() < 0.4 ? [pick(TAGS)] : [])].filter((x, i, a) => a.indexOf(x) === i),
          updatedAt: t.closedAt ?? executedAt,
        };
        t = { ...t, journal };
      }
      balance += t.pnl ?? 0;
      trades.push(t);
    }

    // the first session also has a live position and a waiting order on its chart
    if (si === 0) {
      const symbol = p.symbols[0];
      const openTime = cursor - 6 * BAR_MS;
      const entry = priceAt(symbol, openTime);
      const slDist = atr(symbol, '15m', cursor) * 2;
      const sl = roundToTick(symbol, entry - slDist);
      const tp = roundToTick(symbol, entry + slDist * 2.5);
      const lots = lotsForRisk(symbol, balance * 0.01, entry, sl, openTime);
      const pointValue = pointValueUsd(symbol, openTime);
      const last = priceAt(symbol, cursor);
      trades.push({
        id: id('tr'),
        sessionId: session.id,
        strategyId: p.strategy?.id,
        symbol,
        side: 'buy',
        orderType: 'market',
        status: 'open',
        entry,
        sl,
        tp,
        lots,
        initialLots: lots,
        pointValue,
        risk: Math.round(slDist * pointValue * lots * 100) / 100,
        riskPct: 1,
        placedTime: openTime,
        openTime,
        partials: [],
        bestPrice: Math.max(entry, last),
        maxR: Math.max(0, Math.round(((last - entry) / slDist) * 100) / 100),
        executedAt: now - 25 * 60_000,
        journal: {
          screenshots: [],
          checklistId: p.checklist?.id,
          checked: p.checklist?.items.filter((it) => it.required).map((it) => it.id) ?? [],
          confidence: 70,
          rating: 4,
          notes: 'سوییپ کف سشن آسیا و بازگشت. هدف: سقف دیروز.',
          tags: ['سشن نیویورک', 'پولبک'],
          updatedAt: now - 25 * 60_000,
        },
      });
      const second = p.symbols[1];
      const px = priceAt(second, cursor);
      const d2 = atr(second, '15m', cursor) * 2;
      const limit = roundToTick(second, px + d2 * 0.8);
      const lots2 = lotsForRisk(second, balance * 0.01, limit, limit + d2, cursor);
      const pv2 = pointValueUsd(second, cursor);
      trades.push({
        id: id('tr'),
        sessionId: session.id,
        strategyId: p.strategy?.id,
        symbol: second,
        side: 'sell',
        orderType: 'limit',
        status: 'pending',
        entry: limit,
        sl: roundToTick(second, limit + d2),
        tp: roundToTick(second, limit - d2 * 2),
        lots: lots2,
        initialLots: lots2,
        pointValue: pv2,
        risk: Math.round(d2 * pv2 * lots2 * 100) / 100,
        riskPct: 1,
        placedTime: cursor - BAR_MS,
        openTime: cursor - BAR_MS,
        partials: [],
        executedAt: now - 10 * 60_000,
      });
    }
  });

  // Practice minutes for the last 8 days.
  const minutes: Record<number, number> = { [-7]: 34, [-6]: 52, [-5]: 18, [-2]: 106, [-1]: 47, [0]: 21 };
  const dailySeconds: Record<string, number> = {};
  for (const [offset, m] of Object.entries(minutes)) dailySeconds[addDays(today, Number(offset))] = m * 60;

  return { user, strategies, checklists, sessions, trades, dailySeconds, replayedMs };
}
