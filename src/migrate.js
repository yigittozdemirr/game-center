// The app used to be called GameCenter: its library and settings are copied to the new data folder once.
const fs = require('fs');
const path = require('path');

// Electron creates the new data folder before the app's code runs, so look for the library file, not the folder.
// The old folder is left as it was (a backup). library.json is written last, so a half-done copy is retried next start.
function copyData(from, to) {
  if (!fs.existsSync(path.join(from, 'library.json')) || fs.existsSync(path.join(to, 'library.json'))) return false;
  try {
    fs.mkdirSync(to, { recursive: true });
    // "Local Storage" holds small UI preferences such as games per row
    for (const f of ['config.json', 'accounts.bin', 'images', 'Local Storage']) {
      if (fs.existsSync(path.join(from, f))) fs.cpSync(path.join(from, f), path.join(to, f), { recursive: true });
    }
    // the library stores full image paths (…\gamecenter\images\…): point them at the new folder
    const json = (p) => JSON.stringify(p).slice(1, -1);
    const oldPath = new RegExp(json(from).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'); // Windows paths ignore case
    const lib = fs.readFileSync(path.join(from, 'library.json'), 'utf8').replace(oldPath, () => json(to));
    fs.writeFileSync(path.join(to, 'library.json'), lib);
    return true;
  } catch (e) {
    console.warn('Could not copy GameCenter data:', e.message);
    return false;
  }
}

module.exports = { copyData };
