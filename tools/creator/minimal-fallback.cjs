const { buildEnergyCoreEffectCode } = require('./skeletons/energy-core.cjs');

function buildMinimalFallbackPayload({ reason, prompt } = {}) {
  const degradedReason = typeof reason === 'string' && reason.trim() ? reason.trim() : 'AI generation failed';
  const _prompt = typeof prompt === 'string' ? prompt : '';

  // Intentionally simple and highly reliable "always visible" effect.
  // This is used only when the AI path times out or cannot be repaired into a valid EngineEffect.
  const code = buildEnergyCoreEffectCode({
    color: '#00f2ff',
    intensity: 1.2,
    speed: 1.0
  });

  return {
    code,
    degraded: true,
    degradedReason,
    degradedPrompt: _prompt
  };
}

module.exports = {
  buildMinimalFallbackPayload
};

