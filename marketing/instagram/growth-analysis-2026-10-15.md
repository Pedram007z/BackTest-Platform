# @backtestlab_ir: why reels stay under 200 views (15 Oct 2026)

Data from the Instagram API through Composio.

## The account

- 7 followers, 0 following, 14 posts (13 reels, 1 carousel), all published 7–15 Oct.
- Last 8 days: 1,147 accounts reached, 1,373 views, 17 profile visits, 29 accounts engaged.

## Every reel

Avg watch is in seconds; skip rate is the share of views skipped in the first 3 seconds.

| Posted (UTC) | Hook | Views | Reach | Avg watch | Skip rate | Saves | Shares |
|---|---|---|---|---|---|---|---|
| 15 Oct 09:17 | بک‌تست‌لب از امروز بازه (launch) | 111 | 51 | 6.3 | 35% | 4 | 2 |
| 14 Oct 16:59 | بیشتر تریدرها… بعد از ۲۰ معامله | 122 | 118 | 10.4 | 64% | 2 | 0 |
| 14 Oct 15:58 | ترید رو شروع نکن… | 8 | 5 | 17.8 | 40% | 0 | 0 |
| 12 Oct 12:33 | اگه برمی‌گشتی به ۱۲ مارس ۲۰۲۰… | 181 | 161 | 6.9 | 64% | 2 | 3 |
| 12 Oct 11:19 | ۵ اشتباه بک‌تست | 128 | 123 | 7.4 | 70% | 0 | 0 |
| 12 Oct 07:46 | ۱۲ مارس ۲۰۲۰، بیت‌کوین ۴۰٪ ریخت | 182 | 162 | 16.8 | 53% | 1 | 0 |
| 11 Oct 13:33 | استراتژی جدید یاد نگیر | 5 | 5 | 8.8 | 25% | 0 | 0 |
| 11 Oct 08:09 | وین‌ریت ۸۰٪… و حسابت منفیه؟ | 161 | 144 | 8.8 | 36% | 3 | 3 |
| 11 Oct 01:39 | تمرین با حساب دمو… | 6 | 4 | 5.7 | 50% | 0 | 0 |
| 10 Oct 12:40 | ۳ نشونه… | 5 | 2 | 3.6 | 100% | 0 | 0 |
| 9 Oct 08:16 | بک‌تست یعنی چی؟ | 4 | 2 | 3.9 | 100% | 0 | 0 |
| 8 Oct 07:32 | ۵۰٪ ضرر کردی؟ | 119 | 114 | 4.1 | 63% | 0 | 0 |
| 7 Oct 20:23 | چرا حرفه‌ای‌ها بیشتر از ۱٪ ریسک نمی‌کنن؟ | 6* | 119 | 10.2 | 100% | 1 | 0 |

\* The API returned 6 views against a reach of 119 for this reel; the numbers don't agree.

## Why the views stop near 200

1. **The test batch isn't passed.** A new account's reel is first shown to a small batch of non-followers, about 100–180 people here. It is pushed further only if that batch watches and sends it. Ours lose most viewers in the first 3 seconds: skip rates are 50–70% on most reels. Average watch time is 4–10 seconds on reels that run 20–55 seconds. Sends are almost zero.
2. **The first frame isn't readable at once.** The kinetic text fades and blurs in, so the very first frame is dark or half-formed. The hooks are about the concept ("backtesting") rather than about the viewer's money.
3. **The reels are too long for the payoff.** The answer comes 20–40 seconds in.
4. **Nothing is worth sending.** Instagram's head, Adam Mosseri, names watch time, likes per reach and sends per reach as the top signals, with sends weighing more for reaching non-followers. The two best reels had a story or a twist (12 March 2020; the 80% win-rate paradox). They were also the ones that got shares.
5. **Posting pattern.** Two or three reels went out on the same day, once only an hour apart, and one went out at 05:09 Tehran time. Five reels got under 10 views. Same-day posting isn't proven to be the cause, but check **Account Status → recommendation eligibility** for those five.
6. **Caption hygiene.** Two captions still hold production notes:
   - 9 Oct, «بک‌تست یعنی چی؟»: "- Candles playing: …"
   - The 8 Oct carousel: the slide list.
   Edit them.

## What the niche's big pages do

Their reel views couldn't be read: the API connection only covers our own account. Follower counts below are approximate, from web search.

The large Persian pages include:
- nikgold_forex (~1.2M)
- amirhossein.namavar (~1.2M)
- zeytontrade (~474k)
- meysamdehqani (~241k)
- economy.reza (~206k)

What they have in common:
- Topics tied to today's gold, dollar or crypto price.
- Real trades and account results.
- Trading psychology.
- A person on camera, or at least a voice.
- A pull to Telegram.

## The sample reel (`reels/brand-reels/g1`)

«زیر ۳۰ بخر، بالای ۷۰ بفروش»: the most-taught RSI rule, tested on 11 years of real gold prices (1-hour chart, 2015 to Oct 2026, no fees).

- 550 trades, 61.3% win rate, account −59.0%, worst drawdown 74%.
- Holding gold over the same years returned +246.9%.
- With a $0.30 spread the loss becomes −62.9%.

How it's built:
- 18 seconds long, with the rule fully readable at frame 0.
- Eleven years fast-forward with every trade flashing.
- The 61% win rate as a tease, then the −59% twist and the buy-and-hold comparison.
- A comment prompt for the next strategy to test, which starts a series, and a send prompt («بفرست برای رفیقی که با RSI ترید می‌کنه»).

## Plan

- **A series:** «استراتژی‌های اینستاگرام رو روی داده‌ی واقعی تست می‌کنم», 3 a week, with topics taken from the comments.
- **Format:** 12–20 seconds; the rule or result readable on frame 1; the payoff by the middle; a twist; a send prompt. Add your voice. A face helps more.
- **Trial Reels:** post every new reel as a Trial Reel first. It is shown to non-followers, and if it does well it is shared with followers automatically.
- **Timing:** one reel a day at most, at a consistent evening time in Tehran. Never two within a few hours.
- **Seed each reel:**
  - Post it to the @backtestlab_ir Telegram channel.
  - Run Collab posts with small Persian trading pages.
  - Reply to every comment in the first hour.
- **Measure:** skip rate (aim for under 40%), average watch time against length, and sends per reach. Make more of whatever topic wins.
