local data = {}

local ae_compDurations = {0, 29.96}
data.ae_compDurations = ae_compDurations

local ae_effectType = 'effect'
data.ae_effectType = ae_effectType

local ae_transitionInputIndex = {
    {'LumiFireworks_14-effect0', 'InputTex', 0},
}
data.ae_transitionInputIndex = ae_transitionInputIndex

local ae_durations = {
    ['LumiFireworks_14-effect0'] = {
        ['nodeDuration'] = {{0, 30}, },
        ['texDuration'] = {
            ['InputTex'] = {{0, 30}, },
        },
    },
    ['LumiDeepGlow_14-effect1'] = {
        ['nodeDuration'] = {{0, 30}, },
        ['texDuration'] = {
            ['InputTex'] = {{0, 30}, },
        },
    },
}
data.ae_durations = ae_durations

local ae_attribute = {
    ['LumiFireworks_14-effect0'] = {
        ['scale'] = 0.55000001192093,
        ['frequency'] = 1.0,
        ['speed'] = 1,
        ['color'] = 0.5,
        ['launchDuration'] = 1.0,
        ['explosionDuration'] = 2,
        ['AEDesignSize'] = Amaz.Vector2f(608, 1001),
    },
    ['LumiDeepGlow_14-effect1'] = {
        ['radius'] = 500,
        ['exposure'] = 1.04999995231628,
        ['threshold'] = 0,
        ['thresholdSmooth'] = 0,
        ['greyScale'] = 0,
        ['blendMode'] = 1,
        ['view'] = 1,
        ['ratio'] = 1,
        ['rotate'] = 0,
        ['ca'] = false,
        ['redOffset'] = 0.0025,
        ['greenOffset'] = 0,
        ['blueOffset'] = -0.0025,
        ['tint'] = false,
        ['tintMode'] = 1,
        ['tintColor'] = Amaz.Color(1, 0, 0, 1),
        ['tintMix'] = 1,
        ['sourceOpacity'] = 1,
        ['unmult'] = true,
        ['gammaCorrect'] = true,
        ['gammaValue'] = 2,
        ['glowIter'] = 4,
        ['stepsMult'] = 1.5,
        ['downSample'] = 0.7,
        ['quality'] = 0.7,
        ['AEDesignSize'] = Amaz.Vector2f(608, 1001),
    },
}
data.ae_attribute = ae_attribute

local ae_sliderInfos = {
}
data.ae_sliderInfos = ae_sliderInfos

local ae_fadeinInfos = {
    time = 0,
    infos = {
    }
}
data.ae_fadeinInfos = ae_fadeinInfos

local ae_fadeoutInfos = {
    time = 0,
    infos = {
    }
}
data.ae_fadeoutInfos = ae_fadeoutInfos

local ae_animationInfos = {
    animationMode = 1,
    loopStart = 0,
    speedInfo = {1, 0, 1, },
}
data.ae_animationInfos = ae_animationInfos

return data
