const pe = require('../three.js规范/3d模板/3DTemplate_副本/public/js/peartifact.js');
const registry = require('../three.js规范/3d模板/3DTemplate_副本/public/js/effectRegistry.js');

registry.registerEffect({
  id: 'LumiTest',
  version: 1,
  params: { intensity: { type: 'number', min: 0, max: 1, default: 0.5 } },
  exportHook: (e) => ({ id: e.id, version: e.version, params: e.params })
});

const stack = [
  {
    id: 'LumiTest',
    enabled: true,
    params: { intensity: 0.9 },
    keyframes: {
      intensity: [
        { time: 0, value: 0.1, easing: 'Linear.None' },
        { time: 1000, value: 0.9, easing: 'Quadratic.Out' }
      ]
    }
  }
];

const artifact = pe.exportFromEffectStack(stack, registry, { name: 'preset', withCreatedAt: true });
const json = pe.stringifyPEArtifact(artifact, { pretty: true });
const parsed = pe.parsePEArtifact(json);
const imported = pe.importToEffectStack(parsed, registry);

if (!Array.isArray(imported)) throw new Error('import type');
if (imported.length !== 1) throw new Error('import length');
if (imported[0].id !== 'LumiTest') throw new Error('import id');
if (!imported[0].params || imported[0].params.intensity !== 0.9) throw new Error('import params');

const legacyArrayJson = JSON.stringify(stack, null, 2);
const legacyArrayParsed = pe.parsePEArtifact(legacyArrayJson);
if (!legacyArrayParsed || legacyArrayParsed.kind !== 'peartifact' || legacyArrayParsed.schemaVersion !== 1) throw new Error('legacy array manifest');
if (!Array.isArray(legacyArrayParsed.effects) || legacyArrayParsed.effects.length !== 1) throw new Error('legacy array effects');

const legacyEffectsObjectJson = JSON.stringify({ effects: stack }, null, 2);
const legacyEffectsObjectParsed = pe.parsePEArtifact(legacyEffectsObjectJson);
if (!Array.isArray(legacyEffectsObjectParsed.effects) || legacyEffectsObjectParsed.effects[0].id !== 'LumiTest') throw new Error('legacy effects object');

const legacyObjectsJson = JSON.stringify({ objects: [{ name: 'box_1', type: 'box' }], effects: stack }, null, 2);
const legacyObjectsParsed = pe.parsePEArtifact(legacyObjectsJson);
if (!legacyObjectsParsed.sceneData || !Array.isArray(legacyObjectsParsed.sceneData.objects)) throw new Error('legacy objects sceneData');
if (!Array.isArray(legacyObjectsParsed.effects) || legacyObjectsParsed.effects[0].id !== 'LumiTest') throw new Error('legacy objects effects');

const coerced = pe.coerceToManifestV1(JSON.parse(legacyArrayJson));
if (!coerced || !coerced.manifest || !Array.isArray(coerced.warnings) || coerced.warnings.length < 1) throw new Error('coerce warnings');

console.log('ok');
