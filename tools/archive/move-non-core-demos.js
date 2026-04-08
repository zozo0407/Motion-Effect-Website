const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '../..');
const DEMOS_DIR = path.join(PROJECT_ROOT, 'my-motion-portfolio/public/demos');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dest' && argv[i + 1]) {
      out.dest = argv[i + 1];
      i += 1;
      continue;
    }
    if (a === '--dry-run') {
      out.dryRun = true;
      continue;
    }
  }
  return out;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function exists(p) {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch (_) {
    return false;
  }
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

function movePath(src, dest, dryRun) {
  if (!exists(src)) return { moved: false, reason: 'missing', src, dest };
  if (exists(dest)) return { moved: false, reason: 'dest_exists', src, dest };
  if (dryRun) return { moved: true, reason: 'dry_run', src, dest };

  ensureDir(path.dirname(dest));

  try {
    fs.renameSync(src, dest);
    return { moved: true, reason: 'rename', src, dest };
  } catch (e) {
    if (fs.cpSync) {
      fs.cpSync(src, dest, { recursive: true, force: false, errorOnExist: true });
    } else {
      copyDirRecursive(src, dest);
    }
    removeDirRecursive(src);
    return { moved: true, reason: 'copy_then_delete', src, dest };
  }
}

function listDemoFiles() {
  if (!exists(DEMOS_DIR)) return [];
  const entries = fs.readdirSync(DEMOS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => e.name);
}

function listDemoDirs() {
  if (!exists(DEMOS_DIR)) return [];
  const entries = fs.readdirSync(DEMOS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const destRoot = args.dest
    ? path.resolve(PROJECT_ROOT, args.dest)
    : path.resolve(PROJECT_ROOT, '..', 'cupcut-website-archive');
  const dryRun = Boolean(args.dryRun);

  const keep = new Set([
    'demo4.html',
    'demo8.html',
    'demo5.html',
    'demo9.html',
    'demo10.html',
    'demo11.html',
    'demo20.html',
    'demo_audio_anomaly.html',
    'demo_text_glitch.html',
    'demo_curl_noise.html',
    'lab.html'
  ]);

  const srcDir = DEMOS_DIR;
  const destDir = path.join(destRoot, 'my-motion-portfolio/public/demos');
  ensureDir(destDir);

  const results = [];
  for (const name of listDemoFiles()) {
    if (keep.has(name)) continue;
    const src = path.join(srcDir, name);
    const dest = path.join(destDir, name);
    results.push(movePath(src, dest, dryRun));
  }

  for (const name of listDemoDirs()) {
    const src = path.join(srcDir, name);
    const dest = path.join(destDir, name);
    results.push(movePath(src, dest, dryRun));
  }

  const summary = {
    sourceDir: srcDir,
    destDir,
    dryRun,
    kept: Array.from(keep.values()).sort(),
    movedCount: results.filter((r) => r.moved).length,
    results
  };

  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
}

main();
