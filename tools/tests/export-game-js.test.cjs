const fs = require('fs');
const path = require('path');
const assert = require('assert');

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

function projectPath(...parts) {
  return path.join(__dirname, '..', '..', ...parts);
}

const templatesPath = projectPath('src', 'site', 'templates.js');
const labPath = projectPath('src', 'site', 'lab.js');
const mainPath = projectPath('src', 'main.js');
const indexHtmlPath = projectPath('index.html');

const templates = read(templatesPath);
const lab = read(labPath);
const main = read(mainPath);
const indexHtml = read(indexHtmlPath);

assert(
  templates.includes("d.type === 'REQUEST_GAME_JS_SOURCE'") ||
    templates.includes('d.type === "REQUEST_GAME_JS_SOURCE"') ||
    templates.includes('REQUEST_GAME_JS_SOURCE'),
  'templates.js should handle REQUEST_GAME_JS_SOURCE message'
);

assert(
  templates.includes('GAME_JS_SOURCE'),
  'templates.js should be able to provide GAME_JS_SOURCE'
);

assert(
  lab.includes('REQUEST_GAME_JS_SOURCE'),
  'lab.js should send REQUEST_GAME_JS_SOURCE message to iframe'
);

assert(
  main.includes('triggerExportGameJS'),
  'main.js should expose triggerExportGameJS on window'
);

assert(
  indexHtml.includes('triggerExportGameJS'),
  'index.html should include a button wired to triggerExportGameJS'
);

console.log('export-game-js.test.cjs passed');
