# Agent × MCP : 即梦工作站

> 一个以 **Agent 为操控中心**的智能交互系统，支持多种交互形式（GUI、终端、MCP），通过统一的智能核心处理用户意图，智能调度执行图片生成任务。

## ✨ 核心特性

- 🤖 **Agent 中心化** - 所有交互和执行都通过中央 Agent 协调
- 🎨 **即梦 AI 集成** - 专注图片生成的 MCP 服务集成
- 📚 **案例驱动学习** - 通过风格案例库降低提示词学习门槛
- 🚀 **简单部署** - Node.js 单服务启动，自动打开浏览器
- 💻 **跨平台支持** - Windows/Mac/Linux 完美兼容

## 📦 安装

### 方式一：NPM 全局安装（推荐）

```bash
# 安装
npm install -g @chengfeng2025/picagent-jimeng

# 启动
picagent
```

### 方式二：源码运行

```bash
# 克隆项目
git clone https://github.com/Ceeon/picagent.git
cd picagent

# 安装依赖
npm install

# 启动服务
npm start
```

### Windows 用户注意

v1.0.7+ 已完全支持 Windows，无需安装编译工具：

```bash
# 使用官方源安装（如果淘宝镜像未同步）
npm install -g @chengfeng2025/picagent-jimeng@latest --registry https://registry.npmjs.org
```

## 🏗️ 系统架构

```
                    Agent × MCP 架构设计
    ┌──────────────────────────────────────────────────┐
    │                   用户界面层                      │
    │  ┌─────────┐  ┌──────────┐  ┌──────────────┐   │
    │  │  主界面  │  │ MCP管理  │  │ 数据编辑器   │   │
    │  │  Agent   │  │  设置    │  │ Handsontable │   │
    │  └─────────┘  └──────────┘  └──────────────┘   │
    └──────────────────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  WebSocket  │
                    │   通信层    │
                    └──────┬──────┘
                           │
    ┌──────────────────────────────────────────────────┐
    │                  Agent 协调层                     │
    │  ┌────────────────────────────────────────────┐  │
    │  │            中央 Agent 控制器              │  │
    │  │  • 理解用户意图                           │  │
    │  │  • 组合提示词                             │  │
    │  │  • 调度任务执行                           │  │
    │  │  • 管理生成流程                           │  │
    │  └────────────────────────────────────────────┘  │
    └──────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
    │ 终端服务 │      │ MCP服务 │      │ 数据服务 │
    │  (PTY)  │      │ (即梦)  │      │ (Files) │
    └─────────┘      └─────────┘      └─────────┘
```

## 🎯 使用流程

### 1. 启动服务
```bash
picagent
# 或
npm start
```
服务将自动在 http://localhost:3004 启动并打开浏览器

### 2. 配置 MCP（首次使用）
点击右上角 "⚙️ 管理" 进入 MCP 管理界面：
- 输入即梦 API Key
- 设置图片输出目录
- 点击"安装/更新"

### 3. 使用 Agent 生成图片

#### 方式一：案例模板 + 用户需求
1. 从左侧选择风格模板（如"赛博朋克猫咪"）
2. 输入用户需求（如"在咖啡店"）
3. 点击"🚀 生成"

#### 方式二：直接在终端对话
在右侧终端中直接与 Claude 对话：
```
> 帮我生成一张赛博朋克风格的猫咪在咖啡店的图片
```

### 4. 查看生成结果
- 图片自动保存到配置的输出目录
- 底部画廊实时显示最新生成的图片
- 支持刷新和打开文件夹

## 💡 核心功能

### Agent 智能处理
- **意图理解** - 识别用户需求，理解风格要求
- **提示词优化** - 智能组合和优化提示词
- **任务调度** - 自动调用即梦 MCP 执行生成

### MCP 服务集成
- **即梦 API Core** - 支持 jimeng-apicore
- **即梦火山引擎** - 支持 jimeng-volcengine
- **状态监控** - 实时检测 MCP 连接状态
- **配置管理** - API Key 和输出目录设置

### 数据管理系统
- **100+ 风格模板** - 内置丰富的风格案例
- **Handsontable 编辑器** - 类 Excel 的数据管理
- **批量导入导出** - JSON 格式数据交换

### 终端交互
- **完整终端体验** - 基于 xterm.js + node-pty
- **Claude 集成** - 自动启动 claude 对话
- **实时输出** - 命令执行结果实时显示

## 🛠️ 技术栈

- **后端**: Node.js + Express + TypeScript
- **前端**: HTML + TailwindCSS + JavaScript
- **终端**: node-pty / @lydell/node-pty (预编译)
- **通信**: Socket.io WebSocket
- **数据**: Handsontable 表格编辑器
- **MCP**: Claude MCP SDK + 即梦 API

## 📁 项目结构

```
picagent/
├── src/
│   ├── services/          # 核心服务
│   │   ├── terminal.ts    # 终端服务
│   │   ├── websocket.ts   # WebSocket 通信
│   │   └── mcp-detector.ts # MCP 检测
│   ├── routes/            # API 路由
│   └── server.ts          # 主服务
├── public/                # 前端资源
│   ├── index.html         # 主界面
│   ├── mcp.html          # MCP 管理
│   └── js/               # 前端脚本
├── dist/                  # 编译输出
└── package.json
```

## 🔧 API 接口

### 数据管理
- `GET /api/covers` - 获取封面数据
- `POST /api/covers` - 保存封面数据
- `GET /api/gallery` - 获取图片列表
- `POST /api/open-folder` - 打开文件夹

### WebSocket 事件
```javascript
// Agent 执行
socket.emit('agent:execute', {
  prompt: '风格提示词',
  userRequirements: '用户需求'
})

// 终端控制
socket.emit('terminal:create', { cols: 80, rows: 24 })
socket.emit('terminal:write', 'command')

// MCP 管理
socket.emit('mcp:check')
socket.emit('mcp:install', { name, config })
```

## 📝 更新日志

### v1.0.7 (2025-09-22)
- 🐛 修复 Windows 启动脚本问题
- ✨ 改进路径解析和命令兼容性

### v1.0.6 (2025-09-22)
- ✨ 添加 @lydell/node-pty 预编译支持
- 🎯 Windows 用户无需编译工具
- 🔧 自动选择最佳 PTY 实现

### v1.0.5 (2025-09-21)
- 🐛 修复图片 URL 编码问题
- 🎨 改进图片显示效果

### v4.0 核心版本
- ✅ Agent 智能执行系统
- ✅ 数据管理系统（Handsontable）
- ✅ 图库管理功能
- ✅ 配置同步机制
- ✅ MCP 完整集成

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [GitHub 仓库](https://github.com/Ceeon/picagent)
- [NPM 包](https://www.npmjs.com/package/@chengfeng2025/picagent-jimeng)
- [即梦 AI](https://jimeng.jianying.com/)
- [Claude MCP](https://claude.ai)

---

**当前版本**: v1.0.7
**作者**: chengfeng
**技术支持**: 通过 GitHub Issues 反馈问题