// Emulators: the user picks the emulator's exe and a ROM folder; ROMs are listed as games.
// Covers come from libretro's open thumbnail archive (thumbnails.libretro.com), matched by file name.
const fs = require('fs');
const path = require('path');
const { norm } = require('./scanner');

// preset by exe name; everything can be changed in the form
const PRESETS = [
  { match: /^retroarch/, name: 'RetroArch', args: '-L "cores\\CORE_libretro.dll" "{rom}"', exts: ['zip', '7z', 'nes', 'sfc', 'smc', 'gb', 'gbc', 'gba', 'n64', 'z64', 'md', 'cue', 'chd'], system: '' },
  { match: /^pcsx2/, name: 'PCSX2', args: '"{rom}"', exts: ['iso', 'chd', 'cso', 'gz'], system: 'Sony - PlayStation 2' },
  { match: /^duckstation/, name: 'DuckStation', args: '"{rom}"', exts: ['cue', 'chd', 'pbp', 'm3u', 'iso'], system: 'Sony - PlayStation' },
  { match: /^ppsspp/, name: 'PPSSPP', args: '"{rom}"', exts: ['iso', 'cso', 'pbp', 'chd'], system: 'Sony - PlayStation Portable' },
  { match: /^rpcs3/, name: 'RPCS3', args: '"{rom}"', exts: ['iso', 'pkg'], system: 'Sony - PlayStation 3' },
  { match: /^dolphin/, name: 'Dolphin', args: '-b -e "{rom}"', exts: ['iso', 'gcm', 'gcz', 'rvz', 'wbfs', 'ciso', 'wad'], system: 'Nintendo - GameCube' },
  { match: /^cemu/, name: 'Cemu', args: '-g "{rom}"', exts: ['wud', 'wux', 'wua', 'rpx'], system: 'Nintendo - Wii U' },
  { match: /^(citra|lime3ds|azahar)/, name: '3DS', args: '"{rom}"', exts: ['3ds', 'cia', 'cci', 'cxi'], system: 'Nintendo - Nintendo 3DS' },
  { match: /^ryujinx/, name: 'Ryujinx', args: '"{rom}"', exts: ['nsp', 'xci'], system: '' },
  { match: /^melonds/, name: 'melonDS', args: '"{rom}"', exts: ['nds'], system: 'Nintendo - Nintendo DS' },
  { match: /^mgba/, name: 'mGBA', args: '"{rom}"', exts: ['gba', 'gb', 'gbc'], system: 'Nintendo - Game Boy Advance' },
  { match: /^(project64|simple64)/, name: 'N64', args: '"{rom}"', exts: ['n64', 'z64', 'v64'], system: 'Nintendo - Nintendo 64' },
  { match: /^xenia/, name: 'Xenia', args: '"{rom}"', exts: ['iso', 'xex', 'zar'], system: 'Microsoft - Xbox 360' },
  { match: /^xemu/, name: 'xemu', args: '-dvd_path "{rom}"', exts: ['iso', 'xiso'], system: 'Microsoft - Xbox' },
  { match: /^(flycast|redream)/, name: 'Dreamcast', args: '"{rom}"', exts: ['gdi', 'cdi', 'chd'], system: 'Sega - Dreamcast' },
];

// system folder names in the libretro archive (for covers)
const SYSTEMS = [
  'Nintendo - Nintendo Entertainment System', 'Nintendo - Super Nintendo Entertainment System', 'Nintendo - Nintendo 64',
  'Nintendo - GameCube', 'Nintendo - Wii', 'Nintendo - Wii U', 'Nintendo - Game Boy', 'Nintendo - Game Boy Color',
  'Nintendo - Game Boy Advance', 'Nintendo - Nintendo DS', 'Nintendo - Nintendo 3DS',
  'Sony - PlayStation', 'Sony - PlayStation 2', 'Sony - PlayStation 3', 'Sony - PlayStation Portable',
  'Sega - Master System - Mark III', 'Sega - Mega Drive - Genesis', 'Sega - Saturn', 'Sega - Dreamcast',
  'Microsoft - Xbox', 'Microsoft - Xbox 360', 'Atari - 2600', 'SNK - Neo Geo', 'FBNeo - Arcade Games',
];

function presetFor(exe) {
  const b = path.basename(exe).toLowerCase();
  const p = PRESETS.find((x) => x.match.test(b));
  return p ? { name: p.name, args: p.args, exts: p.exts, system: p.system } : { name: path.basename(exe, '.exe'), args: '"{rom}"', exts: [], system: '' };
}

// Split the template first, then insert {rom}: a path with spaces/quotes still stays one argument
function romArgs(template, rom) {
  return [...(template || '"{rom}"').matchAll(/"([^"]*)"|(\S+)/g)].map((m) => (m[1] ?? m[2]).replaceAll('{rom}', rom));
}

// "Pokemon - Emerald Version (USA, Europe)" -> "Pokemon - Emerald Version"
const cleanName = (raw) => raw.replace(/\s*[([][^)\]]*[)\]]/g, '').trim() || raw;

function scanRoms(emu) {
  const exts = new Set((emu.exts || []).map((e) => e.toLowerCase().replace(/^\./, '')));
  if (!emu.romDir || !exts.size) return [];
  const out = [];
  const walk = (dir, depth) => {
    let list = [];
    try { list = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const d of list) {
      const full = path.join(dir, d.name);
      if (d.isDirectory()) { if (depth < 2) walk(full, depth + 1); continue; }
      if (!exts.has(path.extname(d.name).slice(1).toLowerCase())) continue;
      const raw = path.basename(d.name, path.extname(d.name));
      out.push({
        key: `emu:${emu.id}:${norm(path.relative(emu.romDir, full))}`,
        name: cleanName(raw),
        rawName: raw,
        source: 'emu',
        emuId: emu.id,
        emuName: emu.name,
        system: emu.system || '',
        rom: full,
        launch: emu.exe,
        installDir: path.dirname(emu.exe),
        iconPath: emu.exe,
      });
    }
  };
  walk(emu.romDir, 0);
  return out;
}

function libretroUrls(system, rawName) {
  if (!system) return {};
  const s = encodeURIComponent(system);
  const n = encodeURIComponent(rawName.replace(/[&*/:`<>?\\|"]/g, '_')); // libretro's file naming rule
  const base = 'https://thumbnails.libretro.com';
  return { cover: `${base}/${s}/Named_Boxarts/${n}.png`, hero: `${base}/${s}/Named_Snaps/${n}.png`, logo: `${base}/${s}/Named_Logos/${n}.png` };
}

module.exports = { PRESETS, SYSTEMS, presetFor, romArgs, cleanName, scanRoms, libretroUrls };
