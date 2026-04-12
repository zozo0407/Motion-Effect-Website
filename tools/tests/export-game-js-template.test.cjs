const fs = require('fs');
const path = require('path');
const assert = require('assert');

function read(p) {
  return fs.readFileSync(p, 'utf8');
}
function projectPath(...parts) {
  return path.join(__dirname, '..', '..', ...parts);
}

const actionsPath = projectPath('src', 'site', 'lab-actions.js');
const actions = read(actionsPath);

assert(
  actions.includes('tt.getSystemInfoSync') && actions.includes('tt.createCanvas'),
  'lab-actions.js should include a minigame template (tt.getSystemInfoSync + tt.createCanvas) for exporting game.js'
);

console.log('export-game-js-template.test.cjs passed');

