#!/bin/bash

# 脚本名称: kill_node_npm_force.sh
# 功能: 强制终止所有node和npm进程（排除编辑器相关进程）
# 使用方法: ./kill_node_npm_force.sh

echo "🔍 正在查找node和npm进程..."

# 获取当前脚本的进程ID
CURRENT_PID=$$
Father_PID=$1

# 查找进程ID，排除编辑器相关进程和当前脚本
PIDS=$(ps aux | grep -E "(node|npm)" | grep -v grep | grep -v "Code Helper\|Cursor Helper\|MBox\|Trae" | grep -v "kill_node_npm" | awk '{print $2}' | grep -v "^$CURRENT_PID$" | grep -v "^$Father_PID$" | tr '\n' ' ')

if [ -z "$PIDS" ]; then
    echo "✅ 未找到需要终止的node或npm进程。"
    exit 0
fi

echo "🎯 找到进程ID: $PIDS"
echo "💀 正在强制终止进程..."

# 强制终止所有进程
kill -9 $PIDS 2>/dev/null

echo "✅ 终止命令已执行！"

# 验证结果
echo "🔍 验证结果..."
REMAINING=$(ps aux | grep -E "(node|npm)" | grep -v grep | grep -v "Code Helper\|Cursor Helper\|MBox\|Trae" | grep -v "kill_node_npm")

if [ -z "$REMAINING" ]; then
    echo "✅ 所有node和npm进程已成功终止！"
else
    echo "⚠️  仍有以下进程在运行："
    echo "$REMAINING"
fi 