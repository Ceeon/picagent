# PicAgent 独立版安装指南

## 快速开始

### 下载独立版程序

根据您的操作系统下载对应版本：

- **Windows**: `picagent-win.exe` (约 60MB)
- **macOS**: `picagent-mac` (约 60MB)
- **Linux**: `picagent-linux` (约 60MB)

### 运行方式

#### Windows
1. 双击 `picagent-win.exe`
2. 首次运行会自动检测依赖
3. 根据提示安装缺失的依赖

#### macOS/Linux
```bash
# 添加执行权限
chmod +x picagent-mac  # 或 picagent-linux

# 运行程序
./picagent-mac  # 或 ./picagent-linux
```

## 依赖要求

PicAgent 独立版**不需要安装 Node.js**，但需要以下系统依赖：

### 必需依赖
- **Claude Code CLI** - AI 编程助手
- **Node.js 14+** - 运行即梦 MCP 服务

## 自动安装依赖

### 方式一：自动安装模式

首次运行时使用自动安装参数：

```bash
# Windows
picagent-win.exe --auto-install

# macOS/Linux
./picagent-mac --auto-install
```

程序会自动：
1. 检测缺失的依赖
2. 调用系统包管理器安装
3. 配置必要的环境

### 方式二：运行安装脚本

我们提供了独立的安装脚本：

#### Windows (PowerShell)
```powershell
# 以管理员身份运行
.\scripts\install-deps.ps1
```

#### macOS/Linux (Bash)
```bash
./scripts/install-deps.sh
```

### 方式三：手动安装

#### 1. 安装 Python
- **Windows**:
  ```powershell
  winget install Python.Python.3.12
  ```
- **macOS**:
  ```bash
  brew install python@3.12
  ```
- **Linux**:
  ```bash
  sudo apt install python3.12
  ```

#### 2. 安装 Claude Code
访问 https://claude.ai/download 下载安装

#### 3. 安装即梦 MCP 服务
```bash
npm install -g jimeng-apicore-mcp jimeng-volcengine-mcp
```

## 运行参数

```bash
# 跳过依赖检查（部分功能可能不可用）
./picagent-mac --skip-deps-check

# 自动安装缺失的依赖
./picagent-mac --auto-install

# 指定端口
./picagent-mac 8080
```

## 首次配置

### 配置即梦 MCP

首次运行后，需要配置即梦 API：

1. 访问 http://localhost:3004/mcp
2. 输入您的即梦 API Key
3. 点击"通过 Claude 配置"
4. Claude 会自动完成配置

## 常见问题

### Q: 提示"Claude Code 未安装"
A: 请访问 https://claude.ai/download 下载并安装 Claude Code

### Q: 提示"Python 未安装"
A: 运行 `--auto-install` 参数自动安装，或手动安装 Python 3.8+

### Q: 端口被占用
A: 程序会自动寻找可用端口，或手动指定：`./picagent-mac 8080`

### Q: Windows 安全警告
A: 这是因为程序未签名，选择"更多信息" → "仍要运行"即可

### Q: macOS 提示"无法打开"
A: 打开系统偏好设置 → 安全性与隐私 → 允许运行

## 卸载

直接删除可执行文件即可，不会在系统中留下其他文件。

依赖的 Python 和 Claude Code 需要单独卸载（如果不再需要）。

## 技术支持

- GitHub Issues: https://github.com/yourusername/picagent/issues
- 文档: https://github.com/yourusername/picagent/wiki

## 版本信息

- 当前版本: 1.0.8
- 文件大小: 约 60MB
- 包含组件: Node.js 运行时 + PicAgent 应用

---

💡 **提示**: 独立版包含完整的 Node.js 运行时，无需安装 Node.js 即可运行！