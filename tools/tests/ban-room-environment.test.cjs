const fs = require('fs');
const path = require('path');
const assert = require('assert');

const serverPath = path.join(__dirname, '..', '..', 'server.js');
const server = fs.readFileSync(serverPath, 'utf8');

// Prevent a common runtime crash: RoomEnvironment is not in core three module.
assert(
  server.includes('RoomEnvironment'),
  'server.js should mention RoomEnvironment in validation to prevent runtime "not a constructor" crashes'
);
assert(
  server.includes('not a constructor'),
  'server.js should explain the RoomEnvironment runtime failure mode'
);

console.log('ban-room-environment.test.cjs passed');

