const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { parseVdf, scanFolder, merge, norm, fromLaunchers, steamStats, hideOff } = require('../src/scanner');

test("a disabled platform's games don't come back through shortcuts in extra folders", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gco-'));
  fs.writeFileSync(path.join(dir, 'Fortnite.url'), '[InternetShortcut]\nURL=com.epicgames.launcher://apps/fn%3Aabc%3AFortnite?action=launch&silent=true\n');
  fs.writeFileSync(path.join(dir, 'Stardew.url'), '[InternetShortcut]\nURL=steam://rungameid/413150\n');
  fs.writeFileSync(path.join(dir, 'OMORI.exe'), '');
  const items = scanFolder(dir, () => ({}));
  const platform = [
    { key: 'epic:Fortnite', name: 'Fortnite', source: 'epic', launch: 'x' },
    { key: 'steam:413150', name: 'Stardew Valley', source: 'steam', launch: 'y' },
  ];
  const keys = (off) => hideOff(merge(items, platform), off).map((g) => g.key).sort();
  assert.deepEqual(keys(['epic']), ['file:omori', 'steam:413150']);
  assert.deepEqual(keys(['steam', 'epic']), ['file:omori']);
});
const { palette } = require('../src/metadata');

test("parseVdf reads nested blocks and escapes", () => {
  const v = parseVdf('"libraryfolders"\n{\n "0"\n {\n  "path"  "C:\\\\Steam"\n  "apps" { "413150" "1" }\n }\n}');
  assert.equal(v.libraryfolders['0'].path, 'C:\\Steam');
  assert.deepEqual(v.libraryfolders['0'].apps, { 413150: '1' });
});

test("norm strips special characters", () => {
  assert.equal(norm('Battlefield™ 1'), norm('Battlefield 1'));
  assert.equal(norm('Metaphor: ReFantazio'), norm('Metaphor ReFantazio'));
});

test("shortcuts are read and merged with Steam/Epic games", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gc-'));
  fs.writeFileSync(path.join(dir, 'Stardew.url'), '[InternetShortcut]\nURL=steam://rungameid/413150\nIconFile=C:\\x.ico\n');
  fs.writeFileSync(path.join(dir, 'Fortnite.url'), '[InternetShortcut]\nURL=com.epicgames.launcher://apps/fn%3Aabc%3AFortnite?action=launch&silent=true\n');
  fs.writeFileSync(path.join(dir, 'GTA IV.lnk'), '');
  fs.writeFileSync(path.join(dir, 'Persona.lnk'), '');
  fs.writeFileSync(path.join(dir, 'desktop.ini'), '');
  const readLink = (f) => {
    if (f.includes('GTA')) return { target: 'C:\\Steam\\steamapps\\common\\Grand Theft Auto IV\\GTAIV\\PlayGTAIV.exe' };
    throw new Error('no target');
  };
  const items = scanFolder(dir, readLink);
  assert.equal(items.length, 4);

  const platform = [
    { key: 'steam:413150', name: 'Stardew Valley', source: 'steam', steamAppId: '413150', launch: 'steam://rungameid/413150', installDir: 'C:\\Steam\\steamapps\\common\\Stardew Valley' },
    { key: 'steam:12210', name: 'Grand Theft Auto IV: The Complete Edition', source: 'steam', steamAppId: '12210', launch: 'steam://rungameid/12210', installDir: 'C:\\Steam\\steamapps\\common\\Grand Theft Auto IV' },
    { key: 'epic:Fortnite', name: 'Fortnite', source: 'epic', launch: 'com.epicgames.launcher://x', installDir: 'C:\\Epic\\Fortnite' },
    { key: 'steam:999', name: 'Steam Only', source: 'steam', steamAppId: '999', launch: 'steam://rungameid/999', installDir: 'C:\\Steam\\steamapps\\common\\X' },
  ];
  const all = merge(items, platform);
  const by = Object.fromEntries(all.map((g) => [g.key, g]));
  assert.equal(all.length, 5); // 4 platform games + Persona
  assert.equal(by['steam:413150'].name, 'Stardew Valley'); // launcher data wins, no duplicate
  assert.equal(by['steam:12210'].launch, 'steam://rungameid/12210'); // matched by install folder
  assert.equal(by['epic:Fortnite'].source, 'epic');
  assert.equal(by['file:persona'].source, 'shortcut');
  // a shortcut without a target merges with the platform game of the same name (no duplicate card)
  const xbox = [{ key: 'xbox:p', name: 'Persona', source: 'xbox', launch: 'shell:AppsFolder\\p!a' }];
  assert.deepEqual(merge(items.filter((i) => i.name === 'Persona'), xbox).map((g) => g.key), ['xbox:p']);
  assert.match(by['file:persona'].launch, /Persona\.lnk$/);
});

test("Xbox / EA / Ubisoft / GOG records become games", () => {
  const has = (p) => !p.includes('missing');
  const games = fromLaunchers({
    xbox: { name: 'Persona 5 Royal', pkg: 'SEGA.P5R', family: 'SEGA.P5R_abc', appId: 'P5R', dir: 'C:\\XboxGames\\P5R', exe: 'P5R.exe' }, // a single item may not come as an array
    ea: [
      { name: 'Battlefield™ 1', dir: 'C:\\EA\\BF1\\', icon: '"C:\\EA\\BF1\\bf1.exe"' },
      { name: 'Removed', dir: 'C:\\EA\\X\\', icon: '"C:\\missing\\x.exe"' },
    ],
    ubi: [{ id: '635', dir: 'C:\\Ubisoft\\Far Cry 3\\' }],
    gog: [],
  }, has);
  const by = Object.fromEntries(games.map((g) => [g.key, g]));
  assert.equal(games.length, 3);
  assert.equal(by['xbox:SEGA.P5R_abc'].launch, 'shell:AppsFolder\\SEGA.P5R_abc!P5R');
  assert.equal(by['ea:battlefield1'].launch, 'C:\\EA\\BF1\\bf1.exe');
  assert.equal(by['ubisoft:635'].name, 'Far Cry 3');
  assert.equal(by['ubisoft:635'].launch, 'uplay://launch/635/0');
});

test("Steam playtime is read from localconfig.vdf", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gcs-'));
  fs.mkdirSync(path.join(root, 'userdata', '42', 'config'), { recursive: true });
  fs.writeFileSync(path.join(root, 'userdata', '42', 'config', 'localconfig.vdf'),
    '"UserLocalConfigStore" { "Software" { "valve" { "Steam" { "apps" { "413150" { "LastPlayed" "1700000000" "Playtime" "1302" "Playtime2wks" "850" } } } } } }');
  assert.deepEqual(steamStats(root)['413150'], { playtime: 1302, playtime2wks: 850, lastPlayed: 1700000000000 });
});

test("palette finds the dominant color", () => {
  const w = 4, h = 4, buf = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h * 4; i += 4) { buf[i] = 20; buf[i + 1] = 30; buf[i + 2] = 230; buf[i + 3] = 255; } // BGRA: red
  const p = palette(buf, w, h);
  assert.equal(p.primary, '#e61e14');
});
