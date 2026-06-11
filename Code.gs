/**
 * ForTe Fam — Free cloud backend (Google Apps Script)
 * Account: team21online | Storage: one Google Sheet (auto-created)
 * Deploy: Extensions-free, 100% free, no paid API.
 *
 * SETUP (browser only):
 * 1. Go to script.google.com (signed in as team21online) → New project
 * 2. Paste this entire file into Code.gs → Save
 * 3. Deploy → New deployment → type "Web app"
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web App URL and paste it into CONFIG.SCRIPT_URL in index.html
 */

const SHEET_NAME = "ForTeFam_DB";

function db_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty("FF_SHEET_ID");
  let ss;
  if (id) {
    try { ss = SpreadsheetApp.openById(id); } catch (e) { id = null; }
  }
  if (!id) {
    ss = SpreadsheetApp.create(SHEET_NAME);
    props.setProperty("FF_SHEET_ID", ss.getId());
  }
  ["users", "rooms", "msgs", "events"].forEach(function (n) {
    if (!ss.getSheetByName(n)) {
      const sh = ss.insertSheet(n);
      sh.getRange(1, 1, 1, 2).setValues([["key", "json"]]);
    }
  });
  const def = ss.getSheetByName("Sheet1") || ss.getSheetByName("Feuille 1");
  if (def && ss.getSheets().length > 4) ss.deleteSheet(def);
  return ss;
}

function readAll_(ss, name) {
  const sh = ss.getSheetByName(name);
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 2, last - 1, 1).getValues()
    .map(function (r) { try { return JSON.parse(r[0]); } catch (e) { return null; } })
    .filter(Boolean);
}

function upsert_(ss, name, key, obj) {
  const sh = ss.getSheetByName(name);
  const last = sh.getLastRow();
  if (last > 1) {
    const keys = sh.getRange(2, 1, last - 1, 1).getValues();
    for (let i = 0; i < keys.length; i++) {
      if (String(keys[i][0]) === String(key)) {
        sh.getRange(i + 2, 2).setValue(JSON.stringify(obj));
        return;
      }
    }
  }
  sh.appendRow([key, JSON.stringify(obj)]);
}

/** READ — JSONP so the static site can poll with zero CORS issues */
function doGet(e) {
  const ss = db_();
  const data = {
    users: {}, rooms: readAll_(ss, "rooms"),
    msgs: readAll_(ss, "msgs").slice(-400), // last 400 messages
    events: readAll_(ss, "events")
  };
  readAll_(ss, "users").forEach(function (u) { data.users[u.u] = u; });
  const cb = (e && e.parameter && e.parameter.callback) || "callback";
  return ContentService
    .createTextOutput(cb + "(" + JSON.stringify(data) + ")")
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function folder_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty("FF_FOLDER_ID");
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const f = DriveApp.createFolder("ForTeFam Files");
  props.setProperty("FF_FOLDER_ID", f.getId());
  return f;
}

function insertAbsent_(ss, name, key, obj) {
  const sh = ss.getSheetByName(name);
  const last = sh.getLastRow();
  if (last > 1) {
    const keys = sh.getRange(2, 1, last - 1, 1).getValues();
    for (let i = 0; i < keys.length; i++) {
      if (String(keys[i][0]) === String(key)) return; // already in cloud — keep cloud copy
    }
  }
  sh.appendRow([key, JSON.stringify(obj)]);
}

/** WRITE — fire-and-forget posts from the app */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(8000);
  try {
    const body = JSON.parse(e.postData.contents);
    const a = body.action, p = body.payload;
    const ss = db_();
    if (a === "addMsg")          upsert_(ss, "msgs", p.id, p);
    else if (a === "bootstrap") {
      // First device connecting: seed the cloud without overwriting anything already there
      (p.users || []).forEach(function (u) { insertAbsent_(ss, "users", u.u, u); });
      (p.rooms || []).forEach(function (r) { insertAbsent_(ss, "rooms", r.id, r); });
      (p.events || []).forEach(function (ev) { insertAbsent_(ss, "events", ev.id, ev); });
      (p.msgs || []).forEach(function (m) { delete m.dataUrl; insertAbsent_(ss, "msgs", m.id, m); });
    }
    else if (a === "addFileMsg") {
      // Save the photo/file into Google Drive (free), keep only the link in the DB
      try {
        const parts = String(p.dataUrl || "").split(",");
        const bytes = Utilities.base64Decode(parts[1] || "");
        const blob = Utilities.newBlob(bytes, p.mime || "application/octet-stream", p.name || ("file-" + p.id));
        const file = folder_().createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        p.fileId = file.getId();
      } catch (err) { /* if Drive fails, store the message without a file link */ }
      delete p.dataUrl; // never store raw bytes in the Sheet
      upsert_(ss, "msgs", p.id, p);
    }
    else if (a === "addRoom")    upsert_(ss, "rooms", p.id, p);
    else if (a === "addEvent")   upsert_(ss, "events", p.id, p);
    else if (a === "upsertUser") { delete p.lastSeenLocal; upsert_(ss, "users", p.u, p); }
    else if (a === "ping") {
      const us = readAll_(ss, "users");
      const me = us.filter(function (u) { return u.u === p.u; })[0];
      if (me) { me.lastSeen = Date.now(); upsert_(ss, "users", me.u, me); }
    }
    else if (a === "rsvp") {
      const evs = readAll_(ss, "events");
      const ev = evs.filter(function (x) { return x.id === p.id; })[0];
      if (ev) { ev.rsvp = ev.rsvp || {}; ev.rsvp[p.user] = p.ans; upsert_(ss, "events", ev.id, ev); }
    }
    return ContentService.createTextOutput("ok");
  } catch (err) {
    return ContentService.createTextOutput("err:" + err);
  } finally {
    lock.releaseLock();
  }
}
