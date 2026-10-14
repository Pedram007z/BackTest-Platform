# Store screenshots for the Android app

Six 1080×1920 portrait screenshots (9:16) for Cafe Bazaar, Myket and Google Play, in upload order:

1. «استراتژیت رو روی گذشته‌ی بازار امتحان کن؛ نه روی سرمایه‌ات.»: the logo and the gold replay.
2. «بازار رو کندل به کندل دوباره پخش کن»: the replay and its play controls.
3. «ابزار رسم، اندیکاتور و تقویم اقتصادی»: fib, EMA, RSI and the news panel.
4. «پوزیشن بگیر؛ حجم از درصد ریسکت»: the order ticket at 1% risk.
5. «ژورنال و آنالیز کامل»: analytics and the Monte Carlo card.
6. «چند سال بازار، توی چند ساعت»: the dashboard's replayed time against the time spent.

The phone screens come from the app at 390×844 @3x:
- The gold replay runs on real April 2025 prices from the platform's own server (set up as for the launch reel; see `../reels/brand-reels/README.md`).
- The trade on screen hit its target at +2R.
- The journal, analytics and dashboard are from the sample account.

## Rebuild

1. Start the server and the app as for the launch reel. Restore the server's data, then run the captures from `capture/`:
   1. `node draw-desktop.cjs`
   2. `node mshots.cjs <dir>`
   3. `node mpages.cjs <dir>`
2. Save these as JPEGs in `screens/`: m-step14, m-step10, m-tools0, m-ticket, m-news, m-analytics-full, m-dashboard-full.
3. Run `node render.cjs`. It writes `out/01..06.png` plus a JPEG copy of each.
