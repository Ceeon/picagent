import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { openBrowser } from './utils/browser';
import { setupWebSocket } from './services/websocket';
import apiRoutes from './routes/api';
import mcpRoutes from './routes/mcp';
import * as net from 'net';
import { dependencyChecker } from './deps-check';
import { ptyInstaller } from './services/pty-installer';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 支持通过环境变量或命令行参数设置端口
const DEFAULT_PORT = 3004;
const PREFERRED_PORT = Number(process.env.PORT || process.argv[2] || DEFAULT_PORT);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', apiRoutes);
app.use('/api/mcp', mcpRoutes);

setupWebSocket(io);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/mcp', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/mcp.html'));
});


// 查找可用端口
async function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve) => {
    const testServer = net.createServer();
    
    testServer.listen(startPort, () => {
      const port = (testServer.address() as net.AddressInfo).port;
      testServer.close(() => resolve(port));
    });
    
    testServer.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        // 端口被占用，尝试下一个
        console.log(`⚠️  端口 ${startPort} 已被占用，尝试端口 ${startPort + 1}...`);
        resolve(findAvailablePort(startPort + 1));
      } else {
        // 其他错误，使用下一个端口
        resolve(findAvailablePort(startPort + 1));
      }
    });
  });
}

// 启动服务器
async function startServer() {
  try {
    // 检查是否跳过依赖检查
    const skipDepsCheck = process.argv.includes('--skip-deps-check');
    const autoInstall = process.argv.includes('--auto-install');

    if (!skipDepsCheck) {
      console.log('\n🔍 PicAgent 启动前检查\n');
      console.log('=' .repeat(50));

      // 自动安装模式
      if (autoInstall) {
        console.log('📦 自动安装模式已启用\n');
        await dependencyChecker.autoInstallDependencies();

        // 同时检查和安装PTY依赖
        console.log('🔧 检查终端模块依赖...\n');
        const ptyStatus = await ptyInstaller.checkAvailability();

        if (!ptyStatus.available) {
          console.log('⚠️  终端模块不可用，尝试自动安装...');
          const installResult = await ptyInstaller.autoInstall();

          if (installResult.success) {
            console.log(`✅ ${installResult.message}`);
            if (installResult.needsRestart) {
              console.log('💡 某些终端功能需要重启应用才能使用');
            }
          } else {
            console.log(`⚠️  ${installResult.message}`);
            console.log('💡 终端功能可能受限，但Web界面仍可正常使用');
          }
          console.log();
        } else {
          console.log(`✅ 终端模块已就绪: ${ptyStatus.packageName}`);
        }
      }

      // 检查依赖
      const depsReady = await dependencyChecker.waitForDependencies();

      if (!depsReady) {
        console.log('\n💡 提示：');
        console.log('  1. 手动安装依赖后重新运行');
        console.log('  2. 使用 --auto-install 自动安装依赖');
        console.log('  3. 使用 --skip-deps-check 跳过检查（部分功能可能不可用）\n');

        if (!autoInstall) {
          console.log('是否自动安装缺失的依赖？运行：');
          console.log('  npm start -- --auto-install\n');
        }

        process.exit(1);
      }

      // 非自动安装模式下也检查PTY状态
      if (!autoInstall) {
        console.log('🔧 检查终端模块...');
        const ptyStatus = await ptyInstaller.checkAvailability();

        if (!ptyStatus.available) {
          console.log('⚠️  终端模块不可用');
          console.log('💡 建议运行 npm start -- --auto-install 自动安装所需依赖');
        } else {
          console.log(`✅ 终端模块: ${ptyStatus.packageName}`);
        }
        console.log();
      }

      console.log('=' .repeat(50));
    } else {
      console.log('\n⚠️  已跳过依赖检查，部分功能可能不可用\n');
    }

    const availablePort = await findAvailablePort(PREFERRED_PORT);

    server.listen(availablePort, () => {
      console.log(`\n🚀 PicAgent 服务已启动`);
      console.log(`📍 访问地址: http://localhost:${availablePort}`);

      if (availablePort !== PREFERRED_PORT) {
        console.log(`ℹ️  提示: 原端口 ${PREFERRED_PORT} 被占用，已自动切换到端口 ${availablePort}`);
      }

      console.log(`\n提示: 正在自动打开浏览器...\n`);
      openBrowser(`http://localhost:${availablePort}`);
    });
  } catch (error) {
    console.error('❌ 启动服务器失败:', error);
    process.exit(1);
  }
}

startServer();

export default server;