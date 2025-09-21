#!/usr/bin/env node

/**
 * PicAgent 安装后脚本
 * 自动在桌面创建 PicAgent-Tools 目录并复制启动器
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// 获取桌面路径
function getDesktopPath() {
  const homeDir = os.homedir();
  
  // Windows
  if (process.platform === 'win32') {
    // 尝试使用 PowerShell 获取桌面路径
    try {
      const cmd = 'powershell -command "[Environment]::GetFolderPath(\'Desktop\')"';
      const desktop = execSync(cmd, { encoding: 'utf8' }).trim();
      if (desktop && fs.existsSync(desktop)) {
        return desktop;
      }
    } catch (e) {
      // 忽略错误，使用默认路径
    }
    return path.join(homeDir, 'Desktop');
  }
  
  // macOS 和 Linux
  return path.join(homeDir, 'Desktop');
}

// 主函数
function main() {
  try {
    console.log('\n📦 正在安装 PicAgent 启动器...\n');
    
    // 获取相关路径
    const desktopPath = getDesktopPath();
    const toolsDir = path.join(desktopPath, 'PicAgent-Tools');
    const templatesDir = path.join(__dirname, '..', 'templates');
    
    // 检查桌面是否存在
    if (!fs.existsSync(desktopPath)) {
      console.log('⚠️  未找到桌面目录，跳过启动器安装');
      console.log('   您可以通过命令行运行: picagent');
      return;
    }
    
    // 创建 PicAgent-Tools 目录
    if (!fs.existsSync(toolsDir)) {
      fs.mkdirSync(toolsDir, { recursive: true });
      console.log('✅ 创建目录: ~/Desktop/PicAgent-Tools/');
    } else {
      console.log('📁 目录已存在: ~/Desktop/PicAgent-Tools/');
    }
    
    // 复制对应平台的启动器
    if (process.platform === 'darwin') {
      // macOS
      const sourcePath = path.join(templatesDir, 'Mac启动器.command');
      const targetPath = path.join(toolsDir, 'Mac启动器.command');
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        // 设置可执行权限
        fs.chmodSync(targetPath, '755');
        console.log('✅ 已安装 Mac 启动器');
      }
    } else if (process.platform === 'win32') {
      // Windows
      const sourcePath = path.join(templatesDir, 'Windows启动器.bat');
      const targetPath = path.join(toolsDir, 'Windows启动器.bat');
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log('✅ 已安装 Windows 启动器');
      }
    }
    
    // 同时复制另一个平台的启动器（供多平台用户使用）
    const otherLaunchers = [
      { source: 'Mac启动器.command', target: 'Mac启动器.command', platform: 'darwin' },
      { source: 'Windows启动器.bat', target: 'Windows启动器.bat', platform: 'win32' }
    ];
    
    otherLaunchers.forEach(launcher => {
      if (process.platform !== launcher.platform) {
        const sourcePath = path.join(templatesDir, launcher.source);
        const targetPath = path.join(toolsDir, launcher.target);
        
        if (fs.existsSync(sourcePath) && !fs.existsSync(targetPath)) {
          fs.copyFileSync(sourcePath, targetPath);
          if (launcher.platform === 'darwin') {
            try {
              fs.chmodSync(targetPath, '755');
            } catch (e) {
              // Windows 上可能无法设置权限，忽略
            }
          }
        }
      }
    });
    
    // 显示成功信息
    console.log('\n' + '='.repeat(50));
    console.log('\n✅ PicAgent 已成功安装！\n');
    console.log('📁 启动器位置: ~/Desktop/PicAgent-Tools/\n');
    console.log('🚀 使用方法:');
    console.log('   方法1: 命令行输入 picagent');
    console.log('   方法2: 双击桌面 PicAgent-Tools 中的启动器\n');
    
    if (process.platform === 'darwin') {
      console.log('💡 Mac 用户提示:');
      console.log('   • 首次运行可能需要在"系统偏好设置>安全性"中允许');
      console.log('   • 可将启动器拖到 Dock 栏创建快捷方式\n');
    } else if (process.platform === 'win32') {
      console.log('💡 Windows 用户提示:');
      console.log('   • 可右键启动器选择"发送到>桌面快捷方式"');
      console.log('   • 可将启动器固定到任务栏\n');
    }
    
    console.log('📖 项目主页: https://github.com/Ceeon/picagent');
    console.log('='.repeat(50) + '\n');
    
  } catch (error) {
    console.error('⚠️  安装启动器时出现错误:', error.message);
    console.log('   您仍可以通过命令行运行: picagent');
  }
}

// 仅在作为 npm postinstall 脚本运行时执行
if (process.env.npm_lifecycle_event === 'postinstall') {
  main();
}

// 导出函数供其他脚本使用
module.exports = { getDesktopPath, main };