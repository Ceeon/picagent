import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';

const execAsync = promisify(exec);

interface DependencyStatus {
  claude: boolean;
  node: boolean;
  npm: boolean;
  pty: boolean;
}

interface DependencyInfo {
  name: string;
  installed: boolean;
  version?: string;
  installCommand?: string;
  installUrl?: string;
}

export class DependencyChecker {
  private platform = os.platform();

  async checkCommand(command: string): Promise<{ exists: boolean; version?: string }> {
    try {
      const { stdout } = await execAsync(command);
      return { exists: true, version: stdout.trim() };
    } catch {
      return { exists: false };
    }
  }

  async checkAllDependencies(): Promise<DependencyInfo[]> {
    const deps: DependencyInfo[] = [];

    // Check Claude Code
    const claude = await this.checkCommand('claude --version');
    deps.push({
      name: 'Claude Code',
      installed: claude.exists,
      version: claude.version,
      installUrl: 'https://claude.ai/download',
      installCommand: this.platform === 'darwin'
        ? 'brew install claude'
        : 'Visit https://claude.ai/download'
    });

    // Check Node.js
    const node = await this.checkCommand('node --version');
    deps.push({
      name: 'Node.js',
      installed: node.exists,
      version: node.version,
      installCommand: this.getInstallCommand('node'),
      installUrl: 'https://nodejs.org/downloads'
    });

    // Check npm
    const npm = await this.checkCommand('npm --version');
    deps.push({
      name: 'npm',
      installed: npm.exists,
      version: npm.version,
      installCommand: node.exists ? 'Installed with Node.js' : 'Install Node.js first'
    });

    // Check PTY modules
    const ptyPackages = [
      '@homebridge/node-pty-prebuilt-multiarch',
      'node-pty-prebuilt-multiarch',
      '@lydell/node-pty',
      'node-pty'
    ];

    let ptyAvailable = false;
    let ptyVersion = '';
    let availablePtyPackage = '';

    for (const pkg of ptyPackages) {
      try {
        require.resolve(pkg);
        ptyAvailable = true;
        availablePtyPackage = pkg;
        try {
          const packageInfo = require(`${pkg}/package.json`);
          ptyVersion = packageInfo.version || 'unknown';
        } catch (e) {
          ptyVersion = 'installed';
        }
        break;
      } catch (e) {
        // 继续检查下一个包
      }
    }

    deps.push({
      name: 'Terminal (PTY)',
      installed: ptyAvailable,
      version: ptyAvailable ? `${availablePtyPackage}@${ptyVersion}` : undefined,
      installCommand: this.platform === 'win32'
        ? 'Run scripts/install-deps.ps1 as administrator'
        : 'npm install @homebridge/node-pty-prebuilt-multiarch',
      installUrl: this.platform === 'win32'
        ? 'https://visualstudio.microsoft.com/visual-cpp-build-tools/'
        : undefined
    });

    return deps;
  }

  private getInstallCommand(tool: string): string {
    switch (this.platform) {
      case 'win32':
        if (tool === 'node') return 'winget install OpenJS.NodeJS';
        if (tool === 'claude') return 'Download from https://claude.ai/download';
        break;
      case 'darwin':
        if (tool === 'node') return 'brew install node';
        if (tool === 'claude') return 'brew install claude';
        break;
      case 'linux':
        if (tool === 'node') return 'sudo apt install nodejs npm';
        if (tool === 'claude') return 'Download from https://claude.ai/download';
        break;
    }
    return `Install ${tool} manually`;
  }

  async generateReport(): Promise<string> {
    const deps = await this.checkAllDependencies();
    let report = '\n=== 依赖检测报告 ===\n\n';

    let allInstalled = true;

    for (const dep of deps) {
      if (dep.installed) {
        report += `✅ ${dep.name}: ${dep.version || '已安装'}\n`;
      } else {
        allInstalled = false;
        report += `❌ ${dep.name}: 未安装\n`;
        if (dep.installCommand) {
          report += `   👉 安装命令: ${dep.installCommand}\n`;
        }
        if (dep.installUrl) {
          report += `   👉 下载地址: ${dep.installUrl}\n`;
        }
      }
      report += '\n';
    }

    if (!allInstalled) {
      report += '⚠️  部分依赖未安装，某些功能可能无法使用\n';
      report += '\n运行安装脚本（根据您的系统）：\n';

      switch (this.platform) {
        case 'win32':
          report += '  PowerShell: .\\scripts\\install-deps.ps1\n';
          break;
        case 'darwin':
        case 'linux':
          report += '  Terminal: ./scripts/install-deps.sh\n';
          break;
      }
    } else {
      report += '✨ 所有依赖已就绪！\n';
    }

    return report;
  }

  async waitForDependencies(requiredDeps: string[] = ['claude', 'node']): Promise<boolean> {
    console.log('正在检查必要的依赖...\n');

    const report = await this.generateReport();
    console.log(report);

    const deps = await this.checkAllDependencies();
    const missingRequired = requiredDeps.filter(req =>
      !deps.find(d => d.name.toLowerCase().includes(req.toLowerCase()))?.installed
    );

    if (missingRequired.length > 0) {
      console.log('\n⏸️  请安装必要的依赖后重新运行程序');
      console.log('   或使用 --skip-deps-check 跳过检查（部分功能可能不可用）\n');
      return false;
    }

    return true;
  }

  async executeInstallCommand(command: string): Promise<void> {
    console.log(`\n正在执行: ${command}\n`);

    const isWindows = this.platform === 'win32';
    const shell = isWindows ? 'powershell.exe' : '/bin/sh';
    const shellArgs = isWindows ? ['-Command', command] : ['-c', command];

    return new Promise((resolve, reject) => {
      const spawn = require('child_process').spawn;
      const proc = spawn(shell, shellArgs, {
        stdio: 'inherit',
        shell: true
      });

      proc.on('close', (code: number) => {
        if (code === 0) {
          console.log('✅ 安装成功\n');
          resolve();
        } else {
          console.log(`❌ 安装失败 (退出码: ${code})\n`);
          reject(new Error(`Installation failed with code ${code}`));
        }
      });

      proc.on('error', (err: Error) => {
        console.log(`❌ 执行命令失败: ${err.message}\n`);
        reject(err);
      });
    });
  }

  async autoInstallDependencies(): Promise<void> {
    const deps = await this.checkAllDependencies();
    const toInstall = deps.filter(d => !d.installed && d.installCommand && !d.installCommand.includes('Visit'));

    if (toInstall.length === 0) {
      console.log('✨ 所有依赖已安装！\n');
      return;
    }

    console.log('发现未安装的依赖，将尝试自动安装：\n');

    for (const dep of toInstall) {
      console.log(`\n正在安装 ${dep.name}...`);

      if (dep.installCommand && !dep.installCommand.includes('Visit') && !dep.installCommand.includes('Install') && !dep.installCommand.includes('first')) {
        try {
          await this.executeInstallCommand(dep.installCommand);
        } catch (err) {
          console.log(`⚠️  ${dep.name} 自动安装失败，请手动安装`);
          if (dep.installUrl) {
            console.log(`   下载地址: ${dep.installUrl}`);
          }
        }
      } else {
        console.log(`ℹ️  ${dep.name} 需要手动安装`);
        if (dep.installUrl) {
          console.log(`   下载地址: ${dep.installUrl}`);
        }
      }
    }
  }
}

// 导出单例
export const dependencyChecker = new DependencyChecker();