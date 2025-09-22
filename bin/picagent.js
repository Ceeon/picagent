#!/usr/bin/env node

/**
 * PicAgent CLI 入口
 * Agent × MCP : 即梦工作站
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// 获取项目根目录
const rootDir = path.resolve(__dirname, '..');
const serverFile = path.join(rootDir, 'dist', 'server.js');

// 检查是否已经构建
if (!fs.existsSync(serverFile)) {
  console.log('⚙️  首次运行，正在构建项目...');
  
  // Windows 需要特殊处理
  const isWindows = os.platform() === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';

  // 运行构建
  const build = spawn(npmCmd, ['run', 'build'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true
  });
  
  build.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ 构建失败，请检查错误信息');
      process.exit(1);
    }
    startServer();
  });
} else {
  startServer();
}

function startServer() {
  console.log(`
╔════════════════════════════════════════════╗
║     Agent × MCP : 即梦工作站              ║
║     AI 图片生成智能工作台                  ║
╚════════════════════════════════════════════╝
`);

  // Windows 需要特殊处理
  const isWindows = os.platform() === 'win32';
  const nodeCmd = isWindows ? 'node.exe' : 'node';

  // 启动服务器
  const server = spawn(nodeCmd, [serverFile], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: isWindows // Windows 需要 shell: true
  });

  // 处理退出信号
  process.on('SIGINT', () => {
    console.log('\n👋 正在关闭 PicAgent 服务...');
    server.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    server.kill('SIGTERM');
    process.exit(0);
  });

  server.on('error', (err) => {
    console.error('❌ 启动失败:', err.message);
    process.exit(1);
  });

  server.on('close', (code) => {
    if (code !== null) {
      console.log(`服务器退出，代码: ${code}`);
      process.exit(code);
    }
  });
}