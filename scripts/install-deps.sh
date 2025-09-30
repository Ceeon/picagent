#!/bin/bash

# PicAgent 依赖安装脚本 (Mac/Linux)

echo "================================================"
echo "  PicAgent 依赖安装脚本"
echo "================================================"
echo ""

# 检测操作系统
OS="unknown"
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
    echo "检测到系统: macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    echo "检测到系统: Linux"
else
    echo "⚠️  未识别的操作系统: $OSTYPE"
    exit 1
fi

echo ""

# 函数：检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 函数：安装 Homebrew (仅 Mac)
install_homebrew() {
    if [ "$OS" == "mac" ] && ! command_exists brew; then
        echo "📦 正在安装 Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
}

# 函数：安装 Node.js
install_nodejs() {
    if ! command_exists node; then
        echo "📦 正在安装 Node.js..."
        if [ "$OS" == "mac" ]; then
            brew install node
        else
            curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
            sudo apt-get install -y nodejs
        fi
    else
        echo "✅ Node.js 已安装: $(node --version)"
    fi
}

# 函数：安装即梦 MCP 服务
install_jimeng_mcp() {
    echo "📦 正在安装即梦 MCP 服务..."

    # 安装即梦 MCP 包
    if command_exists npm; then
        echo "  - 安装 jimeng-apicore-mcp..."
        npm install -g jimeng-apicore-mcp
        echo "  - 安装 jimeng-volcengine-mcp..."
        npm install -g jimeng-volcengine-mcp
    else
        echo "❌ npm 未安装，无法安装即梦 MCP 服务"
    fi
}

# 函数：安装 Claude Code
install_claude() {
    if ! command_exists claude; then
        echo "📦 正在安装 Claude Code..."
        if [ "$OS" == "mac" ]; then
            # 尝试通过 Homebrew 安装
            if command_exists brew; then
                brew install claude
            else
                echo "⚠️  请手动下载 Claude Code："
                echo "   👉 https://claude.ai/download"
                open https://claude.ai/download
            fi
        else
            echo "⚠️  请手动下载 Claude Code："
            echo "   👉 https://claude.ai/download"
            xdg-open https://claude.ai/download 2>/dev/null || echo "请在浏览器中打开上述链接"
        fi
    else
        echo "✅ Claude Code 已安装: $(claude --version)"
    fi
}

# 函数：配置 MCP
configure_mcp() {
    echo ""
    echo "📦 配置即梦 MCP..."

    # 检查是否已配置
    if claude mcp list 2>/dev/null | grep -q "jimeng"; then
        echo "✅ 即梦 MCP 已配置"
    else
        echo "是否现在配置即梦 MCP？(y/n)"
        read -r response
        if [[ "$response" == "y" ]]; then
            echo "请输入即梦 API Key:"
            read -r api_key

            echo "正在配置即梦 MCP..."
            claude mcp add-json jimeng-apicore "{
                \"command\": \"npx\",
                \"args\": [\"jimeng-apicore-mcp\"],
                \"env\": {
                    \"APICORE_API_KEY\": \"$api_key\",
                    \"JIMENG_OUTPUT_DIR\": \"~/Pictures/jimeng\"
                }
            }"

            echo "✅ MCP 配置完成"
        fi
    fi
}

# 主流程
main() {
    echo "开始安装依赖..."
    echo ""

    # Mac 需要先安装 Homebrew
    if [ "$OS" == "mac" ]; then
        install_homebrew
    fi

    # 安装各个组件
    install_nodejs
    install_jimeng_mcp
    install_claude

    echo ""
    echo "================================================"
    echo "  依赖检查完成"
    echo "================================================"
    echo ""

    # 最终检查
    echo "📋 最终状态："
    echo ""

    if command_exists node; then
        echo "✅ Node.js: $(node --version)"
    else
        echo "❌ Node.js: 未安装"
    fi

    if command_exists npm; then
        echo "✅ npm: $(npm --version)"
    else
        echo "❌ npm: 未安装"
    fi

    if command_exists claude; then
        echo "✅ Claude Code: 已安装"
    else
        echo "❌ Claude Code: 未安装"
    fi

    echo ""

    # 询问是否配置 MCP
    configure_mcp

    echo ""
    echo "🎉 安装脚本执行完成！"
    echo ""
    echo "现在可以运行 PicAgent："
    echo "  ./picagent-mac"
    echo ""
}

# 运行主流程
main