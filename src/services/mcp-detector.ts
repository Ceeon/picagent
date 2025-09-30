import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';

const execAsync = promisify(exec);

export interface MCPStatus {
  name: string;
  installed: boolean;
  configured: boolean;
  apiKeyValid: boolean;
  errorMessage?: string;
}

export class MCPDetector {
  private mcpList: string[] = ['jimeng-apicore', 'jimeng-volcengine', 'gemini-apicore'];
  private cache: { [key: string]: { status: MCPStatus; timestamp: number } } = {};
  private cacheTimeout = 5000; // 5秒缓存

  async checkAllStatus(forceRefresh: boolean = false): Promise<MCPStatus[]> {
    const results: MCPStatus[] = [];

    for (const mcp of this.mcpList) {
      const status = await this.checkStatus(mcp, forceRefresh);
      results.push(status);
    }

    return results;
  }

  async checkStatus(mcpName: string, forceRefresh: boolean = false): Promise<MCPStatus> {
    try {
      // 使用完整的用户环境执行命令，确保与用户终端环境一致
      const { stdout } = await execAsync('claude mcp list', {
        env: {
          ...process.env,                           // 继承现有环境变量
          HOME: os.homedir(),                       // 确保使用当前用户主目录
          USER: os.userInfo().username              // 确保使用当前用户名
        },
        cwd: os.homedir()                          // 在用户主目录执行命令
      });

      console.log(`检测 ${mcpName}，claude mcp list 输出:`, stdout);

      // 直接检查：如果输出中根本没有这个MCP名称，说明未安装
      if (!stdout.includes(mcpName)) {
        return {
          name: mcpName,
          installed: false,
          configured: false,
          apiKeyValid: false
        };
      }

      // 如果有这个名称，再检查是否Connected
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.includes(mcpName)) {
          const isConnected = line.toLowerCase().includes('connected');
          console.log(`${mcpName} 状态行: "${line}", Connected: ${isConnected}`);

          return {
            name: mcpName,
            installed: true,
            configured: isConnected,
            apiKeyValid: isConnected
          };
        }
      }

      // 如果找到名称但没找到对应行，认为已安装但未配置
      return {
        name: mcpName,
        installed: true,
        configured: false,
        apiKeyValid: false
      };

    } catch (error: any) {
      console.error(`检测 ${mcpName} 时出错:`, error.message);
      return {
        name: mcpName,
        installed: false,
        configured: false,
        apiKeyValid: false,
        errorMessage: error.message
      };
    }
  }

  private async checkConfiguration(mcpName: string): Promise<{ configured: boolean; apiKeyValid: boolean }> {
    try {
      // claude mcp inspect 命令可能不存在，我们直接从list结果判断
      const { stdout } = await execAsync('claude mcp list', {
        env: {
          ...process.env,
          HOME: os.homedir(),
          USER: os.userInfo().username
        },
        cwd: os.homedir()
      });

      if (stdout.includes(mcpName) && stdout.includes('Connected')) {
        return { configured: true, apiKeyValid: true };
      }

      return { configured: false, apiKeyValid: false };
    } catch {
      return { configured: false, apiKeyValid: false };
    }
  }

  async installMCP(mcpName: string): Promise<{ success: boolean; message: string }> {
    try {
      // 根据MCP类型构建正确的安装命令
      let command = '';
      
      if (mcpName === 'jimeng-apicore') {
        // 使用add-json命令添加jimeng-apicore配置
        const config = {
          command: "npx",
          args: ["jimeng-apicore-mcp"]
        };
        command = `claude mcp add-json ${mcpName} '${JSON.stringify(config)}'`;
      } else if (mcpName === 'jimeng-volcengine') {
        // 使用add-json命令添加jimeng-volcengine配置
        const config = {
          command: "npx",
          args: ["jimeng-volcengine-mcp"]
        };
        command = `claude mcp add-json ${mcpName} '${JSON.stringify(config)}'`;
      } else if (mcpName === 'gemini-apicore') {
        // 使用add-json命令添加gemini-apicore配置
        const config = {
          command: "npx",
          args: ["gemini-apicore-mcp"]
        };
        command = `claude mcp add-json ${mcpName} '${JSON.stringify(config)}'`;
      } else {
        return { success: false, message: '未知的MCP类型' };
      }
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('Successfully')) {
        return { success: false, message: stderr };
      }
      
      return { success: true, message: '安装成功' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async testMCPConnection(mcpName: string): Promise<{ success: boolean; message: string }> {
    try {
      // MCP 测试应该通过检查配置和状态来验证，而不是运行命令
      // 因为 claude mcp 没有 run 命令
      const status = await this.checkStatus(mcpName);
      
      if (!status.installed) {
        return { success: false, message: 'MCP未安装' };
      }
      
      if (!status.configured) {
        return { success: false, message: 'MCP未配置' };
      }
      
      if (!status.apiKeyValid) {
        return { success: false, message: 'API Key无效或未配置' };
      }
      
      return { success: true, message: '配置有效' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}

export const mcpDetector = new MCPDetector();