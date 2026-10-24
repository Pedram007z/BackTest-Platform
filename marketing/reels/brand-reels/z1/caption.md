# z1 «میخوای جزو ۵ درصد باشی؟»: caption, pinned comment and DM reply

## Caption

```
میخوای جزو ۵ درصد باشی، ولی نمی‌دونی چطوری؟ 🥇
فرقشون اندیکاتور مخفی نیست؛ عددهای استراتژیشون رو می‌دونن:
وین‌ریت، میانگین سود به ضرر، و بدترین ضررهای پشت سر هم.

یه نمونه‌ی واقعی روی طلا (۷۵۵ معامله):
از هر ۱۰ تا کمتر از ۴ تا برد، ولی هر برد تقریباً ۲ برابر هر ضرر؛
و ۱۴ ضرر پشت سر هم هم توش بوده.

👇 زیر همین پست بنویس «عدد» تا لینک شروع رایگان رو برات دایرکت کنم.
.
#ترید #فارکس #طلا #بک_تست #مدیریت_ریسک #استراتژی_معاملاتی
```

**Pinned comment:** «وین‌ریت استراتژی خودت چنده؟ 👇»

## DM reply to everyone who comments «عدد» (by hand, or as an auto-DM)

```
سلام! 👋 اینم لینک شروع رایگان بک‌تست‌لب:
[لینک]
استراتژیت رو روی داده‌ی واقعی و بدون دیدن آینده تست کن، تا سه تا عددت رو داشته باشی:
وین‌ریت، میانگین سود به ضرر، و بدترین ضررهای پشت سر هم.
```

## Facts on screen

- **The «۵ درصد»:** it's the user's hook, a popular saying rather than a measured figure. The reel makes no claim about
  how many traders lose.
- **The three numbers are one real example (`data.py`), labelled «نمونه» on screen.**
  - **The rule:** XAUUSD 4-hour candles (UTC) from the platform's stored 1-minute data, January 2015 to September 2026.
    When a candle closes above the previous 20 candles' high, buy at the next open; below their low, sell.
  - **Stop and target:** the stop is 1.5 × ATR(14) away and the target is 2R. A candle touching both counts as the stop.
  - **Costs:** a 0.30 spread and $7 per lot commission on every trade.
  - **Results:**
    - 755 trades with a 36.8% win rate, shown as «۳٫۷ از ۱۰»;
    - average win 1.97R and average loss 1.03R, shown as «۱٫۹ به ۱»;
    - a longest losing streak of 14, and +54.1R in total.
- **The five-loss streak** is trades 666–670. The curve went from 21.8R to 16.8R, and the same rule made a new high
  shortly after.
- **The wall** has one tile per trade, in order: green for a win, red for a loss.
- **The replay** is the tile the camera enters: trade 715, a buy on 27 February 2026 that reached its target.
- **The platform screens:** replay without the future, per-symbol spread and commission when creating a session, and
  Analytics with win rate, average RR and the longest losing streak. The metric tiles show «عدد تو», not invented
  values.
