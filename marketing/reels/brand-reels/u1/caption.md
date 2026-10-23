# u1 «اگه سکه بندازی و ترید کنی…»: caption and pinned comment (both cuts)

## Caption

```
اگه سکه بندازی و ترید کنی، بعد از ۱۰۰۰ معامله چی می‌شه؟ 🪙
روی داده‌ی واقعی طلا تستش کردیم:
بدون هزینه: تقریباً صفر به صفر، پنجاه پنجاه.
با اسپرد و کمیسیون: وین‌ریت حدود ۴۵٪ و حدود −۱۲۰R.
با ریسک ۱۰۰ دلار، یه حساب ۱۰ هزار دلاری قبل از معامله‌ی هزارم صفر شد.

ترید بدون برتری، حتی شانسی هم نیست.
استراتژی تو بعد از هزینه‌ها برتری داره؟
🔗 شروعش رایگانه؛ لینک توی بیو
.
#ترید #فارکس #طلا #بک_تست #اسپرد #مدیریت_ریسک
```

**Pinned comment:** «فکر می‌کردی نتیجه‌ی سکه چی می‌شه؟ 👇»

## Facts on screen

- **The test (`data.py`):** real XAUUSD 1-minute data from 2023–2025.
  - 1,000 entries at random weekday minutes, 07:00–20:00 UTC; the coin picks the side.
  - The stop and the target are both $3 away.
  - Each entry is scored twice: with no costs, and with a 0.30 spread and $7 commission per lot.
- **Results, seed 3:**
  - no costs: 502 wins and +4R;
  - with costs: 452 wins (45.2%) and −119.3R;
  - at $100 a trade, a $10,000 account reaches $0 at trade 743.
  - Seeds 1–12 give −79 to −159R with costs, and 10 of the 12 reach $0 before trade 1,000.
- **The candles shown are real:** the first entry's 5-minute candles (20 June 2025).
- **«تنظیمات جلسه»:** the platform's per-symbol spread and commission, which you set when creating a session.
