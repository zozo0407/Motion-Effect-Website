#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function log(msg) {
  console.log(msg);
}

function exitWithError(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function ensureSingleArgOrExit(argv) {
  if (argv.length !== 3) {
    console.log('用法: node replace.js <shader_file>');
    console.log('支持的文件格式: .vert (顶点着色器) 或 .frag (片段着色器)');
    process.exit(1);
  }
}

function determineShaderType(inputFile) {
  if (inputFile.endsWith('.vert')) {
    return 'vertex';
  }
  if (inputFile.endsWith('.frag')) {
    return 'fragment';
  }
  return null;
}

function buildOutputPath(inputFile) {
  const dirPath = path.dirname(inputFile);
  const fileName = path.basename(inputFile);
  return path.join(dirPath, `c_${fileName}`);
}

function transformVertexShader(source) {
  let text = source;
  text = text.replace(/\buv\b/g, "attTexcoord0");
  text = text.replace(/\bnormal\b/g, "attNormal");
  text = text.replace(/\bposition\b/g, "attPosition");
  text = text.replace(/\bnormalMatrix\b/g,'mat3(u_MV)');
  text = text.replace(/\bmodelViewMatrix\b/g,"u_MV");
  text = text.replace(/\bprojectionMatrix\b/g,"u_Projection");
  text = text.replace(/\bmodelViewProjectionMatrix\b/g,"u_MVP");
  text = text.replace(/u_Projection \* u_MV/g,"u_MVP");

  const newDeclarations = "precision highp float; attribute vec3 attPosition; attribute vec2 attTexcoord0; attribute vec3 attNormal; uniform mat4 u_MVP; uniform mat4 u_MV; uniform mat4 u_Projection;";
  return newDeclarations + text;
}

function transformFragmentShader(source) {
  return 'precision highp float;' + source;
}

function main() {
  ensureSingleArgOrExit(process.argv);

  const inputFile = process.argv[2];

  if (!fs.existsSync(inputFile)) {
    exitWithError(`错误: 文件 '${inputFile}' 不存在`);
  }

  const shaderType = determineShaderType(inputFile);
  if (!shaderType) {
    exitWithError('错误: 不支持的文件格式，请使用 .vert 或 .frag 后缀');
  }

  const outputFile = buildOutputPath(inputFile);

  if (shaderType === 'vertex') {
    // log(`检测到顶点着色器文件: ${inputFile}`);
    // log('开始处理顶点着色器文件...');
    // log(`输入文件：${inputFile}`);
    // log(`输出文件：${outputFile}`);
    // log('');

    const source = fs.readFileSync(inputFile, 'utf8');
    const transformed = transformVertexShader(source);
    fs.writeFileSync(outputFile, transformed, 'utf8');
    log(`✓ 顶点着色器已保存到 ${outputFile}`);
  } else if (shaderType === 'fragment') {
    // log(`检测到片段着色器文件: ${inputFile}`);
    // log('开始处理片段着色器文件...');
    // log(`输入文件：${inputFile}`);
    // log(`输出文件：${outputFile}`);
    // log('');

    const source = fs.readFileSync(inputFile, 'utf8');
    const transformed = transformFragmentShader(source);
    fs.writeFileSync(outputFile, transformed, 'utf8');
    log(`✓ 片段着色器已保存到 ${outputFile}`);
  }

  // log('');
  // log('处理完成！');
  // log(`新文件：${outputFile}`);
}

main();


