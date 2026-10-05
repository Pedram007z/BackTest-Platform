# BacktestLab logo

Custom-drawn lettering in the style of the chosen reference: the Persian «بک‌تست‌لب» and the Latin «backtestlab»
are built from geometry (`src/heavy.mjs`, `src/latin.mjs`), not typed in a font.

- **Weight:** heavy, even stroke. **Tops:** cut at a gentle slant, higher on the right.
- **Base:** each word sits on one heavy base stroke with large rounded outer corners.
- **Dots:** slanted dashes; ت's two dots are one wider dash. **ک:** its top stroke rises to the right.
- **«لب» / «lab»:** in the accent colour.
- **Symbol:** your original icon, refined: the two bars and the play button now stand on one baseline and rise
  into the play button, the bar tops carry the same gentle slant as the letters, and the play button has softened corners.

| Folder | Files |
|---|---|
| `svg/` | `logo-fa-*` (Persian, symbol on the right), `logo-en-*`, `logo-stacked-*`, `wordmark-fa-*`, `wordmark-en-*`, `app-icon.svg`, `favicon.svg`, `instagram-profile.svg`, `construction.svg` |
| `png/` | not kept in the repo; `node png.mjs ../png ../svg` renders app icons, favicons, the Instagram picture and 4× lockups |

Colour versions: `dark` (for dark backgrounds), `light`, `white` (one colour, for violet or photos), `black` (one colour, print).

| Colour | Hex | Use |
|---|---|---|
| Night | `#0D0B14` | background |
| Mist | `#EEEBF6` | text on dark |
| Lilac | `#A58BFF` | «لب» on dark |
| Violet | `#6A46FF` | «لب» on light |
| Ink | `#17131F` | text on light |
| Icon gradient | `#9273FF → #5430E6` | app icon tile |

Rules: keep clear space of at least half the icon's width around the logo; don't recolour single letters,
stretch, outline or add effects; below 24 px use the app icon instead of the full lockup.

Regenerate (Node 20+): `cd brand/src && node brand.mjs ../svg`, then `node tsgen.mjs ../../src/components/brand/paths.ts` for the
app's `<Logo />`. PNGs need Playwright with Chromium: `node png.mjs ../png ../svg`. The site's favicon and app icons
are in `public/`.
