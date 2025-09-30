import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface InstallResult {
  success: boolean;
  packageName?: string;
  message: string;
  needsRestart?: boolean;
}

export class PtyInstaller {
  private platform = os.platform();
  private isWindows = this.platform === 'win32';

  // 按优先级排序的node-pty包列表
  private readonly ptyPackages = [
    '@homebridge/node-pty-prebuilt-multiarch',
    'node-pty-prebuilt-multiarch',
    '@lydell/node-pty',
    'node-pty'
  ];

  /**
   * 检查PTY模块可用性状态
   */
  async checkAvailability(): Promise<{ available: boolean; packageName?: string }> {
    const availablePkg = await this.detectAvailablePty();
    return {
      available: availablePkg !== null,
      packageName: availablePkg || undefined
    };
  }

  /**
   * 检测是否已有可用的node-pty包
   */
  async detectAvailablePty(): Promise<string | null> {
    for (const pkg of this.ptyPackages) {
      try {
        require.resolve(pkg);
        return pkg;
      } catch (e) {
        // 继续检查下一个包
      }
    }
    return null;
  }

  /**
   * 自动安装node-pty包
   */
  async autoInstall(): Promise<InstallResult> {
    console.log('🔧 开始自动安装Node-PTY...');

    // 首先检查是否已有可用包
    const existing = await this.detectAvailablePty();
    if (existing) {
      return {
        success: true,
        packageName: existing,
        message: `已找到可用的PTY包: ${existing}`
      };
    }

    // Windows环境下先检查构建工具
    if (this.isWindows) {
      const buildToolsCheck = await this.checkWindowsBuildTools();
      if (!buildToolsCheck.available && !buildToolsCheck.canInstall) {
        return {
          success: false,
          message: '缺少Windows构建工具，无法编译node-pty。请手动安装Visual Studio构建工具。'
        };
      }

      if (!buildToolsCheck.available && buildToolsCheck.canInstall) {
        console.log('📦 正在安装Windows构建工具...');
        await this.installWindowsBuildTools();
      }
    }

    // 尝试安装预构建包
    for (const pkg of this.ptyPackages) {
      try {
        console.log(`📦 正在尝试安装: ${pkg}`);
        const result = await this.installPackage(pkg);

        if (result.success) {
          return {
            success: true,
            packageName: pkg,
            message: `成功安装: ${pkg}`,
            needsRestart: true
          };
        }
      } catch (error: any) {
        console.log(`❌ 安装 ${pkg} 失败: ${error.message}`);
      }
    }

    return {
      success: false,
      message: '所有node-pty包安装都失败了。请检查网络连接和系统环境。'
    };
  }

  /**
   * 安装单个包
   */
  private async installPackage(packageName: string): Promise<InstallResult> {
    return new Promise((resolve) => {
      const npm = this.isWindows ? 'npm.cmd' : 'npm';
      const args = ['install', packageName, '--save'];

      const child = spawn(npm, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: this.isWindows
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
        console.log(`npm: ${data.toString().trim()}`);
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
        console.error(`npm error: ${data.toString().trim()}`);
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            packageName,
            message: `成功安装 ${packageName}`
          });
        } else {
          resolve({
            success: false,
            message: `安装 ${packageName} 失败 (退出码: ${code})\n${stderr}`
          });
        }
      });

      child.on('error', (error) => {
        resolve({
          success: false,
          message: `执行npm命令失败: ${error.message}`
        });
      });
    });
  }

  /**
   * 检查Windows构建工具
   */
  private async checkWindowsBuildTools(): Promise<{ available: boolean; canInstall: boolean }> {
    if (!this.isWindows) {
      return { available: true, canInstall: false };
    }

    try {
      // 检查是否有Visual Studio构建工具
      await execAsync('where cl.exe');
      return { available: true, canInstall: false };
    } catch (e) {
      // 检查是否可以使用winget或choco安装
      try {
        await execAsync('where winget');
        return { available: false, canInstall: true };
      } catch (e2) {
        try {
          await execAsync('where choco');
          return { available: false, canInstall: true };
        } catch (e3) {
          return { available: false, canInstall: false };
        }
      }
    }
  }

  /**
   * 安装Windows构建工具
   */
  private async installWindowsBuildTools(): Promise<void> {
    try {
      // 首先尝试winget
      try {
        console.log('使用winget安装Visual Studio构建工具...');
        await execAsync('winget install Microsoft.VisualStudio.2022.BuildTools --silent --accept-package-agreements --accept-source-agreements');
        return;
      } catch (e) {
        console.log('winget安装失败，尝试chocolatey...');
      }

      // 尝试chocolatey
      try {
        await execAsync('choco install visualstudio2022buildtools -y');
        return;
      } catch (e) {
        console.log('chocolatey安装失败');
      }

      // 如果都失败，给出手动安装建议
      throw new Error('自动安装构建工具失败，需要手动安装');

    } catch (error: any) {
      throw new Error(`Windows构建工具安装失败: ${error.message}`);
    }
  }

  /**
   * 生成安装报告
   */
  async generateInstallReport(): Promise<string> {
    let report = '\n=== Node-PTY 安装状态报告 ===\n\n';

    // 检查现有包
    const available = await this.detectAvailablePty();
    if (available) {
      report += `✅ 当前可用: ${available}\n`;
    } else {
      report += `❌ 未找到可用的node-pty包\n`;
    }

    // Windows特殊检查
    if (this.isWindows) {
      const buildTools = await this.checkWindowsBuildTools();
      report += `\nWindows构建环境:\n`;
      report += `  - 构建工具: ${buildTools.available ? '✅ 已安装' : '❌ 未安装'}\n`;
      report += `  - 可自动安装: ${buildTools.canInstall ? '✅ 是' : '❌ 否'}\n`;
    }

    // 可用包列表
    report += `\n可尝试的包 (按优先级):\n`;
    for (const pkg of this.ptyPackages) {
      try {
        require.resolve(pkg);
        report += `  - ${pkg} ✅ 已安装\n`;
      } catch (e) {
        report += `  - ${pkg} ❌ 未安装\n`;
      }
    }

    return report;
  }
}

export const ptyInstaller = new PtyInstaller();