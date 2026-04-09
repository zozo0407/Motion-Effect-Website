function shouldUseBlueprintStage(env = process.env) {
    const raw = typeof env.AI_ENABLE_BLUEPRINT === 'string' ? env.AI_ENABLE_BLUEPRINT.trim().toLowerCase() : '';
    return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

module.exports = {
    shouldUseBlueprintStage
};
