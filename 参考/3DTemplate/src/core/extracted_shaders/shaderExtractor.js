/**
 * 着色器提取工具
 * 用于自动提取Three.js场景中所有ShaderMaterial的着色器代码并保存为文件
 * 
 * 在Node.js环境下运行，可以提取ScriptScene中的所有着色器
 */

const fs = require('fs');
const path = require('path');
const THREE = require('three');

class ShaderExtractor {
  constructor() {
    this.extractedShaders = new Map(); // 存储已提取的着色器信息
    this.outputDir = './out/'; // 输出目录
    this.shaderHashes = new Map(); // 存储着色器代码的哈希值
    this.duplicateShaders = new Map(); // 存储重复的着色器信息
  }

  /**
   * 设置输出目录
   * @param {string} dir - 输出目录路径
   */
  setOutputDirectory(dir) {
    this.outputDir = dir;
    // 确保输出目录存在
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * 从场景中提取所有ShaderMaterial的着色器
   * @param {THREE.Scene} scene - Three.js场景对象
   * @param {string} sceneName - 场景名称，用于文件命名
   */
  extractFromScene(scene, sceneName = 'scene') {
    console.log(`开始从场景 "${sceneName}" 提取着色器...`);
    
    this.extractedShaders.clear();
    this.traverseScene(scene);
    
    // 保存所有提取的着色器
    this.saveAllShaders(sceneName);
    
    console.log(`着色器提取完成！共提取 ${this.extractedShaders.size} 个着色器`);
    return this.extractedShaders;
  }

  /**
   * 遍历场景中的所有对象，查找ShaderMaterial
   * @param {THREE.Object3D} object - 要遍历的对象
   */
  traverseScene(object) {
    if (!object) return;
    
    // 检查当前对象是否有材质
    if (object.material) {
      this.processMaterial(object.material, object.name || 'unknown');
    }

    // 递归遍历子对象
    if (object.children) {
      object.children.forEach(child => {
        this.traverseScene(child);
      });
    }
  }

  /**
   * 处理材质对象
   * @param {THREE.Material} material - 材质对象
   * @param {string} objectName - 对象名称
   */
  processMaterial(material, objectName) {
    // 处理单个材质
    // console.log("material.type", material.type);
    if (material.type === 'ShaderMaterial') {
      // console.log("单个 material", material);
      this.extractShader(material, objectName);
    }
    
    // 处理材质数组
    if (Array.isArray(material)) {
      material.forEach((mat, index) => {
        if (mat && mat.type === 'ShaderMaterial') {
          this.extractShader(mat, `${objectName}_${index}`);
        }
      });
    }
  }

    /**
   * 生成字符串的简单哈希值（使用长度）
   * @param {string} str - 要生成哈希的字符串
   * @returns {string} 哈希值
   */
  generateHash(str) {
    if (str.length === 0) return '0';
    
    // 使用长度作为哈希值，简单高效
    return `${str.length}`;
  }

  /**
   * 提取单个着色器的代码
   * @param {THREE.ShaderMaterial} material - ShaderMaterial对象
   * @param {string} objectName - 对象名称
   */
  extractShader(material, objectName) {
    if (!material.vertexShader || !material.fragmentShader) {
      console.warn(`材质 ${material.name || 'unnamed'} 缺少着色器代码`);
      return;
    }

    // 生成着色器代码的哈希值
    const vertexHash = this.generateHash(material.vertexShader);
    const fragmentHash = this.generateHash(material.fragmentShader);
    const combinedHash = `${vertexHash}_${fragmentHash}`;

    // 检查是否已存在相同的着色器
    if (this.shaderHashes.has(combinedHash)) {
      const existingKey = this.shaderHashes.get(combinedHash);
      const existingShader = this.extractedShaders.get(existingKey);
      
      // 记录重复信息
      const duplicateKey = `${objectName}_${combinedHash}`;
      this.duplicateShaders.set(duplicateKey, {
        name: combinedHash, // 使用哈希值作为名称
        objectName: objectName,
        duplicateOf: existingKey,
        vertexShader: existingShader.vertexShader,
        fragmentShader: existingShader.fragmentShader,
        uniforms: material.uniforms || {},
        timestamp: new Date().toISOString()
      });
      
      // console.log(`发现重复着色器: ${duplicateKey} -> 重复于 ${existingKey} (哈希: ${combinedHash})`);
      return;
    }

    const shaderInfo = {
      name: combinedHash, // 使用哈希值作为名称
      objectName: objectName,
      vertexShader: material.vertexShader,
      fragmentShader: material.fragmentShader,
      uniforms: material.uniforms || {},
      timestamp: new Date().toISOString(),
      hash: combinedHash
    };

    // 生成唯一标识符，使用哈希值
    const key = `${combinedHash}`;
    this.extractedShaders.set(key, shaderInfo);
    this.shaderHashes.set(combinedHash, key);
    
    console.log(`提取着色器: ${key} (哈希: ${combinedHash})`);
  }

  /**
   * 保存所有提取的着色器到文件
   * @param {string} sceneName - 场景名称
   */
  saveAllShaders(sceneName) {
    if (this.extractedShaders.size === 0) {
      console.log('没有找到需要保存的着色器');
      return;
    }

    // 创建场景特定的目录
    const sceneDir = path.join(this.outputDir, sceneName);
    if (!fs.existsSync(sceneDir)) {
      fs.mkdirSync(sceneDir, { recursive: true });
    }

    // 保存每个着色器
    this.extractedShaders.forEach((shaderInfo, key) => {
      this.saveShaderToFiles(shaderInfo, sceneDir, key);
    });

    // 保存重复着色器信息（可选）
    if (this.duplicateShaders.size > 0) {
      this.saveDuplicateShadersInfo(sceneDir, sceneName);
    }

    // 生成着色器清单文件
    this.generateShaderManifest(sceneDir, sceneName);
  }

  /**
   * 将着色器保存为vert和frag文件
   * @param {Object} shaderInfo - 着色器信息
   * @param {string} outputDir - 输出目录
   * @param {string} key - 着色器标识符
   */
  saveShaderToFiles(shaderInfo, outputDir, key) {

    const safeKey = this.sanitizeFileName(key);
    
    // 保存顶点着色器
    const vertPath = path.join(outputDir, `${safeKey}.vert`);
    fs.writeFileSync(vertPath, shaderInfo.vertexShader, 'utf8');
    
    // 保存片段着色器
    const fragPath = path.join(outputDir, `${safeKey}.frag`);
    fs.writeFileSync(fragPath, shaderInfo.fragmentShader, 'utf8');
    
    // 保存着色器信息（JSON格式）
    const infoPath = path.join(outputDir, `${safeKey}.json`);
    const infoData = {
      name: shaderInfo.name,
      objectName: shaderInfo.objectName,
      vertexShaderFile: `${safeKey}.vert`,
      fragmentShaderFile: `${safeKey}.frag`,
      uniforms: shaderInfo.uniforms,
      timestamp: shaderInfo.timestamp
    };
    fs.writeFileSync(infoPath, JSON.stringify(infoData, null, 2), 'utf8');
    
    console.log(`保存着色器文件: ${safeKey}.vert, ${safeKey}.frag, ${safeKey}.json`);
  }

  /**
   * 保存重复着色器信息
   * @param {string} outputDir - 输出目录
   * @param {string} sceneName - 场景名称
   */
  saveDuplicateShadersInfo(outputDir, sceneName) {
    const duplicateInfo = {
      sceneName: sceneName,
      extractionTime: new Date().toISOString(),
      totalDuplicates: this.duplicateShaders.size,
      duplicates: []
    };

    this.duplicateShaders.forEach((shaderInfo, key) => {
      duplicateInfo.duplicates.push({
        key: key,
        name: shaderInfo.name,
        objectName: shaderInfo.objectName,
        duplicateOf: shaderInfo.duplicateOf,
        uniforms: shaderInfo.uniforms,
        timestamp: shaderInfo.timestamp
      });
    });

    const duplicatePath = path.join(outputDir, 'duplicate_shaders.json');
    fs.writeFileSync(duplicatePath, JSON.stringify(duplicateInfo, null, 2), 'utf8');
    
    console.log(`保存重复着色器信息: duplicate_shaders.json (共 ${this.duplicateShaders.size} 个重复)`);
  }

  /**
   * 生成着色器清单文件
   * @param {string} outputDir - 输出目录
   * @param {string} sceneName - 场景名称
   */
  generateShaderManifest(outputDir, sceneName) {
    const manifest = {
      sceneName: sceneName,
      extractionTime: new Date().toISOString(),
      totalShaders: this.extractedShaders.size,
      totalDuplicates: this.duplicateShaders.size,
      uniqueShaders: this.extractedShaders.size,
      shaders: []
    };

    this.extractedShaders.forEach((shaderInfo, key) => {
      const safeKey = this.sanitizeFileName(key);
      manifest.shaders.push({
        key: key,
        name: shaderInfo.name,
        objectName: shaderInfo.objectName,
        files: {
          vertex: `${safeKey}.vert`,
          fragment: `${safeKey}.frag`,
          info: `${safeKey}.json`
        }
      });
    });

    const manifestPath = path.join(outputDir, 'shader_manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    
    console.log(`生成着色器清单: ${manifestPath}`);
  }

  /**
   * 清理文件名，移除不安全的字符
   * @param {string} filename - 原始文件名
   * @returns {string} 清理后的文件名
   */
  sanitizeFileName(filename) {
    return filename
      .replace(/[<>:"/\\|?*]/g, '_') // 替换Windows不允许的字符
      .replace(/\s+/g, '_')          // 替换空格为下划线
      .replace(/__+/g, '_')          // 合并多个下划线
      .replace(/^_+|_+$/g, '');      // 移除首尾下划线
  }

  /**
   * 从特定对象提取着色器
   * @param {THREE.Object3D} object - 特定对象
   * @param {string} objectName - 对象名称
   */
  extractFromObject(object, objectName) {
    console.log(`从对象 "${objectName}" 提取着色器...`);
    
    this.extractedShaders.clear();
    this.traverseScene(object);
    
    // 保存着色器
    this.saveAllShaders(objectName);
    
    return this.extractedShaders;
  }

  /**
   * 获取已提取的着色器信息
   * @returns {Map} 着色器信息映射
   */
  getExtractedShaders() {
    return this.extractedShaders;
  }

  /**
   * 清理临时数据
   */
  clear() {
    this.extractedShaders.clear();
  }
}

// 导出类
module.exports = ShaderExtractor;

