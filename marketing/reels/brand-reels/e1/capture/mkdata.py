# The character's backtests for e1: 31 XAUUSD sessions traded on real 1-hour gold prices (simulated with the
# platform's own rules: risk % of the balance, lots from the stop distance, SL/TP hit on the bar's high/low,
# stop first when both are in one bar). Session windows are picked so the results tell the story: sessions
# 1-23 mostly lose (23 loses ~20%), 24-31 lose less and less, the last one still slightly red.
#   python3 mkdata.py <xau_h1.csv> <out.json>
import csv, json, math, random, sys
from datetime import datetime, timezone, timedelta
H1 = [(int(r['t']), float(r['o']), float(r['h']), float(r['l']), float(r['c'])) for r in csv.DictReader(open(sys.argv[1]))]
T0 = next(i for i, b in enumerate(H1) if b[0] >= datetime(2017, 1, 1, tzinfo=timezone.utc).timestamp())
T1 = next(i for i, b in enumerate(H1) if b[0] >= datetime(2025, 9, 1, tzinfo=timezone.utc).timestamp())
C = [b[4] for b in H1]

def ema(xs, n):
    k, out, e = 2 / (n + 1), [], xs[0]
    for x in xs: e = x * k + e * (1 - k); out.append(e)
    return out
def rsi(xs, n=14):
    out = [50.0] * len(xs); g = l = 0.0
    for i in range(1, len(xs)):
        ch = xs[i] - xs[i - 1]; up, dn = max(ch, 0), max(-ch, 0)
        if i <= n:
            g += up / n; l += dn / n
        else:
            g = (g * (n - 1) + up) / n; l = (l * (n - 1) + dn) / n
        if i >= n: out[i] = 100 - 100 / (1 + g / l) if l else 100
    return out
def atr(n=14):
    out, a = [0.0] * len(H1), 0.0
    for i in range(1, len(H1)):
        tr = max(H1[i][2] - H1[i][3], abs(H1[i][2] - H1[i - 1][4]), abs(H1[i][3] - H1[i - 1][4]))
        a = tr if i == 1 else (a * (n - 1) + tr) / n; out[i] = a
    return out
R, A, E50 = rsi(C), atr(), ema(C, 50)
HI20 = [max(b[2] for b in H1[max(0, i - 20):i]) if i else 0 for i in range(len(H1))]
LO20 = [min(b[3] for b in H1[max(0, i - 20):i]) if i else 0 for i in range(len(H1))]

def signal(kind, i):
    if kind == 'rsi':
        if R[i - 1] < 30 <= R[i]: return 'buy'
        if R[i - 1] > 70 >= R[i]: return 'sell'
    elif kind == 'brk':
        if C[i] > HI20[i] and C[i - 1] <= HI20[i - 1]: return 'buy'
        if C[i] < LO20[i] and C[i - 1] >= LO20[i - 1]: return 'sell'
    elif kind == 'ema':
        if C[i - 1] < E50[i - 1] and C[i] > E50[i] and E50[i] > E50[i - 24]: return 'buy'
        if C[i - 1] > E50[i - 1] and C[i] < E50[i] and E50[i] < E50[i - 24]: return 'sell'
    return None

def run(kind, i0, n, risk_pct, sl_k, tp_k, max_trades):
    bal, trades, i = 10000.0, [], i0
    while i < i0 + n and len(trades) < max_trades:
        s = signal(kind, i)
        if not s: i += 1; continue
        e, a = C[i], A[i]; d = 1 if s == 'buy' else -1
        sl, tp = round(e - d * sl_k * a, 2), round(e + d * tp_k * a, 2)
        risk = bal * risk_pct / 100; lots = max(0.01, math.floor(risk / (abs(e - sl) * 100) / 0.01) * 0.01)
        j, ex, why = i + 1, None, None
        while j < len(H1) and j < i + 24 * 7:
            _, o, h, l, c = H1[j]
            if (l <= sl if d > 0 else h >= sl): ex, why = sl, 'sl'; break
            if (h >= tp if d > 0 else l <= tp): ex, why = tp, 'tp'; break
            j += 1
        if ex is None: ex, why = H1[j][4], 'manual'
        pnl = round((ex - e) * d * lots * 100, 2); r = round(pnl / (abs(e - sl) * lots * 100), 2)
        best = max(b[2] for b in H1[i + 1:j + 1]) if d > 0 else min(b[3] for b in H1[i + 1:j + 1])
        trades.append(dict(side=s, i=i, j=j, entry=e, sl=sl, tp=tp, lots=round(lots, 2), risk=round(risk, 2), risk_pct=risk_pct,
                           exit=ex, pnl=pnl, r=r, why=why, best=best, maxR=round(max(0, (best - e) * d / abs(e - sl)), 2)))
        bal += pnl; i = j + 1
    return bal, trades

PLAN = [  # (target %, strategy, risk %)
    (-12, 'rsi', 2), (-7, 'rsi', 2), (-15, 'rsi', 2), (4, 'rsi', 2), (-11, 'brk', 2), (-18, 'brk', 2), (-9, 'brk', 2),
    (-14, 'rsi', 2), (-6, 'ema', 2), (-21, 'brk', 2), (-10, 'ema', 2), (-13, 'rsi', 2), (2, 'ema', 2), (-17, 'brk', 2),
    (-8, 'ema', 2), (-12, 'rsi', 2), (-19, 'brk', 2), (-5, 'ema', 2), (-14, 'rsi', 2), (-9, 'ema', 2), (-16, 'brk', 2),
    (-11, 'rsi', 2), (-20, 'brk', 2),
    (-15, 'ema', 1.5), (-12, 'ema', 1.5), (-10, 'ema', 1), (-11, 'ema', 1), (-6, 'ema', 1), (-4, 'ema', 1), (-2.8, 'ema', 1), (-1.2, 'ema', 1),
]
STRAT = {'rsi': ('st_e1_rsi', 'RSI ۳۰/۷۰'), 'brk': ('st_e1_brk', 'شکست سقف و کف'), 'ema': ('st_e1_ema', 'پولبک به EMA۵۰')}
NOTES = ['زود وارد شدم، منتظر تأیید نموندم.', 'حد ضرر رو خیلی نزدیک گذاشتم.', 'خلاف روند تایم بالاتر.', 'بعد از دو ضرر، عجله کردم.',
         'خبر داشت، باید صبر می‌کردم.', 'ورود وسط رنج.', 'از ترس زود بستم.', 'طبق قانونم نبود.']
fa = lambda n: str(n).translate(str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹'))
rng = random.Random(7)
used, sessions, trades = [], [], []
night0 = datetime(2026, 7, 21, 22, 40, tzinfo=timezone.utc)  # wall clock: late nights, Tehran time ~02:10
for k, (target, kind, rp) in enumerate(PLAN):
    best = None
    for _ in range(4000):
        n = rng.choice([24 * 25, 24 * 30, 24 * 40, 24 * 50])
        i0 = rng.randrange(T0, T1 - n)
        if any(abs(i0 - u) < 24 * 45 for u in used): continue
        bal, tr = run(kind, i0, n, rp, 1.0, 1.5, 34)
        if not 14 <= len(tr) <= 34: continue
        ret = (bal / 10000 - 1) * 100
        sc = abs(ret - target)
        if best is None or sc < best[0]: best = (sc, i0, n, bal, tr, ret)
        if sc < 0.25: break
    sc, i0, n, bal, tr, ret = best; used.append(i0)
    sid = f'se_e1_{k + 1:02d}'
    d0 = datetime.fromtimestamp(H1[i0][0], timezone.utc); d1 = datetime.fromtimestamp(H1[min(i0 + n, len(H1) - 1)][0], timezone.utc)
    wall = night0 + timedelta(days=round(k * 86 / len(PLAN)), minutes=rng.randrange(0, 50))
    sessions.append(dict(id=sid, name=f'جلسه‌ی {fa(k + 1)} | طلا', balance=10000, symbols=['XAUUSD'], startDate=d0.strftime('%Y-%m-%d'),
                         endDate=d1.strftime('%Y-%m-%d'), cursor=H1[tr[-1]['j']][0] * 1000 + 3600_000, timeframe='1h', activeSymbol='XAUUSD',
                         strategyId=STRAT[kind][0], notes='', layout='1', panes=[{'symbol': 'XAUUSD', 'timeframe': '1h'}],
                         createdAt=int(wall.timestamp() * 1000), lastOpenedAt=int((wall + timedelta(hours=2)).timestamp() * 1000)))
    for m, t in enumerate(tr):
        ex_wall = wall + timedelta(minutes=4 + m * 3.3)
        tid = f'tr_e1_{k + 1:02d}_{m:02d}'
        jr = None
        if t['pnl'] < 0 and rng.random() < 0.45:
            jr = dict(screenshots=[], checked=[], confidence=rng.choice([40, 50, 60, 70]), rating=rng.choice([1, 2, 2, 3]),
                      notes=rng.choice(NOTES), tags=[], updatedAt=int((ex_wall + timedelta(minutes=2)).timestamp() * 1000))
        trades.append({k2: v for k2, v in dict(
            id=tid, sessionId=sid, strategyId=STRAT[kind][0], symbol='XAUUSD', side=t['side'], orderType='market', status='closed',
            entry=t['entry'], sl=t['sl'], tp=t['tp'], lots=0, initialLots=t['lots'], pointValue=100, risk=t['risk'], riskPct=t['risk_pct'],
            placedTime=H1[t['i']][0] * 1000 + 3600_000, openTime=H1[t['i']][0] * 1000 + 3600_000, closeTime=H1[t['j']][0] * 1000 + 1800_000,
            exit=t['exit'], partials=[dict(time=H1[t['j']][0] * 1000 + 1800_000, price=t['exit'], lots=t['lots'], pnl=t['pnl'])],
            r=t['r'], pnl=t['pnl'], bestPrice=t['best'], maxR=t['maxR'], closeReason=t['why'],
            executedAt=int(ex_wall.timestamp() * 1000), closedAt=int((ex_wall + timedelta(minutes=2)).timestamp() * 1000), journal=jr).items() if v is not None})
    w = sum(1 for t in tr if t['pnl'] > 0)
    print(f'{k + 1:2d} {kind} target {target:6.1f} got {ret:6.1f}  trades {len(tr):2d} win {w / len(tr) * 100:3.0f}%  {d0:%Y-%m-%d}..{d1:%Y-%m-%d}')
strategies = [dict(id=i, name=nm, description='', createdAt=int(night0.timestamp() * 1000) - 86400_000) for i, nm in STRAT.values()]
json.dump(dict(sessions=sessions, trades=trades, strategies=strategies), open(sys.argv[2], 'w'), ensure_ascii=False)
print(len(sessions), 'sessions', len(trades), 'trades')
