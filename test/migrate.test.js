const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { copyData } = require('../src/migrate');

function setup() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ludora-migrate-'));
  const from = path.join(root, 'gamecenter');
  const to = path.join(root, 'Ludora');
  fs.mkdirSync(path.join(from, 'images', 'steam_1'), { recursive: true });
  fs.writeFileSync(path.join(from, 'images', 'steam_1', 'hero.jpg'), 'img');
  fs.writeFileSync(path.join(from, 'config.json'), '{"lang":"en"}');
  // stored with different casing, as the old app did
  const hero = path.join(from.replace('gamecenter', 'GameCenter'), 'images', 'steam_1', 'hero.jpg');
  fs.writeFileSync(path.join(from, 'library.json'), JSON.stringify({ games: { 'steam:1': { images: { hero } } } }, null, 2));
  return { root, from, to };
}

test('copies library, settings and images even if Electron already made the new folder', () => {
  const { root, from, to } = setup();
  fs.mkdirSync(to); // Electron creates userData before the app runs
  fs.writeFileSync(path.join(to, 'Local State'), '{}');
  assert.strictEqual(copyData(from, to), true);
  assert.strictEqual(fs.readFileSync(path.join(to, 'config.json'), 'utf8'), '{"lang":"en"}');
  const lib = JSON.parse(fs.readFileSync(path.join(to, 'library.json'), 'utf8'));
  assert.strictEqual(lib.games['steam:1'].images.hero, path.join(to, 'images', 'steam_1', 'hero.jpg'));
  assert.ok(fs.existsSync(lib.games['steam:1'].images.hero));
  assert.ok(fs.existsSync(path.join(from, 'library.json')), 'old folder is kept as a backup');
  fs.rmSync(root, { recursive: true, force: true });
});

test('does nothing once the new folder has a library', () => {
  const { root, from, to } = setup();
  fs.mkdirSync(to);
  fs.writeFileSync(path.join(to, 'library.json'), '{"games":{}}');
  assert.strictEqual(copyData(from, to), false);
  assert.strictEqual(fs.readFileSync(path.join(to, 'library.json'), 'utf8'), '{"games":{}}');
  fs.rmSync(root, { recursive: true, force: true });
});

test('does nothing for new users', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ludora-migrate-'));
  assert.strictEqual(copyData(path.join(root, 'gamecenter'), path.join(root, 'Ludora')), false);
  fs.rmSync(root, { recursive: true, force: true });
});
