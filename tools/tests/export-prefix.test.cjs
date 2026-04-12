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
const actionsPath = projectPath('src', 'site', 'lab-actions.js');
const mainPath = projectPath('src', 'main.js');

const indexHtml = read(indexHtmlPath);
const actions = read(actionsPath);
const main = read(mainPath);

assert(indexHtml.includes('openExportSettings()'), 'index.html should wire an export settings trigger');
assert(main.includes('openExportSettings'), 'main.js should expose openExportSettings on window');
assert(actions.includes('exportFilePrefix'), 'lab-actions.js should store export prefix in localStorage key exportFilePrefix');

console.log('export-prefix.test.cjs passed');

