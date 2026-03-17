#!/bin/bash

# 检查命令行参数
FORCE_MODE=false
PORT=3008

# 获取当前脚本的进程ID
CURRENT_PID=$$
bash ./kill_node_npm_force.sh $CURRENT_PID

# 解析命令行参数
while [[ $# -gt 0 ]]; do
  case $1 in
    --force)
      FORCE_MODE=true
      shift
      ;;
    --port)
      PORT="$2"
      shift 2
      ;;
    -h|--help)
      echo "使用方法: $0 [选项]"
      echo "选项:"
      echo "  --force     强制模式：kill掉占用端口的进程"
      echo "  --port NUM  指定端口号 (默认: 3008)"
      echo "  -h, --help  显示此帮助信息"
      exit 0
      ;;
    *)
      echo "未知选项: $1"
      echo "使用 $0 --help 查看帮助"
      exit 1
      ;;
  esac
done

# 输出模式信息
if [ "$FORCE_MODE" = true ]; then
    echo "启动模式: 强制端口模式 (会kill占用进程)"
    export FORCE_PORT=true
else
    echo "启动模式: 端口递增模式 (自动尝试下一个端口)"
    export FORCE_PORT=false
fi

echo "目标端口: $PORT"
export PORT=$PORT

# 安装依赖
npm install 
npm install @tweenjs/tween.js

# 启动服务
npm run dev:full 