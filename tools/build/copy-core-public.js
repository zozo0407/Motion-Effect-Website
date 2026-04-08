const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '../..');
const SRC_PUBLIC = path.join(PROJECT_ROOT, 'my-motion-portfolio/public');
const DEST_PUBLIC = path.join(PROJECT_ROOT, 'dist/my-motion-portfolio/public');

function exists(p) {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch (_) {
    return false;
  }
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function removeDirRecursive(p) {
  if (!exists(p)) return;
  const entries = fs.readdirSync(p, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(p, e.name);
    if (e.isDirectory()) {
      removeDirRecursive(full);
      continue;
    }
    fs.unlinkSync(full);
  }
  fs.rmdirSync(p);
}

function copyDirRecursive(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) {
      copyDirRecursive(s, d);
      continue;
    }
    if (e.isSymbolicLink()) {
      const link = fs.readlinkSync(s);
      fs.symlinkSync(link, d);
      continue;
    }
    fs.copyFileSync(s, d);
  }
}

function copyPath(src, dest) {
  if (!exists(src)) return { copied: false, reason: 'missing', src, dest };
  const stat = fs.lstatSync(src);
  if (stat.isDirectory()) {
    if (fs.cpSync) {
      fs.cpSync(src, dest, { recursive: true, force: true });
    } else {
      copyDirRecursive(src, dest);
    }
    return { copied: true, reason: 'dir', src, dest };
  }
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  return { copied: true, reason: 'file', src, dest };
}

function countFiles(p) {
  if (!exists(p)) return 0;
  const stat = fs.lstatSync(p);
  if (!stat.isDirectory()) return 1;
  let total = 0;
  const entries = fs.readdirSync(p, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(p, e.name);
    if (e.isDirectory()) {
      total += countFiles(full);
      continue;
    }
    total += 1;
  }
  return total;
}

function main() {
  if (!exists(SRC_PUBLIC)) {
    throw new Error(`Source public directory not found: ${SRC_PUBLIC}`);
  }

  ensureDir(path.dirname(DEST_PUBLIC));
  removeDirRecursive(DEST_PUBLIC);
  ensureDir(DEST_PUBLIC);

  const whitelistDirs = ['js', 'data', 'demos', 'sample'];
  const whitelistFiles = ['vite.svg'];

  const copied = [];

  for (const dir of whitelistDirs) {
    const src = path.join(SRC_PUBLIC, dir);
    const dest = path.join(DEST_PUBLIC, dir);
    const res = copyPath(src, dest);
    if (res.copied) copied.push({ type: 'dir', rel: dir });
  }

  for (const file of whitelistFiles) {
    const src = path.join(SRC_PUBLIC, file);
    const dest = path.join(DEST_PUBLIC, file);
    const res = copyPath(src, dest);
    if (res.copied) copied.push({ type: 'file', rel: file });
  }

  const report = {
    srcPublic: SRC_PUBLIC,
    destPublic: DEST_PUBLIC,
    copied,
    fileCount: countFiles(DEST_PUBLIC)
  };

  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
}

main();

