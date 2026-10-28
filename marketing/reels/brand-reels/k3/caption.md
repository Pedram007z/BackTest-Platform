# k3 «کدوم پلتفرم بک‌تست‌گیری ایرانی تقویم اقتصادی داره…؟»: caption

## Caption

```
کدوم پلتفرم بک‌تست ایرانی تقویم اقتصادی داره که روی چارت، ساعت و تاریخ خبرهای مهم رو نشونت بده؟ 📅
صد البته بک‌تست‌لب.

📍 هر خبر مهم روی کندل خودش علامت داره؛ قرمز پراهمیت، نارنجی متوسط
🕓 اسم خبر به فارسی، ساعتش به وقت تهران یا هر منطقه‌ی زمانی
〰️ خبرهای پیش‌رو با خط‌چین، قبل از اینکه برسی بهشون
🔒 عدد واقعی خبر تا بازپخش به همون لحظه نرسه، نشون داده نمی‌شه
🗓 تقویم کامل کنار چارت، با تاریخ شمسی

تقویم اقتصادی توی اشتراک حرفه‌ای بک‌تست‌لبه؛ لینکش توی بیوئه 🔗
.
#بک_تست #تقویم_اقتصادی #فارکس #طلا #NFP #ترید #تحلیل_فاندامنتال #تریدر
```

## Facts on screen

- **The screens are real captures of the platform** (`capture/cap.mjs`). They come from a local copy of the platform, in
  its light theme and on the built-in chart.
  - **The session:** XAUUSD, 15-minute candles, on Friday 2 October 2026 (جمعه ۱۰ مهر ۱۴۰۵), the day of the US jobs
    report. NFP was released at 12:30 UTC, which is 16:00 Tehran and 08:30 New York.
  - **The candles are real gold data** from the platform's market store. That includes the release candle (16:00–16:15 Tehran):
    O 4185.68, H 4226.00, L 4185.27, C 4210.82, a range of about 40 dollars.
- **The news times come from the platform's official release schedule.** The capture machine can't reach ForexFactory,
  so the platform filled the week from the schedule: USD, EUR and GBP news, high and medium impact, with times and no
  values. As a result:
  - the hover cards show the time, the impact and the Persian title, with no A/F/P row;
  - the calendar's footnote says so (the reel's crop leaves the footnote out).
- **On the live site, ForexFactory's actual numbers appear after the replay passes each release**, wherever the server
  has that week.
- **The orange flag is a medium-impact event:** Unemployment Claims on Thursday. To show it, «متوسط» was switched on
  in the calendar's impact filter; the default shows high impact only.
- **The «عدد واقعی» card is an illustration.** It's marked «مثال» and shows no numbers: a lock that opens when the
  playhead reaches «لحظه‌ی خبر».
- **The drawn chart in the opening and in «نصفه‌ست» is an illustration**, not market data.
- **The economic calendar is locked on the free plan.** That's why the reel and the caption point to «اشتراک حرفه‌ای»
  and don't say «شروع رایگان».
- **Length:** the reel is 56.0 s.
  - The recording is 61.7 s. It is sped up 12% with the pitch kept, and the long pauses are trimmed.
  - Getting closer to 50 s would mean cutting a line of the script.
