# f1 «همیشه میخواستی رو FX Replay بک‌تست بگیری؟»: caption, pinned comment and DM reply

## Caption

```
همیشه میخواستی رو FX Replay بک‌تست بگیری، ولی نمی‌شد؟ 🤔
کارت خارجی، فیلترشکن، قیمت دلاری… دیگه لازم نیست.

بک‌تست‌لب فارسیه، با پرداخت ریالی:
بازار واقعی رو از ۲۰۱۵ تا الان دوباره پخش می‌کنی، بدون دیدن آینده؛
خط می‌کشی، اندیکاتور می‌ذاری و خرید و فروش می‌کنی، با اسپرد و کمیسیون بروکرت؛
آخرش هم آنالیز، وین‌ریت و بدترین ضررهای پشت سر همت رو نشونت می‌ده.

👇 زیر همین پست بنویس «ریپلی» تا لینک شروع رایگان رو برات دایرکت کنم.
.
#بک_تست #ترید #فارکس #طلا #بکتست #مدیریت_ریسک
```

**Pinned comment:** «تا حالا روی کدوم سایت بک‌تست گرفتی؟ 👇»

## DM reply to everyone who comments «ریپلی» (by hand, or as an auto-DM)

```
سلام! 👋 اینم لینک شروع رایگان بک‌تست‌لب:
🔗 https://backtestlab.ir
فارسی، با پرداخت ریالی؛ بازار واقعی رو از ۲۰۱۵ تا الان بدون دیدن آینده پخش کن و استراتژیت رو تست کن.
```

## Facts on screen

- **Every screen is the real platform.** It ran locally on main (TradingView chart library, API server on the market
  store) and was captured by Playwright at 2× (`capture/`).
  - **The account:** a new account («علی رضایی», a made-up name) signed up with a phone number on the 7-day pro trial.
  - **The session:** «طلا · شکست لندن», XAUUSD 15-minute candles from 14 April 2025, with a 3-pip (0.30) spread and
    $7 commission.
- **The replay:** stepped with the app's own «کندل بعدی» button. The Fibonacci, EMA 50 and RSI were placed through the
  chart library's API on the real swing low and high in view.
- **The trades:** ten trades placed with the app's own «خرید» and «فروش» buttons, using its default stop (1.5 × ATR)
  and 2R target, each played candle by candle until it closed.
  - The trade shown is a buy at 3219.38 that reached its target, +$181.44.
  - **Analytics, all real:** 10 trades, 4 wins (40%), +$173.51, average RR 1.99, a longest losing streak of 3.
- **«از ۲۰۱۵ تا الان»:** the new-session window's own line, «داده‌ی چارت: ۱۱ دی ۱۳۹۳ تا ۱۵ مهر ۱۴۰۵» (1 January 2015
  to 7 October 2026).
- **«پرداخت ریالی»:** the billing page's payment methods, زرین‌پال and زیبال through Shaparak. The plan prices on that
  page are the platform's defaults, so check them against the live site.
- **The hook and the three pains** are drawn and generic: a page that doesn't load, a declined card, a VPN switching
  off, a dollar price. Nothing of FX Replay's own is shown; its name is only in the voice and the words.
