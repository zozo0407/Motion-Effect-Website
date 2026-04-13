const http = require('http');

const TEST_CASES = [
  { name: '金属球体(v3)', prompt: '一个金属质感的球体，使用 MeshStandardMaterial（高金属度、低粗糙度），缓慢自转。两盏不同色温的点光源从对角照射，在曲面上产生流动的高光，背景纯黑。' },
  { name: '发光线条(v4)', prompt: '一组发光的线条（使用 LineSegments），呈现深紫与电蓝的渐变色，缓慢旋转。使用自发光材质 (emissive)，背景纯黑。' },
  { name: '半透明发光晶体', prompt: '一个半透明的发光晶体（使用 MeshPhysicalMaterial 的 transmission 属性），缓慢自转。内部透出柔和的青色光晕，配合一盏点光源从侧面照射，背景纯黑。' },
  { name: '粒子环(v4)', prompt: '一个漆黑的球体，周围环绕着一圈缓慢旋转的发光粒子环（使用 Points），粒子带有紫红渐变色。' },
  { name: '禅意涟漪', prompt: '深色背景下，一个低多边形平面 (PlaneGeometry) 展现平滑的水面波纹效果，顶点随正弦波起伏。使用 MeshStandardMaterial 配合一盏暖橙色点光源从上方照射，营造静谧氛围。' },
  { name: '双圆环', prompt: '两个发光的圆环 (Torus)，一个散发青色光晕，一个散发洋红色光晕，以不同速度和轴向交错旋转。使用自发光材质 (emissive)，带 Bloom 泛光。' },
  { name: '深海浮游生物(v4)', prompt: '数百个微小的发光球体（使用 Points 或小球体 Mesh），在纯黑空间中沿缓慢的曲线轨迹漂浮游动。使用自发光材质 (emissive) 呈现柔和的蓝绿色光晕，带 Bloom 泛光。' },
  { name: '线框二十面体', prompt: '一个线框模式 (Wireframe) 的二十面体，缓慢匀速旋转，发出锐利的赛博绿光。使用自发光材质 (emissive)，带 Bloom 泛光。' },
  { name: '日全食边缘耀斑', prompt: '一个完全纯黑的圆盘遮挡住后方强烈的白色点光源，四周溢出夺目的日冕光晕（Bloom）。随着光源微小的位移，光斑在边缘游走。' },
  { name: '音频可视化(v3)', prompt: '一排围绕成圆形的垂直发光柱体（使用 CylinderGeometry），高度随正弦波函数平滑起伏，颜色在青到洋红之间渐变，缓慢旋转。使用自发光材质 (emissive)。' },
];

function generateCode(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ prompt });
    const req = http.request({
      hostname: 'localhost', port: 3000, path: '/api/generate-effect-v2',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      timeout: 150000,
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(new Error(`JSON: ${e.message}`)); } });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(data); req.end();
  });
}

function validateCode(code) {
  if (!code || typeof code !== 'string') return ['代码为空'];
  if (code.trim().length < 20) return ['代码过短'];
  const errors = [];
  if (!/export\s+default\s+class/i.test(code) && !/EngineEffect/.test(code)) errors.push('缺少 EngineEffect');
  return errors;
}

async function run() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  AUTO-TEST: 10 Prompts (Round 4 - Further Optimized)');
  console.log('═══════════════════════════════════════════════════════\n');
  const results = [];
  const t0 = Date.now();
  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    const start = Date.now();
    console.log(`[${i + 1}/${TEST_CASES.length}] ${tc.name}`);
    try {
      const json = await generateCode(tc.prompt);
      const elapsed = Date.now() - start;
      if (json.degraded) {
        console.log(`  ✕ [FAIL] Degraded (${elapsed}ms): ${(json.degradedReason || '').substring(0, 80)}`);
        results.push({ '#': i + 1, name: tc.name, status: 'FAIL', time: elapsed, error: `降级: ${(json.degradedReason || '').substring(0, 60)}` });
      } else if (!json.code || typeof json.code !== 'string') {
        console.log(`  ✕ [FAIL] No code (${elapsed}ms): ${(json.error || '').substring(0, 60)}`);
        results.push({ '#': i + 1, name: tc.name, status: 'FAIL', time: elapsed, error: (json.error || 'No code').substring(0, 60) });
      } else {
        const v = validateCode(json.code);
        if (v.length > 0) {
          console.log(`  ✕ [FAIL] Validation (${elapsed}ms): ${v.join('; ')}`);
          results.push({ '#': i + 1, name: tc.name, status: 'FAIL', time: elapsed, error: v.join('; ') });
        } else {
          console.log(`  ✓ [SUCCESS] ${json.code.length} chars (${elapsed}ms)`);
          results.push({ '#': i + 1, name: tc.name, status: 'SUCCESS', time: elapsed, error: '' });
        }
      }
    } catch (e) {
      results.push({ '#': i + 1, name: tc.name, status: 'FAIL', time: Date.now() - start, error: e.message.substring(0, 60) });
      console.log(`  ✕ [FAIL] (${Date.now() - start}ms): ${e.message}`);
    }
    if (i < TEST_CASES.length - 1) await new Promise(r => setTimeout(r, 1000));
  }
  const totalTime = Date.now() - t0;
  console.log('\n═══════════════════════════════════════════════════════');
  console.table(results.map(r => ({ '#': r['#'], name: r.name, status: r.status, time: r.time, error: r.error.substring(0, 50) })));
  const s = results.filter(r => r.status === 'SUCCESS').length;
  console.log(`\n成功率: ${s}/${results.length} (${((s / results.length) * 100).toFixed(1)}%)`);
  console.log(`平均耗时: ${Math.round(results.reduce((a, r) => a + r.time, 0) / results.length)}ms`);
  console.log(`总耗时: ${(totalTime / 1000).toFixed(1)}s`);
  const fails = results.filter(r => r.status === 'FAIL');
  if (fails.length) { console.log('\n失败详情:'); fails.forEach(r => console.log(`  [${r['#']}] ${r.name}: ${r.error}`)); }
  console.log('\n═══════════════════════════════════════════════════════\n');
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
