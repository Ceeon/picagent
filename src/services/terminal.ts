// 自动选择可用的 PTY 实现，支持自动安装
import { ptyInstaller } from './pty-installer';

let pty: any = null;
const ptyModules = [
  '@homebridge/node-pty-prebuilt-multiarch',
  'node-pty-prebuilt-multiarch',
  '@lydell/node-pty',
  'node-pty'
];

// 尝试加载现有的PTY模块
for (const moduleName of ptyModules) {
  try {
    pty = require(moduleName);
    console.log(`✅ 使用终端模块: ${moduleName}`);
    break;
  } catch (e) {
    // 继续尝试下一个
  }
}

// 如果没有找到可用模块，尝试自动安装
if (!pty) {
  console.log('❌ 未找到可用的 PTY 模块，尝试自动安装...');

  // 创建一个异步初始化函数
  let ptyInitPromise: Promise<boolean> | null = null;

  const initializePty = async (): Promise<boolean> => {
    try {
      const installResult = await ptyInstaller.autoInstall();

      if (installResult.success && installResult.packageName) {
        console.log(`✅ ${installResult.message}`);

        if (installResult.needsRestart) {
          console.log('⚠️  需要重启应用以加载新安装的模块');
          return false;
        }

        // 尝试加载新安装的模块
        try {
          pty = require(installResult.packageName);
          console.log(`✅ 成功加载: ${installResult.packageName}`);
          return true;
        } catch (e) {
          console.error(`❌ 加载失败: ${installResult.packageName}`);
          return false;
        }
      } else {
        console.error(`❌ PTY自动安装失败: ${installResult.message}`);

        // 显示安装报告
        const report = await ptyInstaller.generateInstallReport();
        console.log(report);

        return false;
      }
    } catch (error: any) {
      console.error(`❌ PTY安装过程出错: ${error.message}`);
      return false;
    }
  };

  // 导出初始化promise供外部使用
  ptyInitPromise = initializePty();

  // 导出异步初始化函数
  (global as any).initializePtyAsync = () => ptyInitPromise;
}
import { EventEmitter } from 'events';
import os from 'os';

export interface TerminalSize {
  cols: number;
  rows: number;
}

export class TerminalSession extends EventEmitter {
  private ptyProcess: any; // PTY 进程实例
  private sessionId: string;
  private isActive: boolean = true;

  constructor(sessionId: string, size: TerminalSize = { cols: 80, rows: 30 }, cwd?: string) {
    super();
    this.sessionId = sessionId;

    if (!pty) {
      // 如果PTY不可用，但有初始化promise，等待初始化完成
      const initPtyAsync = (global as any).initializePtyAsync;
      if (initPtyAsync) {
        // 异步初始化，先发送错误消息
        setTimeout(() => {
          this.emit('data', '⚠️  正在安装终端依赖，请稍候...\r\n');
        }, 100);

        // 尝试异步初始化
        initPtyAsync().then((success: boolean) => {
          if (success) {
            this.emit('data', '✅ 终端依赖安装成功，请重启应用\r\n');
          } else {
            this.emit('data', '❌ 终端依赖安装失败，某些功能可能不可用\r\n');
            this.emit('data', '💡 请查看控制台日志获取详细错误信息\r\n');
          }
        });

        // 创建一个假的ptyProcess来避免后续调用出错
        this.ptyProcess = {
          onData: () => {},
          onExit: () => {},
          write: () => {},
          resize: () => {},
          kill: () => {}
        };
        return;
      }

      throw new Error('终端模块不可用，且无法自动安装');
    }

    const shell = os.platform() === 'win32' ? 'powershell.exe' : process.env.SHELL || 'bash';
    const args: string[] = [];  // 不使用 --norc 和 --noprofile，让终端加载用户配置

    // 设置环境变量
    const env = {
      ...process.env,
      TERM: 'xterm-256color',
      LANG: process.env.LANG || 'en_US.UTF-8',
      LC_ALL: process.env.LC_ALL || 'en_US.UTF-8'
    } as { [key: string]: string };

    this.ptyProcess = pty.spawn(shell, args, {
      name: 'xterm-256color',
      cols: size.cols,
      rows: size.rows,
      cwd: cwd || process.env.HOME || process.cwd(),
      env: env
    });

    this.ptyProcess.onData((data: string) => {
      this.emit('data', data);
    });

    this.ptyProcess.onExit(() => {
      this.isActive = false;
      this.emit('exit');
    });
  }

  write(data: string): void {
    if (this.isActive) {
      this.ptyProcess.write(data);
    }
  }

  resize(size: TerminalSize): void {
    if (this.isActive) {
      this.ptyProcess.resize(size.cols, size.rows);
    }
  }

  async execute(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isActive) {
        reject(new Error('Terminal session is not active'));
        return;
      }

      let output = '';
      const dataHandler = (data: string) => {
        output += data;
      };

      this.on('data', dataHandler);

      setTimeout(() => {
        this.removeListener('data', dataHandler);
        resolve(output);
      }, 3000);

      this.write(command + '\r');
    });
  }

  async executeSilent(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isActive) {
        reject(new Error('Terminal session is not active'));
        return;
      }

      // 使用 child_process 直接执行，不通过终端显示
      const { exec } = require('child_process');
      exec(command, (error: any, stdout: string, stderr: string) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout || stderr);
        }
      });
    });
  }

  destroy(): void {
    if (this.isActive) {
      this.isActive = false;
      this.ptyProcess.kill();
      this.removeAllListeners();
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getIsActive(): boolean {
    return this.isActive;
  }
}

class TerminalManager {
  private sessions: Map<string, TerminalSession> = new Map();

  createSession(sessionId: string, size?: TerminalSize, cwd?: string): TerminalSession {
    if (this.sessions.has(sessionId)) {
      this.sessions.get(sessionId)?.destroy();
    }

    const session = new TerminalSession(sessionId, size, cwd);
    this.sessions.set(sessionId, session);

    session.on('exit', () => {
      this.sessions.delete(sessionId);
    });

    return session;
  }

  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  destroySession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.destroy();
      this.sessions.delete(sessionId);
    }
  }

  destroyAllSessions(): void {
    this.sessions.forEach(session => session.destroy());
    this.sessions.clear();
  }
}

export const terminalManager = new TerminalManager();
