# k6 «نظرت چیه باهم یه خودکشی کنیم؟» (kinetic): caption

## Caption

```
بدون بک‌تست وارد بازار شدن یعنی خودکشی مالی 📉
سه تا استراتژی داری و نمی‌دونی کدومش واقعاً کار می‌کنه؟

📝 قانون‌ها و چک‌لیست هر کدوم رو توی بک‌تست‌لب ذخیره کن
⏪ روی بازار واقعی گذشته تستشون کن
📊 توی آنالیز ببین کدوم سود داده و کدوم فقط اعصابتو خورده
✅ بعد فقط با برنده وارد بازار شو

شروع رایگان؛ لینک توی بیو 🔗
.
#بک_تست #ترید #فارکس #طلا #بکتست #تریدر #مدیریت_ریسک
```

The caption says «خودکشی مالی» so Instagram reads it as money talk. A bare «خودکشی» in a caption can get a post
limited under the self-harm rules.

## Facts on screen

- **The take:** the user's second recording of k5's script, with the same 102 words.
- **The drawn parts:**
  - the account's equity line and its crash (no numbers, only a «صفر» line);
  - the plan card;
  - the stopwatch and the capital bar (۱۰۰٪ to ۰٪ is the plan in the voice, not data);
  - the light bulb;
  - the three strategy cards that get shuffled.
- **From «بک‌تست‌لب» on, every screen is the real platform in its light theme.** These are k5's captures
  (`../k5/screens/`, from k5's `capture/` scripts): the dashboard, the strategy window with its rules, the checklist,
  the three gold sessions at their end, the analytics with its strategy filter, then filtered to «فروش در باز شدن
  لندن», and the strategy cards.
- **The results are the app's own strategy cards** (`results.json`, copied from k5):

  | Strategy | Trades | Win rate | Net |
  |---|---|---|---|
  | فروش در باز شدن لندن | 10 | 50% | +$429 |
  | خرید در باز شدن نیویورک | 10 | 20% | −$362 |
  | خرید در باز شدن لندن | 10 | 10% | −$613 |

  These are three XAUUSD 1h sessions that started on ۲۳ شهریور ۱۴۰۵ (14 Sep 2026). Each used the app's default stop
  (1.5× ATR) and target (2R) at 1% risk. `k5/caption.md` has the full setup.
- **About «شروع رایگان»:** the free plan has one session. The analytics, the journal and the economic calendar need
  the pro plan.
- **Length:** 42.5 s, on the take's own speed. Only the pauses are trimmed.
