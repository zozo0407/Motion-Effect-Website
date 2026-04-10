const fs = require('fs');
const path = require('path');
const assert = require('assert');

const serverPath = path.join(__dirname, '..', '..', 'server.js');
const server = fs.readFileSync(serverPath, 'utf8');

// wrapped_parts prompt should explicitly require a visible-object closure:
// geometry/material/shader must become Mesh/Points/Line and must be added to scene.
assert(
  server.includes('必须把它们组装成一个实际可渲染对象'),
  'wrapped_parts prompt should explicitly require assembling geometry/material/shader into a renderable object'
);
assert(
  server.includes('必须调用 scene.add('),
  'wrapped_parts prompt should explicitly require scene.add(...) so the first frame is visible'
);

// Validator should mention the common black-screen failure mode:
// setup defines geometry/shader/material but never adds a visible object into scene.
assert(
  server.includes('定义了 Geometry / Material / shader') && server.includes('但没有把实际可见对象加入 scene'),
  'server.js should validate the common black-screen case: setup defines rendering resources but never adds a visible object'
);

console.log('ban-empty-visible-scene.test.cjs passed');
