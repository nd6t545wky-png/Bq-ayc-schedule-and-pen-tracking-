/**
 * BQ Weekly Schedule and Tracking: live Google Sheets
 *
 * Paste this into Extensions → Apps Script of a new Google Sheet (the "control" sheet), then
 * follow docs/sheets-setup.md. It makes one spreadsheet per age group (U16, U18, AYWC, AWC) and
 * keeps them up to date every 5 minutes. Each one is shared (view only) with the coaches of
 * that age group and nobody else: anyone else who has access, players included, is removed.
 *
 * This script never needs changing when the app changes: the database decides which tabs and
 * columns exist (public.sheet_group), and new players, tabs and columns appear on their own.
 */
const SUPABASE_URL = "https://icczlruovqfhqllnkohh.supabase.co";
const PUBLISHABLE_KEY = "sb_publishable_wcCYY8iA-1odDWGP2MxgIw_t9DEyy1X";
const EVERY_MINUTES = 5;

const props = () => PropertiesService.getScriptProperties();

function onOpen() {
  SpreadsheetApp.getUi().createMenu("BQ sync")
    .addItem("1. Set export key", "setKey")
    .addItem("2. Start live sync", "startSync")
    .addSeparator()
    .addItem("Refresh now", "refreshNow")
    .addItem("Stop live sync", "stopSync")
    .addToUi();
}

function setKey() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt("Export key", "Paste the key from the app (Bullpens → Coaches → Live spreadsheets).", ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const key = r.getResponseText().trim();
  if (!/^bqx_[A-Za-z0-9_-]{20,}$/.test(key)) { ui.alert("That doesn't look like an export key. It starts with bqx_."); return; }
  props().setProperty("EXPORT_KEY", key);
  ui.alert("Key saved. Now choose BQ sync → 2. Start live sync.");
}

function startSync() {
  stopSync(true);
  sync();
  ScriptApp.newTrigger("sync").timeBased().everyMinutes(EVERY_MINUTES).create();
  SpreadsheetApp.getUi().alert("Live sync is on. The age-group spreadsheets are linked on the Status tab and update every " + EVERY_MINUTES + " minutes.");
}

function stopSync(quiet) {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === "sync").forEach(t => ScriptApp.deleteTrigger(t));
  if (quiet !== true) SpreadsheetApp.getUi().alert("Live sync is off. Your spreadsheets keep their data.");
}

// Rewrites every tab, even ones that look unchanged.
function refreshNow() {
  const p = props(), keep = {};
  Object.keys(p.getProperties()).forEach(k => { if (!k.startsWith("HASH_")) keep[k] = p.getProperty(k); });
  p.setProperties(keep, true);
  sync();
}

function sync() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    const key = props().getProperty("EXPORT_KEY");
    if (!key) { status([["Not set up", "Choose BQ sync → 1. Set export key"]]); return; }
    const res = UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/rpc/sheet_export", {
      method: "post", contentType: "application/json", muteHttpExceptions: true,
      headers: { apikey: PUBLISHABLE_KEY },
      payload: JSON.stringify({ p_key: key }),
    });
    if (res.getResponseCode() !== 200) throw new Error("App returned " + res.getResponseCode() + ": " + res.getContentText().slice(0, 200));
    const data = JSON.parse(res.getContentText());
    if (!data) { status([["Key not accepted", "Make a new key in the app and set it again (BQ sync → 1. Set export key)"]]); return; }

    const lines = [];
    Object.keys(data.groups).forEach(age => {
      const id = groupSheetId(age);
      writeGroup(id, age, data.groups[age]);
      const share = shareGroup(id, age, (data.viewers || {})[age] || []);
      lines.push([age, "https://docs.google.com/spreadsheets/d/" + id]);
      lines.push(["", share]);
    });
    status([["Last update", new Date()]].concat(lines));
  } catch (e) {
    status([["Error", String(e && e.message || e)], ["Last tried", new Date()]]);
    throw e;
  } finally {
    lock.releaseLock();
  }
}

// Shares the spreadsheet (view only) with exactly this age group's coaches. Anyone else with
// access (players, coaches who were removed or moved to another group) is taken off. Runs when
// the coach list changes, and re-checks hourly in case someone shared it by hand.
function shareGroup(id, age, viewers) {
  const p = props(), sigKey = "SHARE_" + age, checkKey = "SHARECHECK_" + age, noteKey = "SHARENOTE_" + age;
  const want = viewers.map(v => String(v.email).toLowerCase());
  const sig = JSON.stringify(want);
  if (p.getProperty(sigKey) === sig && Date.now() - Number(p.getProperty(checkKey) || 0) < 3600 * 1000) return p.getProperty(noteKey) || "";

  const file = DriveApp.getFileById(id);
  const owner = String((file.getOwner() && file.getOwner().getEmail()) || "").toLowerCase();
  const email = u => String(u.getEmail() || "").toLowerCase();
  try { file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE); } catch (e) { /* some Workspace domains don't allow it */ }
  file.setShareableByEditors(false);
  file.getEditors().forEach(u => { const e = email(u); if (e && e !== owner) file.removeEditor(u); });   // coaches only ever view
  file.getViewers().forEach(u => { const e = email(u); if (e && e !== owner && want.indexOf(e) < 0) file.removeViewer(u); });

  const have = file.getViewers().map(email), shared = [], failed = [];
  viewers.forEach(v => {
    const e = String(v.email).toLowerCase();
    if (e === owner || have.indexOf(e) >= 0) { shared.push(v.name); return; }
    try { file.addViewer(e); shared.push(v.name); } catch (err) { failed.push(v.name); }
  });
  const note = (shared.length ? "Shared with: " + shared.join(", ") : "Not shared with any coach yet")
    + (failed.length ? " · Couldn't share with: " + failed.join(", ") + " (their app email needs a Google account)" : "");
  p.setProperty(sigKey, failed.length ? "" : sig);   // keep retrying anyone who couldn't be added
  p.setProperty(checkKey, String(Date.now()));
  p.setProperty(noteKey, note);
  return note;
}

// The spreadsheet for an age group, made the first time it's needed.
function groupSheetId(age) {
  const p = props(), k = "SHEET_" + age;
  let id = p.getProperty(k);
  if (id) { try { DriveApp.getFileById(id); return id; } catch (e) { /* deleted: make a new one */ } }
  id = SpreadsheetApp.create("BQ Weekly – " + age).getId();
  p.setProperty(k, id);
  return id;
}

function writeGroup(id, age, tabs) {
  const p = props();
  let ss = null;
  const open = () => ss || (ss = SpreadsheetApp.openById(id));
  const names = tabs.map(t => t.name);

  tabs.forEach((tab, i) => {
    const values = tabValues(tab);
    const hashKey = "HASH_" + age + "_" + tab.name;
    const hash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, JSON.stringify(values)));
    if (p.getProperty(hashKey) === hash) return;   // nothing new (Refresh now rewrites everything)
    let sh = open().getSheetByName(tab.name);
    const fresh = !sh;
    if (!sh) sh = open().insertSheet(tab.name, i);
    sh.clearContents();
    const nCols = values[0].length;
    if (sh.getMaxColumns() < nCols) sh.insertColumnsAfter(sh.getMaxColumns(), nCols - sh.getMaxColumns());
    if (sh.getMaxRows() < values.length + 1) sh.insertRowsAfter(sh.getMaxRows(), values.length + 1 - sh.getMaxRows());
    sh.getRange(1, 1, values.length, nCols).setValues(values);
    sh.getRange(1, 1, 1, sh.getMaxColumns()).setFontWeight("normal").setBackground(null);
    sh.getRange(1, 1, 1, nCols).setFontWeight("bold").setBackground("#efe6e8");
    sh.setFrozenRows(1); sh.setFrozenColumns(1);
    if (fresh) sh.autoResizeColumns(1, nCols);
    p.setProperty(hashKey, hash);
  });

  // tidy up: the blank first sheet, and tabs this script made that the app no longer sends
  if (ss) {
    const made = JSON.parse(p.getProperty("TABS_" + age) || "[]");
    ss.getSheets().forEach(sh => {
      const n = sh.getName();
      if (names.indexOf(n) >= 0) return;
      if (made.indexOf(n) >= 0 || (/^(Sheet|Tabelle|Feuille|Hoja)\s?1$/.test(n) && sh.getLastRow() === 0)) {
        if (ss.getSheets().length > 1) ss.deleteSheet(sh);
      }
    });
    p.setProperty("TABS_" + age, JSON.stringify(names));
  }
}

// Header row plus data rows. Columns: the order the app asks for, then any fields it doesn't
// know about yet (so new data shows up without a script change). Keys starting with _ are internal.
function tabValues(tab) {
  const cols = tab.cols.map(c => c[0]), labels = {};
  tab.cols.forEach(c => { labels[c[0]] = c[1]; });
  tab.rows.forEach(r => Object.keys(r).forEach(k => { if (k[0] !== "_" && cols.indexOf(k) < 0) cols.push(k); }));
  // drop listed columns that have no data at all, so empty columns don't clutter the sheet
  const used = cols.filter((k, i) => i === 0 || tab.rows.some(r => r[k] != null && r[k] !== ""));
  const header = used.map(k => labels[k] || k.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, s => s.toUpperCase()));
  const rows = tab.rows.map(r => used.map(k => cell(r[k])));
  return [header].concat(rows.length ? rows : [used.map((k, i) => i === 0 ? "No data yet" : "")]);
}

function cell(v) {
  if (v == null) return "";
  if (Array.isArray(v)) v = v.join(", ");
  else if (typeof v === "object") v = JSON.stringify(v);
  // text typed into the app is never run as a spreadsheet formula
  if (typeof v === "string" && /^[=+\-@]/.test(v) && !/^-?\d+(\.\d+)?$/.test(v)) v = "'" + v;
  return v;
}

function status(lines) {
  const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(props().getProperty("CONTROL_ID"));
  if (!props().getProperty("CONTROL_ID")) props().setProperty("CONTROL_ID", ss.getId());
  const sh = ss.getSheetByName("Status") || ss.insertSheet("Status", 0);
  sh.clearContents();
  sh.getRange(1, 1, lines.length, 2).setValues(lines.map(l => [l[0], l[1] == null ? "" : l[1]]));
  sh.getRange(1, 1, lines.length, 1).setFontWeight("bold");
  sh.autoResizeColumns(1, 2);
}
