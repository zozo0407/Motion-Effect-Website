const prompts = [
    "紫色发光粒子漩涡，中心脉冲，带轻微雾感。",
    "绿色霓虹线框立方体，缓慢旋转，黑色背景。",
    "金色液态金属球，表面水波纹起伏，高光反射。",
    "纯黑背景下的白色线条声波，随时间节奏跳动。",
    "红色的数字雨数据流，从上往下掉落，赛博朋克风。"
];

async function run() {
    let totalTime = 0;
    let successCount = 0;
    console.log(`========================================`);
    console.log(`🚀 开始批量测试 5 个简短 Prompt...`);
    console.log(`========================================\n`);

    for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i];
        console.log(`[${i + 1}/5] 请求: "${prompt}"`);
        const start = Date.now();
        
        try {
            const res = await fetch('http://localhost:3000/api/generate-effect-v2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            const duration = Date.now() - start;
            
            if (res.ok) {
                const data = await res.json();
                const code = data.code || '';
                const size = (code.length / 1024).toFixed(2) + 'KB';
                const hasClass = code.includes('export default class EngineEffect');
                const hasRenderer = code.includes('new THREE.WebGLRenderer');
                const hasRender = code.includes('.render(');
                
                if (hasClass && hasRenderer && hasRender) {
                    console.log(`   ✅ 成功 | 耗时: ${(duration/1000).toFixed(2)}s | 代码量: ${size} | 合规: 是 (包含类、Renderer初始化和Render调用)`);
                    totalTime += duration;
                    successCount++;
                } else {
                    console.log(`   ⚠️ 警告 | 耗时: ${(duration/1000).toFixed(2)}s | 合规: 否 (代码可能缺少关键结构)`);
                }
            } else {
                const err = await res.text();
                console.log(`   ❌ 失败 | 耗时: ${(duration/1000).toFixed(2)}s | 状态: ${res.status} | 错误: ${err}`);
            }
        } catch (e) {
            console.log(`   ❌ 异常 | 错误: ${e.message}`);
        }
        console.log('');
    }

    console.log(`========================================`);
    console.log(`🎉 测试结束! 成功率: ${successCount}/5`);
    if (successCount > 0) {
        console.log(`⏳ 平均成功耗时: ${(totalTime / successCount / 1000).toFixed(2)}s`);
    }
    console.log(`========================================`);
}

run();