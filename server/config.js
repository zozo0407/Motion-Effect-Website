const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.join(__dirname, '..');
const DATA_FILE = path.join(ROOT_DIR, 'my-motion-portfolio/public/data/demos.json');
const DEMO_DIR = path.join(ROOT_DIR, 'my-motion-portfolio/public/demos');
const PROMPTS_DIR = path.join(ROOT_DIR, 'prompts');
const TEMP_PREVIEWS_DIR = path.join(ROOT_DIR, '.temp_previews');

if (!fs.existsSync(TEMP_PREVIEWS_DIR)) {
    fs.mkdirSync(TEMP_PREVIEWS_DIR, { recursive: true });
}

function isSkeletonRouterEnabled(env) {
    const raw = typeof env.AI_ENABLE_SKELETON_ROUTER === 'string' ? env.AI_ENABLE_SKELETON_ROUTER.trim().toLowerCase() : '';
    return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

function isLegacySkeletonsDisabled(env) {
    const raw = typeof env.AI_DISABLE_LEGACY_SKELETONS === 'string' ? env.AI_DISABLE_LEGACY_SKELETONS.trim().toLowerCase() : '';
    return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

function isMinimalFallbackEnabled(env) {
    const raw = typeof env.AI_ENABLE_MINIMAL_FALLBACK === 'string' ? env.AI_ENABLE_MINIMAL_FALLBACK.trim().toLowerCase() : '';
    if (!raw) return true;
    return !(raw === '0' || raw === 'false' || raw === 'no' || raw === 'off');
}

function getV2TotalBudgetMs(env) {
    const raw = typeof env.AI_V2_TOTAL_BUDGET_MS === 'string' ? env.AI_V2_TOTAL_BUDGET_MS.trim() : '';
    const v = raw ? Number(raw) : 90000;
    if (!Number.isFinite(v)) return 90000;
    return Math.max(15000, Math.min(180000, Math.floor(v)));
}

module.exports = {
    PORT: process.env.PORT || 3000,
    ROOT_DIR,
    DATA_FILE,
    DEMO_DIR,
    PROMPTS_DIR,
    TEMP_PREVIEWS_DIR,
    isSkeletonRouterEnabled,
    isLegacySkeletonsDisabled,
    isMinimalFallbackEnabled,
    getV2TotalBudgetMs,
};
