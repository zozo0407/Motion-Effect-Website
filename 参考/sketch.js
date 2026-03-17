
let video;
let net;
let segmentation;
let modelLoaded = false;
let videoLoaded = false;

let particles = [];
let backgroundParticles = []; // 背景粒子数组
let foregroundParticles = []; // 前景粒子数组
let lastSpawnTime = 0;
let lastBackgroundSpawnTime = 0; // 背景粒子生成时间
let lastForegroundSpawnTime = 0; // 前景粒子生成时间

// --- 可调整参数 ---
let spawnInterval = 30; // 初始生成间隔 (ms)
let minParticleRadius = 3; // 粒子最小半径
let maxParticleRadius = 6; // 粒子最大半径
const MAX_PARTICLES = 200;
const GRAVITY = 0.05;
const BOUNCE_DAMPING = 0.3;

// --- UI 相关变量 ---
let particleStyle = 'circle'; // 'circle', 'text', 'custom'
let textSource = '❄'; // 初始为雪花字符
let customIcon = null; // 存储自定义图标
let collisionColor = [255, 122, 145]; // 默认粉色 RGB 值
let particleColor = [255, 255, 255]; // 默认白色 RGB 值

// --- 发光画布 ---
let particleCanvas;

// --- 视频原始尺寸 ---
let videoOriginalWidth = 640;
let videoOriginalHeight = 480;

function setup() {
  // 初始创建一个默认大小的 canvas，后续可能会调整
  createCanvas(videoOriginalWidth, videoOriginalHeight);

  // 创建 UI 控件
  createUI();

  // 初始化离屏画布 (初始大小，后续可能调整)
  particleCanvas = createGraphics(videoOriginalWidth, videoOriginalHeight);

  // --- 初始状态：默认加载example.mp4视频 ---
  video = createVideo(['example.mp4']);
  video.hide();
  video.loop();
  
  video.elt.addEventListener('loadedmetadata', () => {
    videoOriginalWidth = video.elt.videoWidth;
    videoOriginalHeight = video.elt.videoHeight;
    console.log("视频原始尺寸:", videoOriginalWidth, "x", videoOriginalHeight);

    // 计算自适应缩放，确保最大边不超过720像素
    let newCanvasWidth, newCanvasHeight;
    const maxSize = 720;
    
    if (videoOriginalWidth > videoOriginalHeight) {
      // 宽度大于高度，以宽度为基准
      if (videoOriginalWidth <= maxSize) {
        newCanvasWidth = videoOriginalWidth;
        newCanvasHeight = videoOriginalHeight;
      } else {
        const scale = maxSize / videoOriginalWidth;
        newCanvasWidth = maxSize;
        newCanvasHeight = videoOriginalHeight * scale;
      }
    } else {
      // 高度大于或等于宽度，以高度为基准
      if (videoOriginalHeight <= maxSize) {
        newCanvasWidth = videoOriginalWidth;
        newCanvasHeight = videoOriginalHeight;
      } else {
        const scale = maxSize / videoOriginalHeight;
        newCanvasHeight = maxSize;
        newCanvasWidth = videoOriginalWidth * scale;
      }
    }

    // 重新调整 canvas 和 particleCanvas 的大小
    resizeCanvas(newCanvasWidth, newCanvasHeight);
    particleCanvas = createGraphics(newCanvasWidth, newCanvasHeight);

    video.size(newCanvasWidth, newCanvasHeight); // 调整视频元素大小以匹配 canvas
    videoLoaded = true;

    if (modelLoaded) {
      predictSeg();
    }
  });
  
  // 如果视频加载失败，显示错误信息
  video.elt.addEventListener('error', () => {
    console.error('无法加载example.mp4，请确保该文件存在于同一目录下');
    // 创建一个错误提示画面
    video = createGraphics(videoOriginalWidth, videoOriginalHeight);
    video.loadPixels();
    video.fill(0);
    video.textAlign(CENTER, CENTER);
    video.textSize(24);
    video.fill(255);
    video.text('无法加载example.mp4\n请确保该文件存在于同一目录下', videoOriginalWidth/2, videoOriginalHeight/2);
    image(video, 0, 0);
  });

  // 加载模型
  bodyPix.load({
    architecture: 'MobileNetV1',
    outputStride: 16,
    multiplier: 0.5,
    quantBytes: 2
  }).then(model => {
    net = model;
    modelLoaded = true;
  }).catch(err => {
    console.error('模型加载失败:', err);
  });
}

function createUI() {
  // --- 粒子样式选择 ---
  createDiv('<strong>粒子样式:</strong>').style('color', 'black');
  const styleSelect = createSelect();
  styleSelect.option('圆点', 'circle');
  styleSelect.option('文字', 'text');
  styleSelect.option('自定义图标', 'custom');
  styleSelect.selected(particleStyle);
  styleSelect.changed(() => {
    particleStyle = styleSelect.value();
    if (particleStyle === 'text' && textSource === '') {
      textSource = '❄';
    }
    // 显示/隐藏相关控件
    updateUIVisibility();
  });

  // --- 文字内容输入 ---
  const textDiv = createDiv('<strong>文字内容:</strong>').style('color', 'black');
  textDiv.id('textControls');
  textDiv.style('display', 'none'); // 初始隐藏
  const textInput = createInput('❄');
  textInput.id('textInput');
  textInput.input(() => {
    textSource = textInput.value() || '❄';
  });

  // --- 自定义图标上传 ---
  const iconDiv = createDiv('<strong>自定义图标:</strong>').style('color', 'black');
  iconDiv.id('iconControls');
  iconDiv.style('display', 'none'); // 初始隐藏
  const iconInput = createFileInput(handleIconUpload);
  iconInput.id('iconInput');
  iconInput.style('display', 'none');
  const iconButton = createButton('上传图标');
  iconButton.id('iconButton');
  iconButton.mousePressed(() => iconInput.elt.click());
  iconButton.style('margin', '5px');

  // --- 粒子大小调整 ---
  createDiv('<strong>粒子大小:</strong>').style('color', 'black');
  const sizeSlider = createSlider(1, 10, (minParticleRadius + maxParticleRadius) / 2); // 1到10的粒子大小范围
  sizeSlider.input(() => {
    const centerSize = sizeSlider.value();
    minParticleRadius = centerSize * 0.5; // 最小半径为中心值的50%
    maxParticleRadius = centerSize * 1.5; // 最大半径为中心值的150%
  });
  
  // --- 雪花生成频率调整 ---
  createDiv('<strong>雪花生成频率:</strong>').style('color', 'black');
  const frequencySlider = createSlider(10, 100, spawnInterval); // 10到100毫秒的生成间隔
  frequencySlider.input(() => {
    spawnInterval = frequencySlider.value();
  });
  
  // --- 整体雪花颜色选择 ---
  createDiv('<strong>雪花颜色:</strong>').style('color', 'black');
  const particleColorPicker = createColorPicker('#FFFFFF'); // 默认白色
  particleColorPicker.input(() => {
    const c = particleColorPicker.color();
    particleColor = [red(c), green(c), blue(c)];
  });
  
  // --- 碰撞颜色选择 ---
  createDiv('<strong>碰撞后颜色:</strong>').style('color', 'black');
  const colorPicker = createColorPicker('#FFC0CB'); // 默认粉色
  colorPicker.input(() => {
    const c = colorPicker.color();
    collisionColor = [red(c), green(c), blue(c)];
  });

  // --- 文件上传按钮 ---
  const fileInput = createFileInput(handleFile);
  fileInput.style('display', 'none');
  const fileButton = createButton('上传 MP4 视频');
  fileButton.mousePressed(() => fileInput.elt.click());
  fileButton.style('margin', '5px');
}

// --- 更新UI可见性 ---
function updateUIVisibility() {
  const textControls = select('#textControls');
  const iconControls = select('#iconControls');
  
  if (textControls) {
    textControls.style('display', particleStyle === 'text' ? 'block' : 'none');
  }
  
  if (iconControls) {
    iconControls.style('display', particleStyle === 'custom' ? 'block' : 'none');
  }
}

// --- 处理图标上传 ---
function handleIconUpload(file) {
  if (file.type !== 'image') {
    console.error('请选择图片文件');
    return;
  }
  
  loadImage(file.data, img => {
    if (img) {
      customIcon = img;
      console.log('图标上传成功');
    } else {
      console.error('图标加载失败');
    }
  });
}

function updateSizeDisplay() {
  // 更新显示当前的最小和最大半径
  select('#sizeDisplay').html('当前: 最小=' + minParticleRadius + ', 最大=' + maxParticleRadius);
}

// --- 处理上传的文件 ---
function handleFile(file) {
  if (file.type !== 'video') {
    console.error('请选择视频文件');
    return;
  }

  // 创建新的 video 元素
  video = createVideo([file.data]);
  video.hide();
  video.loop();

  video.elt.addEventListener('loadedmetadata', () => {
    videoOriginalWidth = video.elt.videoWidth;
    videoOriginalHeight = video.elt.videoHeight;
    console.log("视频原始尺寸:", videoOriginalWidth, "x", videoOriginalHeight);

    // 计算自适应缩放，确保最大边不超过720像素
    let newCanvasWidth, newCanvasHeight;
    const maxSize = 720;
    
    if (videoOriginalWidth > videoOriginalHeight) {
      // 宽度大于高度，以宽度为基准
      if (videoOriginalWidth <= maxSize) {
        newCanvasWidth = videoOriginalWidth;
        newCanvasHeight = videoOriginalHeight;
      } else {
        const scale = maxSize / videoOriginalWidth;
        newCanvasWidth = maxSize;
        newCanvasHeight = videoOriginalHeight * scale;
      }
    } else {
      // 高度大于或等于宽度，以高度为基准
      if (videoOriginalHeight <= maxSize) {
        newCanvasWidth = videoOriginalWidth;
        newCanvasHeight = videoOriginalHeight;
      } else {
        const scale = maxSize / videoOriginalHeight;
        newCanvasHeight = maxSize;
        newCanvasWidth = videoOriginalWidth * scale;
      }
    }

    // 重新调整 canvas 和 particleCanvas 的大小
    resizeCanvas(newCanvasWidth, newCanvasHeight);
    particleCanvas = createGraphics(newCanvasWidth, newCanvasHeight);

    video.size(newCanvasWidth, newCanvasHeight); // 调整视频元素大小以匹配 canvas
    videoLoaded = true;

    if (modelLoaded) {
      predictSeg();
    }
  });
}

function predictSeg() {
  if (!net || !video.elt || video.elt.readyState < 2) {
    setTimeout(predictSeg, 200);
    return;
  }

  net.segmentPerson(video.elt, {
    internalResolution: 'medium',
    segmentationThreshold: 0.7
  }).then(seg => {
    segmentation = seg;
    setTimeout(predictSeg, 100);
  }).catch(err => {
    console.error('分割出错:', err);
    setTimeout(predictSeg, 500);
  });
}

class Particle {
  constructor() {
    // 注意：坐标范围需要根据新的 canvas 尺寸调整
    this.x = random(width);
    this.y = random(-300, -20);
    this.vx = random(-1.2, 1.2);
    this.vy = 0;

    // --- 新增：旋转 ---
    this.angle = random(TWO_PI);
    this.angularVelocity = random(-0.002, 0.002); // 旋转速度为原来的2%（当前速度的20%）

    // --- 大小 (使用全局变量) ---
    this.r = random(minParticleRadius, maxParticleRadius);

    this.alpha = 255;
    this.collideTime = null;
    this.fading = false;
    this.colorTransition = false; // 新增：颜色过渡状态
    this.collisionCount = 0; // 新增：碰撞计数器
    this.maxCollisions = 3; // 新增：最大碰撞次数
    // 为粒子颜色添加2%的随机性
    this.originalColor = [
      particleColor[0] * random(0.98, 1.02),
      particleColor[1] * random(0.98, 1.02),
      particleColor[2] * random(0.98, 1.02)
    ];
    this.currentColor = [...this.originalColor]; // 当前颜色

    // --- 样式和文字 ---
    this.style = particleStyle;
    this.textChar = textSource.charAt(floor(random(textSource.length)));
  }

  isInsidePerson(mask) {
    if (this.x < 0 || this.x >= width || this.y < 0 || this.y >= height) return false;
    // 使用 Math.floor 确保索引是整数
    const idx = Math.floor(this.y) * width + Math.floor(this.x);
    // 检查索引是否在 mask 有效范围内
    if (idx < 0 || idx >= mask.length) return false;
    return mask[idx] === 1;
  }

  update(mask) {
    if (this.collideTime) {
      const now = millis();
      
      // 颜色渐变效果：碰撞后1秒内变成UI指定颜色，随后0.3秒又变回整体色
      if (!this.colorTransition) {
        this.colorTransition = true;
      }
      
      if (this.colorTransition) {
        const colorElapsed = now - this.collideTime;
        if (colorElapsed < 1000) { // 1秒内完成颜色过渡到碰撞颜色
          const t = colorElapsed / 1000; // 0到1的过渡值
          for (let i = 0; i < 3; i++) {
            this.currentColor[i] = lerp(this.originalColor[i], collisionColor[i], t);
          }
        } else if (colorElapsed < 1300) { // 在接下来的0.3秒内从碰撞颜色变回原始颜色
          const t = (colorElapsed - 1000) / 300; // 0到1的过渡值
          for (let i = 0; i < 3; i++) {
            this.currentColor[i] = lerp(collisionColor[i], this.originalColor[i], t);
          }
        } else {
          // 颜色过渡完成，恢复为原始颜色
          this.currentColor = [...this.originalColor];
        }
      }
    }
    if (this.alpha <= 0) return;

    this.vy += GRAVITY;
    let nextX = this.x + this.vx;
    let nextY = this.y + this.vy;
    this.angle += this.angularVelocity;

    // 人物碰撞检测
    if (mask && this.collisionCount < this.maxCollisions) {
      const points = [
        [nextX, nextY],
        [nextX, nextY - this.r],
        [nextX, nextY + this.r],
        [nextX - this.r, nextY],
        [nextX + this.r, nextY]
      ];
      let hit = false;
      for (const [px, py] of points) {
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const idx = Math.floor(py) * width + Math.floor(px);
          if (idx >= 0 && idx < mask.length && mask[idx] === 1) { // 添加边界检查
            hit = true;
            break;
          }
        }
      }

      if (hit) {
        this.vy *= -BOUNCE_DAMPING * 1; // y轴弹力调整为原来的50% (1.5 * 0.5 = 0.75)
        this.vx *= BOUNCE_DAMPING * 4; // x轴弹力增加到原来的4倍（大约2倍于整体弹力）
        this.angularVelocity = random(-0.06, 0.06); // 调整为原来的30% (0.2 * 0.3 = 0.06)
        this.y -= 2;
        this.collideTime = millis();
        this.collisionCount++; // 增加碰撞计数
        // 移除颜色过渡状态重置，不再变色
      }
    }

    this.x = nextX;
    this.y = nextY;
  }

  draw(pGraphics) {
    if (this.alpha <= 0) return;

    pGraphics.push();
    pGraphics.translate(this.x, this.y);
    pGraphics.rotate(this.angle);

    pGraphics.fill(this.currentColor[0], this.currentColor[1], this.currentColor[2], this.alpha);
    pGraphics.noStroke();

    if (this.style === 'circle') {
      pGraphics.ellipse(0, 0, this.r * 2);
    } else if (this.style === 'text') {
      pGraphics.textAlign(CENTER, CENTER);
      pGraphics.textSize(this.r * 1.5);
      pGraphics.text(this.textChar, 0, 0);
    } else if (this.style === 'custom' && customIcon) {
      // 绘制自定义图标
      pGraphics.imageMode(CENTER);
      const iconSize = this.r * 2;
      pGraphics.tint(this.currentColor[0], this.currentColor[1], this.currentColor[2], this.alpha);
      pGraphics.image(customIcon, 0, 0, iconSize, iconSize);
    }

    pGraphics.pop();
  }

  shouldBeRemoved() {
    // 检查粒子是否超出屏幕边界或透明度为0
    return this.alpha <= 0 || 
           this.y > height + 50 || 
           this.x < -50 || 
           this.x > width + 50 ||
           this.y < -350; // 考虑到粒子初始生成位置是-300到-20
  }
}

// 背景粒子类，大小为前景粒子的30%
class BackgroundParticle {
  constructor() {
    // 注意：坐标范围需要根据新的 canvas 尺寸调整
    this.x = random(width);
    this.y = random(-300, -20);
    this.vx = random(-0.48, 0.48); // 背景粒子速度为中雪的60% (0.8 * 0.6)
    this.vy = 0;

    // --- 新增：旋转 ---
    this.angle = random(TWO_PI);
    this.angularVelocity = random(-0.001, 0.001); // 背景粒子旋转为中雪的2%（当前速度的20%）

    // --- 大小为前景粒子的30% ---
    this.r = random(minParticleRadius, maxParticleRadius) * 0.3;

    this.alpha = 150; // 背景粒子透明度稍低
    this.collideTime = null;
    this.fading = false;
    
    // 为背景粒子颜色添加2%的随机性
    this.color = [
      particleColor[0] * random(0.98, 1.02),
      particleColor[1] * random(0.98, 1.02),
      particleColor[2] * random(0.98, 1.02)
    ];

    // --- 样式和文字 ---
    this.style = particleStyle;
    this.textChar = textSource.charAt(floor(random(textSource.length)));
  }

  update(mask) {
    if (this.collideTime) {
      const now = millis();
      if (!this.fading && now - this.collideTime >= 500) {
        this.fading = true;
      }
      if (this.fading) {
        const fadeElapsed = now - (this.collideTime + 500);
        if (fadeElapsed < 300) {
          this.alpha = map(fadeElapsed, 0, 300, 150, 0); // 从150淡出到0
        } else {
          this.alpha = 0;
        }
      }
    }

    if (this.alpha <= 0) return;

    this.vy += GRAVITY * 0.6; // 背景粒子重力为中雪的60% (0.7 * 0.6 ≈ 0.42，这里使用0.6)
    let nextX = this.x + this.vx;
    let nextY = this.y + this.vy;
    this.angle += this.angularVelocity;

    this.x = nextX;
    this.y = nextY;
  }

  draw(pGraphics) {
    if (this.alpha <= 0) return;

    pGraphics.push();
    pGraphics.translate(this.x, this.y);
    pGraphics.rotate(this.angle);

    pGraphics.fill(this.color[0], this.color[1], this.color[2], this.alpha);
    pGraphics.noStroke();

    if (this.style === 'circle') {
      pGraphics.ellipse(0, 0, this.r * 2);
    } else if (this.style === 'text') {
      pGraphics.textAlign(CENTER, CENTER);
      pGraphics.textSize(this.r * 1.5);
      pGraphics.text(this.textChar, 0, 0);
    } else if (this.style === 'custom' && customIcon) {
      // 绘制自定义图标
      pGraphics.imageMode(CENTER);
      const iconSize = this.r * 2;
      pGraphics.image(customIcon, 0, 0, iconSize, iconSize);
    }

    pGraphics.pop();
  }

  shouldBeRemoved() {
    // 检查粒子是否超出屏幕边界或透明度为0
    return this.alpha <= 0 || 
           this.y > height + 50 || 
           this.x < -50 || 
           this.x > width + 50 ||
           this.y < -350; // 考虑到粒子初始生成位置是-300到-20
  }
}

// --- 前景粒子类，大小为中雪的200%，速度为中雪的400% ---
class ForegroundParticle {
  constructor() {
    // 注意：坐标范围需要根据新的 canvas 尺寸调整
    this.x = random(width);
    this.y = random(-300, -20);
    this.vx = random(-0.84, 0.84); // 速度调整为原来的70% (1.2 * 0.7)
    this.vy = 0;

    // --- 新增：旋转 ---
    this.angle = random(TWO_PI);
    this.angularVelocity = random(-0.01, 0.01); // 前景粒子旋转为中雪的2%（当前速度的20%）

    // --- 大小为中雪的400% ---
    this.r = random(minParticleRadius, maxParticleRadius) * 3;

    this.alpha = 128; // 设置为50%透明度
    this.collideTime = null;
    this.fading = false;
    this.blurAmount = 8; // 模糊度
    
    // 为前景粒子颜色添加2%的随机性
    this.color = [
      particleColor[0] * random(0.98, 1.02),
      particleColor[1] * random(0.98, 1.02),
      particleColor[2] * random(0.98, 1.02)
    ];

    // --- 样式和文字 ---
    this.style = particleStyle;
    this.textChar = textSource.charAt(floor(random(textSource.length)));
  }

  update(mask) {
    if (this.collideTime) {
      const now = millis();
      if (!this.fading && now - this.collideTime >= 500) {
        this.fading = true;
      }
      if (this.fading) {
        const fadeElapsed = now - (this.collideTime + 500);
        if (fadeElapsed < 300) {
          this.alpha = map(fadeElapsed, 0, 300, 255, 0);
        } else {
          this.alpha = 0;
        }
      }
    }

    if (this.alpha <= 0) return;

    this.vy += GRAVITY * 1.4; // 前景粒子重力为中雪的140% (增加一些重力以平衡更大的速度)
    let nextX = this.x + this.vx;
    let nextY = this.y + this.vy;
    this.angle += this.angularVelocity;

    // 边界反弹 (使用新的 width/height)
    if (nextX - this.r < 0 || nextX + this.r > width) {
      this.vx *= -BOUNCE_DAMPING;
      this.angularVelocity *= -0.8;
      nextX = this.x + this.vx;
    }
    // 移除底部碰撞检测，雪花会直接穿过底部

    // 前景粒子不进行人物碰撞检测，直接穿过人物区域
    this.x = nextX;
    this.y = nextY;
  }

  draw(pGraphics) {
    if (this.alpha <= 0) return;

    pGraphics.push();
    pGraphics.translate(this.x, this.y);
    pGraphics.rotate(this.angle);

    pGraphics.fill(this.color[0], this.color[1], this.color[2], this.alpha);
    pGraphics.noStroke();

    // 添加模糊效果
    pGraphics.drawingContext.filter = `blur(${this.blurAmount}px)`;

    if (this.style === 'circle') {
      pGraphics.ellipse(0, 0, this.r * 2);
    } else if (this.style === 'text') {
      pGraphics.textAlign(CENTER, CENTER);
      pGraphics.textSize(this.r * 1.5);
      pGraphics.text(this.textChar, 0, 0);
    } else if (this.style === 'custom' && customIcon) {
      // 绘制自定义图标
      pGraphics.imageMode(CENTER);
      const iconSize = this.r * 2;
      pGraphics.image(customIcon, 0, 0, iconSize, iconSize);
    }

    // 重置滤镜
    pGraphics.drawingContext.filter = 'none';
    pGraphics.pop();
  }

  shouldBeRemoved() {
    // 检查粒子是否超出屏幕边界或透明度为0
    return this.alpha <= 0 || 
           this.y > height + 50 || 
           this.x < -50 || 
           this.x > width + 50 ||
           this.y < -350; // 考虑到粒子初始生成位置是-300到-20
  }
}

function draw() {
  background(0);

  if (video && videoLoaded) {
    // 绘制视频 (已按比例缩放)
    image(video, 0, 0, width, height);
  }

  // 清空粒子画布 (已按比例缩放)
  particleCanvas.clear();

  // 生成新中间层粒子
  if (millis() - lastSpawnTime > spawnInterval && particles.length < MAX_PARTICLES/2) {
    const newParticle = new Particle();
    newParticle.style = particleStyle;
    if (particleStyle === 'text') {
        newParticle.textChar = textSource.charAt(floor(random(textSource.length)));
    }
    particles.push(newParticle);
    // 添加随机性到生成间隔，使粒子生成更自然
    lastSpawnTime = millis() + random(-10, 10);
  }

  // 更新和绘制中间层粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update(segmentation ? segmentation.data : null);
    p.draw(particleCanvas);

    if (p.shouldBeRemoved()) {
      particles.splice(i, 1);
    }
  }

  // 将带发光效果的粒子画布绘制到主画布
  // 增强发光效果，使其能够透过背景显示
  drawingContext.shadowColor = `rgba(${particleColor[0]}, ${particleColor[1]}, ${particleColor[2]}, 0.8)`; // 增加阴影透明度，使其更明显
  drawingContext.shadowBlur = 15; // 增大阴影模糊半径，使边缘发光更明显
  image(particleCanvas, 0, 0);
  drawingContext.shadowColor = 'transparent';
}