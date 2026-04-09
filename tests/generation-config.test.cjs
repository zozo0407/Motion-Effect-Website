const test = require('node:test');
const assert = require('node:assert/strict');

const { shouldUseBlueprintStage } = require('../tools/creator/generation-config.cjs');

test('defaults to skipping blueprint stage', () => {
    assert.equal(shouldUseBlueprintStage({}), false);
});

test('enables blueprint stage only when explicitly set to true-like value', () => {
    assert.equal(shouldUseBlueprintStage({ AI_ENABLE_BLUEPRINT: 'true' }), true);
    assert.equal(shouldUseBlueprintStage({ AI_ENABLE_BLUEPRINT: '1' }), true);
    assert.equal(shouldUseBlueprintStage({ AI_ENABLE_BLUEPRINT: 'yes' }), true);
});

test('treats false-like values as disabled', () => {
    assert.equal(shouldUseBlueprintStage({ AI_ENABLE_BLUEPRINT: 'false' }), false);
    assert.equal(shouldUseBlueprintStage({ AI_ENABLE_BLUEPRINT: '0' }), false);
    assert.equal(shouldUseBlueprintStage({ AI_ENABLE_BLUEPRINT: '' }), false);
});
