# Story s2 · «کد تخفیف خرید اولت: فقط به این استوری ریپلای بده»

A 1080×1920 story offering a first-purchase discount code to anyone who replies. It uses the look of the q-series
reels:
- **Top, violet:** the logo, «کد تخفیف / خرید اولت», and a ticket whose code is hidden behind dots and a lock, with
  «فقط برای خرید اول».
- **Bottom, ink:** «فقط به این استوری ریپلای بده», a bubble that types «کد» and sends it, «کد تخفیفت رو برات دایرکت
  می‌کنیم», and arrows bouncing toward Instagram's reply field.

The story shows no percentage. To print one on the ticket, set `PCT` in `template.html` (e.g. `const PCT = 20;`) and
rebuild.

**Files**
- `index.html`, built by `build.py` from `template.html`, with the Lucide icons inlined.
- `node render.cjs still <out.png> [t=6]`: the still.
- `node render.cjs video <out.mp4>`: 12 s at 30 fps, with a silent audio track so music can be added in the app.

**Before posting: make the code**
1. Admin panel → «کدهای تخفیف» → «کد تخفیف جدید».
2. Set «درصد تخفیف» and «سقف استفاده», and optionally an expiry.
3. Turn on «فقط برای اولین خرید».

**Posting**
1. Upload the video (or the still). Optionally add soft music from the app.
2. Keep the bottom free: the arrows point at Instagram's reply field.

**Answering replies**
Save this as a quick reply (پاسخ‌های ذخیره‌شده) so each answer is one tap:

```
سلام 👋 اینم کد تخفیف خرید اولت: CODE
موقع خرید، توی صفحه‌ی پرداخت توی کادر «کد تخفیف» واردش کن.
ثبت‌نام: backtestlab.ir
```

Replace `CODE` with the code from the admin panel.
