// Game finder: Steam, Epic, Xbox (Game Pass / Microsoft Store), EA, Ubisoft, GOG + optional extra folders.
// Independent of Electron (readLink is passed in so this can be tested).
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');

// Things in Steam's library files that are not games
const NOT_A_GAME = /redistributable|steamworks|proton|steamvr|runtime|dedicated server|soundtrack|wallpaper engine/i;

function parseVdf(text) {
  const tokens = text.match(/"(?:[^"\\]|\\.)*"|[{}]/g) || [];
  const unq = (t) => t.slice(1, -1).replace(/\\(.)/g, '$1');
  let i = 0;
  const obj = () => {
    const o = {};
    while (i < tokens.length) {
      const t = tokens[i++];
      if (t === '}') return o;
      const next = tokens[i++];
      o[unq(t)] = next === '{' ? obj() : unq(next ?? '""');
    }
    return o;
  };
  return obj();
}

const norm = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');
// VDF key casing differs between installs ("Valve" / "valve")
const pick = (o, ...keys) => keys.reduce((a, k) => a && a[Object.keys(a).find((x) => x.toLowerCase() === k.toLowerCase())], o);

function readSafe(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return null; }
}

function run(cmd, args) {
  return new Promise((resolve) => {
    execFile(cmd, args, { encoding: 'utf8', windowsHide: true, maxBuffer: 32 << 20, timeout: 60000 }, (err, out) => resolve(err ? '' : out));
  });
}

// ---------- Steam ----------
// Steam install folder (from the registry, Unicode: paths with non-ASCII characters are read correctly)
// EA app: its link (link2ea://) only launches games and shows an error without one, so the app is opened by its exe
async function eaAppPath() {
  const key = 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Electronic Arts\\EA Desktop';
  const v = (await regExport(key))[key] || {};
  return [v.LauncherAppPath, v.ClientPath].find((p) => p && /\.exe$/i.test(p) && fs.existsSync(p)) || null;
}

async function findSteamPath() {
  const key = 'HKEY_CURRENT_USER\\Software\\Valve\\Steam';
  const p = (await regExport(key))[key]?.SteamPath;
  return p ? path.normalize(p) : 'C:\\Program Files (x86)\\Steam';
}

// Playtime lives in Steam's local file: userdata/<account>/config/localconfig.vdf (most recent account)
function steamStats(steamPath) {
  const ud = path.join(steamPath, 'userdata');
  let best = null;
  try {
    for (const d of fs.readdirSync(ud)) {
      const f = path.join(ud, d, 'config', 'localconfig.vdf');
      try { const t = fs.statSync(f).mtimeMs; if (!best || t > best.t) best = { f, t }; } catch { /* not in this account */ }
    }
  } catch { return {}; }
  if (!best) return {};
  const apps = pick(parseVdf(readSafe(best.f) || ''), 'UserLocalConfigStore', 'Software', 'Valve', 'Steam', 'apps') || {};
  const stats = {};
  for (const [id, a] of Object.entries(apps)) {
    if (typeof a !== 'object') continue;
    stats[id] = {
      playtime: +pick(a, 'playtime') || 0, // minutes
      playtime2wks: +pick(a, 'Playtime2wks') || 0,
      lastPlayed: (+pick(a, 'LastPlayed') || 0) * 1000,
    };
  }
  return stats;
}

// Shown as the "connected account" on the Platforms page (no Steam sign-in needed, read from a local file)
function steamAccount(steamPath) {
  const users = parseVdf(readSafe(path.join(steamPath, 'config', 'loginusers.vdf')) || '').users || {};
  const list = Object.entries(users);
  const [id, u] = list.find(([, x]) => pick(x, 'MostRecent') === '1') || list[0] || [];
  return u ? { name: pick(u, 'PersonaName'), id: /^\d{17}$/.test(id) ? id : null } : null; // id: SteamID64, for the optional Web API
}

function scanSteam(steamPath) {
  const vdf = readSafe(path.join(steamPath, 'steamapps', 'libraryfolders.vdf'));
  const libs = vdf ? Object.values(parseVdf(vdf).libraryfolders || {}).map((l) => l.path).filter(Boolean) : [steamPath];
  const stats = steamStats(steamPath);
  const games = [];
  for (const lib of libs) {
    const appsDir = path.join(lib, 'steamapps');
    let files = [];
    try { files = fs.readdirSync(appsDir).filter((f) => /^appmanifest_\d+\.acf$/.test(f)); } catch { continue; }
    for (const f of files) {
      const st = parseVdf(readSafe(path.join(appsDir, f)) || '').AppState;
      if (!st || !st.appid || NOT_A_GAME.test(st.name || '')) continue;
      if (!(+st.StateFlags & 4)) continue; // 4 = installed; skip while still downloading
      games.push({
        key: `steam:${st.appid}`,
        name: st.name,
        source: 'steam',
        steamAppId: String(st.appid),
        launch: `steam://rungameid/${st.appid}`,
        installDir: path.join(appsDir, 'common', st.installdir || ''),
        ...stats[st.appid],
      });
    }
  }
  return games;
}

// ---------- Epic ----------
function scanEpic(manifestDir = 'C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests') {
  let files = [];
  try { files = fs.readdirSync(manifestDir).filter((f) => f.endsWith('.item')); } catch { return []; }
  const games = [];
  for (const f of files) {
    let m;
    try { m = JSON.parse(readSafe(path.join(manifestDir, f))); } catch { continue; }
    if (!m || !m.AppName || !(m.AppCategories || []).includes('games')) continue;
    games.push({
      key: `epic:${m.AppName}`,
      name: m.DisplayName || m.AppName,
      source: 'epic',
      launch: `com.epicgames.launcher://apps/${m.CatalogNamespace}%3A${m.CatalogItemId}%3A${m.AppName}?action=launch&silent=true`,
      installDir: m.InstallLocation,
      iconPath: m.InstallLocation && m.LaunchExecutable ? path.join(m.InstallLocation, m.LaunchExecutable) : undefined,
    });
  }
  return games;
}

// ---------- Xbox / EA / Ubisoft / GOG and uninstall entries: Windows registry ----------
// Uses Windows' own "reg export" tool instead of PowerShell: the output is a UTF-16 file, so
// non-ASCII characters and ™ survive, and antivirus software sees no hidden/encoded commands.

// .reg file text -> { "HKEY_...\\Key": { ValueName: value } } (string, expandable string and dword values)
function parseReg(text) {
  const out = {};
  let cur = null;
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.startsWith('[') && line.endsWith(']')) { cur = out[line.slice(1, -1)] = {}; continue; }
    if (!cur || !line) continue;
    while (/^(@|"(?:[^"\\]|\\.)*")=hex/.test(line) && line.endsWith('\\') && i + 1 < lines.length) line = line.slice(0, -1) + lines[++i].trim();
    const m = line.match(/^(?:"((?:[^"\\]|\\.)*)"|(@))=(.*)$/);
    if (!m) continue;
    const name = m[2] ? '' : m[1].replace(/\\(.)/g, '$1');
    const v = m[3];
    if (v.startsWith('"')) cur[name] = v.slice(1, -1).replace(/\\(.)/g, '$1');
    else if (v.startsWith('hex(2):')) cur[name] = Buffer.from(v.slice(7).split(',').filter(Boolean).map((h) => parseInt(h, 16))).toString('utf16le').replace(/\0+$/, '');
    else if (v.startsWith('dword:')) cur[name] = parseInt(v.slice(6), 16);
  }
  return out;
}

async function regExport(key) {
  const file = path.join(os.tmpdir(), `ludora-${process.pid}-${Math.random().toString(36).slice(2)}.reg`);
  try {
    await run('reg', ['export', key, file, '/y']);
    return parseReg(fs.readFileSync(file).toString('utf16le'));
  } catch {
    return {}; // key doesn't exist (e.g. GOG not installed)
  } finally {
    fs.rmSync(file, { force: true });
  }
}

const subkeys = (tree, root) => Object.entries(tree)
  .filter(([k]) => k.toLowerCase().startsWith(root.toLowerCase() + '\\') && !k.slice(root.length + 1).includes('\\'))
  .map(([k, v]) => ({ id: k.slice(root.length + 1), ...v }));

const UNINSTALL_KEYS = [
  'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  'HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  'HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
];
async function readUninstallEntries() {
  const trees = await Promise.all(UNINSTALL_KEYS.map(regExport));
  return trees.flatMap((tree, i) => subkeys(tree, UNINSTALL_KEYS[i]))
    .filter((e) => e.DisplayName && e.UninstallString)
    .map((e) => ({ name: e.DisplayName, dir: e.InstallLocation || '', icon: e.DisplayIcon || '', uninstall: e.UninstallString }));
}

// Xbox / Microsoft Store: package registry + MicrosoftGame.config in the package folder (only games have it)
const XBOX_KEY = 'HKEY_CURRENT_USER\\Software\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\CurrentVersion\\AppModel\\Repository\\Packages';
function xboxFromPackages(packages) {
  const games = [];
  for (const p of packages) {
    const root = p.PackageRootFolder;
    const cfg = root && readSafe(path.join(root, 'MicrosoftGame.config'));
    if (!cfg) continue;
    const manifest = readSafe(path.join(root, 'AppxManifest.xml')) || '';
    const parts = String(p.PackageID || p.id).split('_'); // Name_Version_Arch_ResourceId_PublisherId
    const attr = (xml, re) => (xml.match(re) || [])[1];
    games.push({
      name: attr(cfg, /DefaultDisplayName="([^"]+)"/) || p.DisplayName,
      pkg: parts[0],
      family: `${parts[0]}_${parts[parts.length - 1]}`,
      appId: attr(manifest, /<Application[^>]*\sId="([^"]+)"/),
      dir: root,
      exe: attr(cfg, /<Executable[^>]*\sName="([^"]+)"/),
    });
  }
  return games;
}

async function readLaunchers() {
  const [uninstall, packages, ubi, gog] = await Promise.all([
    readUninstallEntries(),
    regExport(XBOX_KEY).then((t) => subkeys(t, XBOX_KEY)),
    regExport('HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Ubisoft\\Launcher\\Installs').then((t) => subkeys(t, 'HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Ubisoft\\Launcher\\Installs')),
    regExport('HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\GOG.com\\Games').then((t) => subkeys(t, 'HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\GOG.com\\Games')),
  ]);
  return {
    xbox: xboxFromPackages(packages),
    ea: uninstall.filter((e) => /EAInstaller/i.test(e.uninstall)).map((e) => ({ name: e.name, dir: e.dir, icon: e.icon })),
    ubi: ubi.map((x) => ({ id: x.id, dir: x.InstallDir })),
    gog: gog.map((x) => ({ id: x.id, name: x.gameName, dir: x.path, exe: x.exe })),
  };
}

const cleanDir = (p) => (p ? path.resolve(String(p).replace(/"/g, '').split(',')[0].trim()).toLowerCase().replace(/[\\/]+$/, '') : '');

// safe(dir): is the folder too broad (like C:\Program Files) — tracker.safeDir is passed in
function matchUninstall(entries, g, safe) {
  const dir = cleanDir(g.installDir);
  const n = norm(g.name);
  return entries.find((e) => dir && cleanDir(e.dir) === dir)
    || entries.find((e) => n && norm(e.name) === n)
    || (dir && safe(dir) ? entries.find((e) => cleanDir(e.icon).startsWith(dir + '\\')) : null)
    || null;
}

// No registry entry: look for an uninstaller like unins000.exe / uninstall.exe in the game folder (at most 1 subfolder deep)
function findUninstallerExe(dir) {
  const re = /^(unins\d*|uninstall(er)?|uninst)\.exe$/i;
  const look = (d, depth) => {
    let list = [];
    try { list = fs.readdirSync(d, { withFileTypes: true }); } catch { return null; }
    const hit = list.find((x) => x.isFile() && re.test(x.name));
    if (hit) return path.join(d, hit.name);
    if (depth > 0) for (const x of list) if (x.isDirectory()) { const r = look(path.join(d, x.name), depth - 1); if (r) return r; }
    return null;
  };
  return dir ? look(dir, 1) : null;
}

const exists = (p) => { try { return !!p && fs.existsSync(p); } catch { return false; } };

function fromLaunchers(raw, has = exists) {
  const list = (x) => [].concat(x || []);
  const games = [];
  for (const x of list(raw.xbox)) {
    if (!x.family || !x.appId) continue;
    const name = x.name && !/^ms-resource:/i.test(x.name) ? x.name : String(x.pkg || x.family).split('.').pop();
    games.push({
      key: `xbox:${x.family}`, name, source: 'xbox',
      launch: `shell:AppsFolder\\${x.family}!${x.appId}`,
      installDir: x.dir, iconPath: x.exe ? path.join(x.dir, x.exe) : undefined,
    });
  }
  for (const x of list(raw.ea)) {
    const exe = String(x.icon || '').replace(/"/g, '').split(',')[0].trim();
    if (!x.name || !/\.exe$/i.test(exe) || !has(exe)) continue;
    games.push({ key: `ea:${norm(x.name)}`, name: x.name, source: 'ea', launch: exe, installDir: x.dir, iconPath: exe });
  }
  for (const x of list(raw.ubi)) {
    if (!x.id || !has(x.dir)) continue;
    games.push({ key: `ubisoft:${x.id}`, name: path.basename(x.dir.replace(/[\\/]+$/, '')), source: 'ubisoft', launch: `uplay://launch/${x.id}/0`, installDir: x.dir });
  }
  for (const x of list(raw.gog)) {
    if (!x.name || !has(x.exe)) continue;
    games.push({ key: `gog:${x.id}`, name: x.name, source: 'gog', launch: x.exe, installDir: x.dir, iconPath: x.exe });
  }
  return games;
}

// ---------- optional extra folders (games without a launcher) ----------
// readLink(file) -> { target, icon } ; shell.readShortcutLink in Electron
function scanFolder(dir, readLink) {
  let files = [];
  try { files = fs.readdirSync(dir); } catch { return []; }
  const items = [];
  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    if (!['.lnk', '.url', '.exe'].includes(ext)) continue;
    const file = path.join(dir, f);
    const item = { name: path.basename(f, path.extname(f)), launch: file, file };
    if (ext === '.url') {
      const txt = readSafe(file) || '';
      const url = (txt.match(/^URL=(.+)$/m) || [])[1]?.trim() || '';
      item.iconPath = (txt.match(/^IconFile=(.+)$/m) || [])[1]?.trim();
      const steam = url.match(/^steam:\/\/rungameid\/(\d+)/i);
      const epic = url.match(/^com\.epicgames\.launcher:\/\/apps\/[^?]*%3A([^?%]+)\?/i);
      if (steam) item.steamAppId = steam[1];
      if (epic) item.epicApp = decodeURIComponent(epic[1]);
    } else if (ext === '.lnk') {
      try {
        const l = readLink(file);
        item.target = l.target || undefined;
        item.iconPath = (l.icon && fs.existsSync(l.icon) ? l.icon : undefined) || item.target;
      } catch { /* store shortcuts have no target; they are opened through the shortcut itself */ }
    } else {
      item.target = file;
      item.iconPath = file;
    }
    items.push(item);
  }
  return items;
}

const inside = (child, parent) => {
  if (!child || !parent) return false;
  const rel = path.relative(parent.toLowerCase(), child.toLowerCase());
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel);
};

// A shortcut in an extra folder that belongs to an already found game merges with it; otherwise it becomes its own game.
function merge(folderItems, platformGames) {
  const byKey = new Map(platformGames.map((g) => [g.key, { ...g }]));
  for (const it of folderItems) {
    let key = it.steamAppId ? `steam:${it.steamAppId}` : it.epicApp ? `epic:${it.epicApp}` : null;
    if (!key && it.target) key = platformGames.find((g) => inside(it.target, g.installDir))?.key;
    // Xbox/Store shortcuts have no target; if a game with the same name exists, it's that one
    if (!key) key = platformGames.find((g) => norm(g.name) === norm(it.name))?.key;
    if (key && byKey.has(key)) continue; // the launcher's own data is more accurate
    key ||= `file:${norm(it.name)}`;
    byKey.set(key, {
      key, name: it.name, source: 'shortcut', steamAppId: it.steamAppId, launch: it.launch,
      iconPath: it.iconPath, installDir: it.target ? path.dirname(it.target) : undefined, shortcut: it.file,
    });
  }
  return [...byKey.values()];
}

async function scanAll({ folders = [], off = [] }, readLink) {
  const [steamPath, launchers] = await Promise.all([findSteamPath(), readLaunchers()]);
  const platform = [...scanSteam(steamPath), ...scanEpic(), ...fromLaunchers(launchers)];
  const folderItems = folders.flatMap((d) => scanFolder(d, readLink));
  return hideOff(merge(folderItems, platform), off);
}

// Disabled platforms are filtered AFTER merging: otherwise a Steam/Epic shortcut in an extra folder
// (e.g. Fortnite.url) would bring the same game back as a "shortcut".
const hideOff = (games, off) => games.filter((g) => !off.includes(g.key.split(':')[0]));

module.exports = { eaAppPath, parseReg, xboxFromPackages, parseVdf, norm, findSteamPath, steamAccount, scanSteam, steamStats, scanEpic, fromLaunchers, scanFolder, merge, hideOff, scanAll, readUninstallEntries, matchUninstall, findUninstallerExe };
