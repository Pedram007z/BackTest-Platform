# Android app and installable website

The site is an installable app (PWA): `public/sw.js` (service worker), `public/site.webmanifest`, the install
button in the header and the app card in Settings. On Android, iPhone and desktop it can be added to the home
screen from the browser.

For app stores (Cafe Bazaar, Myket, Google Play) there is an Android app in `android/`: a **Trusted Web
Activity** that opens `https://backtestlab.ir/dashboard` full screen, without a browser bar. It shows the live
site, so a new release of the site reaches the app at once; the app itself only needs a new version when its
name, icon, colours or address change. On phones without Chrome (or another browser that supports Trusted Web
Activities) it opens the site in a built-in WebView instead.

| | |
|---|---|
| Package name | `ir.backtestlab.app` |
| Version | `versionCode` / `versionName` in `android/app/build.gradle` (raise both for every store upload) |
| Target / minimum Android | API 36 / API 21 (Android 5) |
| Generated with | Bubblewrap 1.27 (`android/twa-manifest.json`) |

## Building

GitHub builds it (`.github/workflows/android.yml`), so nothing needs to be installed:

- every push that changes `android/` builds the APK and the App Bundle (AAB): *Actions → Android app → the run →
  Artifacts*;
- a tag `android-v<version>` also publishes them as a GitHub release:

  ```bash
  git tag android-v1.0.1 && git push origin android-v1.0.1
  ```

Locally (JDK 17 and the Android SDK): `cd android && ./gradlew assembleRelease bundleRelease`; the files are in
`app/build/outputs/apk/release/` and `app/build/outputs/bundle/release/`.

## Signing key

The release key (`backtestlab-release.jks`, alias `backtestlab`) is **not in the repository** (it is public).
Keep the file and its password safe: every future update of the app on the stores must be signed with the same
key, and a lost key means publishing a new app.

Let GitHub sign the builds: in the repository's *Settings → Secrets and variables → Actions*, add

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 backtestlab-release.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | the keystore password |
| `ANDROID_KEY_ALIAS` | `backtestlab` |

Without them the workflow builds unsigned files (`…-unsigned.apk` / `.aab`), which can be signed by hand:

```bash
# APK (Android SDK build-tools)
apksigner sign --ks backtestlab-release.jks --ks-key-alias backtestlab --out backtestlab-1.0.0.apk backtestlab-1.0.0-unsigned.apk
# App Bundle (JDK)
jarsigner -keystore backtestlab-release.jks -signedjar backtestlab-1.0.0.aab backtestlab-1.0.0-unsigned.aab backtestlab
```

## Full screen: Digital Asset Links

The app opens without a browser bar only when the site vouches for it: `public/.well-known/assetlinks.json`
(served at `https://backtestlab.ir/.well-known/assetlinks.json`, see `deploy/nginx-site.conf`) lists the
package name and the SHA-256 fingerprint of the signing key:

```
44:B6:08:20:D4:C3:40:46:56:A3:C4:EB:0E:B1:54:D0:2A:FD:F1:6E:00:D8:62:0B:81:BF:67:33:5A:2D:3C:FC
```

**Google Play** re-signs apps with its own key (Play App Signing): after the first upload, copy the *App signing
key certificate* SHA-256 from *Play Console → Test and release → App integrity* and add it to
`sha256_cert_fingerprints` in `assetlinks.json` (keep the one above for Cafe Bazaar and Myket). Check with
<https://developers.google.com/digital-asset-links/tools/generator>.

## Publishing

- **Cafe Bazaar** (cafebazaar.ir developer panel) and **Myket** (myket.ir developer panel): upload the signed APK.
- **Google Play**: upload the signed AAB; it requires a privacy policy address and the data-safety form (the app
  shows the website: phone number for sign-in, the user's backtest data).
- Store listing: icon `android/store_icon.png` (512×512), screenshots of the dashboard, chart and analytics pages.
