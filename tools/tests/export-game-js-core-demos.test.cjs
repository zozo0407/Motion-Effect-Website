const fs = require('fs');
const path = require('path');
const assert = require('assert');

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

function projectPath(...parts) {
  return path.join(__dirname, '..', '..', ...parts);
}

const core = JSON.parse(read(projectPath('my-motion-portfolio', 'public', 'data', 'demos.core.json')));

const demoPaths = core.map((d) => projectPath(d.url));

demoPaths.forEach((p) => {
  const text = read(p);
  assert(
    text.includes('REQUEST_GAME_JS_SOURCE'),
    `core demo missing REQUEST_GAME_JS_SOURCE handler: ${p}`
  );
  assert(
    text.includes('GAME_JS_SOURCE'),
    `core demo missing GAME_JS_SOURCE response: ${p}`
  );
});

console.log('export-game-js-core-demos.test.cjs passed');
