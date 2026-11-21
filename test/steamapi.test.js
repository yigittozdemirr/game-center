const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { fetchSteamPlaytimes } = require('../src/metadata');
const { steamAccount } = require('../src/scanner');

const KEY = '0123456789ABCDEF0123456789ABCDEF';
const reply = (status, body) => async () => ({ status, ok: status < 400, json: async () => body });

test('Steam Web API: playtimes, bad key, private profile', async (t) => {
  const real = global.fetch;
  t.after(() => { global.fetch = real; });

  global.fetch = reply(200, { response: { game_count: 1, games: [{ appid: 12210, playtime_forever: 600, playtime_2weeks: 30, rtime_last_played: 1700000000 }] } });
  assert.deepStrictEqual(await fetchSteamPlaytimes(KEY, '76561197960265728'), [{ appId: '12210', playtime: 600, playtime2wks: 30, lastPlayed: 1700000000000 }]);

  global.fetch = reply(403, {});
  await assert.rejects(fetchSteamPlaytimes(KEY, '1'), (e) => e.message === 'E_STEAM_KEY' && !e.message.includes(KEY));

  global.fetch = reply(200, { response: {} }); // what Steam sends when "Game details" is private
  await assert.rejects(fetchSteamPlaytimes(KEY, '1'), { message: 'E_STEAM_PRIVATE' });

  global.fetch = async () => { throw new Error(`fetch failed https://api.steampowered.com/?key=${KEY}`); };
  await assert.rejects(fetchSteamPlaytimes(KEY, '1'), (e) => e.message === 'E_STEAM_API'); // the URL (and key) is never in the error
});

test('steamAccount returns the most recent user and its SteamID64', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ludora-steam-'));
  fs.mkdirSync(path.join(dir, 'config'));
  fs.writeFileSync(path.join(dir, 'config', 'loginusers.vdf'), `"users"
{
  "76561197960265729" { "AccountName" "a" "PersonaName" "Old" "MostRecent" "0" }
  "76561197960265730" { "AccountName" "b" "PersonaName" "Player" "MostRecent" "1" }
}`);
  assert.deepStrictEqual(steamAccount(dir), { name: 'Player', id: '76561197960265730' });
  fs.rmSync(dir, { recursive: true, force: true });
});
