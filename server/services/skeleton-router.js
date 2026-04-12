const { routePromptToSkeleton } = require('../../tools/creator/skeleton-router.cjs');
const { buildGlowSphereEffectCode } = require('../../tools/creator/skeletons/glow-sphere.cjs');
const { buildParticlesEffectCode } = require('../../tools/creator/skeletons/particles.cjs');
const { buildWireframeGeoEffectCode } = require('../../tools/creator/skeletons/wireframe-geo.cjs');
const { buildDigitalRainEffectCode } = require('../../tools/creator/skeletons/digital-rain.cjs');
const { buildGlassGeoEffectCode } = require('../../tools/creator/skeletons/glass-geo.cjs');
const { buildLiquidMetalEffectCode } = require('../../tools/creator/skeletons/liquid-metal.cjs');
const { buildEnergyCoreEffectCode } = require('../../tools/creator/skeletons/energy-core.cjs');
const { buildMinimalFallbackPayload } = require('../../tools/creator/minimal-fallback.cjs');

function buildCodeFromSkeletonRoute(skeletonRoute) {
    if (!skeletonRoute || !skeletonRoute.matched) return '';
    const params = skeletonRoute.params || {};
    if (skeletonRoute.kind === 'energy-core') return buildEnergyCoreEffectCode(params);
    if (skeletonRoute.kind === 'particles-vortex') return buildParticlesEffectCode(params);
    if (skeletonRoute.kind === 'wireframe-geo') return buildWireframeGeoEffectCode(params);
    if (skeletonRoute.kind === 'digital-rain') return buildDigitalRainEffectCode(params);
    if (skeletonRoute.kind === 'glass-geo') return buildGlassGeoEffectCode(params);
    if (skeletonRoute.kind === 'liquid-metal') return buildLiquidMetalEffectCode(params);
    return '';
}

module.exports = { routePromptToSkeleton, buildCodeFromSkeletonRoute, buildMinimalFallbackPayload, buildEnergyCoreEffectCode, buildGlowSphereEffectCode };
