const { app, BrowserWindow, ipcMain, shell, dialog, nativeImage, globalShortcut, desktopCapturer, screen, Notification, clipboard, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { execFile, spawn } = require('child_process');
const scanner = require('./scanner');
const md = require('./metadata');
const tracker = require('./tracker');
const emus = require('./emulators');
const accounts = require('./accounts');

const DATA = app.getPath('userData');
const CFG_FILE = path.join(DATA, 'config.json');
const LIB_FILE = path.join(DATA, 'library.json');
const ACC_FILE = path.join(DATA, 'accounts.bin');
const CACHE = path.join(DATA, 'images'); // not "cache": on Windows it collides with Chromium's own Cache folder and gets wiped
const ICON = ['icon.ico', 'icon.png'].map((f) => path.join(__dirname, '..', 'build', f)).find((f) => fs.existsSync(f));

const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const writeJson = (f, o) => {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f + '.tmp', JSON.stringify(o, null, 2));
  fs.renameSync(f + '.tmp', f); // a half-written file must not corrupt the library
};

// folders: extra folders for games without a launcher; off: disabled platforms
const DEFAULTS = {
  folders: [], off: [], lang: null /* set from the system language on first run */, accent: '#e8293b', shotKey: 'F10', shotDir: '', emulators: [],
  closeToTray: true, // keep running in the tray when the window is closed (for playtime tracking and F10)
  trayOnLaunch: true, // minimize to the tray when a game starts
  autostart: false, // start in the tray with Windows
  trayHintShown: false,
  checkUpdates: true, // look for new GameCenter versions on GitHub
  online: true, // download game info and artwork (Steam, Wikipedia, libretro); can be turned off in Settings
};
let config = { ...DEFAULTS, ...readJson(CFG_FILE, {}) };
const store = readJson(LIB_FILE, { games: {} });
store.platformStats ||= {}; // real playtimes from connected accounts: { key: { playtime, lastPlayed } }
let acc = accounts.loadAccounts(ACC_FILE);
let scanned = [];
let win;

const save = () => writeJson(LIB_FILE, store);
const entry = (key) => (store.games[key] ||= { custom: {}, images: {} });
const find = (key) => { const g = scanned.find((x) => x.key === key); if (!g) throw new Error('E_NOTFOUND'); return g; };
const dirOf = (key) => path.join(CACHE, key.replace(/[^\w.-]/g, '_'));
const customLaunch = (s) => (s.custom.launch && fs.existsSync(s.custom.launch) ? s.custom.launch : null);
const shotRoot = () => config.shotDir || path.join(app.getPath('pictures'), 'GameCenter');
const safeName = (s) => String(s).replace(/[<>:"/\\|?*\x00-\x1f™®©]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Desktop';

function view(g) {
  const s = entry(g.key);
  const m = s.meta || {};
  const c = s.custom || {};
  const ps = store.platformStats[g.key];
  const img = (k) => {
    const p = c.images?.[k] || s.images?.[k];
    return p && fs.existsSync(p) ? `${pathToFileURL(p).href}?v=${s.rev || 0}` : null;
  };
  const tracked = Math.round((s.tracked || 0) / 60000);
  const name = c.name || g.name;
  return {
    key: g.key,
    name,
    source: g.source,
    emuName: g.emuName,
    emuId: g.emuId,
    installDir: g.installDir || null,
    description: m.description || '',
    genres: m.genres || [],
    publisher: m.publishers?.[0] || '',
    developer: m.developers?.[0] || '',
    releaseDate: m.releaseDate || '',
    steamAppId: c.steamAppId || g.steamAppId || m.steamAppId || '',
    steamTitle: m.steamAppId ? m.title : '', // title of the Steam page the info came from
    wikiUrl: m.source === 'wikipedia' ? m.wikiUrl : '',
    steamManual: !!c.steamAppId,
    favorite: !!s.favorite,
    hidden: !!s.hidden,
    status: s.status || '',
    collections: s.collections || [],
    // playtime source: Steam file > connected account (Xbox) > GameCenter tracking
    lastPlayed: Math.max(s.lastPlayed || 0, g.lastPlayed || 0, ps?.lastPlayed || 0),
    playtime: (g.playtime || 0) + (ps ? Math.max(ps.playtime, tracked) : tracked),
    // for Steam's own games the last 2 weeks come from Steam (daily log is only for the chart, so it isn't counted twice)
    playtime2wks: g.source === 'steam' && !c.launch ? g.playtime2wks || 0 : (g.playtime2wks || 0) + tracker.minutesSince(s.days, Date.now() - 13 * 864e5),
    days: s.days || {},
    timeSource: g.source === 'steam' ? (c.launch ? 'steamPlus' : 'steam') : ps ? 'account' : 'tracked',
    running: running.has(g.key),
    launching: !running.has(g.key) && (launching.get(g.key) || 0) > Date.now(),
    images: { hero: img('hero'), cover: img('cover'), logo: img('logo'), icon: img('icon') },
    colors: s.colors || null,
    loading: !s.meta && config.online,
    customLaunch: c.launch || null,
    defaultLaunch: g.source === 'emu' ? g.rom : g.launch,
    customName: c.name || '',
    customImages: Object.keys(c.images || {}),
    shotFolder: safeName(name),
  };
}

// fetch again if info was never fetched, the language changed, or a downloaded image was deleted
const needsFetch = (s) => !s.meta
  || (s.meta.lang && s.meta.lang !== config.lang)
  || (!s.meta.steamAppId && !s.meta.wikiTried) // retry once for games marked "not found" before the Wikipedia fallback existed
  || Object.values(s.images || {}).some((p) => !fs.existsSync(p));

const push = (g) => win?.webContents.send('game:updated', view(g));
const pushAll = () => win?.webContents.send('library:changed', scanned.map(view));

function recolor(s) {
  const c = s.custom || {};
  const p = [c.images?.hero, s.images?.hero, c.images?.cover, s.images?.cover, s.images?.icon].find((x) => x && fs.existsSync(x));
  if (!p) return;
  const im = nativeImage.createFromPath(p);
  if (im.isEmpty()) return;
  const small = im.resize({ width: 48 });
  const { width, height } = small.getSize();
  s.colors = md.palette(small.toBitmap(), width, height);
}

async function enrich(g, force = false) {
  const s = entry(g.key);
  if (!needsFetch(s) && !force) return;
  for (const [k, p] of Object.entries(s.images)) if (!fs.existsSync(p)) delete s.images[k];
  const dir = dirOf(g.key);
  fs.mkdirSync(dir, { recursive: true });
  if (g.iconPath && !s.images.icon) {
    try {
      const ic = await app.getFileIcon(g.iconPath, { size: 'large' });
      if (!ic.isEmpty()) { fs.writeFileSync(path.join(dir, 'icon.png'), ic.toPNG()); s.images.icon = path.join(dir, 'icon.png'); }
    } catch { /* no icon is fine */ }
  }
  if (!config.online && !force) { recolor(s); s.rev = Date.now(); save(); push(g); return; } // offline mode: nothing sent automatically (user-initiated refetch still works)
  try {
    let meta = null;
    if (g.source === 'emu') {
      // ROMs aren't searched on Steam (they'd mix with PC versions); images come from the libretro archive
      for (const [kind, url] of Object.entries(emus.libretroUrls(g.system, g.rawName))) {
        const file = path.join(dir, `${kind}.png`);
        if (!s.images[kind] && await md.download(url, file).catch(() => false)) s.images[kind] = file;
      }
    } else {
      // manual match > the platform's own Steam ID > previous match > automatic search by name
      const id = s.custom.steamAppId || g.steamAppId || s.meta?.steamAppId || await md.findSteamId(g.name);
      meta = id ? await md.fetchSteamDetails(id, config.lang) : null;
      if (meta) s.images = { ...s.images, ...await md.fetchSteamImages(id, dir, meta, s.images) }; // only missing images are downloaded
      // hide programs that came from Steam automatically (Wallpaper Engine etc.) once; the user can undo it in Hidden
      if (meta?.isSoftware && !g.shortcut && s.hidden === undefined) s.hidden = true;
    }
    // games not on Steam (Bloodborne port, Switch/PS2 games...): description, genres, publisher and cover from Wikipedia
    if (!meta) {
      meta = await md.fetchWikiDetails(g.name, config.lang) || { wikiTried: true }; // not found: don't ask again on every start
      if (meta.coverUrl && !s.images.cover) {
        const file = path.join(dir, `cover-wiki${path.extname(new URL(meta.coverUrl).pathname).toLowerCase() || '.jpg'}`);
        if (await md.download(meta.coverUrl, file, md.WIKI_HEADERS).catch(() => false)) s.images.cover = file;
      }
    }
    s.meta = meta;
  } catch (e) {
    console.warn('Could not fetch info:', g.name, e.message); // network error: old info stays, retried on the next scan
  }
  recolor(s);
  s.rev = Date.now();
  save();
  push(g);
}

async function enrichAll(list) {
  const q = [...list];
  await Promise.all([1, 2, 3].map(async () => { while (q.length) await enrich(q.shift()); }));
}

// If games were installed/removed or Steam playtimes changed, send the whole list to the UI.
let lastSig = '';
let scanning = null;
function scan() {
  scanning ||= (async () => {
    try {
      const list = [
        ...await scanner.scanAll(config, (f) => shell.readShortcutLink(f)),
        ...config.emulators.flatMap(emus.scanRoms),
      ];
      const sig = JSON.stringify(list);
      if (sig !== lastSig) {
        lastSig = sig;
        scanned = list;
        pushAll();
        enrichAll(scanned.filter((g) => needsFetch(entry(g.key))));
        for (const k of [...exeCache.keys()]) if (!scanned.some((g) => g.key === k)) exeCache.delete(k);
      }
    } finally { scanning = null; }
    return scanned.map(view);
  })();
  return scanning;
}

// ---------- playtime tracking + "running now" ----------
let running = new Set();
let lastTick = Date.now();
const activeRom = {}; // emulator id -> key of the last launched ROM (while the emulator runs, time goes to that ROM)
// Exe names in each game's folder (re-read when the scan changes); for emulators the emulator's exe
const exeCache = new Map(); // key -> Set(exe name)
async function refreshExeCache() {
  for (const g of scanned) {
    if (exeCache.has(g.key)) continue;
    exeCache.set(g.key, g.source === 'emu' ? new Set([path.basename(g.launch).toLowerCase()]) : await tracker.listExes(g.installDir));
  }
}
function gameExes(g) {
  const set = new Set(exeCache.get(g.key) || []);
  const cl = customLaunch(entry(g.key));
  if (cl && /\.exe$/i.test(cl)) set.add(path.basename(cl).toLowerCase()); // custom launch path such as a mod loader
  return set;
}

function tick(names) {
  const now = Date.now();
  const dt = Math.min(now - lastTick, 60000); // don't inflate time after sleep/suspend
  lastTick = now;
  const games = scanned
    .filter((g) => g.source !== 'emu' || activeRom[g.emuId] === g.key) // while an emulator runs, time goes to the last launched ROM
    .map((g) => ({ key: g.key, exes: gameExes(g) }));
  const recency = (key) => Math.max(launching.get(key) || 0, entry(key).lastPlayed || 0);
  const nowRunning = new Set(tracker.matchRunning(names, games, recency));
  const day = tracker.dayOf(now);
  for (const key of nowRunning) {
    const g = scanned.find((x) => x.key === key);
    const s = entry(key);
    launching.delete(key); // seen running: "Starting" -> "Playing"
    // a daily log is kept for every game (stats chart); for Steam games Steam keeps the total itself
    s.days = Object.fromEntries(Object.entries({ ...s.days, [day]: (s.days?.[day] || 0) + dt }).filter(([d]) => d >= tracker.dayOf(now - 30 * 864e5)));
    if (g.source === 'steam' && !customLaunch(s)) continue;
    s.tracked = (s.tracked || 0) + dt;
    s.lastPlayed = now;
  }
  const expired = [...launching].filter(([, until]) => until < now).map(([k]) => k);
  expired.forEach((k) => launching.delete(k));
  const changed = new Set([...nowRunning, ...running, ...expired]);
  // We hid the window for this game: bring it back once the game was seen running and has now closed.
  // If it was never detected, don't pop up over a game that may still be running; the tray icon still opens it.
  if (hiddenFor && running.has(hiddenFor) && !nowRunning.has(hiddenFor)) {
    if (win && !win.isDestroyed() && !win.isVisible()) showWindow();
    hiddenFor = null;
  } else if (hiddenFor && expired.includes(hiddenFor)) hiddenFor = null;
  running = nowRunning;
  if (changed.size) { save(); scanned.filter((g) => changed.has(g.key)).forEach(push); }
  updateTray();
}
// After pressing Play, blocks a second launch until the process shows up (at most 90 s)
const launching = new Map(); // key -> "starting" until this time
let hiddenFor = null; // game the window was hidden to the tray for

// Check running programs every 15 s (and a few seconds after a launch, so "Playing" shows up quickly)
let tickBusy = false;
async function pollRunning() {
  if (tickBusy || !scanned.length) return;
  tickBusy = true;
  try {
    await refreshExeCache();
    const names = await tracker.runningExeNames();
    if (names) tick(names);
  } finally { tickBusy = false; }
}
function startTracker() {
  pollRunning();
  // every 15 s; every 5 s while the window is hidden for a game, so it comes back quickly when the game closes
  let n = 0;
  setInterval(() => { if (hiddenFor || ++n % 3 === 0) pollRunning(); }, 5000);
}

// ---------- accounts (Xbox) ----------
let steamName = null; // no Steam sign-in needed: the account name comes from the local loginusers.vdf
const accountView = () => ({
  steam: { name: steamName },
  xbox: acc.xbox ? { name: acc.xbox.gamertag, error: acc.xbox.error || null, synced: acc.xbox.synced || 0 } : null,
  xboxClientId: acc.xboxClientId || '',
});

async function syncXbox() {
  if (!acc.xbox) return;
  try {
    const t = await accounts.xboxRefresh(acc.xbox);
    const titles = await accounts.xboxStats(t);
    for (const k of Object.keys(store.platformStats)) if (k.startsWith('xbox:')) delete store.platformStats[k];
    for (const x of titles) store.platformStats[`xbox:${x.pfn}`] = { playtime: x.minutes, lastPlayed: x.lastPlayed };
    acc.xbox.gamertag = t.gamertag || acc.xbox.gamertag;
    acc.xbox.error = null;
    acc.xbox.synced = Date.now();
    save();
  } catch (e) {
    acc.xbox.error = e.message;
    console.warn('Xbox sync failed:', e.message, e.detail || '');
  }
  accounts.saveAccounts(ACC_FILE, acc);
  pushAll();
}

// ---------- screenshots ----------
async function takeShot() {
  try {
    const d = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    const size = { width: Math.round(d.size.width * d.scaleFactor), height: Math.round(d.size.height * d.scaleFactor) };
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: size });
    const src = sources.find((s) => s.display_id === String(d.id)) || sources[0];
    if (!src || src.thumbnail.isEmpty()) throw new Error('E_SHOT');
    // hidden programs (e.g. an always-on utility) don't count as games; if several are running, the latest launched one
    const game = scanned.filter((g) => running.has(g.key) && !entry(g.key).hidden)
      .sort((a, b) => (entry(b.key).lastPlayed || 0) - (entry(a.key).lastPlayed || 0))[0];
    const dir = path.join(shotRoot(), safeName(game ? view(game).name : 'Desktop'));
    fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toLocaleString('sv').replace(/[: ]/g, (c) => (c === ' ' ? '_' : '-'));
    const file = path.join(dir, `${stamp}.png`);
    fs.writeFileSync(file, src.thumbnail.toPNG());
    const n = new Notification({ title: config.lang === 'en' ? 'Screenshot saved' : 'Ekran görüntüsü kaydedildi', body: path.relative(shotRoot(), file), silent: true }); // the UI's short shutter sound instead of Windows' notification sound
    n.on('click', () => shell.showItemInFolder(file));
    n.show();
    win?.webContents.send('shots:new');
  } catch (e) {
    console.warn('Screenshot failed:', e.message);
  }
}

function registerShotKey(key) {
  globalShortcut.unregisterAll();
  try { return globalShortcut.register(key, takeShot); } catch { return false; }
}

function listShots() {
  const root = shotRoot();
  let dirs = [];
  try { dirs = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()); } catch { return []; }
  return dirs.map((d) => {
    const dir = path.join(root, d.name);
    const files = fs.readdirSync(dir).filter((f) => /\.(png|jpe?g)$/i.test(f)).map((f) => {
      const p = path.join(dir, f);
      return { path: p, url: pathToFileURL(p).href, t: fs.statSync(p).mtimeMs };
    }).sort((a, b) => b.t - a.t);
    return { folder: d.name, files };
  }).filter((x) => x.files.length).sort((a, b) => b.files[0].t - a.files[0].t);
}

const insideShots = (p) => { const r = path.relative(shotRoot(), p); return r === '' || (!r.startsWith('..') && !path.isAbsolute(r)); };

// ---------- updates (GitHub releases) ----------
// Asks GitHub for the latest release; if it's newer, the UI offers to download the installer and
// install it silently (the installer closes the old version and starts the new one).
const REPO = 'yigittozdemirr/game-center';
let update = null; // { version, notes, url, size }
let updating = false;

async function checkUpdate() {
  if (!config.checkUpdates) return;
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'GameCenter' },
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return;
    const rel = await r.json();
    const version = String(rel.tag_name || '').replace(/^v/, '');
    const asset = (rel.assets || []).find((a) => /^GameCenter-Setup-[\d.]+\.exe$/.test(a.name));
    // only installers published on this repository's release page
    if (!asset || !String(asset.browser_download_url).startsWith(`https://github.com/${REPO}/releases/download/`)) return;
    if (!md.isNewer(version, app.getVersion())) { update = null; return; }
    update = { version, notes: String(rel.body || '').slice(0, 4000), url: asset.browser_download_url, size: asset.size };
    win?.webContents.send('update:available', update);
  } catch { /* offline or GitHub unreachable: try again later */ }
}

ipcMain.handle('update:get', () => update);
ipcMain.handle('update:install', async () => {
  if (!update) throw new Error('E_NOUPDATE');
  if (updating) return;
  updating = true;
  try {
    const file = path.join(app.getPath('temp'), `GameCenter-Setup-${update.version}.exe`);
    const r = await fetch(update.url, { signal: AbortSignal.timeout(15 * 60000) });
    if (!r.ok || !r.body) throw new Error('E_DOWNLOAD');
    const total = +r.headers.get('content-length') || update.size || 0;
    const out = fs.createWriteStream(file);
    let got = 0;
    let lastSent = 0;
    for await (const chunk of r.body) {
      got += chunk.length;
      if (!out.write(chunk)) await new Promise((res) => out.once('drain', res));
      if (total && Date.now() - lastSent > 200) { lastSent = Date.now(); win?.webContents.send('update:progress', got / total); }
    }
    await new Promise((res, rej) => out.end((e) => (e ? rej(e) : res())));
    if (update.size && fs.statSync(file).size !== update.size) throw new Error('E_DOWNLOAD'); // incomplete download
    win?.webContents.send('update:progress', 1);
    // /S: silent, --updated: keep settings/shortcuts as an update, --force-run: start GameCenter again when done
    spawn(file, ['/S', '--updated', '--force-run'], { detached: true, stdio: 'ignore' }).on('error', () => {}).unref();
    setTimeout(quitApp, 500);
  } catch (e) {
    updating = false;
    throw new Error(e.message === 'E_DOWNLOAD' ? 'E_DOWNLOAD' : 'E_UPDATE');
  }
});

// ---------- IPC: library ----------
ipcMain.handle('library:scan', () => scan());
ipcMain.handle('library:get', () => (scanned.length ? scanned.map(view) : scan()));

ipcMain.handle('game:launch', (_e, key) => launchGame(key));

async function launchGame(key) {
  const g = find(key);
  const s = entry(key);
  if (running.has(key) || (launching.get(key) || 0) > Date.now()) throw new Error('E_RUNNING'); // don't open the same game twice
  // Only paths found by the scanner or picked by the user in a file dialog are opened; the UI can't send arbitrary commands.
  const target = customLaunch(s) || g.launch;
  if (g.source === 'emu' && !customLaunch(s)) {
    if (!fs.existsSync(g.launch)) throw new Error('E_EMU_MISSING');
    const emu = config.emulators.find((x) => x.id === g.emuId);
    spawn(g.launch, emus.romArgs(emu?.args, g.rom), { cwd: path.dirname(g.launch), detached: true, stdio: 'ignore' }).on('error', () => {}).unref();
    activeRom[g.emuId] = key;
  } else if (target.startsWith('shell:AppsFolder')) execFile('explorer.exe', [target]); // Xbox / Microsoft Store game
  else if (/^[a-z][\w+.-]*:\/\//i.test(target)) await shell.openExternal(target);
  else { const err = await shell.openPath(target); if (err) throw new Error(err); }
  s.lastPlayed = Date.now();
  s.playCount = (s.playCount || 0) + 1;
  launching.set(key, Date.now() + 90000);
  setTimeout(pollRunning, 3000);
  setTimeout(pollRunning, 8000);
  save();
  if (config.trayOnLaunch && win && !win.isDestroyed()) { win.hide(); hiddenFor = key; } // go to the tray when a game starts, leave the memory to the game
  updateTray();
  return view(g);
}

// Uninstall: opens the uninstall screen of the platform the game belongs to.
// The return value tells the UI what happened (to show Epic users where to uninstall).
ipcMain.handle('game:uninstall', async (_e, key) => {
  const g = find(key);
  if (g.source === 'emu') throw new Error('E_NOUNINSTALL');
  if (running.has(key)) throw new Error('E_RUNNING');
  if (g.source === 'steam' && g.steamAppId) { await shell.openExternal(`steam://uninstall/${g.steamAppId}`); return 'steam'; }
  if (g.source === 'epic') { await shell.openExternal('com.epicgames.launcher://'); return 'epic'; } // Epic has no uninstall link
  if (g.source === 'xbox') { await shell.openExternal(`ms-settings:appsfeatures-app?${g.key.slice(5)}`); return 'xbox'; }
  // EA, Ubisoft, GOG and shortcut games: the uninstall entry from Control Panel
  const hit = scanner.matchUninstall(await scanner.readUninstallEntries(), g, tracker.safeDir);
  if (hit) {
    // "start" uses Windows' own launch path: uninstallers that need admin rights get a UAC prompt
    spawn('cmd.exe', ['/d', '/s', '/c', `start "" ${hit.uninstall}`], { windowsVerbatimArguments: true, detached: true, stdio: 'ignore', windowsHide: true }).on('error', () => {}).unref();
    return 'registry';
  }
  const exe = tracker.safeDir(g.installDir) ? scanner.findUninstallerExe(g.installDir) : null;
  if (exe) { const err = await shell.openPath(exe); if (err) throw new Error(err); return 'exe'; }
  throw new Error('E_NOUNINSTALL');
});

ipcMain.handle('game:update', (_e, key, patch) => {
  const g = find(key);
  const s = entry(key);
  if ('favorite' in patch) s.favorite = !!patch.favorite;
  if ('hidden' in patch) s.hidden = !!patch.hidden;
  if ('name' in patch) {
    const n = String(patch.name || '').trim().slice(0, 120);
    if (n) s.custom.name = n; else delete s.custom.name;
  }
  if ('status' in patch) {
    if (['playing', 'completed', 'backlog', 'dropped'].includes(patch.status)) s.status = patch.status; else delete s.status;
  }
  if ('collections' in patch) {
    const cols = [...new Set([].concat(patch.collections || []).map((x) => String(x).trim().slice(0, 40)).filter(Boolean))].slice(0, 20);
    if (cols.length) s.collections = cols; else delete s.collections;
  }
  save();
  return view(g);
});

// reset=true: back to the default (the platform's own) launch path
ipcMain.handle('game:setLaunch', async (_e, key, reset) => {
  const g = find(key);
  const s = entry(key);
  if (reset) delete s.custom.launch;
  else {
    const r = await dialog.showOpenDialog(win, {
      defaultPath: g.installDir || undefined,
      properties: ['openFile'],
      filters: [{ name: 'Program', extensions: ['exe', 'lnk', 'bat', 'cmd', 'url'] }],
    });
    if (r.canceled) return view(g);
    s.custom.launch = r.filePaths[0];
  }
  save();
  return view(g);
});

const newsCache = new Map(); // appId -> { at, items } (30 min)
ipcMain.handle('steam:news', async (_e, appId) => {
  if (!config.online) return [];
  if (!/^\d{1,10}$/.test(String(appId))) return [];
  const c = newsCache.get(appId);
  if (c && Date.now() - c.at < 30 * 60000) return c.items;
  const items = await md.fetchSteamNews(appId).catch(() => []);
  newsCache.set(appId, { at: Date.now(), items });
  return items;
});

ipcMain.handle('steam:search', (_e, term) => {
  const q = String(term || '').trim().slice(0, 100);
  return q ? md.searchSteam(q) : [];
});

// Manually match the game to a Steam page (id=null: back to automatic). Info and images are downloaded again.
ipcMain.handle('game:setSteamId', async (_e, key, id) => {
  const g = find(key);
  const s = entry(key);
  if (id === null) delete s.custom.steamAppId;
  else if (/^\d{1,10}$/.test(String(id))) s.custom.steamAppId = String(id);
  else throw new Error('E_NOTFOUND');
  s.meta = undefined;
  s.images = s.images.icon ? { icon: s.images.icon } : {}; // drop the old game's Steam images; images you uploaded yourself stay
  await enrich(g, true);
  return view(g);
});

ipcMain.handle('game:refetch', async (_e, key) => {
  const g = find(key);
  const s = entry(key);
  s.meta = undefined;
  s.images = {};
  await enrich(g, true);
  return view(g);
});

ipcMain.handle('game:setImage', async (_e, key, kind, url) => {
  if (!['hero', 'cover', 'logo'].includes(kind)) throw new Error('E_IMGTYPE');
  const g = find(key);
  const s = entry(key);
  s.custom.images ||= {};
  if (url === null) {
    delete s.custom.images[kind]; // back to default
  } else {
    let src;
    if (url) {
      if (!/^https?:\/\//i.test(url)) throw new Error('E_URL');
    } else {
      const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: [{ name: 'Image', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }] });
      if (r.canceled) return view(g);
      src = r.filePaths[0];
    }
    const ext = (path.extname(src || new URL(url).pathname) || '.jpg').toLowerCase();
    const file = path.join(dirOf(key), `custom_${kind}${ext}`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (src) fs.copyFileSync(src, file);
    else if (!await md.download(url, file)) throw new Error('E_DOWNLOAD');
    s.custom.images[kind] = file;
  }
  recolor(s);
  s.rev = Date.now();
  save();
  return view(g);
});

ipcMain.handle('game:openFolder', (_e, key) => {
  const g = find(key);
  if (g.rom) return shell.showItemInFolder(g.rom);
  if (g.installDir && fs.existsSync(g.installDir)) return shell.openPath(g.installDir);
  if (g.shortcut) return shell.showItemInFolder(g.shortcut);
});

// ---------- IPC: settings ----------
ipcMain.handle('config:get', () => ({ ...config, shotRoot: shotRoot(), systems: emus.SYSTEMS, appVersion: app.getVersion() }));
ipcMain.handle('config:set', (_e, c) => {
  const SOURCES = ['steam', 'epic', 'xbox', 'ea', 'ubisoft', 'gog'];
  const next = {
    folders: (c.folders || []).map(String),
    off: (c.off || []).filter((x) => SOURCES.includes(x)),
    lang: c.lang === 'en' ? 'en' : 'tr',
    accent: /^#[0-9a-f]{6}$/i.test(c.accent) ? c.accent : DEFAULTS.accent,
    shotKey: typeof c.shotKey === 'string' && c.shotKey ? c.shotKey : DEFAULTS.shotKey,
    shotDir: config.shotDir, // only changed through the folder picker
    emulators: config.emulators, // only changed through emu:save
    closeToTray: c.closeToTray !== false,
    trayOnLaunch: c.trayOnLaunch !== false,
    autostart: !!c.autostart,
    trayHintShown: config.trayHintShown,
    online: c.online !== false,
    checkUpdates: c.checkUpdates !== false,
  };
  if (next.shotKey !== config.shotKey && !registerShotKey(next.shotKey)) {
    registerShotKey(config.shotKey);
    throw new Error('E_HOTKEY');
  }
  const rescan = JSON.stringify([next.folders, next.off]) !== JSON.stringify([config.folders, config.off]);
  const langChanged = next.lang !== config.lang;
  const autostartChanged = next.autostart !== config.autostart;
  const onlineTurnedOn = next.online && !config.online;
  config = next;
  writeJson(CFG_FILE, config);
  if (onlineTurnedOn) enrichAll(scanned.filter((g) => needsFetch(entry(g.key)))); // turned back on: fetch what was skipped
  if (autostartChanged) applyAutostart(); // the startup entry is touched only when the user changes the setting
  lastTraySig = ''; // the menu language may have changed
  updateTray();
  if (langChanged) enrichAll(scanned.filter((g) => needsFetch(entry(g.key)))); // descriptions/genres in the new language
  if (rescan) { lastSig = ''; return scan(); }
  return scanned.map(view);
});
ipcMain.handle('dialog:folder', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openDirectory'] });
  return r.canceled ? null : r.filePaths[0];
});

// ---------- IPC: screenshots ----------
ipcMain.handle('shots:list', () => listShots());
ipcMain.handle('shots:reveal', (_e, p) => {
  if (!p) { fs.mkdirSync(shotRoot(), { recursive: true }); return shell.openPath(shotRoot()); }
  if (!insideShots(p)) throw new Error('E_NOTFOUND');
  return shell.showItemInFolder(p);
});
// Deleting moves to the Recycle Bin (so a mistake can be undone)
ipcMain.handle('shots:delete', async (_e, p) => {
  if (!p || !insideShots(p) || !fs.existsSync(p)) throw new Error('E_NOTFOUND');
  await shell.trashItem(p);
  const dir = path.dirname(p);
  if (dir !== shotRoot() && !fs.readdirSync(dir).length) fs.rmdirSync(dir); // remove the game's folder if it's now empty
});
ipcMain.handle('shots:copy', (_e, p) => {
  if (!p || !insideShots(p)) throw new Error('E_NOTFOUND');
  const im = nativeImage.createFromPath(p);
  if (im.isEmpty()) throw new Error('E_NOTFOUND');
  clipboard.writeImage(im);
});
ipcMain.handle('clipboard:text', (_e, s) => clipboard.writeText(String(s).slice(0, 500)));
ipcMain.handle('shots:pickDir', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openDirectory', 'createDirectory'], defaultPath: shotRoot() });
  if (r.canceled) return config;
  config.shotDir = r.filePaths[0];
  writeJson(CFG_FILE, config);
  return { ...config, shotRoot: shotRoot(), systems: emus.SYSTEMS };
});

// ---------- IPC: platform accounts ----------
ipcMain.handle('accounts:get', () => accountView());
ipcMain.handle('accounts:connect', async (_e, id, opts = {}) => {
  if (id !== 'xbox') throw new Error('E_NOTFOUND');
  const clientId = String(opts.clientId || acc.xboxClientId || '').trim();
  acc.xbox = await accounts.xboxLogin(win, clientId);
  acc.xboxClientId = clientId;
  accounts.saveAccounts(ACC_FILE, acc);
  await syncXbox();
  return accountView();
});
ipcMain.handle('accounts:disconnect', (_e, id) => {
  if (id !== 'xbox') throw new Error('E_NOTFOUND');
  delete acc.xbox;
  for (const k of Object.keys(store.platformStats)) if (k.startsWith('xbox:')) delete store.platformStats[k];
  accounts.saveAccounts(ACC_FILE, acc);
  save();
  pushAll();
  return accountView();
});
ipcMain.handle('accounts:sync', async () => { await syncXbox(); return accountView(); });

// ---------- IPC: emulators ----------
const pickedExes = new Set(); // the UI can only save exes picked in a file dialog
ipcMain.handle('emu:pickExe', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: [{ name: 'Program', extensions: ['exe'] }] });
  if (r.canceled) return null;
  pickedExes.add(r.filePaths[0]);
  return { exe: r.filePaths[0], ...emus.presetFor(r.filePaths[0]) };
});
ipcMain.handle('emu:save', (_e, e) => {
  const old = config.emulators.find((x) => x.id === e.id);
  const exe = String(e.exe || '');
  if (!(old?.exe === exe || pickedExes.has(exe))) throw new Error('E_EMU_MISSING');
  const emu = {
    id: old?.id || `e${Date.now().toString(36)}`,
    name: String(e.name || 'Emulator').slice(0, 60),
    exe,
    args: String(e.args || '"{rom}"'),
    romDir: String(e.romDir || ''),
    exts: [].concat(e.exts || []).map((x) => String(x).trim().replace(/^\./, '').toLowerCase()).filter(Boolean),
    system: emus.SYSTEMS.includes(e.system) ? e.system : '',
  };
  config.emulators = old ? config.emulators.map((x) => (x.id === emu.id ? emu : x)) : [...config.emulators, emu];
  writeJson(CFG_FILE, config);
  lastSig = '';
  return scan();
});
ipcMain.handle('emu:remove', (_e, id) => {
  config.emulators = config.emulators.filter((x) => x.id !== id);
  writeJson(CFG_FILE, config);
  lastSig = '';
  return scan();
});
ipcMain.handle('emu:open', (_e, id) => {
  const emu = config.emulators.find((x) => x.id === id);
  if (!emu || !fs.existsSync(emu.exe)) throw new Error('E_EMU_MISSING');
  spawn(emu.exe, [], { cwd: path.dirname(emu.exe), detached: true, stdio: 'ignore' }).on('error', () => {}).unref();
});

// ---------- window and system tray ----------
let tray = null;
let quitting = false;
let lastTraySig = '';

function showWindow() {
  if (!win || win.isDestroyed()) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

function quitApp() {
  quitting = true;
  app.quit();
}

// Right-click menu: open, playing now, last 5 played games (click to launch), screenshots, quit
function updateTray() {
  if (!tray) return;
  const en = config.lang === 'en';
  const views = scanned.filter((g) => g.source !== 'emu' && !entry(g.key).hidden).map(view);
  const playing = views.filter((v) => v.running).map((v) => v.name);
  const recent = views.filter((v) => v.lastPlayed).sort((a, b) => b.lastPlayed - a.lastPlayed).slice(0, 5);
  const sig = JSON.stringify([config.lang, playing, recent.map((v) => [v.key, v.name, v.running, v.launching])]);
  if (sig === lastTraySig) return;
  lastTraySig = sig;
  tray.setToolTip(playing.length ? `GameCenter — ${playing.join(', ')}` : 'GameCenter');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: en ? 'Open GameCenter' : "GameCenter'ı aç", click: showWindow },
    ...(playing.length ? [{ type: 'separator' }, { label: `${en ? 'Playing' : 'Oynuyor'}: ${playing.join(', ')}`, enabled: false }] : []),
    ...(recent.length ? [
      { type: 'separator' },
      { label: en ? 'Recently played' : 'Son oynananlar', enabled: false },
      ...recent.map((v) => ({
        label: v.running ? `● ${v.name}` : v.name,
        enabled: !v.running && !v.launching,
        click: () => launchGame(v.key).catch((e) => console.warn('Launch failed:', v.name, e.message)),
      })),
    ] : []),
    { type: 'separator' },
    { label: en ? 'Screenshots folder' : 'Ekran görüntüleri klasörü', click: () => { fs.mkdirSync(shotRoot(), { recursive: true }); shell.openPath(shotRoot()); } },
    { label: en ? 'Quit' : 'Çıkış', click: quitApp },
  ]));
}

function createTray() {
  tray = new Tray(ICON || nativeImage.createEmpty()); // .ico path: Windows picks the right size for the display scale
  tray.on('click', showWindow);
  tray.on('double-click', showWindow);
  updateTray();
}

// Start with Windows: only in the installed build (in dev mode don't register electron.exe at startup)
function applyAutostart() {
  if (!app.isPackaged) return;
  app.setLoginItemSettings({ openAtLogin: !!config.autostart, args: ['--hidden'] });
}

if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', showWindow); // opening it again (desktop shortcut etc.) shows the existing window
app.setAppUserModelId('com.gamecenter.app'); // for Windows notifications and taskbar grouping
app.on('before-quit', () => { quitting = true; });

app.whenReady().then(async () => {
  if (!config.lang) config.lang = app.getLocale().toLowerCase().startsWith('tr') ? 'tr' : 'en'; // start in English on non-Turkish Windows
  const startHidden = process.argv.includes('--hidden'); // start in the tray at Windows startup
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1000,
    minHeight: 640,
    show: !startHidden, // at Windows startup (--hidden) start in the tray, otherwise show right away
    backgroundColor: '#0c0d12',
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#00000000', symbolColor: '#e8e8ef', height: 40 },
    icon: ICON, // build/icon.ico (or icon.png): window and taskbar icon
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true, autoplayPolicy: 'no-user-gesture-required' }, // so the shutter sound plays even when the window is in the background
  });
  win.removeMenu();
  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  // open external links in the browser, not inside the app
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/i.test(url)) shell.openExternal(url); return { action: 'deny' }; });

  // Close (X): if enabled, keep running in the tray; tell the user once the first time
  win.on('close', (e) => {
    if (quitting || !config.closeToTray) return;
    e.preventDefault();
    win.hide();
    if (!config.trayHintShown) {
      config.trayHintShown = true;
      writeJson(CFG_FILE, config);
      const en = config.lang === 'en';
      new Notification({
        title: en ? 'GameCenter is still running' : 'GameCenter arka planda çalışıyor',
        body: en ? 'Playtime tracking and the screenshot key keep working. Right-click the tray icon to quit.' : 'Süre ölçümü ve ekran görüntüsü tuşu çalışmaya devam ediyor. Kapatmak için tepsideki simgeye sağ tıkla.',
        silent: true,
      }).show();
    }
  });

  createTray();

  // If a game is installed/removed while the app is open: rescan quietly when the window gets focus and periodically
  let lastFocusScan = 0;
  win.on('focus', () => { if (Date.now() - lastFocusScan > 15000) { lastFocusScan = Date.now(); scan(); } });
  setInterval(scan, 180000); // also scanned on focus; rarely in the background
  startTracker();
  if (!registerShotKey(config.shotKey)) console.warn('Could not register screenshot key:', config.shotKey);
  steamName = scanner.steamAccount(await scanner.findSteamPath());
  syncXbox();
  setInterval(syncXbox, 15 * 60000);
  setTimeout(checkUpdate, 8000);
  setInterval(checkUpdate, 6 * 3600000);
});

app.on('will-quit', () => globalShortcut.unregisterAll());
// don't quit when the window is hidden to the tray; only quit for real
app.on('window-all-closed', () => { if (quitting || !config.closeToTray) app.quit(); });
