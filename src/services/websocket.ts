import { Server as SocketIOServer, Socket } from 'socket.io';
import { terminalManager, TerminalSize } from './terminal';
import { mcpDetector, MCPStatus } from './mcp-detector';
import { mcpConfigManager } from './mcp-config';

export function setupWebSocket(io: SocketIOServer): void {
  io.on('connection', (socket: Socket) => {
    console.log(`新客户端连接: ${socket.id}`);

    socket.on('terminal:create', (data: { cols: number; rows: number }) => {
      const size: TerminalSize = {
        cols: data.cols || 80,
        rows: data.rows || 30
      };

      const session = terminalManager.createSession(socket.id, size);

      session.on('data', (data: string) => {
        socket.emit('terminal:data', data);
      });

      session.on('exit', () => {
        socket.emit('terminal:exit');
      });

      // 延迟发送创建成功消息，让终端有时间初始化
      setTimeout(() => {
        socket.emit('terminal:created', { sessionId: socket.id });
        // 不再发送清屏命令，让用户看到正常的 shell 提示符
      }, 100);
    });

    socket.on('terminal:write', (data: string) => {
      const session = terminalManager.getSession(socket.id);
      if (session) {
        session.write(data);
      }
    });

    socket.on('terminal:resize', (size: TerminalSize) => {
      const session = terminalManager.getSession(socket.id);
      if (session) {
        session.resize(size);
      }
    });

    socket.on('terminal:execute', async (command: string) => {
      const session = terminalManager.getSession(socket.id);
      if (session) {
        try {
          const output = await session.execute(command);
          socket.emit('terminal:execute:result', { success: true, output });
        } catch (error: any) {
          socket.emit('terminal:execute:result', { success: false, error: error.message });
        }
      }
    });

    socket.on('mcp:check', async () => {
      try {
        // 使用当前会话的终端来执行检测，但不显示命令
        const session = terminalManager.getSession(socket.id);
        if (session) {
          const output = await (session as any).executeSilent('claude mcp list');
          const statuses = parseMCPStatus(output);
          socket.emit('mcp:status', statuses);
        } else {
          // 如果没有终端会话，使用默认检测
          const statuses = await mcpDetector.checkAllStatus();
          socket.emit('mcp:status', statuses);
        }
      } catch (error: any) {
        socket.emit('mcp:error', { message: error.message });
      }
    });

    socket.on('mcp:install', async (mcpName: string, config?: any) => {
      try {
        const session = terminalManager.getSession(socket.id);
        if (session) {
          // 构建提示词，让 Claude 自己执行配置命令
          let prompt = `请帮我配置 ${mcpName} MCP，执行以下命令：\n\n`;

          if (mcpName === 'jimeng-apicore') {
            // 确保 API Key 存在
            if (!config?.apiKey) {
              socket.emit('mcp:install:result', { success: false, message: '请先输入 API Key' });
              return;
            }

            // 使用用户提供的目录或默认值
            const outputDir = config.outputDir || '~/Pictures';

            // 构建完整的命令
            prompt += `claude mcp add-json jimeng-apicore '{\n`;
            prompt += `  "command": "uvx",\n`;
            prompt += `  "args": ["jimeng-mcp-apicore"],\n`;
            prompt += `  "env": {\n`;
            prompt += `    "APICORE_API_KEY": "${config.apiKey}",\n`;
            prompt += `    "JIMENG_OUTPUT_DIR": "${outputDir}"\n`;
            prompt += `  }\n`;
            prompt += `}'`;

          } else if (mcpName === 'jimeng-volcengine') {
            // 确保 API Key 存在
            if (!config?.apiKey) {
              socket.emit('mcp:install:result', { success: false, message: '请先输入 API Key' });
              return;
            }

            // 使用用户提供的目录或默认值
            const outputDir = config.outputDir || '~/Pictures';

            // 构建完整的命令
            prompt += `claude mcp add-json jimeng-volcengine '{\n`;
            prompt += `  "command": "uvx",\n`;
            prompt += `  "args": ["jimeng-mcp-volcengine"],\n`;
            prompt += `  "env": {\n`;
            prompt += `    "ARK_API_KEY": "${config.apiKey}",\n`;
            prompt += `    "JIMENG_OUTPUT_DIR": "${outputDir}"\n`;
            prompt += `  }\n`;
            prompt += `}'`;
          }

          // 将提示词发送到终端，让 Claude 执行
          session.write(prompt + '\n');

          // 给用户反馈
          socket.emit('mcp:install:result', {
            success: true,
            message: '配置命令已发送给 Claude，请查看终端执行结果'
          });

          // 延迟检查状态
          setTimeout(() => {
            socket.emit('mcp:check');
          }, 3000);
        }
      } catch (error: any) {
        socket.emit('mcp:install:result', { success: false, message: error.message });
      }
    });

    socket.on('mcp:test', async (mcpName: string) => {
      try {
        const result = await mcpDetector.testMCPConnection(mcpName);
        socket.emit('mcp:test:result', result);
      } catch (error: any) {
        socket.emit('mcp:test:result', { success: false, message: error.message });
      }
    });

    socket.on('jimeng:generate', async (params: any) => {
      const session = terminalManager.getSession(socket.id);
      if (!session) {
        socket.emit('jimeng:error', { message: '终端会话未创建' });
        return;
      }

      try {
        // 构建发送给Agent的提示
        const agentPrompt = buildAgentPrompt(params);
        socket.emit('jimeng:command', agentPrompt);
        
        // 将提示直接发送到终端执行
        session.write(agentPrompt + '\n');
        
        socket.emit('jimeng:result', { 
          success: true, 
          message: '提示词已输入，请在终端按Enter执行' 
        });
      } catch (error: any) {
        socket.emit('jimeng:error', { message: error.message });
      }
    });

    socket.on('mcp:save-config', async (config: any) => {
      try {
        // 使用新的配置管理器保存配置
        const result = await mcpConfigManager.configureMCP({
          type: config.type,
          apiKey: config.apiKey,
          outputDir: config.outputDir
        });
        
        socket.emit('mcp:save-config:result', result);
      } catch (error: any) {
        socket.emit('mcp:save-config:result', { 
          success: false, 
          message: error.message 
        });
      }
    });

    socket.on('mcp:get-config', async () => {
      try {
        // 从本地文件读取配置
        const localConfigs = await mcpConfigManager.getLocalConfigs();
        
        const configs = {
          apicore: localConfigs['jimeng-apicore'] || {
            apiKey: '',
            outputDir: ''
          },
          volcengine: localConfigs['jimeng-volcengine'] || {
            apiKey: '',
            outputDir: ''
          }
        };
        
        // 如果本地没有配置，尝试从环境变量读取
        if (!localConfigs['jimeng-apicore'] && process.env.APICORE_API_KEY) {
          configs.apicore = {
            apiKey: process.env.APICORE_API_KEY,
            outputDir: process.env.JIMENG_OUTPUT_DIR || ''
          };
        }
        
        if (!localConfigs['jimeng-volcengine'] && process.env.ARK_API_KEY) {
          configs.volcengine = {
            apiKey: process.env.ARK_API_KEY,
            outputDir: process.env.JIMENG_OUTPUT_DIR || ''
          };
        }
        
        socket.emit('mcp:config-loaded', configs);
      } catch (error: any) {
        console.error('Failed to load config:', error);
        socket.emit('mcp:config-loaded', {
          apicore: { apiKey: '', outputDir: '' },
          volcengine: { apiKey: '', outputDir: '' }
        });
      }
    });

    socket.on('mcp:view-config', async () => {
      try {
        const session = terminalManager.getSession(socket.id);
        if (session) {
          // 显示Claude配置文件路径
          const configPath = '~/.config/claude/claude_desktop_config.json';
          session.write(`\ncat ${configPath}\n`);
          socket.emit('mcp:view-config:result', { 
            success: true 
          });
        }
      } catch (error: any) {
        socket.emit('mcp:view-config:result', { 
          success: false, 
          message: error.message 
        });
      }
    });

    socket.on('mcp:remove', async (mcpName: string) => {
      try {
        const session = terminalManager.getSession(socket.id);
        if (session) {
          // 在终端执行删除命令
          const command = `claude mcp remove ${mcpName}`;
          const output = await session.execute(command);
          
          // 判断是否成功
          const success = output.includes('Removed MCP server') || 
                         output.includes('successfully') ||
                         !output.includes('error');
          
          socket.emit('mcp:remove:result', { 
            success: success,
            message: success ? '删除成功' : output,
            mcpName: mcpName
          });
        } else {
          socket.emit('mcp:remove:result', { 
            success: false, 
            message: '终端会话未创建' 
          });
        }
      } catch (error: any) {
        socket.emit('mcp:remove:result', { 
          success: false, 
          message: error.message 
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`客户端断开连接: ${socket.id}`);
      terminalManager.destroySession(socket.id);
    });
  });
}

function buildAgentPrompt(params: any): string {
  const {
    prompt,
    userRequirements
  } = params;

  // 构建给Agent的专业提示词模板
  let agentPrompt = `你是一个AI绘画大师，结合风格和用户需求，生成绘图提示词，调用即梦MCP作图\n\n`;
  agentPrompt += `风格：${prompt}\n\n`;
  
  if (userRequirements) {
    agentPrompt += `用户需求：${userRequirements}\n`;
  }
  
  return agentPrompt;
}

function buildJimengCommand(params: any): string {
  const {
    prompt,
    size = '16:9',
    image = null,
    mcp = 'jimeng-apicore'
  } = params;

  // 构建提示信息
  let command = `使用${mcp}生成图片:\n`;
  command += `提示词: ${prompt}\n`;
  
  // 尺寸映射
  const sizeMap: { [key: string]: string } = {
    '1:1': '2048x2048',
    '16:9': '2560x1440',
    '9:16': '1440x2560',
    '3:2': '3072x2048',
    '2:3': '2048x3072',
    '4:3': '2732x2048',
    '3:4': '2048x2732',
    '21:9': '3440x1440'
  };
  
  if (size) {
    command += `尺寸: ${sizeMap[size] || size}\n`;
  }
  
  if (image) {
    command += `参考图片: ${image}\n`;
  }
  
  return command;
}

function parseMCPStatus(output: string): MCPStatus[] {
  const mcpList = ['jimeng-apicore', 'jimeng-volcengine'];
  const statuses: MCPStatus[] = [];
  
  for (const mcpName of mcpList) {
    const status: MCPStatus = {
      name: mcpName,
      installed: false,
      configured: false,
      apiKeyValid: false
    };
    
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.startsWith(`${mcpName}:`)) {
        status.installed = true;
        if (line.includes('✓ Connected') || line.includes('Connected')) {
          status.configured = true;
          status.apiKeyValid = true;
        }
        break;
      }
    }
    
    statuses.push(status);
  }
  
  return statuses;
}