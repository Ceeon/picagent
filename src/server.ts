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