# k1 «پراپ تریدرها چطوری به برداشت رسیدن؟»: caption, pinned comment and DM reply

## Caption

```
پراپ تریدرها چطوری به برداشت رسیدن؟ 💸
رازش استراتژی عجیب نیست؛ رازش اینه که قانون‌های چالش رو نمی‌شکنن.

یه مثال واقعی روی طلا (۷۵۵ معامله، سودده):
با ریسک ۲٪ در هر معامله، بدترین افتش ۵۹٪ می‌شد…
با ریسک ۰٫۲۵٪، همون معامله‌ها فقط ۹٪ افت داشتن.
فرق برداشت و سوختن چالش، اندازه‌ی ریسکه.

اول چالش رو توی بک‌تست‌لب پاس کن، بعد حساب تهیه کن.
👇 زیر همین پست بنویس «پراپ» تا لینک شروع رایگان رو برات دایرکت کنم.
.
#پراپ #پراپ_تریدینگ #چالش_پراپ #ترید #فارکس #طلا #مدیریت_ریسک #بک_تست
```

**Pinned comment:** «تو چالش پراپ رو با ریسک چند درصد می‌ری؟ 👇»

## DM reply to everyone who comments «پراپ» (or "prop"; accept both if you automate it)

```
سلام! 👋 اینم لینک شروع رایگان بک‌تست‌لب:
🔗 https://backtestlab.ir
یه جلسه با همون موجودی چالشت بساز، استراتژیت رو روی داده‌ی واقعی و بدون دیدن آینده تست کن، و قبل از خرید چالش ببین افتت تا کجا می‌ره.
```

## Facts on screen

- **No prop firm is named, and no rule number is stated as fact.** The «حد مجاز» line is «مثلاً ۱۰٪»; each firm sets its
  own daily and total limits. The burning account is labelled «نمونه».
- **The drawdown example is real (`data.py`):** z1's breakout rule on XAUUSD 4-hour candles, 755 trades from 2015 to
  2026, with spread and commission.
  - **Results:** +54.1R in total, a deepest drawdown of 37.3R (trades 205 to 586), and a longest losing streak of 14.
  - **The risk ladder:** the same trades in the same order, with a fixed share of the balance at risk on each trade.
    The largest fall from a high is 59.0% at 2%, 33.6% at 1%, 17.8% at 0.5%, and 9.1% at 0.25% (the first step under
    10%).
- **The BacktestLab screens are real captures of the platform** (`capture/capk1.mjs`, run like f1's captures):
  - a new session named «چالش پراپ · ۱۰۰ هزار دلاری» with a balance of 100000;
  - the replay frames from f1;
  - the analytics' Monte Carlo card «افت سرمایه در بدترین ۵٪: ۱۷٫۲٪», from the ten real trades of f1's test session.
- **The voice says «حداکثر افت»; Analytics shows a different figure.** The analytics page has no plain «حداکثر افت».
  Its drawdown figure is the Monte Carlo one above (the admin panel has «بیشترین افت»), and the reel shows that card
  under its own label.
