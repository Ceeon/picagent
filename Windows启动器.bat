@echo off
chcp 65001 >nul
title PicAgent MCP 管理工具

echo ╔══════════════════════════════════════════════╗
echo ║          PicAgent MCP 管理工具               ║
echo ║          即梦AI 配置管理系统                 ║
echo ╚══════════════════════════════════════════════╝
echo.

REM 切换到脚本所在目录
cd /d "%~dp0"

REM 检查 Node.js 是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到 Node.js
    echo 请先安装 Node.js: https://nodejs.org
    echo.
    echo 按任意键退出...
    pause >nul
    exit /b 1
)

REM 检查依赖
if not exist "node_modules" (
    echo 📦 首次运行，正在安装依赖...
    echo 这可能需要几分钟时间，请耐心等待...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        echo 按任意键退出...
        pause >nul
        exit /b 1
    )
    echo ✅ 依赖安装完成
    echo.
)

REM 编译 TypeScript
if not exist "dist" (
    echo 🔨 正在编译代码...
    call npm run build
    if %errorlevel% neq 0 (
        echo ❌ 编译失败
        echo 按任意键退出...
        pause >nul
        exit /b 1
    )
    echo ✅ 编译完成
    echo.
)

REM 检查并清理端口
set PORT=3004
netstat -ano | findstr :%PORT% >nul 2>&1
if %errorlevel% == 0 (
    echo ⚠️  检测到端口 %PORT% 已被占用
    echo 正在尝试清理旧进程...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT%') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 1 /nobreak >nul
    echo ✅ 已清理端口
    echo.
)

REM 启动服务
echo 🚀 正在启动服务...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 提示: 按 Ctrl+C 可以停止服务
echo.

REM 启动应用
call npm start

REM 如果程序退出
echo.
echo 服务已停止。按任意键关闭窗口...
pause >nul