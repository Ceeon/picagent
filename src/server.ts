import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { openBrowser } from './utils/browser';
import { setupWebSocket } from './services/websocket';
import apiRoutes from './routes/api';
import mcpRoutes from './routes/mcp';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3004;

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

server.listen(PORT, () => {
  console.log(`\n🚀 PicAgent 服务已启动`);
  console.log(`📍 访问地址: http://localhost:${PORT}`);
  console.log(`\n提示: 正在自动打开浏览器...\n`);
  
  openBrowser(`http://localhost:${PORT}`);
});

export default server;