const assert = require('assert');
const { buildParticlesEffectCode } = require('../creator/skeletons/particles.cjs');
const { buildWireframeGeoEffectCode } = require('../creator/skeletons/wireframe-geo.cjs');
const { buildDigitalRainEffectCode } = require('../creator/skeletons/digital-rain.cjs');
const { buildGlassGeoEffectCode } = require('../creator/skeletons/glass-geo.cjs');
const { buildLiquidMetalEffectCode } = require('../creator/skeletons/liquid-metal.cjs');

const builders = [
  buildParticlesEffectCode({ color: '#8b5cf6', density: 1.2, speed: 0.8, glowIntensity: 1.4, pulseStrength: 0.6, fogStrength: 0.3 }),
  buildWireframeGeoEffectCode({ primaryColor: '#22c55e', speed: 0.8, scale: 1.0, glowIntensity: 1.2 }),
  buildDigitalRainEffectCode({ primaryColor: '#ff0000', secondaryColor: '#ff3366', speed: 1.3, density: 1.0 }),
  buildGlassGeoEffectCode({ primaryColor: '#60a5fa', transparency: 0.75, roughness: 0.15, metalness: 0.05 }),
  buildLiquidMetalEffectCode({ primaryColor: '#f59e0b', metalness: 0.95, roughness: 0.18, flowIntensity: 0.7 })
];

for (const code of builders) {
  assert(/import \* as THREE from 'three';/.test(code));
  assert(/export default class EngineEffect/.test(code));
  assert(/\bonStart\s*\(/.test(code));
  assert(/\bonUpdate\s*\(/.test(code));
  assert(/\bonResize\s*\(/.test(code));
  assert(/\bonDestroy\s*\(/.test(code));
  assert(/\bgetUIConfig\s*\(/.test(code));
  assert(/\bsetParam\s*\(/.test(code));
  assert(/new THREE\.WebGLRenderer\s*\(/.test(code));
  assert(/\.render\s*\(/.test(code));
}

console.log('skeleton-builders-contract.test.cjs passed');
