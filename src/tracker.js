// Is a game running / how long was it played: running exe names come from Windows' "tasklist" tool and are
// matched against the exe names in each game's folder (no PowerShell, so antivirus software stays calm).
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const dirKey = (d) => path.resolve(d).toLowerCase().replace(/[\\/]+$/, '') + '\\';

// Very broad folders (C:\, C:\Windows, Program Files) would count every program as a game; they are not scanned.
function safeDir(d) {
  if (!d) return null;
  const k = dirKey(d);
  if (k.split('\\').filter(Boolean).length < 2) return null; // drive root
  if (/^[a-z]:\\(windows|program files( \(x86\))?|programdata|users\\[^\\]+)\\$/.test(k)) return null;
  if (/^[a-z]:\\windows\\/.test(k)) return null;
  return k;
}

// Helper programs shared by many games: they don't identify a game, so they are ignored
const GENERIC = new Set([
  'unitycrashhandler64.exe', 'unitycrashhandler32.exe', 'crashreportclient.exe', 'crashpad_handler.exe',
  'easyanticheat.exe', 'easyanticheat_eos.exe', 'easyanticheat_eos_setup.exe', 'easyanticheat_setup.exe',
  'beservice.exe', 'beservice_x64.exe', 'battleye.exe', 'dxsetup.exe', 'dxwebsetup.exe',
  'vc_redist.x64.exe', 'vc_redist.x86.exe', 'vcredist_x64.exe', 'vcredist_x86.exe', 'dotnetfx.exe', 'dotnetfx35.exe',
  'unins000.exe', 'unins001.exe', 'uninstall.exe', 'uninstaller.exe', 'uninst.exe', 'setup.exe', 'updater.exe', 'launcher.exe',
  'ue4prereqsetup_x64.exe', 'ueprereqsetup_x64.exe', 'cefprocess.exe', 'qtwebengineprocess.exe', 'notification_helper.exe',
  'steamerrorreporter.exe', 'steamerrorreporter64.exe', 'oalinst.exe', 'physx.exe', 'touchup.exe', 'cleanup.exe',
]);
// Launcher helpers copied into game folders run on their own while the launcher is open
// (e.g. Fortnite ships EpicWebHelper.exe, which the Epic Games Launcher also runs), so they must not count.
const HELPER = /webhelper|crashhandler|crashreport|crashpad|errorreporter|uninstall|unins\d|setup|redist|prereq|anticheat|battleye|beservice|launcherhelper/;
const isHelper = (n) => GENERIC.has(n) || HELPER.test(n);

// Exe names in a folder (lowercase), at most 4 levels and 20,000 entries; async so big games don't block the main thread
async function listExes(dir, { depth = 4, max = 20000 } = {}) {
  const out = new Set();
  if (!safeDir(dir)) return out;
  let seen = 0;
  const walk = async (d, level) => {
    let list = [];
    try { list = await fs.promises.readdir(d, { withFileTypes: true }); } catch { return; }
    for (const e of list) {
      if (++seen > max) return;
      if (e.isDirectory()) { if (level < depth) await walk(path.join(d, e.name), level + 1); continue; }
      const n = e.name.toLowerCase();
      if (n.endsWith('.exe') && !isHelper(n)) out.add(n);
    }
  };
  await walk(dir, 0);
  return out;
}

// "tasklist /fo csv /nh" output -> running exe names (lowercase)
function parseTasklist(text) {
  const names = new Set();
  for (const line of String(text).split(/\r?\n/)) {
    const m = line.match(/^"([^"]+)"/);
    if (m) names.add(m[1].toLowerCase());
  }
  return names;
}

function runningExeNames() {
  return new Promise((resolve) => {
    execFile('tasklist', ['/fo', 'csv', '/nh'], { windowsHide: true, maxBuffer: 8 << 20, timeout: 15000 }, (err, out) => resolve(err ? null : parseTasklist(out)));
  });
}

// names: running exe names; games: [{ key, exes: Set }]; rank(key): if the same exe name is in several games,
// the most recently launched one wins (e.g. "game.exe" in two RPG Maker games)
function matchRunning(names, games, rank = () => 0) {
  const owners = new Map();
  for (const g of games) for (const e of g.exes) if (names.has(e)) (owners.get(e) || owners.set(e, []).get(e)).push(g.key);
  const out = new Set();
  for (const keys of owners.values()) out.add(keys.length === 1 ? keys[0] : [...keys].sort((a, b) => rank(b) - rank(a))[0]);
  return [...out];
}

const dayOf = (t) => new Date(t).toLocaleDateString('sv'); // local YYYY-MM-DD

function minutesSince(days = {}, sinceMs) {
  const from = dayOf(sinceMs);
  return Math.round(Object.entries(days).filter(([d]) => d >= from).reduce((a, [, ms]) => a + ms, 0) / 60000);
}

module.exports = { safeDir, listExes, isHelper, parseTasklist, runningExeNames, matchRunning, dayOf, minutesSince, GENERIC };
