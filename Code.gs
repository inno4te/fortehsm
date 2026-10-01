/**
 * ForTe Fam — Multi-Family cloud backend (Google Apps Script)
 * Account: team21online | Storage: one Google Sheet, per-family tabs (auto-created)
 *
 * Each family gets its OWN set of tabs, namespaced by familyId:
 *   e.g.  smith__msgs, smith__prayers, smith__madIdeas ...
 * A global "families" tab registers every family (for the super-admin dashboard).
 * This maximises per-family data headroom and keeps families fully isolated.
 *
 * SETUP (browser only):
 * 1. script.google.com (signed in as team21online) → open this project
 * 2. Paste this entire file into Code.gs → Save
 * 3. Deploy → Manage deployments → Edit → New version  (keeps the same /exec URL)
 */

const SHEET_NAME = "ForTeFam_DB";
const DEFAULT_FAM = "forteh";  // the original family keeps its existing data
const SUPER_ADMIN = "inno";    // global admin who can see every family

// Per-family data tabs
// barter lives in global tabs barter__listings / barter__ledger
const FAM_SHEETS = ["users","rooms","msgs","events","stories","goals","habits",
  "priorities","checkins","diagResults","prayers","notes","madIdeas","madGuests","hackstats"];

function ss_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty("FF_SHEET_ID");
  let ss;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { id = null; } }
  if (!id) {
    ss = SpreadsheetApp.create(SHEET_NAME);
    props.setProperty("FF_SHEET_ID", ss.getId());
  }
  // global registry tab
  if (!ss.getSheetByName("families")) {
    const sh = ss.insertSheet("families");
    sh.getRange(1, 1, 1, 2).setValues([["key", "json"]]);
  }
  return ss;
}

// sanitise a familyId to a safe tab prefix
function famId_(raw) {
  let f = String(raw || DEFAULT_FAM).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 24);
  return f || DEFAULT_FAM;
}
function tab_(fam, name) { return fam + "__" + name; }

// get (creating if needed) a per-family data sheet
function sheet_(ss, fam, name) {
  const tn = tab_(fam, name);
  let sh = ss.getSheetByName(tn);
  if (!sh) {
    sh = ss.insertSheet(tn);
    sh.getRange(1, 1, 1, 2).setValues([["key", "json"]]);
  }
  return sh;
}

function readAll_(ss, fam, name) {
  const sh = sheet_(ss, fam, name);
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 2, last - 1, 1).getValues()
    .map(function (r) { try { return JSON.parse(r[0]); } catch (e) { return null; } })
    .filter(Boolean);
}

function upsert_(ss, fam, name, key, obj) {
  const sh = sheet_(ss, fam, name);
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

function insertAbsent_(ss, fam, name, key, obj) {
  const sh = sheet_(ss, fam, name);
  const last = sh.getLastRow();
  if (last > 1) {
    const keys = sh.getRange(2, 1, last - 1, 1).getValues();
    for (let i = 0; i < keys.length; i++) {
      if (String(keys[i][0]) === String(key)) return;
    }
  }
  sh.appendRow([key, JSON.stringify(obj)]);
}

// ---- global family registry helpers ----
function readFamilies_(ss) {
  const sh = ss.getSheetByName("families");
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 2, last - 1, 1).getValues()
    .map(function (r) { try { return JSON.parse(r[0]); } catch (e) { return null; } })
    .filter(Boolean);
}
function upsertFamily_(ss, fam, obj) {
  const sh = ss.getSheetByName("families");
  const last = sh.getLastRow();
  if (last > 1) {
    const keys = sh.getRange(2, 1, last - 1, 1).getValues();
    for (let i = 0; i < keys.length; i++) {
      if (String(keys[i][0]) === String(fam)) {
        sh.getRange(i + 2, 2).setValue(JSON.stringify(obj));
        return;
      }
    }
  }
  sh.appendRow([fam, JSON.stringify(obj)]);
}

function folder_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty("FF_FOLDER_ID");
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const f = DriveApp.createFolder("ForTeFam Files");
  props.setProperty("FF_FOLDER_ID", f.getId());
  return f;
}

/** READ — JSONP. ?fam=<id> scopes to one family.
 *  ?admin=1&fam=inn... returns the global family registry for the super-admin. */

/* ====================== BARTER (global, cross-family) ======================
   Tabs: barter__listings, barter__ledger. Listings expire after 7 days and are
   moved to the ledger. Same rules as the app's barterReduce(). */
function bsheet_(ss, name){
  var tn = "barter__" + name, sh = ss.getSheetByName(tn);
  if (!sh) { sh = ss.insertSheet(tn); sh.getRange(1,1,1,2).setValues([["key","json"]]); }
  return sh;
}
function bread_(ss, name){
  var sh = bsheet_(ss, name), last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2,1,last-1,2).getValues().map(function(r){
    try { var o = JSON.parse(r[1]); o.__k = String(r[0]); return o; } catch(e){ return null; }
  }).filter(Boolean);
}
function bwrite_(ss, name, key, obj){
  var sh = bsheet_(ss, name), last = sh.getLastRow();
  if (obj && obj.__k) delete obj.__k;
  if (last > 1) {
    var keys = sh.getRange(2,1,last-1,1).getValues();
    for (var i=0;i<keys.length;i++) if (String(keys[i][0])===String(key)) {
      if (obj === null) sh.deleteRow(i+2); else sh.getRange(i+2,2).setValue(JSON.stringify(obj));
      return;
    }
  }
  if (obj !== null) sh.appendRow([key, JSON.stringify(obj)]);
}
function bwho_(w){ return w ? (w.fam + ":" + w.u) : ""; }
function bphoto_(o){
  if (!o || !o.photo || String(o.photo).indexOf("data:") !== 0) return;
  try {
    var parts = String(o.photo).split(",");
    var blob = Utilities.newBlob(Utilities.base64Decode(parts[1]), "image/jpeg", "barter-" + (o.id||Date.now()) + ".jpg");
    var f = folder_().createFile(blob);
    f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    o.photoId = f.getId();
  } catch (e) {}
  delete o.photo;
}
function bledger_(L, outcome){
  var a = L.accepted;
  return { id:L.id, outcome:outcome, ts:Date.now(), created:L.ts, matchedTs:L.matchedTs||null, doneTs:L.doneTs||null,
    item:L.title, itemDesc:L.desc||"",
    owner:{name:L.owner.name, famName:L.owner.famName, fam:L.owner.fam, u:L.owner.u, phone:L.owner.phone},
    exchangedFor: a ? {title:a.title, desc:a.desc||"", name:a.by.name, famName:a.by.famName, fam:a.by.fam, u:a.by.u, phone:a.by.phone} : null,
    witness: L.witness || null };
}
function bpurge_(ss){
  var now = Date.now();
  bread_(ss, "listings").forEach(function(L){
    if ((L.exp||0) <= now) {
      var outcome = L.status==="done" ? "exchanged" : (L.status==="matched" ? "matched-not-completed" : "expired-no-deal");
      bwrite_(ss, "ledger", L.id, bledger_(L, outcome));
      bwrite_(ss, "listings", L.id, null);
    }
  });
}
function barterApply_(ss, op, p){
  var now = Date.now();
  if (op === "create") {
    if (!p || !p.id || !p.owner) return "err:bad";
    p.exp = (p.ts||now) + 7*24*60*60*1000;   // the server sets the 7-day clock
    p.status = "open"; p.offers = []; bphoto_(p);
    bwrite_(ss, "listings", p.id, p); return "ok";
  }
  var id = p.id || p.listingId, L = null;
  bread_(ss, "listings").forEach(function(x){ if (x.id === id) L = x; });
  if (!L) return "err:gone";
  if (op === "offer") {
    if (L.status !== "open" || bwho_(L.owner) === bwho_(p.offer.by)) return "err:closed";
    bphoto_(p.offer);
    L.offers = (L.offers||[]).filter(function(o){ return bwho_(o.by) !== bwho_(p.offer.by); });
    L.offers.push(p.offer);
  } else if (op === "decide") {
    var o = null; (L.offers||[]).forEach(function(x){ if (x.id === p.offerId) o = x; });
    if (!o || L.status !== "open") return "err:state";
    if (p.good) { L.status = "matched"; L.accepted = o; L.matchedTs = now; L.offers = []; }
    else { L.offers = L.offers.filter(function(x){ return x.id !== p.offerId; }); }
  } else if (op === "witness") {
    if (L.status !== "matched") return "err:state"; L.witness = p.witness;
  } else if (op === "done") {
    if (L.status !== "matched") return "err:state"; L.status = "done"; L.doneTs = now;
    bwrite_(ss, "ledger", L.id, bledger_(L, "exchanged"));
  } else if (op === "calloff") {
    if (L.status !== "matched") return "err:state"; L.status = "open"; L.accepted = null; L.witness = null; L.matchedTs = null;
  } else if (op === "withdraw") {
    bwrite_(ss, "listings", L.id, null); return "ok";
  } else return "err:op";
  L.up = now; bwrite_(ss, "listings", L.id, L); return "ok";
}

function doGet(e) {
  const ss = ss_();
  const cb = (e && e.parameter && e.parameter.callback) || "callback";
  const fam = famId_(e && e.parameter && e.parameter.fam);

  // super-admin dashboard feed
  if (e && e.parameter && e.parameter.barter === "1") {
    bpurge_(ss);
    var out = { listings: bread_(ss, "listings").map(function(x){ delete x.__k; return x; }) };
    if (e.parameter.ledger === "1") out.ledger = bread_(ss, "ledger").map(function(x){ delete x.__k; return x; });
    return ContentService.createTextOutput(cb + "(" + JSON.stringify(out) + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  if (e && e.parameter && e.parameter.admin === "1") {
    const fams = readFamilies_(ss).map(function (f) {
      var users = readAll_(ss, f.id, "users");
      return {
        id: f.id, name: f.name, mission: f.mission, values: f.values, goals: f.goals,
        admin: f.admin, created: f.created,
        members: users.length,
        msgCount: sheetCount_(ss, f.id, "msgs"),
        prayerCount: sheetCount_(ss, f.id, "prayers"),
        ideaCount: sheetCount_(ss, f.id, "madIdeas")
      };
    });
    return ContentService
      .createTextOutput(cb + "(" + JSON.stringify({ families: fams }) + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  const data = {
    fam: fam,
    family: (function () { var all = readFamilies_(ss); for (var i=0;i<all.length;i++) if (all[i].id===fam) return all[i]; return null; })(),
    users: {}, rooms: readAll_(ss, fam, "rooms"),
    msgs: readAll_(ss, fam, "msgs").slice(-400),
    events: readAll_(ss, fam, "events"),
    stories: readAll_(ss, fam, "stories").filter(function(s){ return Date.now()-s.ts < 24*60*60*1000; }),
    goals: readAll_(ss, fam, "goals"),
    habits: readAll_(ss, fam, "habits"),
    priorities: readAll_(ss, fam, "priorities"),
    checkins: readAll_(ss, fam, "checkins").slice(-2000),
    diagResults: readAll_(ss, fam, "diagResults").slice(-500),
    prayers: readAll_(ss, fam, "prayers").slice(-1000),
    notes: readAll_(ss, fam, "notes").slice(-300),
    madIdeas: readAll_(ss, fam, "madIdeas").slice(-500),
    madGuests: readAll_(ss, fam, "madGuests").slice(-200),
    hackstats: readAll_(ss, fam, "hackstats").slice(-2000)
  };
  readAll_(ss, fam, "users").forEach(function (u) { data.users[u.u] = u; });
  return ContentService
    .createTextOutput(cb + "(" + JSON.stringify(data) + ")")
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function sheetCount_(ss, fam, name) {
  const tn = tab_(fam, name);
  const sh = ss.getSheetByName(tn);
  if (!sh) return 0;
  return Math.max(0, sh.getLastRow() - 1);
}

/** WRITE — every post carries body.fam to scope the family. */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(8000);
  try {
    const body = JSON.parse(e.postData.contents);
    const a = body.action, p = body.payload;
    const fam = famId_(body.fam);
    const ss = ss_();

    // ---- family lifecycle ----
    if (a === "barter") {
      return ContentService.createTextOutput(barterApply_(ss, p.op, p.p));
    }
    if (a === "createFamily") {
      // p: {id,name,mission,values,goals,admin,created}
      const newFam = famId_(p.id);
      const existing = readFamilies_(ss);
      for (var i = 0; i < existing.length; i++) {
        if (existing[i].id === newFam) return ContentService.createTextOutput("err:family-exists");
      }
      upsertFamily_(ss, newFam, {
        id: newFam, name: p.name || newFam, mission: p.mission || "", values: p.values || "",
        goals: p.goals || "", verses: p.verses || [], theme: p.theme || "green", admin: p.admin || "", created: p.created || Date.now()
      });
      if (p.adminUser) upsert_(ss, newFam, "users", p.adminUser.u, p.adminUser);
      return ContentService.createTextOutput("ok");
    }
    else if (a === "updateFamily") {
      const all = readFamilies_(ss);
      for (var j = 0; j < all.length; j++) {
        if (all[j].id === fam) {
          ["name","mission","values","goals","verses","theme"].forEach(function(k){ if (p[k] !== undefined) all[j][k] = p[k]; });
          upsertFamily_(ss, fam, all[j]);
          break;
        }
      }
      return ContentService.createTextOutput("ok");
    }

    if (a === "addMsg")          upsert_(ss, fam, "msgs", p.id, p);
    else if (a === "bootstrap") {
      (p.users || []).forEach(function (u) { insertAbsent_(ss, fam, "users", u.u, u); });
      (p.rooms || []).forEach(function (r) { insertAbsent_(ss, fam, "rooms", r.id, r); });
      (p.events || []).forEach(function (ev) { insertAbsent_(ss, fam, "events", ev.id, ev); });
      (p.msgs || []).forEach(function (m) { delete m.dataUrl; insertAbsent_(ss, fam, "msgs", m.id, m); });
    }
    else if (a === "addFileMsg") {
      try {
        const parts = String(p.dataUrl || "").split(",");
        const bytes = Utilities.base64Decode(parts[1] || "");
        const blob = Utilities.newBlob(bytes, p.mime || "application/octet-stream", p.name || ("file-" + p.id));
        const file = folder_().createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        p.fileId = file.getId();
      } catch (err) {}
      delete p.dataUrl;
      upsert_(ss, fam, "msgs", p.id, p);
    }
    else if (a === "addRoom")    upsert_(ss, fam, "rooms", p.id, p);
    else if (a === "addStory")   upsert_(ss, fam, "stories", p.id, p);
    else if (a === "addGoal")     upsert_(ss, fam, "goals",      p.id, p);
    else if (a === "addHabit")    upsert_(ss, fam, "habits",     p.id, p);
    else if (a === "addPriority") upsert_(ss, fam, "priorities", p.id, p);
    else if (a === "addCheckin")  upsert_(ss, fam, "checkins",   p.id, p);
    else if (a === "addDiagResult") upsert_(ss, fam, "diagResults", p.id, p);
    else if (a === "addPrayer")     upsert_(ss, fam, "prayers",     p.id, p);
    else if (a === "addNote")       upsert_(ss, fam, "notes",       p.id, p);
    else if (a === "addMadIdea")    upsert_(ss, fam, "madIdeas",    p.id, p);
    else if (a === "addMadGuest")   upsert_(ss, fam, "madGuests",   p.id, p);
    else if (a === "addHackStat")   upsert_(ss, fam, "hackstats",   p.id, p);
    else if (a === "addEvent")   upsert_(ss, fam, "events", p.id, p);
    else if (a === "upsertUser") { delete p.lastSeenLocal; upsert_(ss, fam, "users", p.u, p); }
    else if (a === "ping") {
      const us = readAll_(ss, fam, "users");
      const me = us.filter(function (u) { return u.u === p.u; })[0];
      if (me) { me.lastSeen = Date.now(); upsert_(ss, fam, "users", me.u, me); }
    }
    else if (a === "rsvp") {
      const evs = readAll_(ss, fam, "events");
      const ev = evs.filter(function (x) { return x.id === p.id; })[0];
      if (ev) { ev.rsvp = ev.rsvp || {}; ev.rsvp[p.user] = p.ans; upsert_(ss, fam, "events", ev.id, ev); }
    }
    return ContentService.createTextOutput("ok");
  } catch (err) {
    return ContentService.createTextOutput("err:" + err);
  } finally {
    lock.releaseLock();
  }
}
