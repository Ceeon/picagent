#!/bin/bash

# PicAgent 启动器 - macOS
# Agent × MCP : 即梦工作站

clear
echo "╔══════════════════════════════════════════════╗"
echo "║          PicAgent - 即梦工作站                ║"
echo "║          AI 图片生成智能工作台                 ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未检测到 Node.js"
    echo "请先安装 Node.js: https://nodejs.org"
    echo ""
    echo "按回车键退出..."
    read
    exit 1
fi

# 检查 picagent 命令是否可用
if ! command -v picagent &> /dev/null; then
    echo "❌ 错误: 未找到 picagent 命令"
    echo ""
    echo "请先安装 PicAgent:"
    echo "npm install -g @chengfeng2025/picagent-jimeng"
    echo ""
    echo "按回车键退出..."
    read
    exit 1
fi

# 检查端口是否被占用
PORT=3004
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  检测到端口 $PORT 已被占用"
    echo "是否清理旧进程？(y/n)"
    read -n 1 response
    echo ""
    
    if [[ "$response" == "y" || "$response" == "Y" ]]; then
        echo "正在清理旧进程..."
        lsof -ti:$PORT | xargs kill -9 2>/dev/null
        sleep 1
        echo "✅ 已清理端口"
    else
        echo "请手动停止占用端口 $PORT 的程序后重试"
        echo "按回车键退出..."
        read
        exit 1
    fi
fi

# 启动 PicAgent
echo "🚀 正在启动 PicAgent..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "提示: 按 Ctrl+C 可以停止服务"
echo ""

# 运行 picagent
picagent

# 如果程序退出，等待用户按键
echo ""
echo "服务已停止。按回车键关闭窗口..."
read