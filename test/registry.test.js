const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { parseReg, xboxFromPackages, matchUninstall, findUninstallerExe } = require('../src/scanner');
const { safeDir } = require('../src/tracker');

test(".reg export is parsed: strings, escapes, multi-line hex(2) and dword", () => {
  const hex = Buffer.from('C:\\Game\\unins000.exe\0', 'utf16le').toJSON().data.map((b) => b.toString(16).padStart(2, '0'));
  const text = '\uFEFFWindows Registry Editor Version 5.00\r\n\r\n'
    + '[HKEY_LOCAL_MACHINE\\SOFTWARE\\Uninstall\\Game]\r\n'
    + '"DisplayName"="Battlefield™ 1 \\"Deluxe\\""\r\n'
    + '"InstallLocation"="C:\\\\Program Files\\\\EA Games\\\\Battlefield 1\\\\"\r\n'
    + `"UninstallString"=hex(2):${hex.slice(0, 10).join(',')},\\\r\n  ${hex.slice(10).join(',')}\r\n`
    + '"NoModify"=dword:00000001\r\n';
  const k = parseReg(text)['HKEY_LOCAL_MACHINE\\SOFTWARE\\Uninstall\\Game'];
  assert.equal(k.DisplayName, 'Battlefield™ 1 "Deluxe"');
  assert.equal(k.InstallLocation, 'C:\\Program Files\\EA Games\\Battlefield 1\\');
  assert.equal(k.UninstallString, 'C:\\Game\\unins000.exe');
  assert.equal(k.NoModify, 1);
});

test("an Xbox package counts as a game only if it has MicrosoftGame.config", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gcx-'));
  const game = path.join(dir, 'game');
  const app = path.join(dir, 'app');
  fs.mkdirSync(game);
  fs.mkdirSync(app);
  fs.writeFileSync(path.join(game, 'MicrosoftGame.config'), '<Game><ShellVisuals DefaultDisplayName="Persona 5 Royal" /><ExecutableList><Executable Name="P5R.exe" Id="P5R" /></ExecutableList></Game>');
  fs.writeFileSync(path.join(game, 'AppxManifest.xml'), '<Package><Applications><Application Id="P5R" Executable="GameLaunchHelper.exe"/></Applications></Package>');
  const list = xboxFromPackages([
    { id: 'SEGA.P5R_1.0.0.0_x64_USEU_abc123', PackageID: 'SEGA.P5R_1.0.0.0_x64_USEU_abc123', PackageRootFolder: game, DisplayName: 'x' },
    { id: 'Microsoft.Calc_1.0_x64__8we', PackageID: 'Microsoft.Calc_1.0_x64__8we', PackageRootFolder: app },
  ]);
  assert.equal(list.length, 1);
  assert.deepEqual({ name: list[0].name, family: list[0].family, appId: list[0].appId, exe: list[0].exe }, { name: 'Persona 5 Royal', family: 'SEGA.P5R_abc123', appId: 'P5R', exe: 'P5R.exe' });
});

test("the uninstall entry is matched by install folder first, then by name", () => {
  const entries = [
    { name: 'Other Program', dir: 'C:\\Games\\Other', uninstall: 'x' },
    { name: 'Metaphor: ReFantazio', dir: '', uninstall: 'C:\\Games\\Metaphor\\unins000.exe' },
    { name: 'Hollow Knight', dir: 'C:\\GOG Games\\Hollow Knight\\', uninstall: 'C:\\GOG Games\\Hollow Knight\\unins000.exe' },
  ];
  assert.equal(matchUninstall(entries, { name: 'HK', installDir: 'C:\\GOG Games\\Hollow Knight' }, safeDir).name, 'Hollow Knight');
  assert.equal(matchUninstall(entries, { name: 'Metaphor ReFantazio', installDir: 'D:\\X' }, safeDir).name, 'Metaphor: ReFantazio');
  assert.equal(matchUninstall(entries, { name: 'Missing', installDir: 'D:\\Y' }, safeDir), null);
});

test("without a registry entry, the uninstaller exe in the game folder is found", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gcu-'));
  fs.mkdirSync(path.join(dir, 'bin'));
  fs.writeFileSync(path.join(dir, 'bin', 'unins000.exe'), '');
  assert.equal(findUninstallerExe(dir), path.join(dir, 'bin', 'unins000.exe'));
});
