# «بازپخش» (Replay): a 25-second motion showreel for BacktestLab

**Concept.** One candle unfolds into words, shapes, space and data, then folds back into itself. Every shot is made out
of the one before it. The last frame is the first frame, so the film loops.

**Rules**
- Type: Vazirmatn only.
- Colour: violet `#7C5CFF`, green `#26C281` and red `#F25466`, plus black and white. Fills are flat.
- Camera: it only tracks in the reading direction (right to left) or pushes forward into a detail, and that detail
  becomes the next scene.
- Motion: critically damped springs (no overshoot) and exponential curves. Blur follows speed and direction.
- Timing: 120 BPM, so a beat is 0.5 s and a bar is 2 s. Something happens on every beat.

| Bar | Time | Technique | What happens |
|---|---|---|---|
| 1 | 0–2 | Hook (kinetic type) | The candle collapses into an underline. «بازار رو دوباره بازی کن» arrives a word per beat while the camera tracks along. The full stop flies to the centre. |
| 2 | 2–4 | Shape morph | Dot → ▶ → ◀◀ → a red and a green candle → nine real EUR/USD candles. |
| 3 | 4–6 | 2D → 3D | The chart tips back onto a floor and the bodies rise into columns. The camera tracks along the row and dives into the white top of the entry candle. |
| 4 | 6–8 | UI | The white becomes a replay panel. Real hourly candles stream in, the position slides in and the target is hit (+2R). The camera pushes into the green zone. |
| 5 | 8–10 | Kinetic type | «کندل به کندل / بدون دیدن آینده». A black bar redacts «آینده». |
| 6 | 10–12 | Shape morph | The bar becomes an hourglass, which flips and becomes a clock that winds back. Black floods the frame and leaves a ring. |
| 7 | 12–14 | 2D → 3D | The ring tips into an orbit. Five markets stand up on it and the carousel turns. The camera pushes into the violet XAU/USD card. |
| 8 | 14–16 | Data | EUR/USD's last 100 backtested trades: the equity line, the hole below zero, then one bar per trade, sorted into 23 wins and 77 losses. They fold into «۱». |
| 9 | 16–18 | Kinetic type | «۱۰۰ معامله / قبل از اولین / ریالِ واقعی.» The full stop becomes the next dot. |
| 10 | 18–20 | Shape morph | Dot → V → W → staircase → horizon. The ground rises. |
| 11 | 20–22 | 2D → 3D (riser) | A city of real weekly EUR/USD moves rises. The camera climbs and dives into the white roof of the tallest tower. |
| 12 | 22–24 | Strongest moment | The white splits into four markets that replay in sync. Each resolves a sixteenth note apart and floods its panel with its real result. |
| End | 24–25 | End title | The four results fold into one violet bar. «بک‌تست‌لب» rises out of it and sinks back, and the bar folds into the opening candle. |

**The Instagram cut** (`reel.html`, `--reel`) is 1080×1920, 28 s and 30 fps. It is the same film, built from the
same code. Every scene is laid out again for portrait inside the app's safe area (y 220–1500):
- the hook sets in three lines, and the camera also tracks down;
- «کندل / به / کندل» stacks;
- the markets carousel is narrower;
- the four replays sit in one column.

After the title comes a call to action: the bar lets go of a button «۷ روز رایگان» and «لینک توی بیو» rises
under it. The button is pressed, and its label rolls to «همین حالا شروع کن». On the last half bar everything folds
back into the candle, so the reel loops too. Caption and cover: `caption.md`.

**Data.** All market data is real, from the platform's own 1-minute store (`data.py`), using a 20-hour breakout with a
1-ATR stop and a 2-ATR target. The losing record (−31R over 100 trades) is shown as it is. That is the point of the
film: see it before risking real money.

**Build.** Every scene is a pure function of time inside `window.seek(t)`, with no CSS animation, no timers and no
state carried between frames. `sound.js` writes the soundtrack with an OfflineAudioContext:
- a kick on every beat;
- a hit on every scene change;
- a whoosh under every exit;
- a riser through bar 11.

`render.cjs` renders 3 subframes per frame at 60 fps and blends them with ffmpeg `tmix` for motion blur, then muxes in
the loudness-normalised soundtrack.

```
python3 data.py <market store> && python3 build.py
node render.cjs stills <dir>             # one frame per beat, to review
node render.cjs video <out.mp4> 3        # 3 parallel workers
```
