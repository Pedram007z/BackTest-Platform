# cv1: reel covers inspired by a trading page's cover grid

The user shared the reels grid of a Persian trading page (ticktrade.fa) and asked for covers inspired by it. These keep
what makes that grid work and nothing of its look:
- a two-line question, the first line white and the second red or green;
- one character with a clear expression;
- one bold, glowing symbol;
- a dark, cinematic trading room with depth;
- everything inside the profile grid's 3:4 crop.

What's ours:
- the BacktestLab trader from k22 (violet hoodie, lime drawstrings and backpack strap, the logo on his chest), drawn
  here waist-up with a rim light;
- our own rooms (a night-city window, monitors with candles, a warm lamp, plants, a glossy desk, blurred for depth and
  tinted per cover);
- our own symbols and type.

| # | Reel | Line 1 | Line 2 | Symbol |
|---|---|---|---|---|
| 1 | k22 (and k16–k21) | به استراتژیت اعتماد داری؟ | یا از بررسیش می‌ترسی؟ | the «بررسی» gate, a «؟» thought bubble |
| 2 | k13–k15 | سودت از استراتژیه؟ | یا از شانسه؟ | a rising candle chart and two dice |
| 3 | k12 | نصف حسابت رفت؟ | ۵۰٪ سود کافی نیست! | the account bar at $500, −50% and +100% |
| 4 | k11 | وین‌ریت ۶۰ درصد، | پس چرا چالش سوخت؟ | a 60% ring, a prop challenge card on fire |
| 5 | k1 | پراپ تریدرها | چطوری به برداشت رسیدن؟ | an approved payout card and bills |
| 6 | q2 | ۲۰۰٪ سود توی یه ماه؟ | بیا یه حساب ساده کنیم | a curve shooting up, cracking |
| 7 | q3 | سیگنال ۹۰٪ سود ماهانه؟ | قبل از خرید اینو ببین | a «سیگنال VIP» phone and a warning sign |
| 8 | k10 | یه پیام از خودِ | یک سال بعدت | an envelope «۱ سال بعد», an hourglass of candles |
| 9 | k9 | چالش ۱۰۰ معامله | تا آخرش میری؟ | a 100-square grid filling with wins and losses |

The numbers on the covers are the reels' own (k12's −50% → +100%, k11's 60%, q2's 200%, q3's 90%, k9's 100). The
candle charts and the grid's colours are decoration, not data.

**Rebuild:** `python3 page.py` and `node render.cjs`. Each cover is written to `out/<n>-<reel>.jpg` (1080×1920) and
`out/<n>-<reel>-grid.jpg` (its 3:4 profile crop), plus `out/grid-preview.jpg` (the 3×3 grid). `out/` is not in git.
