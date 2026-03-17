local isEditor = (Amaz.Macros and Amaz.Macros.EditorSDK) and true or false
local exports = exports or {}
local LumiFireworks = LumiFireworks or {}
LumiFireworks.__index = LumiFireworks
---@class LumiFireworks : ScriptComponent
---@field autoPlay boolean
---@field scale number [UI(Range={0.0, 1.0}, Drag)]
---@field frequency number [UI(Range={0.0, 1.0}, Drag)]
---@field speed number [UI(Range={0.0, 1.0}, Drag)]
---@field color number [UI(Range={0.0, 1.0}, Drag)]
---@field launchDuration number [UI(Range={0.0, 10.0}, Drag)]
---@field explosionDuration number [UI(Range={0.0, 10.0}, Drag)]

---@field bloomRadius number [UI(Range={0.0, 200.0}, Drag)]
---@field bloomSamples number [UI(Range={1.0, 12.0}, Drag)]
---@field bloomBase number [UI(Range={0.0, 20.0}, Drag)]
---@field bloomGlow number [UI(Range={0.0, 20.0}, Drag)]

---@field gradientSpread number [UI(Range={0.0, 10.0}, Drag)]
---@field gradientContrast number [UI(Range={0.0, 10.0}, Drag)]
---@field gradientHeight number [UI(Range={0.0, 1.0}, Drag)]

---@field ParticleTex_1_1 Texture
---@field ParticleTex_1_2 Texture
---@field ParticleTex_2_1 Texture
---@field ParticleTex_2_2 Texture
---@field ParticleTex_3_1 Texture
---@field ParticleTex_3_2 Texture
---@field ParticleTex_4_1 Texture
---@field ParticleTex_4_2 Texture
---@field picture_1 Texture
---@field picture_2 Texture
---@field picture_3 Texture
---@field picture_4 Texture
---@field picture_5 Texture
---@field picture_6 Texture
---@field picture_7 Texture
---@field picture_8 Texture
---@field picture_9 Texture
---@field picture_10 Texture
---@field picture_11 Texture
---@field picture_12 Texture
---@field picture_13 Texture
---@field picture_14 Texture
---@field picture_15 Texture
---@field fireWork Texture
---@field InputTex Texture
---@field OutputTex Texture

local AE_EFFECT_TAG = 'AE_EFFECT_TAG LumiTag'

-- shader-like pseudo random functions
local function rand(x)
    local fract = x - math.floor(x)
    return fract * fract * fract * (fract * (fract * 6.0 - 15.0) + 10.0)
end

local function random(x)
    return rand(math.sin(x) * 12345.6789)
end

local function randomRange(x, min, max)
    local r = random(x)
    return math.floor(min + r * (max - min + 1))
end

local function rgbToHsl(r, g, b)
    local maxc = math.max(r, math.max(g, b))
    local minc = math.min(r, math.min(g, b))
    local h, s
    local l = (maxc + minc) * 0.5
    if maxc == minc then
        h = 0.0
        s = 0.0
    else
        local d = maxc - minc
        s = l > 0.5 and d / (2.0 - maxc - minc) or d / (maxc + minc)
        if maxc == r then
            h = (g - b) / d + (g < b and 6.0 or 0.0)
        elseif maxc == g then
            h = (b - r) / d + 2.0
        else
            h = (r - g) / d + 4.0
        end
        h = h / 6.0
    end
    return h, s, l
end

local function hue2rgb(p, q, t)
    if t < 0.0 then
        t = t + 1.0
    end
    if t > 1.0 then
        t = t - 1.0
    end
    if t < 1.0 / 6.0 then
        return p + (q - p) * 6.0 * t
    end
    if t < 1.0 / 2.0 then
        return q
    end
    if t < 2.0 / 3.0 then
        return p + (q - p) * (2.0 / 3.0 - t) * 6.0
    end
    return p
end

local function hslToRgb(h, s, l)
    if s == 0.0 then
        return l, l, l
    end
    local q = l < 0.5 and l * (1.0 + s) or l + s - l * s
    local p = 2.0 * l - q
    local r = hue2rgb(p, q, h + 1.0 / 3.0)
    local g = hue2rgb(p, q, h)
    local b = hue2rgb(p, q, h - 1.0 / 3.0)
    return r, g, b
end

local function shiftHue(color, shift)
    local h, s, l = rgbToHsl(color.r, color.g, color.b)
    h = (h + shift) % 1.0
    local r, g, b = hslToRgb(h, s, l)
    return {
        r = r,
        g = g,
        b = b
    }
end

local function clamp(x, a, b)
    if x < a then
        return a
    end
    if x > b then
        return b
    end
    return x
end

local function mix(a, b, t)
    return a * (1.0 - t) + b * t
end

local function easeOutQuad(t)
    local u = 1.0 - t
    return 1.0 - u * u
end

local function easeOutCubic(t)
    local u = 1.0 - t
    return 1.0 - u * u * u
end

local function easeInOutCubic(t)
    if t < 0.5 then
        return 4.0 * t * t * t
    end
    local u = -2.0 * t + 2.0
    return 1.0 - (u * u * u) * 0.5
end

local function computeEasedFireworkTime(age, launchDuration, explosionDuration, easeMix)
    if age < 0.0 then
        return -1.0
    end
    local totalDuration = launchDuration + explosionDuration
    if age >= totalDuration then
        return -1.0
    end

    local ld = math.max(0.001, launchDuration)
    local ed = math.max(0.001, explosionDuration)

    easeMix = easeMix or 0.5

    if age < launchDuration then
        local t = clamp(age / ld, 0.0, 1.0)
        local e = mix(easeOutQuad(t), easeOutCubic(t), easeMix)
        return e * launchDuration
    end

    local tExp = age - launchDuration
    local tn = clamp(tExp / ed, 0.0, 1.0)
    local e = mix(easeOutQuad(tn), easeInOutCubic(tn), easeMix)
    return launchDuration + e * explosionDuration
end

local function isCenterXValid(newCenterX, fireworksInstances, minDistance)
    for _, firework in ipairs(fireworksInstances) do
        if math.abs(newCenterX - firework.centerX) < minDistance then
            return false
        end
    end
    return true
end

function LumiFireworks.new(construct, ...)
    local self = setmetatable({}, LumiFireworks)

    self.__lumi_type = "lumi_obj"
    self.__lumi_rt_pingpong_type = "custom"

    self.AEPlugin = false
    self.aeTime = 0
    self.curTime = 0.0

    self.autoPlay = true


    self.startTime = 0.0
    self.endTime = 6.0

    self.cycleTime = 0.0
    self.previousTime = 0.0
    self.launchDuration = 1.5
    self.explosionDuration = 3.0

    self.frequency = 1.0
    self.speed = 1.0

    self.centerX = 0.5
    self.scale = 1.0
    self.color = 1.0

    self.text_height = 0.5

    self.fireworksInstances = {}
    self.nextLaunchTime = 0.0
    self.maxFireworks = 3

    -- Original colors from fireworks.html
    self.fixedColors = { {
        r = 0.7647,
        g = 0.0431,
        b = 0.0118
    }, -- 0xc30b03
        {
            r = 1.0,
            g = 0.4980,
            b = 0.0
        }, -- 0xff7f00
        {
            r = 0.9490,
            g = 0.7451,
            b = 0.2706
        } -- 0xf2be45
    }
    self.shuffledColors = {}
    self.fireworkCount = 0

    self.ParticleTex_1_1 = nil
    self.ParticleTex_1_2 = nil
    self.ParticleTex_2_1 = nil
    self.ParticleTex_2_2 = nil
    self.ParticleTex_3_1 = nil
    self.ParticleTex_3_2 = nil
    self.ParticleTex_4_1 = nil
    self.ParticleTex_4_2 = nil

    self.picture_1 = nil
    self.picture_2 = nil
    self.picture_3 = nil
    self.picture_4 = nil
    self.picture_5 = nil
    self.picture_6 = nil
    self.picture_7 = nil
    self.picture_8 = nil
    self.picture_9 = nil
    self.picture_10 = nil
    self.picture_11 = nil
    self.picture_12 = nil
    self.picture_13 = nil
    self.picture_14 = nil
    self.picture_15 = nil
    self.fireWork = nil

    self.gradientSpread = 1.0
    self.gradientContrast = 1.0
    self.gradientHeight = 0.5

    self.bloomRadius = 0.4
    self.bloomSamples = 11.0
    self.bloomBase = 1.0
    self.bloomGlow = 1.5
    self.bloomThreshold = 0.1
    self.bloomSoftKnee = 0.85

    self.InputTex = nil
    self.OutputTex = nil

    self.textureGroups = { 1, 2, 3 }
    self.shuffledTextureGroups = {}
    self.currentTextureGroupIndex = 1
    self.textureGroupCount = 0
    
    -- 
    self.darkIns = 0.0
    self.lastExplosionTime = -1.0
    self.darkInsDuration = 1.5
    self.darkInsMax = 0.2

    return self
end

local function shuffleArray(array)
    for i = #array, 2, -1 do
        local j = math.random(1, i)
        array[i], array[j] = array[j], array[i]
    end
    return array
end

local function getNextTextureGroup(self)
    if self.textureGroupCount >= 3 then
        self.shuffledTextureGroups = shuffleArray({ 1, 2, 3 })
        self.currentTextureGroupIndex = 1
        self.textureGroupCount = 0
    elseif #self.shuffledTextureGroups == 0 then
        self.shuffledTextureGroups = shuffleArray({ 1, 2, 3 })
        self.currentTextureGroupIndex = 1
    end

    local textureGroup = self.shuffledTextureGroups[self.currentTextureGroupIndex]
    self.currentTextureGroupIndex = self.currentTextureGroupIndex + 1
    self.textureGroupCount = self.textureGroupCount + 1

    return textureGroup
end

function LumiFireworks:setEffectAttr(key, value, comp)
    local function _setEffectAttr(_key, _value, _force)
        if _force or self[_key] ~= nil then
            self[_key] = _value
            if comp and comp.properties ~= nil then
                comp.properties:set(_key, _value)
            end
        end
    end

    if key == "ParticleTex_1_1" and value == nil then
        _setEffectAttr(key, self.ParticleTex_1_1, true)
    elseif key == "ParticleTex_1_2" and value == nil then
        _setEffectAttr(key, self.ParticleTex_1_2, true)
    elseif key == "ParticleTex_2_1" and value == nil then
        _setEffectAttr(key, self.ParticleTex_2_1, true)
    elseif key == "ParticleTex_2_2" and value == nil then
        _setEffectAttr(key, self.ParticleTex_2_2, true)
    elseif key == "ParticleTex_3_1" and value == nil then
        _setEffectAttr(key, self.ParticleTex_3_1, true)
    elseif key == "ParticleTex_3_2" and value == nil then
        _setEffectAttr(key, self.ParticleTex_3_2, true)
    elseif key == "ParticleTex_4_1" and value == nil then
        _setEffectAttr(key, self.ParticleTex_4_1, true)
    elseif key == "ParticleTex_4_2" and value == nil then
        _setEffectAttr(key, self.ParticleTex_4_2, true)
    else
        _setEffectAttr(key, value)
    end
end

function LumiFireworks:onStart(comp)
    self.entity = comp.entity
    self.TAG = AE_EFFECT_TAG .. ' ' .. self.entity.name
    Amaz.LOGI(self.TAG, 'onStart')

    self.camFireworks = self.entity:searchEntity("CamFireworks"):getComponent("Camera")
    self.matFireworks = self.entity:searchEntity("PassFireworks"):getComponent("MeshRenderer").material

    self.matBlit = comp.entity.scene:findEntityBy("PassBlit"):getComponent("MeshRenderer").material
end

function LumiFireworks:onUpdate(comp, deltaTime)
    -- if self.OutputTex then
    --     self.camBlit.renderTexture = self.OutputTex
    -- end

    local duration = self.endTime - self.startTime
    if isEditor then
        duration = 1000000
    end

    local speedFactor = self.speed

    if isEditor then
        self.curTime = self.curTime + deltaTime
    elseif self.AEPlugin then
        self.curTime = self.curTime
    else
        self.curTime = self.curTime
    end

    self.matFireworks:setTex("u_particleTexture_1_1", self.ParticleTex_1_1)
    self.matFireworks:setTex("u_particleTexture_1_2", self.ParticleTex_1_2)
    self.matFireworks:setTex("u_particleTexture_2_1", self.ParticleTex_2_1)
    self.matFireworks:setTex("u_particleTexture_2_2", self.ParticleTex_2_2)
    self.matFireworks:setTex("u_particleTexture_3_1", self.ParticleTex_3_1)
    self.matFireworks:setTex("u_particleTexture_3_2", self.ParticleTex_3_2)
    self.matFireworks:setTex("u_particleTexture_4_1", self.ParticleTex_4_1)
    self.matFireworks:setTex("u_particleTexture_4_2", self.ParticleTex_4_2)
    self.matFireworks:setTex("u_picture_1", self.picture_1)
    self.matFireworks:setTex("u_picture_2", self.picture_2)
    self.matFireworks:setTex("u_picture_3", self.picture_3)
    self.matFireworks:setTex("u_picture_4", self.picture_4)
    self.matFireworks:setTex("u_picture_5", self.picture_5)
    self.matFireworks:setTex("u_picture_6", self.picture_6)
    self.matFireworks:setTex("u_picture_7", self.picture_7)
    self.matFireworks:setTex("u_picture_8", self.picture_8)
    self.matFireworks:setTex("u_picture_9", self.picture_9)
    self.matFireworks:setTex("u_picture_10", self.picture_10)
    self.matFireworks:setTex("u_picture_11", self.picture_11)
    self.matFireworks:setTex("u_picture_12", self.picture_12)
    self.matFireworks:setTex("u_picture_13", self.picture_13)
    self.matFireworks:setTex("u_picture_14", self.picture_14)
    self.matFireworks:setTex("u_picture_15", self.picture_15)
    self.matFireworks:setTex("u_fireWork", self.fireWork)

    local mydeltaTime = math.abs(self.curTime - self.previousTime)
    self.previousTime = self.curTime
        
    if self.autoPlay then
        self.cycleTime = self.cycleTime + mydeltaTime * speedFactor
    end

    local launchInterval = 6.0
    self.maxFireworks = 3.0
    if self.cycleTime >= self.nextLaunchTime and #self.fireworksInstances < self.maxFireworks then
        local textureGroup = getNextTextureGroup(self)

        local colorIndex = (self.fireworkCount % #self.fixedColors) + 1
        local baseColor = self.fixedColors[colorIndex]
        self.fireworkCount = self.fireworkCount + 1

        local hueShift = (self.color - 0.5) * 0.5
        local randomColor = shiftHue(baseColor, hueShift)

        local minX = 0.2
        local maxX = 0.8
        local minDistance = 0.2
        local centerX
        local maxAttempts = 10

        for attempt = 1, maxAttempts do
            local candidateX = minX + random(self.cycleTime + attempt * 0.1) * (maxX - minX)
            local isValid = true

            for _, firework in ipairs(self.fireworksInstances) do
                if math.abs(candidateX - firework.centerX) < minDistance then
                    isValid = false
                    break
                end
            end

            if isValid then
                centerX = candidateX
                break
            end

            if attempt == maxAttempts then
                centerX = candidateX
            end
        end
        local textHeight = 0.6
        if self.text_height < 0.5 then
            textHeight = 0.4 + (0.6 - 0.4) * self.text_height * 2.0
        else
            textHeight = 0.6 + (0.85 - 0.6) * (self.text_height - 0.5) * 2.0
        end
        local centerY = textHeight + random(self.cycleTime * 350234) * (0.85 - textHeight)
        local scale = self.scale * (0.6 + random(self.cycleTime * 1919519) * 0.6)
        local easeMix = random(self.cycleTime * 918273 + centerX * 1000.0 + centerY * 777.0 + textureGroup * 13.0) * 0.3

        local newFirework = {
            startTime = self.cycleTime,
            centerX = centerX,
            centerY = centerY,
            scale = scale,
            textureGroup = textureGroup,
            easeMix = easeMix,
            colorInner = {
                r = 1.0,
                g = 1.0,
                b = 1.0
            },
            colorOuter = randomColor
        }
        table.insert(self.fireworksInstances, newFirework)

        if self.curTime < 2.5 then
            self.nextLaunchTime = self.cycleTime + 0.7
        else
            local minDelay = 0.5 / (self.frequency * 1.5)
            local maxDelay = (launchInterval / 2) / (self.frequency * 1.5)
            local delay = minDelay + random(self.cycleTime * 114514) * (maxDelay - minDelay)
            self.nextLaunchTime = self.cycleTime + delay
        end
    end

    local totalDuration = self.launchDuration + self.explosionDuration
    local i = 1
    while i <= #self.fireworksInstances do
        local firework = self.fireworksInstances[i]
        if self.cycleTime - firework.startTime > totalDuration then
            table.remove(self.fireworksInstances, i)
        else
            -- 
            local explosionTime = firework.startTime + self.launchDuration
            if self.cycleTime >= explosionTime and self.cycleTime - mydeltaTime < explosionTime then
                -- 
                self.lastExplosionTime = self.cycleTime
            end
            i = i + 1
        end
    end
    
    if self.lastExplosionTime >= 0 then
        local timeSinceExplosion = self.cycleTime - self.lastExplosionTime
        local riseDuration = 0.1 -- 
        local fallDuration = self.darkInsDuration - riseDuration -- 
        
        if timeSinceExplosion < riseDuration then
            self.darkIns = self.darkInsMax * (timeSinceExplosion / riseDuration)
        elseif timeSinceExplosion < self.darkInsDuration then
            local fallTime = timeSinceExplosion - riseDuration
            self.darkIns = self.darkInsMax * (1.0 - fallTime / fallDuration)
        else
            self.darkIns = 0.0
            self.lastExplosionTime = -1.0
        end
    end

    self.matFireworks:setFloat("uTime", self.curTime)
    self.matFireworks:setFloat("uLaunchDuration", self.launchDuration)
    self.matFireworks:setFloat("uExplosionDuration", self.explosionDuration)
    self.matFireworks:setFloat("uGlobalTintR", 1.0)
    self.matFireworks:setFloat("uGlobalTintG", 1.0)
    self.matFireworks:setFloat("uGlobalTintB", 1.0)
    self.matFireworks:setFloat("uUseParticleTex", (self.ParticleTex_1_1 or self.ParticleTex_1_2) and 1.0 or 0.0)

    self.matFireworks:setInt("uFireworksCount", #self.fireworksInstances)

    local startTimes = {}    -- uFireworkStartTime
    local fireworkTimes = {} -- uFireworkTime
    local centerXs = {}      -- uFireworkCenterX
    local centerYs = {}      -- uFireworkCenterY
    local scales = {}        -- uFireworkScale
    local textureGroups = {} -- uFireworkTextureGroup
    local colorInnerRs = {}  -- uFireworkColorInnerR
    local colorInnerGs = {}  -- uFireworkColorInnerG
    local colorInnerBs = {}  -- uFireworkColorInnerB
    local colorOuterRs = {}  -- uFireworkColorOuterR
    local colorOuterGs = {}  -- uFireworkColorOuterG
    local colorOuterBs = {}  -- uFireworkColorOuterB

    for i = 1, self.maxFireworks do
        local firework = self.fireworksInstances[i]
        if firework then
            startTimes[i] = firework.startTime
            local age = self.cycleTime - firework.startTime
            fireworkTimes[i] = computeEasedFireworkTime(age, self.launchDuration, self.explosionDuration,
                firework.easeMix)
            centerXs[i] = firework.centerX
            centerYs[i] = firework.centerY
            scales[i] = firework.scale
            textureGroups[i] = firework.textureGroup
            colorInnerRs[i] = firework.colorInner.r
            colorInnerGs[i] = firework.colorInner.g
            colorInnerBs[i] = firework.colorInner.b
            colorOuterRs[i] = firework.colorOuter.r
            colorOuterGs[i] = firework.colorOuter.g
            colorOuterBs[i] = firework.colorOuter.b
        else
            --
            startTimes[i] = -1.0
            fireworkTimes[i] = -1.0
            centerXs[i] = 0.0
            centerYs[i] = 0.0
            scales[i] = 0.0
            textureGroups[i] = 1.0 --
            --
            colorInnerRs[i] = 0.0
            colorInnerGs[i] = 0.0
            colorInnerBs[i] = 0.0
            colorOuterRs[i] = 0.0
            colorOuterGs[i] = 0.0
            colorOuterBs[i] = 0.0
        end
    end

    self.matFireworks:setFloatVector("uFireworkTime", fireworkTimes)
    self.matFireworks:setFloatVector("uFireworkCenterX", centerXs)
    self.matFireworks:setFloatVector("uFireworkCenterY", centerYs)
    self.matFireworks:setFloatVector("uFireworkScale", scales)
    self.matFireworks:setFloatVector("uFireworkTextureGroup", textureGroups)
    self.matFireworks:setFloatVector("uFireworkColorInnerR", colorInnerRs)
    self.matFireworks:setFloatVector("uFireworkColorInnerG", colorInnerGs)
    self.matFireworks:setFloatVector("uFireworkColorInnerB", colorInnerBs)
    self.matFireworks:setFloatVector("uFireworkColorOuterR", colorOuterRs)
    self.matFireworks:setFloatVector("uFireworkColorOuterG", colorOuterGs)
    self.matFireworks:setFloatVector("uFireworkColorOuterB", colorOuterBs)

    self.matBlit:setFloat("uDarkIns", self.darkIns)

    -- Amaz.LOGE("zyy", self.bloomGlow)
end

-- function LumiFireworks:onEvent(sys, event)
--     if "effects_adjust_speed" == event.args:get(0) then
--         local intensity = event.args:get(1)
--         self.speed = 1.5 * intensity + 0.5
--     end
--     if "effects_adjust_color" == event.args:get(0) then
--         local intensity = event.args:get(1)
--         self.color = intensity
--     end
--     if "effects_adjust_number" == event.args:get(0) then
--         local intensity = event.args:get(1)
--         self.frequency = 0.5 * intensity + 0.5
--     end
--     if "effects_adjust_size" == event.args:get(0) then
--         local intensity = event.args:get(1)
--         self.scale = intensity
--     end
--     if "effects_adjust_intensity" == event.args:get(0) then
--         local intensity = event.args:get(1)
--         self.bloomGlow = (1.5 * intensity + 0.5) * 3
--         self.bloomRadius = (1.5 * intensity + 0.5)
--     end
-- end

exports.LumiFireworks = LumiFireworks
return exports
