// Xbox account: official Microsoft sign-in with the user's own Azure app ID (Client ID)
// -> Xbox Live token -> play history (titlehub) and minutes played (userstats).
// No other company's app ID or secret is used.
const { BrowserWindow, safeStorage } = require('electron');
const crypto = require('crypto');
const fs = require('fs');

const AUTH = 'https://login.microsoftonline.com/consumers/oauth2/v2.0';
const REDIRECT = 'https://login.microsoftonline.com/common/oauth2/nativeclient';
const SCOPE = 'XboxLive.signin offline_access';

const b64url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function post(url, body, headers = {}) {
  const isJson = typeof body !== 'string'; // string = form body (OAuth), object = JSON (Xbox)
  const r = await fetch(url, {
    method: 'POST',
    signal: AbortSignal.timeout(20000),
    headers: { 'Content-Type': isJson ? 'application/json' : 'application/x-www-form-urlencoded', Accept: 'application/json', ...headers },
    body: isJson ? JSON.stringify(body) : body,
  });
  const text = await r.text();
  const data = text ? JSON.parse(text) : {};
  if (!r.ok) {
    // XSTS: 2148916233 = this Microsoft account has no Xbox profile; 2148916238 = child account (needs family permission)
    const code = { 2148916233: 'E_XBOX_NOPROFILE', 2148916238: 'E_XBOX_CHILD' }[data.XErr] || 'E_XBOX_AUTH';
    const err = new Error(code);
    err.detail = data.error_description || data.error || r.status;
    throw err;
  }
  return data;
}

// Sign-in window: the user types their password into Microsoft's own page; we only read the code from the redirect URL.
function loginWindow(parent, url) {
  return new Promise((resolve, reject) => {
    const w = new BrowserWindow({
      parent, modal: true, width: 520, height: 720, autoHideMenuBar: true, backgroundColor: '#ffffff',
      webPreferences: { partition: 'xbox-login', contextIsolation: true, sandbox: true },
    });
    let done = false;
    const check = (e, u) => {
      if (!u.startsWith(REDIRECT)) return;
      e.preventDefault();
      done = true;
      resolve(u);
      w.destroy();
    };
    w.webContents.on('will-redirect', check);
    w.webContents.on('will-navigate', check);
    w.on('closed', () => { if (!done) reject(new Error('E_LOGIN_CANCEL')); });
    w.loadURL(url);
  });
}

async function xblTokens(msToken) {
  const user = await post('https://user.auth.xboxlive.com/user/authenticate', {
    Properties: { AuthMethod: 'RPS', SiteName: 'user.auth.xboxlive.com', RpsTicket: `d=${msToken}` },
    RelyingParty: 'http://auth.xboxlive.com', TokenType: 'JWT',
  }, { 'x-xbl-contract-version': '1' });
  const xsts = await post('https://xsts.auth.xboxlive.com/xsts/authorize', {
    Properties: { SandboxId: 'RETAIL', UserTokens: [user.Token] },
    RelyingParty: 'http://xboxlive.com', TokenType: 'JWT',
  }, { 'x-xbl-contract-version': '1' });
  const c = xsts.DisplayClaims.xui[0];
  return { auth: `XBL3.0 x=${c.uhs};${xsts.Token}`, xid: c.xid, gamertag: c.gtg };
}

async function xboxLogin(parent, clientId) {
  if (!/^[0-9a-f-]{36}$/i.test(clientId || '')) throw new Error('E_CLIENTID');
  const verifier = b64url(crypto.randomBytes(32));
  const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
  const url = `${AUTH}/authorize?${new URLSearchParams({
    client_id: clientId, response_type: 'code', redirect_uri: REDIRECT, scope: SCOPE,
    code_challenge: challenge, code_challenge_method: 'S256', prompt: 'select_account',
  })}`;
  const back = new URL(await loginWindow(parent, url));
  const code = back.searchParams.get('code');
  if (!code) throw new Error('E_LOGIN_CANCEL');
  const tok = await post(`${AUTH}/token`, new URLSearchParams({
    client_id: clientId, grant_type: 'authorization_code', code, redirect_uri: REDIRECT, code_verifier: verifier, scope: SCOPE,
  }).toString());
  const xbl = await xblTokens(tok.access_token);
  return { clientId, refresh: tok.refresh_token, gamertag: xbl.gamertag, xid: xbl.xid };
}

// Get a fresh Xbox token with the saved refresh token (Microsoft may also rotate the refresh token)
async function xboxRefresh(acc) {
  const tok = await post(`${AUTH}/token`, new URLSearchParams({
    client_id: acc.clientId, grant_type: 'refresh_token', refresh_token: acc.refresh, scope: SCOPE,
  }).toString());
  if (tok.refresh_token) acc.refresh = tok.refresh_token;
  return xblTokens(tok.access_token);
}

// -> [{ pfn, name, lastPlayed(ms), minutes }]
async function xboxStats(t) {
  const headers = { Authorization: t.auth, 'x-xbl-contract-version': '2', 'Accept-Language': 'en-US', Accept: 'application/json' };
  const r = await fetch(`https://titlehub.xboxlive.com/users/xuid(${t.xid})/titles/titlehistory/decoration/detail`, { headers, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error('E_XBOX_AUTH');
  const titles = ((await r.json()).titles || []).filter((x) => x.pfn);
  const minutes = {};
  for (let i = 0; i < titles.length; i += 50) { // limited number of titles per request
    const part = titles.slice(i, i + 50);
    const s = await post('https://userstats.xboxlive.com/batch', {
      arrangebyfield: 'xuid', xuids: [t.xid], stats: part.map((x) => ({ name: 'MinutesPlayed', titleid: x.titleId })),
    }, headers);
    for (const st of s.statlistscollection?.[0]?.stats || []) minutes[st.titleid] = +st.value || 0;
  }
  return titles.map((x) => ({
    pfn: x.pfn, name: x.name, lastPlayed: Date.parse(x.titleHistory?.lastTimePlayed) || 0, minutes: minutes[x.titleId] || 0,
  }));
}

// The refresh token is written to disk with Windows user encryption (DPAPI)
function loadAccounts(file) {
  try {
    const raw = fs.readFileSync(file);
    return JSON.parse(safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(raw) : raw.toString());
  } catch { return {}; }
}
function saveAccounts(file, data) {
  const text = JSON.stringify(data);
  fs.writeFileSync(file, safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(text) : text);
}

module.exports = { xboxLogin, xboxRefresh, xboxStats, loadAccounts, saveAccounts };
