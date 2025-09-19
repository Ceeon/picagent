import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface MCPStatus {
  name: string;
  installed: boolean;
  configured: boolean;
  apiKeyValid: boolean;
  errorMessage?: string;
}

export class MCPDetector {
  private mcpList: string[] = ['jimeng-apicore', 'jimeng-volcengine'];

  async checkAllStatus(): Promise<MCPStatus[]> {
    const results: MCPStatus[] = [];
    
    for (const mcp of this.mcpList) {
      const status = await this.checkStatus(mcp);
      results.push(status);
    }
    
    return results;
  }

  async checkStatus(mcpName: string): Promise<MCPStatus> {
    const status: MCPStatus = {
      name: mcpName,
      installed: false,
      configured: false,
      apiKeyValid: false
    };

    try {
      // 增加超时时间，确保获取完整输出
      const { stdout } = await execAsync('claude mcp list', { 
        timeout: 5000,
        maxBuffer: 1024 * 1024 
      });
      
      // Check if MCP is listed - look for exact match at line start
      const lines = stdout.split('\n');
      
      for (const line of lines) {
        // Check if line starts with the MCP name followed by a colon
        if (line.startsWith(`${mcpName}:`)) {
          status.installed = true;
          
          // Check if it's connected
          if (line.includes('✓ Connected') || line.includes('Connected')) {
            status.configured = true;
            status.apiKeyValid = true;
          }
          break;
        }
      }
    } catch (error: any) {
      status.errorMessage = error.message;
      
      if (error.message.includes('command not found')) {
        status.errorMessage = 'Claude CLI 未安装';
      }
    }

    return status;
  }

  private async checkConfiguration(mcpName: string): Promise<{ configured: boolean; apiKeyValid: boolean }> {
    try {
      // claude mcp inspect 命令可能不存在，我们直接从list结果判断
      const { stdout } = await execAsync('claude mcp list');
      
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
          command: "uvx",
          args: ["jimeng-mcp-apicore"]
        };
        command = `claude mcp add-json ${mcpName} '${JSON.stringify(config)}'`;
      } else if (mcpName === 'jimeng-volcengine') {
        // 使用add-json命令添加jimeng-volcengine配置
        const config = {
          command: "uvx",
          args: ["jimeng-mcp-volcengine"]
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