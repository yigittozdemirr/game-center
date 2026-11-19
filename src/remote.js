// Phone remote: a small web server on the home network. The phone opens the page from the QR code,
// browses the library and starts games on this PC. Off by default; every data request needs the pairing token.
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const PORT = 47800;
const STATIC = path.join(__dirname, '..', 'renderer', 'mobile');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.svg': 'image/svg+xml' };
const FILES = { '/': 'index.html', '/index.html': 'index.html', '/mobile.css': 'mobile.css', '/mobile.js': 'mobile.js', '/manifest.webmanifest': 'manifest.webmanifest' };

const newToken = () => crypto.randomBytes(24).toString('base64url');

function sameToken(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
}

// Home-network IPv4 addresses, real adapters first (VPN / virtual machine adapters last)
function lanAddresses() {
  const virtual = /vethernet|virtualbox|vmware|hyper-v|wsl|loopback|tailscale|zerotier|hamachi|vpn|tap/i;
  const priv = (ip) => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip);
  return Object.entries(os.networkInterfaces())
    .flatMap(([name, list]) => (list || []).filter((a) => a.family === 'IPv4' && !a.internal && priv(a.address)).map((a) => ({ name, ip: a.address })))
    .sort((a, b) => virtual.test(a.name) - virtual.test(b.name))
    .map((a) => a.ip);
}

function send(res, code, body, type = 'application/json') {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
}

function sendFile(res, file, cache) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, { error: 'E_NOTFOUND' });
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': cache || 'no-store', 'X-Content-Type-Options': 'nosniff' });
    fs.createReadStream(file).pipe(res);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let s = '';
    req.on('data', (c) => { s += c; if (s.length > 10000) { reject(new Error('E_TOOBIG')); req.destroy(); } });
    req.on('end', () => { try { resolve(s ? JSON.parse(s) : {}); } catch { reject(new Error('E_BADJSON')); } });
  });
}

// api: { token(), library(), launch(key), update(key, patch), news(key), imagePath(key, kind), shots(), shotPath(id) }
function createServer(api) {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x');
      const p = url.pathname;
      if (req.method === 'GET' && FILES[p]) return sendFile(res, path.join(STATIC, FILES[p]));
      if (req.method === 'GET' && p === '/icon.png') return sendFile(res, path.join(__dirname, '..', 'build', 'icon.png'), 'max-age=86400');
      if (!p.startsWith('/api/')) return send(res, 404, { error: 'E_NOTFOUND' });
      // the token comes in a header; images use ?t= because <img> can't send headers
      if (!sameToken(req.headers['x-ludora-token'] || url.searchParams.get('t'), api.token())) return send(res, 401, { error: 'E_TOKEN' });
      if (req.method === 'GET' && p === '/api/library') return send(res, 200, api.library());
      if (req.method === 'GET' && p === '/api/img') {
        const file = api.imagePath(url.searchParams.get('key'), url.searchParams.get('kind'));
        return file ? sendFile(res, file, 'private, max-age=604800') : send(res, 404, { error: 'E_NOTFOUND' });
      }
      if (req.method === 'GET' && p === '/api/shots') return send(res, 200, api.shots());
      if (req.method === 'GET' && p === '/api/shot') {
        const file = api.shotPath(url.searchParams.get('id'));
        return file ? sendFile(res, file, 'private, max-age=604800') : send(res, 404, { error: 'E_NOTFOUND' });
      }
      if (req.method === 'POST' && p === '/api/launch') {
        const { key } = await readBody(req);
        return send(res, 200, await api.launch(String(key || '')));
      }
      if (req.method === 'POST' && p === '/api/update') {
        const { key, ...patch } = await readBody(req);
        return send(res, 200, await api.update(String(key || ''), patch));
      }
      if (req.method === 'GET' && p === '/api/news') return send(res, 200, await api.news(String(url.searchParams.get('key') || '')));
      return send(res, 404, { error: 'E_NOTFOUND' });
    } catch (e) {
      send(res, 400, { error: /^E_[A-Z_]+$/.test(e.message) ? e.message : 'E_FAILED' });
    }
  });
}

// Listens on PORT, or the next free port if something else uses it
function listen(server, port = PORT, tries = 10) {
  return new Promise((resolve, reject) => {
    const attempt = (p, left) => {
      const onError = (e) => {
        server.off('listening', onListening);
        if (e.code === 'EADDRINUSE' && left > 1) attempt(p + 1, left - 1);
        else reject(e);
      };
      const onListening = () => { server.off('error', onError); resolve(server.address().port); };
      server.once('error', onError);
      server.once('listening', onListening);
      server.listen(p, '0.0.0.0');
    };
    attempt(port, tries);
  });
}

module.exports = { PORT, newToken, sameToken, lanAddresses, createServer, listen };
