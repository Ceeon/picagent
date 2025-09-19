# PicAgent - 智能Agent操控中心

通过Web UI调用Claude Code和MCP进行智能创作的工具。

## 特性

- 🎨 **即梦AI创作** - 通过GUI快速配置生成图片
- 💻 **Claude智能终端** - 集成终端执行Claude命令
- 🔌 **MCP双版本支持** - 支持jimeng-apicore和jimeng-volcengine
- 🎯 **新拟态设计** - 现代化的UI设计风格
- 🚀 **一键启动** - npx直接运行，无需全局安装

## 快速开始

### 方式1：npx直接运行（推荐）

```bash
npx picagent
```

### 方式2：全局安装

```bash
npm install -g picagent
picagent
```

### 方式3：本地开发

```bash
# 克隆项目
git clone <repository-url>
cd picagent

# 安装依赖
npm install

# 编译TypeScript
npm run build

# 启动服务
npm start

# 或者开发模式
npm run dev
```

## 使用说明

1. 启动后自动打开浏览器访问 `http://localhost:3004`
2. 左侧GUI配置即梦AI参数
3. 右侧Claude终端执行命令
4. MCP未配置时会有引导提示
5. 支持文件拖拽上传参考图片

## MCP配置

### jimeng-apicore（APICore版本）

```bash
# 安装
claude mcp add jimeng-apicore

# 配置API Key
export APICORE_API_KEY="sk-your-api-key"

# 获取API Key
https://api.apicore.ai
```

### jimeng-volcengine（火山引擎版本）

```bash
# 安装
claude mcp add jimeng-volcengine

# 配置API Key
export ARK_API_KEY="sk-your-volcengine-key"

# 获取API Key
https://console.volcengine.com
```

## 功能特点

### GUI配置
- 提示词输入
- 参考图片上传（支持拖拽）
- 尺寸选择（1:1, 16:9, 9:16）
- 高级选项（组图生成、流式输出、水印）

### 智能终端
- 实时命令执行
- Claude命令支持
- MCP状态检测
- 输出实时显示

### MCP管理
- 自动检测安装状态
- API Key验证
- 一键安装配置
- 连接测试

## 技术栈

- **后端**: Node.js + Express + TypeScript
- **前端**: 原生HTML/CSS/JavaScript + 新拟态设计
- **终端**: node-pty + xterm.js
- **通信**: Socket.io WebSocket
- **CLI**: Claude Code集成

## 系统要求

- Node.js >= 16.0.0
- Claude CLI已安装
- MCP环境配置（可选）

## 开发

```bash
# 监听模式编译
npm run watch

# 开发服务器
npm run dev
```

## License

MIT