// Ludora phone remote: the library of the PC that served this page; games start on the PC.
'use strict';

const L = {
  tr: {
    library: 'Kütüphane', emus: 'Emülatörler', shots: 'Görüntüler', stats: 'İstatistik', search: 'Oyun, tür ya da şirket ara…',
    all: 'Tümü', fav: 'Favoriler', recent: 'Son oynananlar', playing: 'Oynanıyor', hidden: 'Gizlenenler', allGenres: 'Tüm türler',
    sortName: 'A → Z', sortRecent: 'Son oynanan', sortMost: 'En çok oynanan', allStatuses: 'Tüm durumlar',
    st_playing: 'Oynuyorum', st_completed: 'Bitirdim', st_backlog: 'Sırada', st_dropped: 'Bıraktım', st_none: 'Durum yok', status: 'Durum',
    random: 'Ne oynasam?', play: "PC'de oyna", running: "PC'de açık", starting: 'Başlatılıyor…', started: "{0} PC'de başlatılıyor",
    favAdd: 'Favorilere ekle', favOn: 'Favorilerde', hide: 'Gizle', unhide: 'Gizlemeyi kaldır', news: 'Haberler ve güncellemeler',
    total: 'Toplam', last2: 'Son 2 hafta', lastPlayed: 'Son oynama', never: 'Hiç', noGames: 'Oyun bulunamadı.', noShots: "Henüz ekran görüntüsü yok. Oyun oynarken PC'de F10'a bas.",
    emuEmpty: "PC'de Ludora > Emülatörler bölümünden emülatör ekleyince oyunların burada görünür.", roms: '{0} oyun',
    totalPlay: 'Toplam oynama', last7: 'Son 7 gün', gamesCount: 'Oyun', emuGames: '+ {0} emülatör oyunu', completed: 'Bitirilen', mostPlayed: 'En çok oynananlar', byPlatform: 'Platforma göre', last14: 'Son 14 gün', noData: 'Henüz veri yok.',
    offline: "PC'ye ulaşılamıyor. Ludora açık mı, telefonun aynı Wi-Fi'de mi?", E_TOKEN: "Bu telefonun eşleşmesi geçersiz. PC'de Ludora > Ayarlar > Telefondan kontrol bölümündeki QR kodu yeniden okut.",
    pairTitle: 'Telefonu eşleştir', pairText: "PC'de Ludora'yı aç, Ayarlar > Telefondan kontrol bölümünü aç ve oradaki QR kodu telefonunun kamerasıyla okut.",
    E_RUNNING: 'Bu oyun zaten açık.', E_NOTFOUND: 'Oyun bulunamadı.', E_EMU_MISSING: 'Emülatör bulunamadı.', E_FAILED: 'İşlem yapılamadı.',
    h: '{0} sa', m: '{0} dk', now: 'şimdi', ago: '{0} önce', d: '{0} gün', hr: '{0} saat', min: '{0} dakika', open: 'Tam boyut', all2: 'Hepsi', close: 'Kapat', shortcut: 'Kısayol',
  },
  en: {
    library: 'Library', emus: 'Emulators', shots: 'Screenshots', stats: 'Stats', search: 'Search games, genres or companies…',
    all: 'All', fav: 'Favorites', recent: 'Recently played', playing: 'Playing', hidden: 'Hidden', allGenres: 'All genres',
    sortName: 'A → Z', sortRecent: 'Recently played', sortMost: 'Most played', allStatuses: 'All statuses',
    st_playing: 'Playing', st_completed: 'Completed', st_backlog: 'Backlog', st_dropped: 'Dropped', st_none: 'No status', status: 'Status',
    random: 'What should I play?', play: 'Play on PC', running: 'Running on PC', starting: 'Starting…', started: 'Starting {0} on your PC',
    favAdd: 'Add to favorites', favOn: 'In favorites', hide: 'Hide', unhide: 'Unhide', news: 'News and updates',
    total: 'Total', last2: 'Last 2 weeks', lastPlayed: 'Last played', never: 'Never', noGames: 'No games found.', noShots: 'No screenshots yet. Press F10 on your PC while playing.',
    emuEmpty: 'Add an emulator in Ludora > Emulators on your PC and its games show up here.', roms: '{0} games',
    totalPlay: 'Total playtime', last7: 'Last 7 days', gamesCount: 'Games', emuGames: '+ {0} emulator games', completed: 'Completed', mostPlayed: 'Most played', byPlatform: 'By platform', last14: 'Last 14 days', noData: 'No data yet.',
    offline: "Can't reach your PC. Is Ludora open and is your phone on the same Wi-Fi?", E_TOKEN: "This phone's pairing is no longer valid. Scan the QR code again in Ludora > Settings > Phone remote on your PC.",
    pairTitle: 'Pair your phone', pairText: 'Open Ludora on your PC, go to Settings > Phone remote, turn it on and scan the QR code with your phone camera.',
    E_RUNNING: 'This game is already running.', E_NOTFOUND: 'Game not found.', E_EMU_MISSING: 'Emulator not found.', E_FAILED: 'Something went wrong.',
    h: '{0} h', m: '{0} min', now: 'just now', ago: '{0} ago', d: '{0} days', hr: '{0} hours', min: '{0} minutes', open: 'Full size', all2: 'All', close: 'Close', shortcut: 'Shortcut',
  },
};
const SOURCE = { steam: 'Steam', epic: 'Epic Games', xbox: 'Xbox', ea: 'EA app', ubisoft: 'Ubisoft Connect', gog: 'GOG' };
const STATUSES = ['playing', 'completed', 'backlog', 'dropped'];

const S = {
  games: [], emulators: [], pc: '', lang: navigator.language.startsWith('tr') ? 'tr' : 'en', tab: 'lib',
  filter: 'all', genre: '', sort: 'name', status: '', emu: '', q: '', detail: null, news: {}, shots: null, shotFolder: '', error: null, busy: new Set(), sig: '',
};
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const t = (k, ...a) => (L[S.lang][k] ?? L.en[k] ?? k).replace(/\{(\d)\}/g, (_, i) => a[i]);
const srcName = (g) => (g.source === 'emu' ? g.emuName : g.source === 'shortcut' ? t('shortcut') : SOURCE[g.source] || g.source);

// The pairing token arrives in the QR link (#t=...), is kept on this phone and removed from the address bar.
let token = '';
try { token = localStorage.getItem('ludoraToken') || ''; } catch { /* private mode: token only lives in this tab */ }
const fromLink = new URLSearchParams(location.hash.slice(1)).get('t');
if (fromLink) {
  token = fromLink;
  try { localStorage.setItem('ludoraToken', token); } catch { /* see above */ }
  history.replaceState(null, '', location.pathname);
}
const withToken = (u) => `${u}&t=${encodeURIComponent(token)}`;

async function api(p, body) {
  const r = await fetch(p, {
    method: body ? 'POST' : 'GET',
    headers: { 'X-Ludora-Token': token, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'E_FAILED');
  return data;
}

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { el.hidden = true; }, 2600);
}

const hours = (min) => (min >= 60 ? t('h', (min / 60).toLocaleString(S.lang, { maximumFractionDigits: 1 })) : t('m', Math.round(min)));
function ago(ms) {
  if (!ms) return t('never');
  const m = (Date.now() - ms) / 60000;
  if (m < 2) return t('now');
  if (m < 60) return t('ago', t('min', Math.round(m)));
  if (m < 48 * 60) return t('ago', t('hr', Math.round(m / 60)));
  return t('ago', t('d', Math.round(m / 1440)));
}
const chip = (attr, value, label, on, count) => `<button class="chip${on ? ' on' : ''}" ${attr}="${esc(value)}">${esc(label)}${count !== undefined ? ` <small>${count}</small>` : ''}</button>`;

// ---------- lists ----------
function matches(g) {
  const q = S.q.trim().toLocaleLowerCase(S.lang);
  return !q || [g.name, g.developer, g.publisher, ...(g.genres || [])].join(' ').toLocaleLowerCase(S.lang).includes(q);
}

// Same tabs as the PC: emulator games live in their own tab, hidden games only under "Hidden"
function libGames() {
  return S.games.filter((g) => {
    if (S.filter === 'hidden') return g.hidden;
    if (g.hidden) return false;
    if (S.filter === 'fav') return g.favorite;
    if (S.filter === 'recent') return !!g.lastPlayed;
    if (S.filter === 'playing') return g.running || g.launching;
    return g.source !== 'emu';
  });
}

function sorted(list, sort) {
  const byName = (a, b) => a.name.localeCompare(b.name, S.lang);
  const fn = { name: byName, recent: (a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0) || byName(a, b), most: (a, b) => b.playtime - a.playtime || byName(a, b) }[sort];
  return list.sort(fn);
}

function cover(g) {
  const src = g.images.cover || g.images.hero;
  if (src) return `<img loading="lazy" src="${esc(withToken(src))}" alt="">`;
  // no artwork: the game's small exe icon on a panel instead of a blurry stretched icon
  return `<div class="noimg">${g.images.icon ? `<img class="ico" src="${esc(withToken(g.images.icon))}" alt="">` : ''}<span>${esc(g.name)}</span></div>`;
}
const card = (g) => `<button class="card" data-open="${esc(g.key)}">${cover(g)}${g.running ? '<span class="badge">●</span>' : g.favorite ? '<span class="badge fav">★</span>' : ''}<span class="name">${esc(g.name)}</span><small class="sub">${esc(g.playtime ? hours(g.playtime) : srcName(g))}</small></button>`;
const grid = (list) => (list.length ? `<div class="grid">${list.map(card).join('')}</div>` : `<p class="empty">${t('noGames')}</p>`);

function searchBox() {
  if (!$('#q')) $('#main').innerHTML = `<input id="q" type="search" autocomplete="off"><div id="body"></div>`;
  $('#q').placeholder = t('search');
  if ($('#q').value !== S.q) $('#q').value = S.q;
}

function renderLib() {
  searchBox();
  const base = libGames();
  const genres = new Map();
  for (const g of base) for (const x of g.genres || []) genres.set(x, (genres.get(x) || 0) + 1);
  const list = sorted(base.filter((g) => matches(g) && (!S.genre || (g.genres || []).includes(S.genre)) && (!S.status || (S.status === 'none' ? !g.status : g.status === S.status))), S.filter === 'recent' ? 'recent' : S.sort);
  const nowPlaying = S.games.filter((g) => g.running && !g.hidden);
  const opt = (v, l, cur) => `<option value="${v}"${cur === v ? ' selected' : ''}>${esc(l)}</option>`;
  $('#body').innerHTML = `
    <div class="chips">${['all', 'fav', 'recent', 'playing', 'hidden'].map((f) => chip('data-filter', f, t(f), S.filter === f)).join('')}</div>
    ${genres.size ? `<div class="chips small">${chip('data-genre', '', t('allGenres'), !S.genre)}${[...genres].sort((a, b) => b[1] - a[1]).map(([x, n]) => chip('data-genre', x, x, S.genre === x, n)).join('')}</div>` : ''}
    <div class="row">
      ${S.filter === 'recent' ? '' : `<select id="sort">${opt('name', t('sortName'), S.sort)}${opt('recent', t('sortRecent'), S.sort)}${opt('most', t('sortMost'), S.sort)}</select>`}
      <select id="status">${opt('', t('allStatuses'), S.status)}${STATUSES.map((x) => opt(x, t('st_' + x), S.status)).join('')}${opt('none', t('st_none'), S.status)}</select>
      <button class="random" data-random>🎲 ${t('random')}</button>
    </div>
    ${nowPlaying.map((g) => `<button class="now" data-open="${esc(g.key)}" style="--c:${esc(g.colors?.primary || 'var(--accent)')}">
      <span class="dot"></span><span><small>${t('running')}</small><b>${esc(g.name)}</b></span></button>`).join('')}
    ${grid(list)}`;
}

function renderEmu() {
  searchBox();
  const emuGames = S.games.filter((g) => g.source === 'emu' && !g.hidden);
  if (!S.emulators.length) { $('#body').innerHTML = `<p class="empty">${t('emuEmpty')}</p>`; return; }
  const count = (id) => emuGames.filter((g) => g.emuId === id).length;
  const list = sorted(emuGames.filter((g) => matches(g) && (!S.emu || g.emuId === S.emu)), 'name');
  $('#body').innerHTML = `
    <div class="chips">${chip('data-emu', '', t('all2'), !S.emu, emuGames.length)}${S.emulators.map((e) => chip('data-emu', e.id, e.system ? `${e.name} · ${e.system}` : e.name, S.emu === e.id, count(e.id))).join('')}</div>
    ${grid(list)}`;
}

function renderStats() {
  const games = S.games.filter((g) => !g.hidden);
  const total = games.reduce((a, g) => a + (g.playtime || 0), 0);
  const top = games.filter((g) => g.playtime > 0).sort((a, b) => b.playtime - a.playtime).slice(0, 8);
  const plat = new Map();
  for (const g of games) if (g.playtime) plat.set(srcName(g), (plat.get(srcName(g)) || 0) + g.playtime);
  const platList = [...plat].sort((a, b) => b[1] - a[1]);
  const dayKey = (ms) => new Date(ms).toLocaleDateString('sv');
  const days = Array.from({ length: 14 }, (_, i) => {
    const ms = Date.now() - (13 - i) * 864e5;
    return { ms, min: Math.round(games.reduce((a, g) => a + (g.days?.[dayKey(ms)] || 0), 0) / 60000) };
  });
  const week = days.slice(7).reduce((a, d) => a + d.min, 0);
  const maxDay = Math.max(1, ...days.map((d) => d.min));
  const dayFmt = new Intl.DateTimeFormat(S.lang, { weekday: 'narrow' });
  const bars = (rows, max) => rows.map(([label, min, key]) => `<button class="hbar"${key ? ` data-open="${esc(key)}"` : ''}><span>${esc(label)}</span><b>${esc(hours(min))}</b><i style="width:${Math.max(2, (min / max) * 100)}%"></i></button>`).join('');
  const count = (st) => games.filter((g) => g.status === st).length;
  $('#main').innerHTML = `<div class="tiles">
      <div><small>${t('totalPlay')}</small><b>${hours(total)}</b></div>
      <div><small>${t('last7')}</small><b>${hours(week)}</b></div>
      <div><small>${t('gamesCount')}</small><b>${games.filter((g) => g.source !== 'emu').length}</b><em>${t('emuGames', games.filter((g) => g.source === 'emu').length)}</em></div>
      <div><small>${t('completed')}</small><b>${count('completed')}</b><em>${t('st_playing')}: ${count('playing')} · ${t('st_backlog')}: ${count('backlog')}</em></div>
    </div>
    <section class="panel"><h3>${t('mostPlayed')}</h3>${top.length ? bars(top.map((g) => [g.name, g.playtime, g.key]), top[0].playtime) : `<p class="muted">${t('noData')}</p>`}</section>
    <section class="panel"><h3>${t('byPlatform')}</h3>${platList.length ? bars(platList, platList[0][1]) : `<p class="muted">${t('noData')}</p>`}</section>
    <section class="panel"><h3>${t('last14')}</h3><div class="cols">${days.map((d) => `<div><i style="height:${d.min ? Math.max(4, (d.min / maxDay) * 100) : 0}%"></i><small>${esc(dayFmt.format(d.ms))}</small></div>`).join('')}</div></section>`;
}

// ---------- game sheet ----------
function renderDetail() {
  const el = $('#sheet');
  const g = S.games.find((x) => x.key === S.detail);
  if (!g) { if (!el.querySelector('.viewer')) { el.hidden = true; document.body.classList.remove('locked'); } return; }
  const busy = g.running || g.launching || S.busy.has(g.key);
  const hero = g.images.hero || g.images.cover;
  const news = S.news[g.key];
  const scroll = el.scrollTop;
  el.hidden = false;
  document.body.classList.add('locked');
  el.style.setProperty('--c', g.colors?.primary || 'var(--accent)');
  el.innerHTML = `<div class="sheet-in">
    <div class="d-hero">${hero ? `<img src="${esc(withToken(hero))}" alt="">` : ''}
      <button class="x" data-close aria-label="${esc(t('close'))}">✕</button>
      ${g.images.logo ? `<img class="logo" src="${esc(withToken(g.images.logo))}" alt="${esc(g.name)}">` : `<h2>${esc(g.name)}</h2>`}
    </div>
    <div class="d-body">
      ${g.images.logo ? `<h2 class="d-name">${esc(g.name)}</h2>` : ''}
      <p class="muted">${esc([srcName(g), g.developer, g.releaseDate].filter(Boolean).join(' · '))}</p>
      <div class="tags">${[...(g.genres || []).slice(0, 4), ...(g.collections || [])].map((x) => `<span>${esc(x)}</span>`).join('')}</div>
      <button class="play" data-play="${esc(g.key)}"${busy ? ' disabled' : ''}>${g.running ? `● ${t('running')}` : g.launching || S.busy.has(g.key) ? t('starting') : `▶ ${t('play')}`}</button>
      <div class="acts">
        <button class="act${g.favorite ? ' on' : ''}" data-fav="${esc(g.key)}">★ ${t(g.favorite ? 'favOn' : 'favAdd')}</button>
        <select id="d-status" aria-label="${esc(t('status'))}"><option value="">${t('st_none')}</option>${STATUSES.map((x) => `<option value="${x}"${g.status === x ? ' selected' : ''}>${t('st_' + x)}</option>`).join('')}</select>
        <button class="act" data-hide="${esc(g.key)}">${t(g.hidden ? 'unhide' : 'hide')}</button>
      </div>
      <div class="stats">
        <div><b>${hours(g.playtime || 0)}</b><small>${t('total')}</small></div>
        <div><b>${hours(g.playtime2wks || 0)}</b><small>${t('last2')}</small></div>
        <div><b>${ago(g.lastPlayed)}</b><small>${t('lastPlayed')}</small></div>
      </div>
      ${g.description ? `<p class="desc">${esc(g.description)}</p>` : ''}
      ${news?.length ? `<h3>${t('news')}</h3>${news.map((n) => `<a class="news" href="${esc(n.url)}" target="_blank" rel="noopener"><b>${esc(n.title)}</b><small>${esc(new Date(n.date).toLocaleDateString(S.lang))}</small><p>${esc(n.text)}</p></a>`).join('')}` : ''}
    </div>
  </div>`;
  el.scrollTop = scroll;
  if (g.steamAppId && !(g.key in S.news)) {
    S.news[g.key] = null;
    api(`/api/news?key=${encodeURIComponent(g.key)}`).then((items) => { S.news[g.key] = items; if (S.detail === g.key) renderDetail(); }).catch(() => {});
  }
}

function apply(v) {
  const i = S.games.findIndex((x) => x.key === v.key);
  if (i >= 0) S.games[i] = v;
}

async function update(key, patch) {
  try { apply(await api('/api/update', { key, ...patch })); } catch (e) { toast(t(e.message in L.en ? e.message : 'E_FAILED')); }
  renderDetail();
  renderTab();
}

async function play(key) {
  const g = S.games.find((x) => x.key === key);
  S.busy.add(key);
  renderDetail();
  try {
    apply(await api('/api/launch', { key }));
    toast(t('started', g.name));
  } catch (e) {
    toast(t(e.message in L.en ? e.message : 'E_FAILED'));
  } finally {
    S.busy.delete(key);
    renderDetail();
    renderTab();
  }
}

// ---------- screenshots ----------
async function renderShots() {
  if (!S.shots) {
    $('#main').innerHTML = '<div class="spin"></div>';
    try { S.shots = await api('/api/shots'); } catch (e) { return fail(e); }
  }
  const folders = S.shots;
  const files = folders.filter((f) => !S.shotFolder || f.folder === S.shotFolder).flatMap((f) => f.files).sort((a, b) => b.t - a.t).slice(0, 120);
  $('#main').innerHTML = folders.length
    ? `<div class="chips">${chip('data-folder', '', t('all2'), !S.shotFolder)}${folders.map((f) => chip('data-folder', f.folder, f.folder, S.shotFolder === f.folder, f.files.length)).join('')}</div>
       <div class="shots">${files.map((f) => `<button data-shot="${esc(f.id)}"><img loading="lazy" src="${esc(withToken(`/api/shot?id=${encodeURIComponent(f.id)}`))}" alt=""></button>`).join('')}</div>`
    : `<p class="empty">${t('noShots')}</p>`;
}

function openShot(id) {
  const src = withToken(`/api/shot?id=${encodeURIComponent(id)}`);
  const el = $('#sheet');
  el.hidden = false;
  document.body.classList.add('locked');
  el.innerHTML = `<div class="viewer" data-close><img src="${esc(src)}" alt=""><a class="open" href="${esc(src)}" target="_blank" rel="noopener">${t('open')}</a></div>`;
}

// ---------- shell ----------
function renderTab() {
  if (S.tab === 'lib') renderLib();
  else if (S.tab === 'emu') renderEmu();
  else if (S.tab === 'stats') renderStats();
  else renderShots();
}

function render() {
  document.documentElement.lang = S.lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === S.tab));
  $('#pc').textContent = S.pc;
  const unpaired = !token || S.error === 'E_TOKEN';
  $('#tabs').hidden = unpaired;
  if (unpaired) {
    $('#main').innerHTML = `<div class="pair"><h2>${t('pairTitle')}</h2><p>${t(token ? 'E_TOKEN' : 'pairText')}</p></div>`;
    return;
  }
  renderTab();
  renderDetail();
}

function fail(e) {
  const offline = e instanceof TypeError; // fetch couldn't reach the PC
  S.error = offline ? 'offline' : e.message;
  $('#banner').hidden = !offline;
  $('#banner').textContent = t('offline');
  if (!offline) render();
}

async function load() {
  if (!token) return render();
  try {
    const d = await api('/api/library');
    $('#banner').hidden = true;
    const wasError = S.error;
    S.error = null;
    S.pc = d.pc;
    S.lang = d.lang === 'en' ? 'en' : 'tr';
    S.emulators = d.emulators || [];
    document.documentElement.style.setProperty('--accent', /^#[0-9a-f]{6}$/i.test(d.accent) ? d.accent : '#e8293b');
    // Redraw only what changed: the daily log of a running game changes every few seconds and would
    // otherwise rebuild the page under the user's finger (and close an open dropdown).
    const strip = (g) => ({ ...g, days: undefined });
    const listSig = JSON.stringify([d.games.map(S.tab === 'stats' ? (g) => g : strip), d.emulators, d.lang]);
    const detailSig = JSON.stringify(d.games.find((g) => g.key === S.detail) || null);
    S.games = d.games;
    if (document.activeElement?.tagName === 'SELECT') return; // try again on the next poll
    if (listSig !== S.sig || wasError) { S.sig = listSig; if (S.tab === 'shots') $('#pc').textContent = S.pc; else { render(); S.detailSig = detailSig; return; } }
    if (detailSig !== S.detailSig) { S.detailSig = detailSig; renderDetail(); }
  } catch (e) { fail(e); }
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-open], [data-play], [data-close], [data-filter], [data-genre], [data-emu], [data-tab], [data-random], [data-folder], [data-shot], [data-fav], [data-hide]');
  if (!el) return;
  const d = el.dataset;
  if (d.open) { S.detail = d.open; S.detailSig = JSON.stringify(S.games.find((g) => g.key === d.open) || null); $('#sheet').scrollTop = 0; renderDetail(); }
  else if (d.play) play(d.play);
  else if (d.fav) { const g = S.games.find((x) => x.key === d.fav); update(d.fav, { favorite: !g.favorite }); }
  else if (d.hide) { const g = S.games.find((x) => x.key === d.hide); update(d.hide, { hidden: !g.hidden }); }
  else if ('close' in d && !e.target.closest('a')) { S.detail = null; $('#sheet').hidden = true; $('#sheet').innerHTML = ''; document.body.classList.remove('locked'); }
  else if (d.filter) { S.filter = d.filter; renderLib(); }
  else if (d.genre !== undefined) { S.genre = d.genre; renderLib(); }
  else if (d.emu !== undefined) { S.emu = d.emu; renderEmu(); }
  else if (d.tab) { S.tab = d.tab; S.shots = null; $('#main').innerHTML = ''; window.scrollTo(0, 0); render(); }
  else if ('random' in d) {
    const pool = libGames().filter((g) => !g.running && !g.hidden);
    if (pool.length) { S.detail = pool[Math.floor(Math.random() * pool.length)].key; renderDetail(); }
  }
  else if (d.folder !== undefined) { S.shotFolder = d.folder; renderShots(); }
  else if (d.shot) openShot(d.shot);
});
document.addEventListener('input', (e) => { if (e.target.id === 'q') { S.q = e.target.value; renderTab(); } });
document.addEventListener('change', (e) => {
  if (e.target.id === 'sort') { S.sort = e.target.value; renderLib(); }
  if (e.target.id === 'status') { S.status = e.target.value; renderLib(); }
  if (e.target.id === 'd-status') update(S.detail, { status: e.target.value });
});

// Keep "Playing" up to date while the page is open
setInterval(() => { if (document.visibilityState === 'visible' && token) load(); }, 4000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') load(); });
render();
load();
