# ForTe Fam v1.1.0 — what's new

- 🔁 **Barter** (red tab): exchange, don't sell. List an item, others propose swaps, answer ✅ Good / ✖ No.
  On Good both parties see each other's phone; the site admin assigns a witness; listings last 7 days,
  then move to the admin ledger. Open to every family (members must belong to a family).
- ✨ New-family wizard: add your **family verses** and choose the **app colour** (8 colours). Admins can edit
  both later in Settings → Edit family profile.
- 💬 "Go to Family Chat" buttons (Family tab and after adding members).
- 🎓 Life Hacks: **Team21 Leadership Academy** (3 modules) and **Intro to AI** (2 modules), each with a
  micro-certificate. 26 Life Hacks and 21 diagnostics in total.
- ✍️ Notes: **Handwrite** pad for S Pen / stylus — pressure-sensitive, palm rejection, S Pen button erases.
- 📱 Mobile: scrollable bottom bar, compact chat header, bottom-sheet forms, no sideways scrolling.
- 🐞 Fixed: creating an event (button was calling the browser's built-in `document.createEvent`);
  Tools hub links now open reliably; video notes now get camera permission in the APK; links/Google
  sign-in no longer get trapped inside the APK.
- 🔐 APK signed with a permanent ForTe Fam key so future versions install as **updates**.

## Deploy
1. Apps Script: paste the new `Code.gs` → Deploy → Manage deployments → Edit → **New version** (same /exec URL).
   The Barter tabs (`barter__listings`, `barter__ledger`) are created automatically.
2. Replace `index.html` on Vercel/GitHub.
3. One-time GitHub signing setup — see `SIGNING-KEY` bundle (kept private, NOT in this repo).
