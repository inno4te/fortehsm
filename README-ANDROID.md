# ForTe Fam — Android APK build

The Android wrapper is a thin native shell around the web app: it loads `index.html` into a system WebView with the permissions for voice notes (microphone) and photo sharing (gallery / camera), and routes calls (Jitsi, Meet) and Google tools out to the system browser.

**Built entirely in the cloud.** You never need Android Studio, a terminal, the Android SDK, or a Mac/PC with anything installed — GitHub Actions does the whole build and hands you back a signed APK.

---

## How the build is wired

```
forte-fam/                              ← your existing repo
├── index.html                          ← the web app (still works at the web URL)
├── Code.gs
├── README.md
├── README-ANDROID.md                   ← this file
├── .github/
│   └── workflows/
│       └── build-apk.yml               ← the GitHub Actions workflow
└── android/                            ← the Android project
    ├── build.gradle
    ├── settings.gradle
    ├── gradle.properties
    └── app/
        ├── build.gradle
        ├── proguard-rules.pro
        └── src/main/
            ├── AndroidManifest.xml
            ├── java/com/team21/fortefam/MainActivity.java
            └── res/
                ├── values/         (strings, colors, light theme)
                ├── values-night/   (dark theme)
                ├── xml/            (network security config)
                ├── drawable/       (launcher icon background + foreground)
                └── mipmap-anydpi-v26/ (adaptive icon descriptors)
```

The workflow copies `index.html` from the repo root into `android/app/src/main/assets/www/index.html` before each build — so **you only ever edit `index.html`** and both the web site and the Android app stay in sync.

---

## Step 1 — Put these files in your GitHub repo (browser only)

1. Open your `forte-fam` repository on github.com.
2. **Add file → Upload files** → drag in the new `android/` folder and the `.github/` folder along with `README-ANDROID.md`.
   *Tip:* GitHub's web uploader handles whole folder drags from your computer's file manager. If your phone/browser blocks folder upload, use the ZIP I included — extract on a desktop, drag once.
3. Commit. That's it — no Android Studio, no command line.

The repo now looks exactly like the tree above.

## Step 2 — Build the APK

The workflow runs **automatically** on every push to `main`. You can also kick it off by hand:

1. Go to your repo on github.com → **Actions** tab.
2. Click **Build ForTe Fam APK** in the left sidebar → **Run workflow** → **Run workflow**.
3. Wait ~3–5 minutes (first build) or ~1–2 minutes (subsequent builds).
4. When the green ✓ shows, click into the run → scroll to **Artifacts** → download **ForTeFam-APK**.

That ZIP contains two files: `ForTeFam-latest.apk` (use this one) and `ForTeFam-<commit-sha>.apk` (same APK, named with the commit for traceability).

## Step 3 — Install on every family phone

1. WhatsApp/email the APK to the family member, or have them download it from the Actions artifacts.
2. On their Android phone, tap the file.
3. Android will ask *"Allow installs from this source?"* — say yes (Settings → Apps → Special access → Install unknown apps → enable for their downloader/file manager). This is normal for any APK not from the Play Store.
4. Tap **Install** → Open.
5. On first launch, allow **Microphone** (for voice notes) and **Photos/Media** (for sharing pictures). They can also be allowed later from Android Settings → Apps → ForTe Fam → Permissions.
6. The same `inno / lin / dj / an / ja / mm / ss / ra` accounts (and the spare slots) work — and because sync is hard-coded in `index.html`, the app talks to the same Google Sheet backend the website does. **The family can chat across the website and the APK seamlessly.**

## Step 4 — Cut official releases (optional, recommended)

When you want a versioned APK with a nice download page:

1. Repo → **Releases** (right sidebar) → **Draft a new release**.
2. Tag it like `v1.0.0`, give it a title and notes.
3. Publish. The workflow automatically attaches `ForTeFam-latest.apk` to the release page.

Family members can bookmark `https://github.com/<you>/forte-fam/releases/latest` — that page always offers the newest APK download.

---

## What's inside the app

| Feature                | How it works in the APK                              |
|------------------------|------------------------------------------------------|
| Login & persistent session | Same as the web — localStorage inside the WebView, survives reboots. |
| Voice notes (10s)      | Native `MediaRecorder` via WebView; mic permission asked on first run. |
| Photo & file sharing   | System gallery / file picker opens via `onShowFileChooser`. |
| Family voice/video calls | Tap the call button → opens **Chrome** for Jitsi (best mic/cam performance). |
| Google tools (Doc, Sheet, Meet, Drive, Calendar) | Open in Chrome, signed into the family member's Google account. |
| Family sync            | JSONP + POST to the team21online Apps Script Web App, exactly like the web. |
| @ mentions, Bible verses, Family Vision | All present — they're part of `index.html`. |

## What's NOT in the app (by design)

- **Push notifications** — Android push needs a paid server (FCM is free but needs a backend you don't have). The chat polls every 4 seconds when the app is open, just like the website. *Workaround:* the app stays open in the background and badges by Android itself; the family can also keep ForTe Fam in their recent-apps tray.
- **Background sync when the app is closed** — same reason.
- **Play Store publication** — this APK is debug-signed for sideload, which is what you asked for. Publishing to Play Store needs a Google Play Console account (USD 25, one-time) and a release-signed APK with a keystore.

## Updating the app

Any time you push a change to `index.html` (or anything else), the workflow rebuilds the APK automatically. Family members install the new APK over the old one — Android keeps their data because the package id (`com.team21.fortefam`) and signing key stay the same.

## Honest caveats

- Voice notes recorded on iPhones (m4a) won't play on a very old Android WebView. Modern Android (8.0+ / SDK 26+, which is the minimum here) handles m4a fine.
- The Jitsi call opens in Chrome so it can use the camera/mic at full quality. If a family member doesn't have Chrome, it falls back to their default browser.
- Microsoft surface tablets and Chromebooks running Android apps work, but the layout is tuned for phones first.
- The APK is **debug-signed**. That's perfectly fine for sideloading and means anyone with this repo can rebuild a byte-identical APK. If you ever publish to the Play Store, generate a release keystore and switch the `release` build type to use it.

---

*ForTe Fam · Making a real difference · Built 100% free, browser-only, end to end.* 💚🧡🤍
