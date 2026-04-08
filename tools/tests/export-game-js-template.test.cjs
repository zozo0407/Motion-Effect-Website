const fs = require('fs');
const path = require('path');
const assert = require('assert');

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

function projectPath(...parts) {
  return path.join(__dirname, '..', '..', ...parts);
}

const labPath = projectPath('src', 'site', 'lab.js');
const lab = read(labPath);

assert(
  lab.includes('tt.getSystemInfoSync') && lab.includes('tt.createCanvas'),
  'lab.js should include a minigame template (tt.getSystemInfoSync + tt.createCanvas) for exporting game.js'
);

console.log('export-game-js-template.test.cjs passed');
