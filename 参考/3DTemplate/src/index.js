// 使用 require 方式引入依赖
const express = require('express');
const path = require('path');
const http = require('http');
const { exec } = require('child_process');
const app = express();

// 配置静态资源目录
app.use(express.static(path.join(__dirname, '../public')));
app.use('/dist', express.static(path.join(__dirname, '../dist')));

// 设置路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 添加编辑器路由
app.get('/editor', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/editor.html'));
});

// 尝试在指定端口启动服务器，如果被占用则自动尝试下一个端口
function startServer(port) {
  const server = http.createServer(app);
  server.listen(port);

  server.on('listening', () => {
    console.log(`服务器已启动，端口：${port}`);
    console.log(`访问地址：http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`端口 ${port} 已被占用，尝试使用下一个端口...`);
      startServer(port + 1);
    } else {
      console.error('启动服务器时发生错误:', err);
      process.exit(1);
    }
  });
}

// 强制占用指定端口，kill掉占用进程
function forceStartServer(port) {
  // 检查端口是否被占用
  exec(`lsof -ti:${port}`, (error, stdout, stderr) => {
    if (stdout.trim()) {
      // 端口被占用，kill掉进程
      const pids = stdout.trim().split('\n');
      console.log(`端口 ${port} 被占用，正在终止进程: ${pids.join(', ')}`);
      
      pids.forEach(pid => {
        exec(`kill -9 ${pid}`, (killError) => {
          if (killError) {
            console.log(`终止进程 ${pid} 失败: ${killError.message}`);
          } else {
            console.log(`已终止进程: ${pid}`);
          }
        });
      });
      
      // 等待进程被终止后启动服务器
      setTimeout(() => {
        startDirectServer(port);
      }, 1000);
    } else {
      // 端口未被占用，直接启动
      startDirectServer(port);
    }
  });
}

// 直接在指定端口启动服务器
function startDirectServer(port) {
  const server = http.createServer(app);
  server.listen(port);

  server.on('listening', () => {
    console.log(`服务器已强制启动，端口：${port}`);
    console.log(`访问地址：http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`端口 ${port} 仍被占用，可能需要手动处理`);
      process.exit(1);
    } else {
      console.error('启动服务器时发生错误:', err);
      process.exit(1);
    }
  });
}

// 配置选项
const PORT = parseInt(process.env.PORT, 10) || 3008;
const FORCE_PORT = process.env.FORCE_PORT === 'true' || process.env.FORCE_PORT === '1';

console.log(`启动模式: ${FORCE_PORT ? '强制端口模式' : '端口递增模式'}`);
console.log(`目标端口: ${PORT}`);

// 根据配置选择启动方式
if (FORCE_PORT) {
  // 强制模式：kill掉占用进程
  forceStartServer(PORT);
} else {
  // 递增模式：自动尝试下一个端口
  startServer(PORT);
}