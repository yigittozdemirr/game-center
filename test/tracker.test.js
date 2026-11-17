const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { matchRunning, safeDir, minutesSince, dayOf, parseTasklist, listExes } = require('../src/tracker');

test("exe names are read from tasklist output", () => {
  const out = '"System Idle Process","0","Services","0","8 K"\r\n"FortniteClient-Win64-Shipping.exe","4120","Console","1","2.100.000 K"\r\n';
  assert.deepEqual([...parseTasklist(out)], ['system idle process', 'fortniteclient-win64-shipping.exe']);
});

test("a game counts as running if a running exe is in the game's exe list", () => {
  const names = new Set(['fortniteclient-win64-shipping.exe', 'explorer.exe']);
  const games = [
    { key: 'epic:Fortnite', exes: new Set(['fortniteclient-win64-shipping.exe', 'fortnitelauncher.exe']) },
    { key: 'ea:bf1', exes: new Set(['bf1.exe']) },
  ];
  assert.deepEqual(matchRunning(names, games), ['epic:Fortnite']);
});

test("if two games share an exe name, the most recently launched one wins", () => {
  const names = new Set(['game.exe']);
  const games = [{ key: 'eski', exes: new Set(['game.exe']) }, { key: 'yeni', exes: new Set(['game.exe']) }];
  const rank = (k) => ({ eski: 100, yeni: 200 })[k];
  assert.deepEqual(matchRunning(names, games, rank), ['yeni']);
});

test("exe names in the game folder are listed, common helpers excluded", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gce-'));
  fs.mkdirSync(path.join(dir, 'Binaries', 'Win64'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'Binaries', 'Win64', 'MyGame-Win64-Shipping.exe'), '');
  fs.writeFileSync(path.join(dir, 'UnityCrashHandler64.exe'), '');
  fs.writeFileSync(path.join(dir, 'readme.txt'), '');
  assert.deepEqual([...await listExes(dir)], ['mygame-win64-shipping.exe']);
  assert.equal((await listExes('C:\\Windows')).size, 0); // broad folders are not scanned
});

test("drive roots and system folders are not scanned", () => {
  assert.equal(safeDir('C:\\'), null);
  assert.equal(safeDir('C:\\Program Files'), null);
  assert.equal(safeDir('C:\\Users\\Someone'), null);
  assert.equal(safeDir('C:\\Windows\\System32'), null);
  assert.equal(safeDir('C:\\Games\\Metaphor'), 'c:\\games\\metaphor\\');
});

test("last 2 weeks of playtime are summed from the daily log", () => {
  const now = Date.now();
  const days = { [dayOf(now)]: 30 * 60000, [dayOf(now - 3 * 864e5)]: 90 * 60000, '2000-01-01': 999 * 60000 };
  assert.equal(minutesSince(days, now - 13 * 864e5), 120);
});
