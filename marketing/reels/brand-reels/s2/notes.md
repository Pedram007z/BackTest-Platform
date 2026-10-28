# s2 «تخفیف ۲۰ درصدی، فقط به مدت ۴۸ ساعت · DISCOUNT20»: Instagram story

16 s, 1080×1920, music only (an original 120 BPM score, −14 LUFS). The scenes:
1. **«تخفیف ۲۰ درصدی»:** «۲۰» slams in with confetti, and «درصدی» lands under it.
2. **«فقط به مدت ۴۸ ساعت»:** a clock ring sweeps down around «۴۸ ساعت».
3. **«با کد تخفیف»:** a coupon with DISCOUNT20 typed on, and «کپی کن».
4. **«موقع خرید اشتراک وارد کن»:** the real billing page in its dark theme (`capture/cap.mjs`), with DISCOUNT20
   typed into «کد تخفیف» and the cursor on «اعمال». The crop leaves the plan prices out. The code isn't applied in
   the capture, because the local copy doesn't have it.
5. **The end card:** «۲۰٪ تخفیف · فقط ۴۸ ساعت», the code, and «لینک توی بیو». The bottom of the frame is left empty
   for Instagram's countdown sticker.

## Before posting

- **In the admin panel (تخفیف‌ها), create DISCOUNT20:** 20 percent, active, and with «فقط اولین خرید» off if the offer
  is for everyone.
- **The admin's expiry is a day, not an hour** (`expiresAt` is a day key and is inclusive). For an exact 48 hours,
  either:
  - set the expiry to the second day and switch the code off by hand when the 48 hours end; or
  - say «تا آخر روز …» instead of 48 hours.
- **Add Instagram's countdown sticker** on the end card, under «لینک توی بیو», set to the code's real end time.

**Rebuild** (in `s2/`): `python3 data.py`, `python3 sound.py`, `python3 ../mkpage_u.py s2 kinetic`,
`REEL_DIR=kinetic node render.cjs cover kinetic/cover.png`, and
`REEL_DIR=kinetic node render.cjs video kinetic/story-hq.mp4 mix.wav 3`.
