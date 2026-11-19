const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const remote = require('../src/remote');

const TOKEN = remote.newToken();
const launched = [];
const updates = [];
const api = {
  token: () => TOKEN,
  library: () => ({ pc: 'PC', games: [{ key: 'steam:1', name: 'Game' }] }),
  launch: async (key) => { if (key !== 'steam:1') throw new Error('E_NOTFOUND'); launched.push(key); return { key }; },
  imagePath: (key, kind) => (key === 'steam:1' && kind === 'cover' ? path.join(__dirname, '..', 'build', 'icon.png') : null),
  update: (key, patch) => { updates.push([key, patch]); return { key, ...patch }; },
  news: async (key) => [{ title: 'News for ' + key }],
  shots: () => [],
  shotPath: () => null,
};

async function withServer(fn) {
  const server = remote.createServer(api);
  const port = await remote.listen(server, 0, 1);
  try { await fn(`http://127.0.0.1:${port}`); } finally { server.close(); }
}

test('sameToken accepts only the exact token', () => {
  assert.ok(remote.sameToken(TOKEN, TOKEN));
  assert.ok(!remote.sameToken('', ''));
  assert.ok(!remote.sameToken(TOKEN.slice(1), TOKEN));
  assert.ok(!remote.sameToken(undefined, TOKEN));
});

test('page is public, data needs the token', () => withServer(async (base) => {
  const page = await fetch(`${base}/`);
  assert.strictEqual(page.status, 200);
  assert.match(await page.text(), /mobile\.js/);
  assert.strictEqual((await fetch(`${base}/api/library`)).status, 401);
  assert.strictEqual((await fetch(`${base}/api/library`, { headers: { 'X-Ludora-Token': 'wrong' } })).status, 401);
  const ok = await fetch(`${base}/api/library`, { headers: { 'X-Ludora-Token': TOKEN } });
  assert.strictEqual(ok.status, 200);
  assert.strictEqual((await ok.json()).games[0].name, 'Game');
}));

test('images take the token as a query parameter', () => withServer(async (base) => {
  assert.strictEqual((await fetch(`${base}/api/img?key=steam:1&kind=cover`)).status, 401);
  const img = await fetch(`${base}/api/img?key=steam:1&kind=cover&t=${TOKEN}`);
  assert.strictEqual(img.status, 200);
  assert.strictEqual(img.headers.get('content-type'), 'image/png');
  assert.strictEqual((await fetch(`${base}/api/img?key=steam:1&kind=../../x&t=${TOKEN}`)).status, 404);
}));

test('launch runs only with the token and reports errors as codes', () => withServer(async (base) => {
  const post = (body, token = TOKEN) => fetch(`${base}/api/launch`, { method: 'POST', headers: { 'X-Ludora-Token': token, 'Content-Type': 'application/json' }, body });
  assert.strictEqual((await post(JSON.stringify({ key: 'steam:1' }), 'nope')).status, 401);
  assert.deepStrictEqual(launched, []);
  assert.strictEqual((await post(JSON.stringify({ key: 'steam:1' }))).status, 200);
  assert.deepStrictEqual(launched, ['steam:1']);
  const bad = await post(JSON.stringify({ key: 'other' }));
  assert.strictEqual(bad.status, 400);
  assert.strictEqual((await bad.json()).error, 'E_NOTFOUND');
  assert.strictEqual((await post('{not json')).status, 400);
}));

test('unknown paths are not served', () => withServer(async (base) => {
  assert.strictEqual((await fetch(`${base}/../src/main.js`)).status, 404);
  assert.strictEqual((await fetch(`${base}/remote.js`)).status, 404);
}));

test('phone can change favorite/status and read news, only with the token', () => withServer(async (base) => {
  const post = (body, token = TOKEN) => fetch(`${base}/api/update`, { method: 'POST', headers: { 'X-Ludora-Token': token, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  assert.strictEqual((await post({ key: 'steam:1', favorite: true }, 'nope')).status, 401);
  assert.deepStrictEqual(updates, []);
  const r = await post({ key: 'steam:1', favorite: true, status: 'playing' });
  assert.strictEqual(r.status, 200);
  assert.deepStrictEqual(updates, [['steam:1', { favorite: true, status: 'playing' }]]);
  assert.strictEqual((await fetch(`${base}/api/news?key=steam:1`)).status, 401);
  const news = await (await fetch(`${base}/api/news?key=steam:1`, { headers: { 'X-Ludora-Token': TOKEN } })).json();
  assert.strictEqual(news[0].title, 'News for steam:1');
}));
