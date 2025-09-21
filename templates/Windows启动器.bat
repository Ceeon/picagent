@echo off
chcp 65001 > nul
title PicAgent - 即梦工作站

:: PicAgent 启动器 - Windows
:: Agent × MCP : 即梦工作站

cls
echo ╔══════════════════════════════════════════════╗
echo ║          PicAgent - 即梦工作站                ║
echo ║          AI 图片生成智能工作台                 ║
echo ╚══════════════════════════════════════════════╝
echo.

:: 检查 Node.js 是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到 Node.js
    echo 请先安装 Node.js: https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: 检查 picagent 命令是否可用
where picagent >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 picagent 命令
    echo.
    echo 请先安装 PicAgent:
    echo npm install -g @chengfeng2025/picagent-jimeng
    echo.
    pause
    exit /b 1
)

:: 检查端口是否被占用
netstat -an | findstr :3004 | findstr LISTENING >nul 2>nul
if %errorlevel% equ 0 (
    echo ⚠️  检测到端口 3004 已被占用
    echo.
    set /p response="是否尝试清理旧进程？(y/n): "
    
    if /i "%response%"=="y" (
        echo 正在清理旧进程...
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3004 ^| findstr LISTENING') do (
            taskkill /f /pid %%a >nul 2>nul
        )
        timeout /t 1 /nobreak >nul
        echo ✅ 已清理端口
        echo.
    ) else (
        echo 请手动停止占用端口 3004 的程序后重试
        pause
        exit /b 1
    )
)

:: 启动 PicAgent
echo 🚀 正在启动 PicAgent...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 提示: 按 Ctrl+C 可以停止服务
echo.

:: 运行 picagent
call picagent

:: 如果程序退出，等待用户按键
echo.
echo 服务已停止。
pause