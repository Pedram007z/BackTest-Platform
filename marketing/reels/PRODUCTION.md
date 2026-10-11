# How the reels are made

Each reel is a web page that draws one frame for any time `t`. A headless browser screenshots it 30 times a second, ffmpeg turns the frames into video, and a soundtrack synthesised in Python is mixed in. Everything is code: no editor project files, stock footage or stock music. To change a word, a colour or a timing, edit the page and render it again.

## Requirements

- **Node 18+ with Playwright and its Chromium.**
  - `tools/pw.cjs` loads `playwright` from this project, or the global copy in the Claude Code cloud container (`/opt/node22/lib/node_modules/playwright`), or wherever `PLAYWRIGHT_MODULE` points.
  - Locally: `npm i -D playwright && npx playwright install chromium`.
- **ffmpeg**, with libx264 and AAC.
- **Python 3** with `numpy` and `scipy`, for the soundtracks: `pip install -r tools/requirements.txt`.
- **Assets**, both already in the repo and referenced by relative path:
  - Fonts: `public/fonts/vazirmatn-*.woff2` (Vazirmatn, SIL Open Font License).
  - Logo: `brand/svg/logo-fa-dark.svg`.

## Folder map

```
marketing/reels/
  README.md              start here: the four reels at a glance
  METHOD.md              the growth method, the research, the reel formula
  PRODUCTION.md          this file
  reels.json             machine-readable summary of the four reels
  reelkit/               shared code for reels 3, 4 and future reels
    base.css             the look: colours, type sizes, title box, chips, cards, end card
    base.js              helpers: easing, word-by-word text, background, panels, labels, replay, belief bubble, end card
    soundgen.py          soundtrack synthesiser driven by a JSON spec
  reel1-demo-account/    index.html (self-contained), soundtrack.py + cues.json, README.md
  reel2-win-rate/        index.html (self-contained), soundtrack.py, README.md
  reel3-new-strategy/    index.html (uses reelkit), sound.json, README.md
  reel4-risk-per-trade/  index.html (uses reelkit), sound.json, README.md
  covers/                cover.html (all four covers) + rendered covers and grid previews
  tools/                 render, stills, facts, covers, encode, verify_numbers
```

Reels 1 and 2 were made before `reelkit` existed and carry their own versions of these helpers. Build new reels on `reelkit`, the way reels 3 and 4 are built.

## Commands

All commands run from `marketing/reels/`.

```sh
# check the layout at chosen moments (fast); prints page errors
node tools/stills.cjs reel4-risk-per-trade /tmp/stills 2.6 13.5 21 39 50

# print the numbers the page computed (window.facts)
node tools/facts.cjs reel4-risk-per-trade

# re-check every number the reels claim
python tools/verify_numbers.py

# the silent video, 1080×1920 at 30 fps, CRF 17 (about 2–5 minutes, 40–50 MB)
node tools/render.cjs reel4-risk-per-trade /tmp/reel4-hq.mp4 30

# the soundtrack
python reelkit/soundgen.py reel4-risk-per-trade/sound.json /tmp/reel4.wav   # reels 3, 4
python reel1-demo-account/soundtrack.py reel1-demo-account/cues.json /tmp/reel1.wav
python reel2-win-rate/soundtrack.py /tmp/reel2.wav

# the file to upload: levels the music to about -16 LUFS, two-pass H.264 3.3 Mb/s + AAC 192k (about 23 MB)
sh tools/encode.sh /tmp/reel4-hq.mp4 /tmp/reel4.wav /tmp/backtestlab-reel4.mp4

# covers: reelN-cover.jpg (1080×1920) and reelN-cover-grid-preview.jpg (the 3:4 profile-grid crop)
node tools/covers.cjs covers covers 1 2 3 4
```

The finished MP4s and WAVs are not committed, because they are large and can be rebuilt with the commands above.

## The page contract

A reel's `index.html` must:

- Be exactly 1080×1920 CSS pixels with `overflow: hidden`.
- Define `window.render(t)`, which draws the frame at `t` seconds **from scratch**. It must be deterministic and must not depend on the previous frame or on real time.
- Set `window.DURATION` in seconds.
- Set `window.ready = true` once fonts are loaded and the first frame is drawn (`document.fonts.ready.then(...)`).
- Optionally set `window.facts = {...}` with the numbers it shows, so they can be checked.
- Use seeded randomness only (`rng(seed)` from `reelkit/base.js`, mulberry32), so every render is identical.

The page is two canvases (`#bg` for the background, `#cv` for charts) plus absolutely positioned HTML layers for text, cards and chips. `render(t)` sets each element's opacity and transform for time `t`.

## reelkit/base.js reference

| Helper | What it does |
|---|---|
| `E.out / E.in / E.inOut / E.back` | Easing curves (cubic; `back` overshoots, for pops). |
| `P(t, a, d)` | Progress of an animation that starts at `a` and lasts `d`, clamped to 0–1. |
| `fa(n, frac)`, `sgn(n, frac)`, `usd(n)` | Persian digits, a signed number (`+` / `−`), and dollars with Persian digits. |
| `rng(seed)` | Seeded PRNG (mulberry32). `tools/verify_numbers.py` has a bit-exact Python port. |
| `C` | Colours: `gain #26c281`, `loss #f25466`, `lilac #b5a2ff`, `amber #f5b014`, `muted #a39cba`, `ink #eeebf6`, `line #302a44`. |
| `show(sel, t, a, b, {per, inD, outD, pop, noLift})` | A text layer on screen from `a` to `b`. Its words rise in one after another (`per` seconds apart) with a blur, and it fades out at `b`. |
| `fadeEl(sel, t, a, b, {pop, inD, outD, lift})` | A whole element slides up (or pops) in at `a` and fades out at `b`. |
| `drawBg(t, flash, red)` | Background: dark base, a slowly drifting violet glow, a moving 90 px grid, a vignette and grain. `flash` is a red hit on the hook; `red` shifts the glow towards red for bad news. |
| `panel(x, y, w, h)`, `label(text, x, y, color, size, bg, dir)` | A dark rounded card on the canvas, and a pill label. Use `dir = 'ltr'` for numbers with a sign, such as `−99.8٪`. |
| `line(ctx, pts, n, X, Y, color, width)` | Draws the first `n` points of a series, so a line grows over time. |
| `drawReplay(t, a, b, box, trades)` | The backtest replay: candles scrolling at ×60, the year ticking up, and a trade counter running to 500. |
| `belief(t, a, b)` | The white speech bubble with the common belief (`#bubble`), plus the ✓ that flips to ؟ (`#tick`). |
| `END_CARD_HTML(line, question, options, comment)`, `endCard(t, t0)` | The pre-launch end card: logo, «به‌زودی», slogan, follow line with a ringing bell, the comment-trigger card with options, and the arrow. |
| `setupReel()` | Call once the page's markup is in place. It sets up the canvases and grain and splits every `[data-k]` text into words. |
| `cutShake(t, cuts, extra)` | A short camera shake on each hard cut. |

### Text markup (`data-k`)

- On-screen text lives in `data-k="..."` attributes and is split into words that animate one by one.
- `*violet*`, `!red!`, `+green+` colour a phrase. A mark opens at the start of a word and closes at the end of a word; trailing punctuation (`،.؛:…؟`) after the closing mark is allowed.
- A newline inside the attribute is a line break.
- Never put a mark inside a word, such as `بک‌تست*لب*`, because a stray `*` will show. Rephrase instead.

### Layout conventions (1080×1920)

- **Hook:** the question line `h2` sits at top 330. The red title box (`.titlebox` + `.h1`) is at about 1150 in the hook, or about 760 when used as a section title.
- **Section text:** the heading (`h3`) is at top 330. Charts and cards sit in a panel at x 70–1010, y about 520–1290. The explanation (`body`) goes at about 1340–1500.
- **Hook lines between sections:** `h2` alone, centred at about 760–800, on an empty screen.
- **Brand:** the logo at the top (y 236) at 55% opacity from the end of the hook until the end card.
- **Safe zone:** the key content stays between y ≈ 240 and 1680. Instagram's UI covers the bottom (caption, buttons) and the grid preview crops to 3:4.
- **Type sizes:** `h1` 108, `h2` 82, `h3` 62, `body` 52, `small` 38. The cover title is 94–124 on one line (`white-space: nowrap`).

## Soundtracks

Each reel has its own track: a dark, modern electronic bed with sound design on the picture's moments.

| Reel | Key and progression | Tempo | Source |
|---|---|---|---|
| 1 | A minor, Am–F–C–G | ~113 BPM | `reel1-demo-account/soundtrack.py` + `cues.json` |
| 2 | D minor, Dm–B♭–F–C | ~109 BPM | `reel2-win-rate/soundtrack.py` (cue times in the script) |
| 3 | E minor, Em–C–G–D | 120 BPM | `reel3-new-strategy/sound.json` → `reelkit/soundgen.py` |
| 4 | C minor, Cm–A♭–E♭–B♭ | 120 BPM | `reel4-risk-per-trade/sound.json` → `reelkit/soundgen.py` |

Everything is synthesised from oscillators and noise: kick, clap, snare rolls, hats, sub bass, pad chords, pluck arpeggio, risers, downlifters, whooshes, impacts, pops, ticks, bells and a "fail" tone. That means no samples and no licence risk. The kick ducks the pad, bass and arp (sidechain), there is a convolution reverb, and the mix is soft-clipped to −1 dBFS peak. The raw output is about −15 LUFS, and `tools/encode.sh` brings it to about −16 LUFS.

### `sound.json` spec (reelkit/soundgen.py)

| Key | Meaning |
|---|---|
| `seed`, `dur`, `fade_from` | Random seed; length in seconds; where the final fade-out starts. |
| `bar`, `grid0` | Seconds per bar (4 beats; 2.0 = 120 BPM) and the time of a bar line. Choose `grid0` so the big cuts fall on beats. |
| `chords`, `prog` | `{"Cm": [[4 voicing freqs in Hz], bass root Hz], ...}` and the chord order, one chord per bar, repeating. The pad always plays. |
| `groove` | Time ranges with kick and bass (the "drops"). |
| `full` | Ranges with the fullest sound: 16th-note hats, octave bass, louder clap and arp, a brighter pad. |
| `dark` | Ranges where the bass and pad are low-passed (the "bad news" sections). |
| `arp`, `hats`, `clap` | Ranges where each part plays. |
| `outro_bass` | `[start, end]`: one long bass note per bar under the end card. |
| `rolls` | `[[start, end]]`: an accelerating snare roll into a drop. |
| `ticks` | `[{start, dur, count, f, step, level}]`: one tick per item as a counter runs. It uses the same `inOut` easing as the animation, so the ticks land on the numbers. |
| `fx` | A list of `{type, t, ...}`. `impact {size, gain}`, `whoosh {gain}` (placed 0.22 s before `t`, for cuts), `riser {d, f0, f1, gain}`, `downlifter {d, gain}`, `pop {f, gain, pan}` (text pops), `tick {f, level, pan}`, `bell {f, d, gain, pan}` (good news or follow), `fail {gain, pan}` (bad news). |

To place cues, read the times straight from `render(t)`: each `show('#id', t, a, ...)` start `a` is a text pop, each cut in `cutShake([...])` gets a whoosh, and big reveals get an impact.

## Making a new reel (checklist)

1. **Script first.** Follow the formula in [METHOD.md](METHOD.md):
   - a counter-belief hook in 0–3.6 s
   - a new hook every 7–10 s, with Type Two phrasing
   - an outlier format
   - a save-worthy card
   - the pre-launch end card with a comment trigger
2. **Verify every number** before animating it. Add the check to `tools/verify_numbers.py`.
3. **Build the page.** Copy `reel4-risk-per-trade/` to a new folder, then:
   - replace the markup, `render(t)` and `END_CARD_HTML(...)`
   - set `window.DURATION`
   - expose `window.facts`
4. **Check stills** at every scene, about 0.5 s after each element appears and just before each cut. Look for:
   - overlaps
   - text running off the edge
   - bidi order (signs, %, $, Latin inside Persian)
   - empty screens longer than about 1.5 s
5. **Render** with `tools/render.cjs`.
6. **Write `sound.json`** from the timeline, then synthesise it. It can't be heard here: check it with a spectrogram (`ffmpeg -i x.wav -lavfi showspectrumpic=s=1600x600 spec.png`) and listen before posting.
7. **Encode** with `tools/encode.sh`. Check one frame per scene from the final MP4, the duration, 1080×1920 at 30 fps, and loudness around −16 LUFS.
8. **Cover:**
   - add a `<section class="cover" id="cN">` to `covers/cover.html` with a case in `show(n)`
   - render it with `tools/covers.cjs`
   - check the grid preview
9. **Caption:** follow the rules in METHOD.md, with no website address before launch.
10. **Document it:** add a README for the reel and update `README.md` and `reels.json`.

## Gotchas met along the way

- **Bidi in Persian:**
  - In right-to-left text, `+0.4R`, `−99.8٪` and `+2R ✓` can come out reversed. Put such numbers in an element with `direction: ltr` (`.ltr`), or draw them on canvas with `dir = 'ltr'`.
  - Persian digits (U+06F0–U+06F9) are "European number" class for bidi, so `+۴۶٪` in an LTR run renders correctly.
  - In captions, prefer words («۴۶٪ سود») over signs.
- **The `data-k` closing mark** must come after the word, before any punctuation, as in `*مهم‌تر*…`. The parser accepts `،.؛:…؟` after the mark.
- **Labels on charts collide** when two values are close (a peak label and a final-value label, for example). Move one into a corner of the panel.
- **Dot plots that stack too high:** scale the dot step per stage, so 500 dots fit the same height as 20.
- **A counter's colour** should follow its meaning: green while in profit on the way up, red once falling, never red on a rising number.
- **The render is deterministic,** so `stills.cjs` at time t shows exactly what the video shows at t.
- **File size:** a CRF-17 render is 40–50 MB, too big for most chat and upload limits. `encode.sh` (two-pass at 3.3 Mb/s) gives about 23 MB with no visible loss on phones.
- **ElevenLabs:** library voices need a paid plan to be used through the API (error 402 on the free plan). Keep the API key in the environment's secrets, never in a file in the repo.
