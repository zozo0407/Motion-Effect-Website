const assert = require('assert');
const { routePromptToSkeleton } = require('../creator/skeleton-router.cjs');

const vortex = routePromptToSkeleton('紫色发光粒子漩涡，中心脉冲，带轻微雾感。');
assert.equal(vortex.matched, true);
assert.equal(vortex.kind, 'particles-vortex');
assert.equal(vortex.params.primaryColor, '#8b5cf6');
assert(vortex.params.pulseStrength > 0);
assert(vortex.params.fogStrength > 0);

const wireframe = routePromptToSkeleton('绿色霓虹线框立方体，缓慢旋转，黑色背景。');
assert.equal(wireframe.matched, true);
assert.equal(wireframe.kind, 'wireframe-geo');
assert.equal(wireframe.params.primaryColor, '#22c55e');
assert(wireframe.params.speed < 1.1);

const rain = routePromptToSkeleton('红色的数字雨数据流，从上往下掉落，赛博朋克风。');
assert.equal(rain.matched, true);
assert.equal(rain.kind, 'digital-rain');
assert.equal(rain.params.primaryColor, '#ff0000');

const glass = routePromptToSkeleton('透明玻璃质感的二十面体，内部蓝色点光源，缓慢旋转。');
assert.equal(glass.matched, true);
assert.equal(glass.kind, 'glass-geo');
assert(glass.params.transparency > 0.5);

const metal = routePromptToSkeleton('金色液态金属球，表面水波纹起伏，高光反射。');
assert.equal(metal.matched, true);
assert.equal(metal.kind, 'liquid-metal');
assert(metal.params.metalness > 0.7);

const longTail = routePromptToSkeleton('一个抽象的叙事化宇宙记忆宫殿，漂浮的门与光带交错。');
assert.equal(longTail.matched, false);

console.log('skeleton-router-balanced.test.cjs passed');
