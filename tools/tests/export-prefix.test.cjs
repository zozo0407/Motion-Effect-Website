const fs = require('fs');
const path = require('path');
const assert = require('assert');

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

function projectPath(...parts) {
  return path.join(__dirname, '..', '..', ...parts);
}

const indexHtmlPath = projectPath('index.html');
const labPath = projectPath('src', 'site', 'lab.js');
const mainPath = projectPath('src', 'main.js');
const unifiedRendererPath = projectPath('my-motion-portfolio', 'public', 'js', 'UnifiedRenderer.js');

const indexHtml = read(indexHtmlPath);
const lab = read(labPath);
const main = read(mainPath);
const unified = read(unifiedRendererPath);

assert(indexHtml.includes('openExportSettings()'), 'index.html should wire an export settings trigger');
assert(main.includes('openExportSettings'), 'main.js should expose openExportSettings on window');
assert(lab.includes('exportFilePrefix'), 'lab.js should store export prefix in localStorage key exportFilePrefix');
assert(unified.includes('exportFilePrefix'), 'UnifiedRenderer.js should also use exportFilePrefix for its export button');

console.log('export-prefix.test.cjs passed');
