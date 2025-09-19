#!/bin/bash

# PicAgent 启动脚本 (macOS 双击运行版本)
# 双击这个文件即可启动 PicAgent

clear
echo "╔══════════════════════════════════════════════╗"
echo "║          PicAgent MCP 管理工具                 ║"
echo "║          即梦AI 配置管理系统                    ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# 切换到脚本所在目录
cd "$(dirname "$0")"

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未检测到 Node.js"
    echo "请先安装 Node.js: https://nodejs.org"
    echo ""
    echo "按回车键退出..."
    read
    exit 1
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    echo "这可能需要几分钟时间，请耐心等待..."
    echo ""
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        echo "按回车键退出..."
        read
        exit 1
    fi
    echo "✅ 依赖安装完成"
    echo ""
fi

# 编译 TypeScript
if [ ! -d "dist" ] || [ "$(find src -name '*.ts' -newer dist -print -quit 2>/dev/null)" ]; then
    echo "🔨 正在编译代码..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ 编译失败"
        echo "按回车键退出..."
        read
        exit 1
    fi
    echo "✅ 编译完成"
    echo ""
fi

# 检查端口是否被占用
PORT=3004
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  检测到端口 $PORT 已被占用"
    echo "正在尝试清理旧进程..."
    lsof -ti:$PORT | xargs kill -9 2>/dev/null
    sleep 1
    echo "✅ 已清理端口"
    echo ""
fi

# 启动服务
echo "🚀 正在启动服务..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "提示: 按 Ctrl+C 可以停止服务"
echo ""

# 启动应用
npm start

# 如果程序退出，等待用户按键
echo ""
echo "服务已停止。按回车键关闭窗口..."
read