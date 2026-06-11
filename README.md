# ForTe Fam — Making a real difference
**Connecting with each other everywhere we are.**

One family hall that blends the best of WhatsApp, Signal and Telegram — chat, groups, direct messages, events with RSVP, and Google's free tools callable directly inside the chat. Built on a **100% free stack**: a single `index.html` + an optional Google Apps Script backend on the **team21online** Google account. No paid API. No server bills. Ever.

---

## What's inside

| File | Purpose |
|---|---|
| `index.html` | The entire app — UI, accounts, chat, events, themes. Self-contained. |
| `Code.gs` | Free Google Apps Script backend (cloud sync via a Google Sheet). Optional. |
| `README.md` | This guide. |

## Family accounts (pre-built)

- Usernames: **forteh1 → forteh20**
- Passwords: **f0rteh01 → f0rteh20** (matching number, two digits)
- `forteh1` = Family Admin (Innocent)
- Anyone can also **create a new account** from the login screen.
- Every member can change their **display name, avatar emoji, password, interface color (6 themes), and dark mode** in *My space*.

## Features

- 🏠 **Family Hall** — the all-family room everyone lands in
- 👥 **Groups** — create groups with chosen members (e.g. "Reunion 2026 planning")
- ✉️ **Direct chats** — private 1-to-1 conversations
- 🎉 **Events** — create events, attach a free Google Meet link, RSVP (Going / Maybe / Can't) with live counts
- 📞 **Free family calls** — voice & video buttons in every chat (or `/call`, `/voice`). Powered by Jitsi Meet: free, in-browser, no account needed — everyone in the room gets a "Join the call" card. Google Meet stays available in the tool tray.
- 🖼️ **Share photos & files from your phone** — the 📎 button (or `/photo`, `/file`). Photos are auto-compressed for low bandwidth; with cloud sync on, files are stored free in a **"ForTeFam Files"** Google Drive folder (team21online) and everyone gets a viewable link. Tap any photo to view full-screen.
- ⚡ **Tools in chat** — the ＋ tray or slash commands drop live tool cards into the conversation:
  `/call` `/doc` `/sheet` `/slides` `/form` `/meet` `/drive` `/keep` `/event Title | date` `/help`
- 🧰 **Tools hub** — Docs, Sheets, Slides, Forms, Meet, Drive, Keep, Calendar, Photos, Maps, Translate, Canva — all free
- 🎨 **Per-member themes** — six accent colors + dark mode, saved per account, around the **deep forest green** · orange · white ForTe identity
- 🟢 **Presence dots** — see who's online
- 📱 **Fully responsive** — phone, tablet, desktop

## Deploy (browser only — no terminal)

### Step 1 — GitHub
1. Go to github.com → **New repository** → name it `forte-fam` → Create.
2. **Add file → Upload files** → drag in `index.html`, `Code.gs`, `README.md` → Commit.

### Step 2 — Vercel
1. Go to vercel.com → **Add New → Project** → Import the `forte-fam` repo.
2. Framework preset: **Other**. No build command. Deploy.
3. Your family URL is live, e.g. `https://forte-fam.vercel.app`.

(The app already works at this point in **Local mode** — each device keeps its own data.)

### Step 3 — Free cloud sync (recommended)
This makes every message, group, event and account sync across all family devices.

1. Signed in as **team21online**, open **script.google.com** → New project.
2. Delete the starter code, paste in the whole of `Code.gs`, Save.
3. **Deploy → New deployment → Web app**
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
4. Authorize when asked, then copy the **Web app URL**.
5. In GitHub, open `index.html` → ✏️ Edit → near the top find:
   ```js
   SCRIPT_URL: "",
   ```
   and paste the URL between the quotes → Commit. Vercel redeploys automatically.
6. The chat header pill changes from **Local** to **Cloud sync**. Done — the database is a Google Sheet auto-created in team21online's Drive (`ForTeFam_DB`).

## Notes & honest limits

- This is a **family tool**, not a security product: passwords are stored in plain text in the browser/Sheet, and the sync endpoint is open to anyone with the URL. Perfect for a trusting family circle; don't use it for sensitive secrets.
- Apps Script free quotas are generous (tens of thousands of calls/day) — far more than a family needs.
- File sharing limits: photos auto-compress to ~700KB; other files up to 4MB (use the Drive tool card for bigger ones). In local-only mode (no SCRIPT_URL), shared files live in each phone's browser storage, so cloud sync is strongly recommended once you start sharing photos.
- Polling interval is 6 seconds (`SYNC_EVERY_MS`) — friendly to low-bandwidth connections.

---

*ForTe Fam · Green, Orange & White · Built with 100% free tools for the Forteh family.* 💚🧡🤍
