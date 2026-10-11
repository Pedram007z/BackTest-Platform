# Reel 2: «وین‌ریت ۸۰٪… و حسابت منفیه‼»

| | |
|---|---|
| **Topic** | A high win rate doesn't make money; expectancy does. The strategy that does make money comes with losing streaks you must have seen before (in a backtest) to stick with it. |
| **Counter-belief** | Everyone looks for a high win rate. The reel shows an 80% win rate losing money and a 35% one making +40R. |
| **Length** | 52.5 s, 1080×1920, 30 fps. Persian, silent-friendly. |
| **Outlier formats used** | The title box with ‼; «داشبورد بک‌تست!!» (the dashboard reveal); a debate/vote (pick A or B), from the 906-comment reel's debate mechanic. |
| **Comment trigger** | «تو کدوم رو انتخاب می‌کنی؟» A «وین‌ریت ۸۰٪» or B «وین‌ریت ۳۵٪ و سود ۳R». «جوابت رو کامنت کن: A یا B؟» |
| **Files** | `index.html` (self-contained), `soundtrack.py` (music, cue times inside), cover: `../covers/reel2-cover.jpg` |

## Timeline

| Time | Beat | On screen |
|---|---|---|
| 0.0–3.6 | **Counter-belief hook** | «وین‌ریت ۸۰٪…». A win-rate gauge fills to 80% while the account line under it falls. At 1.15 s the title box «و حسابت منفیه‼» appears, with a red flash. |
| 3.6–9.2 | The belief, then the **next hook** | «همه دنبالشن:» and a bubble: «یه استراتژی با وین‌ریت بالا، که بیشتر معامله‌هاش سود بده.» The ✓ flips to ؟. At 7.5 s: «ولی یه عدد *مهم‌تر* هست که کسی بهش نگاه نمی‌کنه…» |
| 9.2–17.6 | Proof: the race | «دو تا استراتژی، هر کدوم ۱۰۰ معامله:». Card A (80% wins, +0.2R each) and card B (35% wins, +3R each) race trade by trade. A ends **−4R** and B ends **+40R**. At 14.9 s: «به این میگن *امید ریاضی:* هر معامله، به‌طور میانگین چقدر برات درمیاره.» |
| 17.6–19.6 | **Type Two hook** | «ولی این هنوز *سخت‌ترین* قسمتش نیست…» |
| 19.6–28.2 | The bigger problem: the streak | «با وین‌ریت ۳۵٪، توی ۱۰۰ معامله…». A dot grid of B's 100 trades in which the longest losing run lights up; the red chip «۸ ضرر پشت سر هم»; the small line «با این وین‌ریت، به احتمال ۷۰٪ هشت تا یا بیشتر». Then «بیشتر تریدرها *همین‌جا* استراتژی‌شون رو عوض می‌کنن… !درست قبل از سود.!» |
| 28.2–37.0 | **Question hooks**, then the answer | «از کجا بدونی این ضررها *عادیه؟*» → «باید *قبلش* دیده باشیش.» → «۵ سال گذشته، ۵۰۰ معامله، کندل به کندل:» with the ×60 replay → «اسمش *بک‌تسته.*» → «و وقتی *عددها* رو دیدی…» |
| 37.0–45.0 | **Outlier format: the dashboard** | Title box «داشبورد بک‌تست!!». Tiles for expectancy (+0.4R), losing streak (8) and max drawdown (12%), and an equity curve over 100 trades, labelled «داده‌ی نمونه · استراتژی B». The deepest dip gets the tag «عادیه ✓». «دیگه با ۸ ضرر پشت سر هم نمی‌ترسی؛ چون می‌دونی *جزو بازیه.*» |
| 45.0–52.5 | **Pre-launch end card** + A or B | Logo, «به‌زودی», «قبل از پول واقعی، *عددهای* استراتژیت رو ببین.», the follow line, then the vote card A / B and an arrow. |

## Numbers (re-checked by `tools/verify_numbers.py`; the page's own values come from `tools/facts.cjs`)

- **Strategy A:** 80 wins × +0.2R − 20 losses × 1R = **−4R**.
- **Strategy B:** 35 wins × +3R − 65 losses × 1R = **+40R**.
- **Losing streaks at a 35% win rate:** the chance of 8 or more losses in a row within 100 trades is **69%** (shown as ۷۰٪). The median longest losing run is 9.
- **The dashboard** uses B's exact 100 trades from the dot grid: expectancy +0.4R, longest streak 8, max drawdown 12% (`window.facts`).

## Cover

`covers/reel2-cover.jpg`:
- a green «۸۰٪ وین‌ریت» gauge over a falling red account line
- the red title box «و حسابت منفیه‼»
- the chip «رازی به اسم «امید ریاضی»»

## Caption

```
وین‌ریت ۸۰٪… و حسابت منفیه؟! 🤯

استراتژی A: وین‌ریت ۸۰٪ ← بعد از ۱۰۰ معامله: −۴R
استراتژی B: وین‌ریت ۳۵٪ ← بعد از ۱۰۰ معامله: +۴۰R

رازش یه عدده: «امید ریاضی»؛
یعنی هر معامله، به‌طور میانگین چقدر برات درمیاره. 📊

ولی سخت‌ترین قسمت اینه:
با وین‌ریت ۳۵٪ به احتمال زیاد ۸ تا ضرر پشت سر هم می‌بینی…
و بیشتر تریدرها درست همین‌جا استراتژی‌شون رو کنار می‌ذارن.

بک‌تست یعنی این ضررها رو قبل از پول واقعی ببینی و بدونی جزو بازیه.

بک‌تست‌لب به‌زودی میاد 🚀
فالو کن تا روز لانچ رو از دست ندی 🔔

👇 تو کدوم رو انتخاب می‌کنی؟ A یا B؟ کامنت کن
.
.
.
#بک_تست #فارکس #ترید #تریدر #بازار_مالی #کریپتو #امید_ریاضی #مدیریت_سرمایه #استراتژی_معاملاتی #بکتست
```

**Pinned first comment:** «من B رو انتخاب می‌کنم؛ تو چی؟». Reply to early "A" comments by asking why, since replies keep the thread growing.

## Soundtrack

`soundtrack.py`, D minor (Dm–B♭–F–C), about 109 BPM. The bar length puts the breakdown (28.2 s), the drop (32.6 s) and the dashboard (37.0 s) on bar lines.
- A riser into the hook impact.
- A tick per trade dot as the race runs.
- A "fail" tone as A lands on −4R, and a bell as B lands on +40R.
- A downlifter into «سخت‌ترین قسمت», and a dark groove under the streak.
- A long riser and snare roll into the replay.
- A bell on «عادیه ✓», a bell on the follow line, and a soft final hit.
