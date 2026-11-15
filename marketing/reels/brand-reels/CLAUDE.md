# Brand reels: standing rules

## Covers: always the glass-slab style

The user asked for every reel cover from k30 on to be made in the glass-slab style of `glass-cover/`. Treat it as
the default for every new reel. Don't use a frame of the reel as the cover unless the user asks.

- **Composition:**
  - an optional small chip at the top (the kicker);
  - a big two-line headline, each line fitted to the frame (~960 px). The first line is white on dark or ink on light;
    the second is in the brand's violet;
  - a glowing glass slab in CSS 3D perspective (front, back and edge faces) holding a chart or visual for the reel's
    idea, with small label chips on stems;
  - the slab's soft reflection on the floor;
  - BacktestLab's logo at the bottom: `logo-fa-dark.svg` on dark, `logo-fa-light.svg` on light.
- **Theme:** match the reel. Dark violet for dark or violet reels; light, ink and violet for light reels.
- **Safe area:** keep the headline and the slab inside the centre 3:4 crop (y 240–1680) so the profile grid shows them.
- **Honesty:**
  - a chart on the slab is a drawn sample, with no instrument, price or numbers;
  - illustrative values are labelled «نمونه»;
  - the same content rules as the reels apply.
- **References:** the style came from another brand's cover. Only its composition is used. Never use that brand's
  name, logo or text, and don't copy any reference's look one to one.

To make a cover for a new reel:
1. Add an entry for it to `TH` in `glass-cover/build.py`: the theme, both headline lines, the kicker and the logo.
   Adapt the slab's chart and chips to the reel's idea when buy, sell and a hidden future don't fit.
2. Run `python3 build.py <reel>` and then `node shot.cjs <reel>` in `glass-cover/`. The result is `<reel>-cover.png` at
   1080×1920, taken at 2× and scaled down. PNGs are gitignored.
3. Check it at full size, add a line to the glass-cover section of `README.md`, and deliver it with the reel.
