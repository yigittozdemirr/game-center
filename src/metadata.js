// Info + images from the Steam store API, color palette from images.
const fs = require('fs');
const path = require('path');
const { norm } = require('./scanner');

const STORE = 'https://store.steampowered.com';
const CDN = 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps';

// Wikimedia asks clients to identify themselves (no personal data)
const WIKI_HEADERS = { 'User-Agent': 'GameCenter/1.0 (Windows desktop game launcher)', 'Api-User-Agent': 'GameCenter/1.0 (Windows desktop game launcher)' };

async function getJson(url, headers) {
  const r = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

// ---------- Wikipedia / Wikidata: fallback for games not on Steam (no key needed) ----------
const WD = 'https://www.wikidata.org/w/api.php';
const VIDEO_GAME = 'Q7889';
const claimValues = (e, p) => (e.claims?.[p] || []).map((c) => c.mainsnak?.datavalue?.value).filter(Boolean);

// Wikimedia temporarily blocks rapid bursts: requests go one by one with a short gap
let wikiGate = Promise.resolve();
function wikiGet(url) {
  const p = wikiGate.then(() => new Promise((r) => setTimeout(r, 350))).then(() => getJson(url, WIKI_HEADERS));
  wikiGate = p.catch(() => {});
  return p;
}

// Release date: "preferred" claim > earliest with day precision > earliest
function releaseClaim(e) {
  const cs = (e.claims?.P577 || []).filter((c) => c.mainsnak?.datavalue?.value?.time);
  const v = (c) => c.mainsnak.datavalue.value;
  const byTime = (a, b) => String(v(a).time).localeCompare(String(v(b).time));
  const pick = cs.find((c) => c.rank === 'preferred') || cs.filter((c) => v(c).precision >= 11).sort(byTime)[0] || cs.sort(byTime)[0];
  return pick && v(pick);
}

function wikiDate(v, lang) {
  if (!v?.time) return '';
  const [, y, m, d] = v.time.match(/^\+?(\d{4})-(\d{2})-(\d{2})/) || [];
  if (!y) return '';
  if (v.precision < 11 || m === '00' || d === '00') return y; // only the year is known
  return new Date(Date.UTC(+y, +m - 1, +d)).toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

async function wikiSummary(site, title) {
  try {
    return await wikiGet(`https://${site}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`);
  } catch { return null; }
}

// Finds the game on Wikidata as a "video game"; returns description (Turkish if available), genres, developer, publisher, release date and cover.
async function fetchWikiDetails(name, lang = 'tr') {
  const terms = [...new Set([name.replace(/ - /g, ': '), name])]; // ROM names use " - " where the title has ":"
  let hit = null;
  for (const term of terms) {
    const s = await wikiGet(`${WD}?action=wbsearchentities&search=${encodeURIComponent(term)}&language=en&uselang=en&type=item&limit=7&format=json`);
    const ids = (s.search || []).map((x) => x.id);
    if (!ids.length) continue;
    const ents = (await wikiGet(`${WD}?action=wbgetentities&ids=${ids.join('|')}&props=claims|sitelinks|labels&languages=en|tr&format=json`)).entities || {};
    const n = norm(term);
    const games = ids.map((id) => ents[id]).filter((e) => e?.sitelinks?.enwiki && claimValues(e, 'P31').some((v) => v.id === VIDEO_GAME));
    const lab = (e) => norm(e.labels?.en?.value || '');
    // exact name first; otherwise a prefix match of similar length ("Fortnite" ≠ "Fortnite: Save the World")
    hit = games.find((e) => lab(e) === n)
      || games.find((e) => {
        const l = lab(e);
        return l && (l.startsWith(n) || n.startsWith(l)) && Math.min(l.length, n.length) / Math.max(l.length, n.length) >= 0.7;
      });
    if (hit) break;
  }
  if (!hit) return null;

  const ref = (p, max) => claimValues(hit, p).map((v) => v.id).filter(Boolean).slice(0, max);
  const genreIds = ref('P136', 4); const devIds = ref('P178', 2); const pubIds = ref('P123', 2);
  const all = [...genreIds, ...devIds, ...pubIds];
  const labels = all.length ? (await wikiGet(`${WD}?action=wbgetentities&ids=${all.join('|')}&props=labels&languages=tr|en&format=json`)).entities || {} : {};
  const label = (id) => labels[id]?.labels?.[lang === 'en' ? 'en' : 'tr']?.value || labels[id]?.labels?.en?.value;
  const cap = (s) => (s ? s.charAt(0).toLocaleUpperCase(lang === 'en' ? 'en' : 'tr') + s.slice(1) : s);

  const en = await wikiSummary('en', hit.sitelinks.enwiki.title);
  const tr = lang !== 'en' && hit.sitelinks.trwiki ? await wikiSummary('tr', hit.sitelinks.trwiki.title) : null;
  const release = releaseClaim(hit);
  return {
    source: 'wikipedia',
    lang,
    wikiTried: true,
    title: hit.labels?.en?.value || name,
    description: (tr?.extract || en?.extract || '').trim(),
    genres: genreIds.map(label).filter(Boolean).map(cap),
    developers: devIds.map(label).filter(Boolean),
    publishers: pubIds.map(label).filter(Boolean),
    releaseDate: wikiDate(release, lang),
    coverUrl: en?.originalimage?.source || en?.thumbnail?.source || '',
    wikiUrl: (tr || en)?.content_urls?.desktop?.page || '',
  };
}

// Names not on Steam (e.g. "ASBR") won't match; the user can pick the right page with "Search Steam".
async function findSteamId(name) {
  const r = await getJson(`${STORE}/api/storesearch/?term=${encodeURIComponent(name)}&l=turkish&cc=TR`);
  const items = r.items || [];
  const n = norm(name);
  const hit = items.find((i) => norm(i.name) === n)
    || items.find((i) => { const m = norm(i.name); return m.length > 2 && (m.startsWith(n) || n.startsWith(m)); });
  return hit ? String(hit.id) : null;
}

// For manual matching by the user: raw Steam store search results
async function searchSteam(term) {
  const r = await getJson(`${STORE}/api/storesearch/?term=${encodeURIComponent(term)}&l=turkish&cc=TR`);
  return (r.items || []).filter((i) => i.type === 'app').slice(0, 10).map((i) => ({ id: String(i.id), name: i.name, image: i.tiny_image || '' }));
}

async function fetchSteamDetails(appId, lang = 'tr') {
  const r = await getJson(`${STORE}/api/appdetails?appids=${appId}&l=${lang === 'en' ? 'english' : 'turkish'}`);
  const d = r[appId]?.success ? r[appId].data : null;
  if (!d) return null;
  return {
    steamAppId: String(appId),
    lang,
    title: d.name,
    type: d.type,
    isSoftware: d.type !== 'game' || (d.genres || []).some((g) => +g.id >= 51 && +g.id <= 60), // 51-60: Steam's software genres
    description: d.short_description || '',
    genres: (d.genres || []).map((g) => g.description),
    developers: d.developers || [],
    publishers: d.publishers || [],
    releaseDate: d.release_date?.date || '',
    website: d.website || '',
    headerImage: d.header_image,
    background: d.background_raw,
  };
}

// The developer's official Steam announcements (patch notes etc.); no key needed
async function fetchSteamNews(appId) {
  const r = await getJson(`https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${appId}&count=5&maxlength=260&feeds=steam_community_announcements&format=json`);
  const clean = (s) => String(s || '')
    .replace(/\{STEAM_CLAN_IMAGE\}\S*/g, '')
    .replace(/\[\/?[^\]]{1,40}\]/g, ' ') // BBCode tags
    .replace(/<[^>]*>/g, ' ')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return (r.appnews?.newsitems || []).map((n) => ({
    title: clean(n.title), text: clean(n.contents), date: (n.date || 0) * 1000,
    url: `https://store.steampowered.com/news/app/${appId}/view/${n.gid}`,
  }));
}

async function download(url, file, headers) {
  const r = await fetch(url, { headers, signal: AbortSignal.timeout(30000) });
  if (!r.ok) return false;
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 1000) return false; // Steam sometimes returns an empty/placeholder image
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
  return true;
}

// Downloads a game's banner/cover/logo into the cache. Returns { hero, cover, logo } file paths
// have: images already downloaded (not re-downloaded when the language changes)
async function fetchSteamImages(appId, dir, meta, have = {}) {
  const out = {};
  const tryAll = async (kind, file, urls) => {
    if (have[kind]) return;
    for (const u of urls.filter(Boolean)) {
      try { if (await download(u, path.join(dir, file))) { out[kind] = path.join(dir, file); return; } } catch { /* try the next one */ }
    }
  };
  await Promise.all([
    tryAll('hero', 'hero.jpg', [`${CDN}/${appId}/library_hero.jpg`, meta?.background, meta?.headerImage]),
    tryAll('cover', 'cover.jpg', [`${CDN}/${appId}/library_600x900_2x.jpg`, `${CDN}/${appId}/library_600x900.jpg`]),
    tryAll('logo', 'logo.png', [`${CDN}/${appId}/logo.png`]),
  ]);
  return out;
}

// BGRA bitmap -> two most dominant vivid colors + average. Used for the background glow.
function palette(buf, width, height) {
  const bins = Array.from({ length: 12 }, () => ({ w: 0, r: 0, g: 0, b: 0 }));
  let ar = 0, ag = 0, ab = 0, n = 0;
  for (let i = 0; i < width * height * 4; i += 4) {
    const b = buf[i], g = buf[i + 1], r = buf[i + 2];
    ar += r; ag += g; ab += b; n++;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const v = max / 255, s = max ? (max - min) / max : 0;
    if (v < 0.2 || s < 0.25) continue;
    let h = 0;
    if (max === r) h = ((g - b) / (max - min)) % 6;
    else if (max === g) h = (b - r) / (max - min) + 2;
    else h = (r - g) / (max - min) + 4;
    const bin = bins[Math.floor(((h * 60 + 360) % 360) / 30)];
    const w = s * v;
    bin.w += w; bin.r += r * w; bin.g += g * w; bin.b += b * w;
  }
  const hex = (r, g, b) => '#' + [r, g, b].map((x) => Math.round(Math.min(255, x)).toString(16).padStart(2, '0')).join('');
  const avg = n ? hex(ar / n, ag / n, ab / n) : '#333344';
  const ranked = bins.map((b, i) => ({ ...b, i })).filter((b) => b.w > 0).sort((a, b) => b.w - a.w);
  const color = (b) => hex(b.r / b.w, b.g / b.w, b.b / b.w);
  const primary = ranked[0] ? color(ranked[0]) : avg;
  // keep the second color a bit apart in hue so the gradient is visible
  const far = ranked.find((b) => Math.min(Math.abs(b.i - ranked[0].i), 12 - Math.abs(b.i - ranked[0].i)) >= 2);
  const secondary = far ? color(far) : ranked[1] ? color(ranked[1]) : avg;
  return { primary, secondary, average: avg };
}

// "1.10.0" > "1.9.2"
function isNewer(a, b) {
  const pa = String(a).split('.').map((x) => parseInt(x, 10) || 0);
  const pb = String(b).split('.').map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0);
  return false;
}

module.exports = { isNewer, WIKI_HEADERS, fetchSteamNews, findSteamId, searchSteam, fetchWikiDetails, fetchSteamDetails, fetchSteamImages, download, palette };
