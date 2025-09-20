# Agent × MCP : 即梦工作站

<div align="center">

![Version](https://img.shields.io/npm/v/@chengfeng2025/picagent-jimeng)
![License](https://img.shields.io/npm/l/@chengfeng2025/picagent-jimeng)
![Node](https://img.shields.io/node/v/@chengfeng2025/picagent-jimeng)

**AI 图片生成智能工作台 - 以 Agent 为中心的创作平台**

[快速开始](#快速开始) • [功能特性](#功能特性) • [使用指南](#使用指南) • [API 文档](#api-文档)

</div>

## 简介

Agent × MCP : 即梦工作站是一个以 **Agent 为操控中心**的智能交互系统，通过统一的智能核心处理用户意图，智能调度执行 AI 图片生成任务。

### 核心特性

- 🤖 **Agent 中心化** - 所有交互和执行都通过中央 Agent 协调
- 🎨 **即梦 AI 集成** - 专注图片生成的 MCP 服务集成
- 📚 **案例驱动学习** - 通过风格案例库降低提示词学习门槛
- 🚀 **简单部署** - Node.js 单服务启动，自动打开浏览器
- 💡 **智能提示词组合** - Agent 自动优化和组合提示词
- 🖼️ **实时图库管理** - 自动监听和展示生成结果

## 快速开始

### 安装方式

#### 方式一：NPX 运行（推荐，无需安装）

```bash
npx @chengfeng2025/picagent-jimeng
```

#### 方式二：全局安装

```bash
# 安装
npm install -g @chengfeng2025/picagent-jimeng

# 运行
picagent
```

#### 方式三：从源码运行

```bash
# 克隆项目
git clone https://github.com/yourusername/picagent.git
cd picagent

# 安装依赖
npm install

# 启动服务
npm start
```

### 首次使用

1. 启动服务后会自动打开浏览器访问 `http://localhost:3004`
2. 点击右上角 "管理 MCP" 配置即梦 API
3. 输入 API Key 和输出目录
4. 返回主界面开始创作

## 功能特性

### 1. Agent 智能协调

- 理解用户意图
- 智能组合提示词
- 自动调度任务执行
- 透明展示思考过程

### 2. MCP 管理中心

- 支持 jimeng-apicore 和 jimeng-volcengine 双版本
- 一键安装和配置
- 实时状态检测
- API Key 安全管理

### 3. 数据管理系统

- Handsontable 表格编辑器
- 100+ 风格案例模板
- 服务端文件持久化
- 批量导入导出

### 4. 图库管理

- 自动加载生成结果
- 缩略图预览
- 时间戳排序
- 一键打开文件夹

## 使用指南

### 配置 MCP

1. 获取 API Key
   - APICore: https://api.apicore.ai
   - 火山引擎: https://console.volcengine.com

2. 在 MCP 管理页面配置
   ```
   API Key: sk-your-api-key
   输出目录: /Users/yourname/Pictures/jimeng
   ```

### 生成图片

1. **选择风格模板** - 从下拉列表选择预设风格
2. **输入用户需求** - 描述你想要的具体内容
3. **点击生成** - Agent 自动组合提示词并执行
4. **查看结果** - 图片自动加载到画廊

### 编辑模板

访问 `http://localhost:3004/handsontable-editor.html` 编辑风格模板：

- 添加新模板
- 编辑提示词
- 设置标签
- 导出 JS 文件

## API 文档

### REST API

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/covers` | GET | 获取所有封面模板 |
| `/api/covers` | POST | 保存封面模板 |
| `/api/gallery` | GET | 获取图片列表 |
| `/api/image/:filename` | GET | 获取单张图片 |
| `/api/open-folder` | POST | 打开输出文件夹 |

### WebSocket 事件

```javascript
// Agent 执行
socket.emit('agent:execute', {
  prompt: '风格提示词',
  userRequirements: '用户需求'
});

// MCP 管理
socket.emit('mcp:check');
socket.emit('mcp:install', { name, config });
socket.emit('mcp:remove', name);
```

## 系统要求

- Node.js >= 16.0.0
- macOS / Windows / Linux
- Claude Desktop App（用于 MCP）

## 项目结构

```
picagent/
├── dist/           # 编译输出
├── public/         # 前端文件
├── src/            # TypeScript 源码
│   ├── routes/     # API 路由
│   └── services/   # 后端服务
├── bin/            # CLI 入口
└── package.json
```

## 开发

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 监听模式
npm run watch
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

- GitHub: [https://github.com/yourusername/picagent](https://github.com/yourusername/picagent)
- Issues: [https://github.com/yourusername/picagent/issues](https://github.com/yourusername/picagent/issues)

---

<div align="center">
Made with ❤️ by PicAgent Team
</div>