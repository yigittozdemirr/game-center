const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { romArgs, cleanName, scanRoms, libretroUrls, presetFor } = require('../src/emulators');

test("a ROM path with spaces and quotes stays a single argument", () => {
  assert.deepEqual(romArgs('-b -e "{rom}"', 'C:\\ROMs\\Zelda "TP" (USA).iso'), ['-b', '-e', 'C:\\ROMs\\Zelda "TP" (USA).iso']);
  assert.deepEqual(romArgs('', 'C:\\a b.iso'), ['C:\\a b.iso']);
  assert.deepEqual(romArgs('-L "cores\\snes9x_libretro.dll" "{rom}"', 'x.sfc'), ['-L', 'cores\\snes9x_libretro.dll', 'x.sfc']);
});

test("region/version tags are stripped from the file name", () => {
  assert.equal(cleanName('Pokemon - Emerald Version (USA, Europe)'), 'Pokemon - Emerald Version');
  assert.equal(cleanName('God of War (USA) [v1.01]'), 'God of War');
  assert.equal(cleanName('(Beta)'), '(Beta)');
});

test("the ROM folder is scanned by extension", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'roms-'));
  fs.mkdirSync(path.join(dir, 'Disc Game (USA)'));
  fs.writeFileSync(path.join(dir, 'Disc Game (USA)', 'Disc Game (USA).cue'), '');
  fs.writeFileSync(path.join(dir, 'Disc Game (USA)', 'Disc Game (USA).bin'), '');
  fs.writeFileSync(path.join(dir, 'Other (Europe).CHD'), '');
  fs.writeFileSync(path.join(dir, 'readme.txt'), '');
  const games = scanRoms({ id: 'e1', name: 'DuckStation', exe: 'C:\\Emu\\duck.exe', romDir: dir, exts: ['cue', 'chd'], system: 'Sony - PlayStation' });
  assert.deepEqual(games.map((g) => g.name).sort(), ['Disc Game', 'Other']);
  assert.equal(games[0].source, 'emu');
  assert.ok(games.every((g) => g.key.startsWith('emu:e1:')));
});

test("the libretro cover URL follows the archive's file naming rule", () => {
  const u = libretroUrls('Sony - PlayStation 2', 'Ratchet & Clank (USA)');
  assert.equal(u.cover, 'https://thumbnails.libretro.com/Sony%20-%20PlayStation%202/Named_Boxarts/Ratchet%20_%20Clank%20(USA).png');
  assert.deepEqual(libretroUrls('', 'x'), {});
});

test("a preset is picked from the exe name", () => {
  assert.equal(presetFor('D:\\Emu\\pcsx2-qt.exe').system, 'Sony - PlayStation 2');
  assert.equal(presetFor('D:\\Emu\\Dolphin.exe').args, '-b -e "{rom}"');
  assert.equal(presetFor('D:\\Emu\\unknown.exe').name, 'unknown');
});
