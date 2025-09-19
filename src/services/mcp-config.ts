import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export interface MCPConfig {
  type: 'jimeng-apicore' | 'jimeng-volcengine';
  apiKey: string;
  outputDir: string;
}

export class MCPConfigManager {
  private configPath: string;
  private localConfigPath: string;

  constructor() {
    // Claude配置文件路径
    this.configPath = path.join(os.homedir(), '.config', 'claude', 'claude_desktop_config.json');
    // 本地配置文件路径
    this.localConfigPath = path.join(process.cwd(), 'config', 'mcp-config.json');
    this.ensureConfigDir();
  }

  /**
   * 确保配置目录存在
   */
  private async ensureConfigDir(): Promise<void> {
    try {
      const configDir = path.dirname(this.localConfigPath);
      await fs.mkdir(configDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create config directory:', error);
    }
  }

  /**
   * 添加或更新MCP配置
   */
  async configureMCP(config: MCPConfig): Promise<{ success: boolean; message: string }> {
    try {
      // 保存到本地配置
      await this.saveLocalConfig(config);
      
      // 构建MCP配置JSON
      const mcpConfig = this.buildMCPConfig(config);
      
      // 使用claude mcp add-json命令添加配置
      const command = `claude mcp add-json ${config.type} '${JSON.stringify(mcpConfig)}'`;
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('Successfully')) {
        return { success: false, message: stderr };
      }
      
      return { success: true, message: '配置已成功添加' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 保存配置到本地文件
   */
  async saveLocalConfig(config: MCPConfig): Promise<void> {
    try {
      // 读取现有配置
      let localConfigs = await this.getLocalConfigs();
      
      // 更新或添加配置
      localConfigs[config.type] = {
        apiKey: config.apiKey,
        outputDir: config.outputDir,
        updatedAt: new Date().toISOString()
      };
      
      // 保存到文件
      await fs.writeFile(
        this.localConfigPath, 
        JSON.stringify(localConfigs, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to save local config:', error);
    }
  }

  /**
   * 读取本地配置
   */
  async getLocalConfigs(): Promise<any> {
    try {
      const content = await fs.readFile(this.localConfigPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return {};
    }
  }

  /**
   * 获取指定MCP的本地配置
   */
  async getLocalConfig(type: string): Promise<any> {
    const configs = await this.getLocalConfigs();
    return configs[type] || null;
  }

  /**
   * 构建MCP配置对象
   */
  private buildMCPConfig(config: MCPConfig): any {
    if (config.type === 'jimeng-apicore') {
      return {
        command: "uvx",
        args: ["jimeng-mcp-apicore"],
        env: {
          APICORE_API_KEY: config.apiKey,
          JIMENG_OUTPUT_DIR: config.outputDir || path.join(os.homedir(), 'Pictures')
        }
      };
    } else if (config.type === 'jimeng-volcengine') {
      return {
        command: "uvx",
        args: ["jimeng-mcp-volcengine"],
        env: {
          ARK_API_KEY: config.apiKey,
          JIMENG_OUTPUT_DIR: config.outputDir || path.join(os.homedir(), 'Pictures')
        }
      };
    }
    
    throw new Error('未知的MCP类型');
  }

  /**
   * 读取当前MCP配置
   */
  async getCurrentConfig(): Promise<any> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return { mcpServers: {} };
    }
  }

  /**
   * 获取MCP状态
   */
  async getMCPStatus(mcpName: string): Promise<any> {
    try {
      const { stdout } = await execAsync(`claude mcp get ${mcpName}`);
      
      // 解析输出判断状态
      const status = {
        installed: !stdout.includes('not found'),
        configured: false,
        apiKeyValid: false
      };
      
      // 检查配置
      const config = await this.getCurrentConfig();
      if (config.mcpServers && config.mcpServers[mcpName]) {
        status.configured = true;
        const serverConfig = config.mcpServers[mcpName];
        
        // 检查API Key是否存在
        if (mcpName === 'jimeng-apicore') {
          status.apiKeyValid = !!serverConfig.env?.APICORE_API_KEY;
        } else if (mcpName === 'jimeng-volcengine') {
          status.apiKeyValid = !!serverConfig.env?.ARK_API_KEY;
        }
      }
      
      return status;
    } catch (error) {
      return {
        installed: false,
        configured: false,
        apiKeyValid: false
      };
    }
  }

  /**
   * 列出所有MCP
   */
  async listMCPs(): Promise<string[]> {
    try {
      const { stdout } = await execAsync('claude mcp list');
      // 解析输出提取MCP名称
      const lines = stdout.split('\n');
      const mcps: string[] = [];
      
      for (const line of lines) {
        if (line.includes('jimeng-apicore') || line.includes('jimeng-volcengine')) {
          const match = line.match(/(jimeng-\w+)/);
          if (match) {
            mcps.push(match[1]);
          }
        }
      }
      
      return mcps;
    } catch (error) {
      return [];
    }
  }

  /**
   * 删除MCP配置
   */
  async removeMCP(mcpName: string): Promise<{ success: boolean; message: string }> {
    try {
      const { stdout, stderr } = await execAsync(`claude mcp remove ${mcpName}`);
      
      if (stderr && !stderr.includes('Successfully')) {
        return { success: false, message: stderr };
      }
      
      return { success: true, message: '配置已删除' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}

export const mcpConfigManager = new MCPConfigManager();