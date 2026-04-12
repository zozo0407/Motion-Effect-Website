const fs = require('fs');
const path = require('path');
const assert = require('assert');

const validator = fs.readFileSync(path.join(__dirname, '..', '..', 'server', 'services', 'code-validator.js'), 'utf8');

assert(
  validator.includes('RoomEnvironment'),
  'code-validator.js should mention RoomEnvironment in validation to prevent runtime "not a constructor" crashes'
);
assert(
  validator.includes('not a constructor'),
  'code-validator.js should explain the RoomEnvironment runtime failure mode'
);

console.log('ban-room-environment.test.cjs passed');

