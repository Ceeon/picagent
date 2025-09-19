import * as pty from 'node-pty';
import { EventEmitter } from 'events';
import os from 'os';

export interface TerminalSize {
  cols: number;
  rows: number;
}

export class TerminalSession extends EventEmitter {
  private ptyProcess: pty.IPty;
  private sessionId: string;
  private isActive: boolean = true;

  constructor(sessionId: string, size: TerminalSize = { cols: 80, rows: 30 }) {
    super();
    this.sessionId = sessionId;
    
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
      cwd: process.env.HOME || process.cwd(),
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

  createSession(sessionId: string, size?: TerminalSize): TerminalSession {
    if (this.sessions.has(sessionId)) {
      this.sessions.get(sessionId)?.destroy();
    }

    const session = new TerminalSession(sessionId, size);
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