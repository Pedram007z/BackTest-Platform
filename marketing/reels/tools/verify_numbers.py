"""
Re-checks every number the four reels state on screen or in their captions, from first principles.

The figures the pages draw from their own simulations (reel 3's 30 traders, the dashboards) are printed by
tools/facts.cjs; reel 4's sequence is rebuilt here bit-for-bit (same PRNG and shuffle as reelkit/base.js).

usage: python tools/verify_numbers.py
"""
from math import comb


def check(label, got, want, tol=0.0):
    ok = abs(got - want) <= tol
    print(f"{'OK ' if ok else 'BAD'} {label}: {got} (expected {want})")
    if not ok:
        raise SystemExit(1)


# ---------- reel 1: «حساب دمو، وقت تلف کردنه» ----------
# 100 trades on a demo account when the setup appears 1–2 times a trading day: 50–100 trading days ≈ 2.5–5 months.
# The reel rounds this to «≈ ۳ ماه» (about 21 trading days a month, at ~1.5 setups a day).
check('reel 1: trading months for 100 trades at 1.5 setups/day', round(100 / 1.5 / 21, 1), 3.2)

# ---------- reel 2: «وین‌ریت ۸۰٪… و حسابت منفیه‼» ----------
check('reel 2: strategy A, 80 wins × +0.2R − 20 losses × 1R', round(80 * 0.2 - 20 * 1, 6), -4)
check('reel 2: strategy B, 35 wins × +3R − 65 losses × 1R', 35 * 3 - 65 * 1, 40)


def p_longest_run_at_least(n, p_loss, k):
    """Probability that n independent trades contain a losing run of length >= k (exact, by dynamic programming)."""
    # state: current losing run length (0..k-1); absorbed mass = runs that already reached k
    dist = [1.0] + [0.0] * (k - 1)
    hit = 0.0
    for _ in range(n):
        nxt = [0.0] * k
        for run, pr in enumerate(dist):
            nxt[0] += pr * (1 - p_loss)
            if run + 1 >= k:
                hit += pr * p_loss
            else:
                nxt[run + 1] += pr * p_loss
        dist = nxt
    return hit


p8 = p_longest_run_at_least(100, 0.65, 8)
check('reel 2: P(8+ losses in a row within 100 trades at 35% wins)', round(p8, 2), 0.69, 0.015)
# median longest run: the smallest k with P(longest >= k+1) <= 0.5
median = next(k for k in range(1, 40) if p_longest_run_at_least(100, 0.65, k + 1) <= 0.5)
check('reel 2: median longest losing run', median, 9)

# ---------- reel 3: «استراتژی جدید یاد نگیر‼» ----------
# A strategy with a true 50% win rate: how often its measured win rate lands inside the range the reel shows.


def coverage(n, lo, hi):
    return sum(comb(n, x) for x in range(n + 1) if lo <= x / n <= hi) / 2 ** n


check('reel 3: 20 trades land in 30–70%', round(coverage(20, 0.30, 0.70), 3), 0.959, 0.002)
check('reel 3: 100 trades land in 40–60%', round(coverage(100, 0.40, 0.60), 3), 0.965, 0.002)
check('reel 3: 500 trades land in 45–55%', round(coverage(500, 0.45, 0.55), 3), 0.978, 0.002)
# «۵۰۰ معامله با حساب واقعی… بیش از یک سال»: 500 trades at 1–2 setups a trading day = 250–500 trading days
check('reel 3: trading years for 500 trades at 2 setups/day (the fastest case)', round(500 / 2 / 252, 2), 0.99, 0.01)

# ---------- reel 4: «یه استراتژی سودده… و حسابت نصف شد‼» ----------
M = 0xFFFFFFFF


def mulberry32(seed):
    """The PRNG in reelkit/base.js (rng), ported bit for bit."""
    state = seed & M

    def nxt():
        nonlocal state
        state = (state + 0x6D2B79F5) & M
        x = ((state ^ (state >> 15)) * (1 | state)) & M
        x = ((x + (((x ^ (x >> 7)) * (61 | x)) & M)) & M) ^ x
        return ((x ^ (x >> 14)) & M) / 4294967296

    return nxt


def sequence(seed, wins, n, max_streak):
    """Same as sequence() in reel 4: shuffle 35 wins among 100 trades until the longest losing run is exactly 8."""
    s = seed
    while True:
        r = mulberry32(s)
        seq = [i < wins for i in range(n)]
        for i in range(n - 1, 0, -1):
            j = int(r() * (i + 1))
            seq[i], seq[j] = seq[j], seq[i]
        best = cur = 0
        for w in seq:
            cur = 0 if w else cur + 1
            best = max(best, cur)
        if best == max_streak:
            return seq
        s += 1


SEQ = sequence(21, 35, 100, 8)


def path(risk):
    p = [10000.0]
    for w in SEQ:
        p.append(p[-1] * (1 + 3 * risk if w else 1 - risk))
    return p


P1, P10, P30 = path(0.01), path(0.10), path(0.30)
peak = max(range(101), key=lambda i: P30[i])
trough = min(range(peak, 101), key=lambda i: P30[i])
check('reel 4: wins in the sequence', sum(SEQ), 35)
check('reel 4: 1% risk, final balance', round(P1[-1]), 14642)
check('reel 4: 30% risk, final balance', round(P30[-1]), 4872)
check('reel 4: 30% risk, peak balance', round(P30[peak]), 1273879)
check('reel 4: 30% risk, drawdown from the peak (%)', round((1 - P30[trough] / P30[peak]) * 100, 1), 99.8)
check('reel 4: 10% risk, final return (%) (why the reel never says 1% earns the most)', round((P10[-1] / 1e4 - 1) * 100), 932, 1)
for risk, want in ((0.01, 7.7), (0.02, 14.9), (0.05, 33.7), (0.10, 57.0), (0.30, 94.2)):
    check(f'reel 4: 8 losses in a row at {risk:.0%} risk (%)', round((1 - (1 - risk) ** 8) * 100, 1), want)
check('reel 4: Kelly fraction for 35% wins at 3R (p − q/b)', round(0.35 - 0.65 / 3, 3), 0.133)
print('all numbers check out')
