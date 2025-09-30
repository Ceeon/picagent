# PicAgent 依赖安装脚本 (Windows)

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  PicAgent 依赖安装脚本" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 函数：检查命令是否存在
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# 函数：安装 Node.js
function Install-NodeJS {
    if (-not (Test-Command "node")) {
        Write-Host "📦 正在安装 Node.js..." -ForegroundColor Yellow

        # 检查 winget 是否可用
        if (Test-Command "winget") {
            Write-Host "  使用 winget 安装..." -ForegroundColor Gray
            winget install OpenJS.NodeJS
        } else {
            # 如果没有 winget，尝试使用 Chocolatey
            if (Test-Command "choco") {
                Write-Host "  使用 Chocolatey 安装..." -ForegroundColor Gray
                choco install nodejs -y
            } else {
                Write-Host "⚠️  请手动安装 Node.js:" -ForegroundColor Red
                Write-Host "   👉 https://nodejs.org/downloads" -ForegroundColor Yellow
                Start-Process "https://nodejs.org/downloads"
                return $false
            }
        }

        # 刷新环境变量
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    } else {
        $version = node --version 2>&1
        Write-Host "✅ Node.js 已安装: $version" -ForegroundColor Green
    }
    return $true
}

# 函数：安装即梦 MCP 服务
function Install-JimengMCP {
    Write-Host "📦 正在安装即梦 MCP 服务..." -ForegroundColor Yellow

    if (Test-Command "npm") {
        Write-Host "  - 安装 jimeng-apicore-mcp..." -ForegroundColor Gray
        npm install -g jimeng-apicore-mcp

        Write-Host "  - 安装 jimeng-volcengine-mcp..." -ForegroundColor Gray
        npm install -g jimeng-volcengine-mcp

        Write-Host "  ✅ 即梦 MCP 服务安装完成" -ForegroundColor Green
    } else {
        Write-Host "❌ npm 未安装，无法安装即梦 MCP 服务" -ForegroundColor Red
        return $false
    }
    return $true
}

# 函数：安装Windows构建工具
function Install-WindowsBuildTools {
    Write-Host "📦 正在安装 Windows 构建工具..." -ForegroundColor Yellow

    # 检查是否已安装
    try {
        & where.exe cl.exe > $null 2>&1
        Write-Host "  ✅ 构建工具已安装" -ForegroundColor Green
        return $true
    } catch {
        # 需要安装
    }

    # 尝试使用 winget 安装
    if (Test-Command "winget") {
        Write-Host "  使用 winget 安装 Visual Studio 构建工具..." -ForegroundColor Gray
        try {
            winget install Microsoft.VisualStudio.2022.BuildTools --silent --accept-package-agreements --accept-source-agreements
            Write-Host "  ✅ Visual Studio 构建工具安装完成" -ForegroundColor Green
            return $true
        } catch {
            Write-Host "  ⚠️  winget 安装失败，尝试其他方法..." -ForegroundColor Yellow
        }
    }

    # 尝试使用 chocolatey
    if (Test-Command "choco") {
        Write-Host "  使用 chocolatey 安装构建工具..." -ForegroundColor Gray
        try {
            choco install visualstudio2022buildtools -y
            Write-Host "  ✅ 构建工具安装完成" -ForegroundColor Green
            return $true
        } catch {
            Write-Host "  ⚠️  chocolatey 安装失败" -ForegroundColor Yellow
        }
    }

    # 手动安装提示
    Write-Host "  ⚠️  无法自动安装构建工具，请手动安装：" -ForegroundColor Yellow
    Write-Host "  👉 下载地址: https://visualstudio.microsoft.com/visual-cpp-build-tools/" -ForegroundColor Cyan
    Write-Host "  📝 安装时请选择 'C++ 生成工具' 工作负载" -ForegroundColor Gray
    return $false
}

# 函数：安装 Node-PTY 依赖包
function Install-NodePtyDeps {
    Write-Host "📦 正在安装 Node-PTY 依赖..." -ForegroundColor Yellow

    if (-not (Test-Command "npm")) {
        Write-Host "❌ npm 未安装，跳过 PTY 依赖安装" -ForegroundColor Red
        return $false
    }

    # PTY包列表，按优先级排序
    $ptyPackages = @(
        "@homebridge/node-pty-prebuilt-multiarch",
        "node-pty-prebuilt-multiarch",
        "@lydell/node-pty",
        "node-pty"
    )

    foreach ($pkg in $ptyPackages) {
        Write-Host "  - 尝试安装 $pkg..." -ForegroundColor Gray
        try {
            npm install $pkg --save-optional
            Write-Host "  ✅ 成功安装 $pkg" -ForegroundColor Green
            return $true
        } catch {
            Write-Host "  ❌ 安装 $pkg 失败" -ForegroundColor Red
        }
    }

    Write-Host "❌ 所有 PTY 包安装都失败了" -ForegroundColor Red
    Write-Host "💡 picagent 会在启动时自动尝试安装" -ForegroundColor Cyan
    return $false
}

# 函数：安装 Claude Code
function Install-Claude {
    if (-not (Test-Command "claude")) {
        Write-Host "📦 正在安装 Claude Code..." -ForegroundColor Yellow

        # 检查是否有 winget
        if (Test-Command "winget") {
            # 尝试搜索 Claude 包
            $searchResult = winget search claude 2>&1
            if ($searchResult -match "Claude") {
                winget install claude
            } else {
                Write-Host "⚠️  请手动下载 Claude Code:" -ForegroundColor Red
                Write-Host "   👉 https://claude.ai/download" -ForegroundColor Yellow
                Start-Process "https://claude.ai/download"
            }
        } else {
            Write-Host "⚠️  请手动下载 Claude Code:" -ForegroundColor Red
            Write-Host "   👉 https://claude.ai/download" -ForegroundColor Yellow
            Start-Process "https://claude.ai/download"
        }
    } else {
        Write-Host "✅ Claude Code 已安装" -ForegroundColor Green
    }
}

# 函数：配置 MCP
function Configure-MCP {
    Write-Host ""
    Write-Host "📦 配置即梦 MCP..." -ForegroundColor Yellow

    # 检查是否已配置
    $mcpList = claude mcp list 2>&1
    if ($mcpList -match "jimeng") {
        Write-Host "✅ 即梦 MCP 已配置" -ForegroundColor Green
    } else {
        $response = Read-Host "是否现在配置即梦 MCP？(y/n)"
        if ($response -eq "y") {
            $apiKey = Read-Host "请输入即梦 API Key"

            Write-Host "正在配置即梦 MCP..." -ForegroundColor Gray

            $config = @"
{
    "command": "npx",
    "args": ["jimeng-apicore-mcp"],
    "env": {
        "APICORE_API_KEY": "$apiKey",
        "JIMENG_OUTPUT_DIR": "$env:USERPROFILE\Pictures\jimeng"
    }
}
"@

            claude mcp add-json jimeng-apicore $config

            Write-Host "✅ MCP 配置完成" -ForegroundColor Green
        }
    }
}

# 函数：检查管理员权限
function Test-Administrator {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# 主流程
function Main {
    Write-Host "开始安装依赖..." -ForegroundColor Cyan
    Write-Host ""

    # 检查是否有管理员权限
    if (-not (Test-Administrator)) {
        Write-Host "⚠️  某些安装可能需要管理员权限" -ForegroundColor Yellow
        Write-Host "   如果安装失败，请以管理员身份运行此脚本" -ForegroundColor Yellow
        Write-Host ""
    }

    # 安装各个组件
    $nodeOk = Install-NodeJS
    if ($nodeOk) {
        Install-JimengMCP

        # Windows 特有：安装构建工具和PTY依赖
        Write-Host "🔧 配置 Windows 开发环境..." -ForegroundColor Cyan
        Install-WindowsBuildTools
        Install-NodePtyDeps
    }
    Install-Claude

    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "  依赖检查完成" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""

    # 最终检查
    Write-Host "📋 最终状态：" -ForegroundColor Cyan
    Write-Host ""

    if (Test-Command "node") {
        $version = node --version 2>&1
        Write-Host "✅ Node.js: $version" -ForegroundColor Green
    } else {
        Write-Host "❌ Node.js: 未安装" -ForegroundColor Red
    }

    if (Test-Command "npm") {
        $version = npm --version 2>&1
        Write-Host "✅ npm: $version" -ForegroundColor Green
    } else {
        Write-Host "❌ npm: 未安装" -ForegroundColor Red
    }

    if (Test-Command "claude") {
        Write-Host "✅ Claude Code: 已安装" -ForegroundColor Green
    } else {
        Write-Host "❌ Claude Code: 未安装" -ForegroundColor Red
    }

    Write-Host ""

    # 询问是否配置 MCP
    Configure-MCP

    Write-Host ""
    Write-Host "🎉 安装脚本执行完成！" -ForegroundColor Green
    Write-Host ""
    Write-Host "现在可以运行 PicAgent：" -ForegroundColor Cyan
    Write-Host "  .\picagent-win.exe" -ForegroundColor Yellow
    Write-Host ""

    Write-Host "按任意键退出..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# 运行主流程
Main