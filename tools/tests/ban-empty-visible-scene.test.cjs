const fs = require('fs');
const path = require('path');
const assert = require('assert');

const aiGenerator = fs.readFileSync(path.join(__dirname, '..', '..', 'server', 'services', 'ai-generator.js'), 'utf8');
const validator = fs.readFileSync(path.join(__dirname, '..', '..', 'server', 'services', 'code-validator.js'), 'utf8');

assert(
  aiGenerator.includes('必须把它们组装成一个实际可渲染对象'),
  'wrapped_parts prompt should explicitly require assembling geometry/material/shader into a renderable object'
);
assert(
  aiGenerator.includes('必须调用 scene.add('),
  'wrapped_parts prompt should explicitly require scene.add(...) so the first frame is visible'
);
assert(
  validator.includes('定义了 Geometry / Material / shader') && validator.includes('但没有把实际可见对象加入 scene'),
  'code-validator.js should validate the common black-screen case: setup defines rendering resources but never adds a visible object'
);

console.log('ban-empty-visible-scene.test.cjs passed');

