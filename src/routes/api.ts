import { Router } from 'express';
import { terminalManager } from '../services/terminal';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const router = Router();

// Covers data file path
const COVERS_FILE_PATH = join(__dirname, '../../public/js/covers-data.js');

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PicAgent',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

router.get('/sessions', (req, res) => {
  const sessions: any[] = [];
  res.json({ sessions });
});

// GET /api/covers - 获取所有封面数据
router.get('/covers', (req, res) => {
  try {
    if (existsSync(COVERS_FILE_PATH)) {
      const fileContent = readFileSync(COVERS_FILE_PATH, 'utf8');
      // 提取 coverTemplates 对象
      const match = fileContent.match(/const coverTemplates = ({[\s\S]*?});/);
      if (match) {
        const dataStr = match[1];
        const data = eval('(' + dataStr + ')');
        res.json({ success: true, data });
      } else {
        res.json({ success: false, error: '无法解析数据文件' });
      }
    } else {
      res.json({ success: true, data: {} });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/gallery - 获取生成的文件列表（图片 + HTML）
router.get('/gallery', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const os = require('os');
    
    // 从查询参数 / 本地配置 / 环境变量 解析输出目录
    let outputDir = (req.query.outputDir as string) || '';
    if (!outputDir) {
      try {
        const localConfigPath = join(process.cwd(), 'config', 'mcp-config.json');
        if (existsSync(localConfigPath)) {
          const cfgRaw = readFileSync(localConfigPath, 'utf8');
          const cfg = JSON.parse(cfgRaw);
          outputDir = cfg.globalOutputDir
            || cfg['jimeng-apicore']?.outputDir
            || cfg['jimeng-volcengine']?.outputDir
            || cfg['gemini-apicore']?.outputDir
            || '';
        }
      } catch {}
    }
    if (!outputDir) {
      outputDir = process.env.JIMENG_OUTPUT_DIR || path.join(os.homedir(), 'Pictures');
    }
    
    // 确保目录存在
    if (!existsSync(outputDir)) {
      return res.json({ 
        success: false, 
        error: `目录不存在: ${outputDir}`,
        files: [],
        outputDir
      });
    }
    
    // 读取目录中的相关文件（图片、HTML）
    const files = await fs.readdir(outputDir);
    const items = files
      .filter((file: string) => /\.(jpg|jpeg|png|gif|webp|html|htm)$/i.test(file))
      .map((file: string) => {
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file);
        const isHtml = /\.(html|htm)$/i.test(file);
        return {
          name: file,
          path: path.join(outputDir, file),
          url: isImage ? `/api/image/${file}` : `/api/file/${file}`,
          type: isImage ? 'image' : (isHtml ? 'html' : 'other')
        };
      });
    
    // 按修改时间排序（最新的在前）
    const filesWithStats = await Promise.all(
      items.map(async (file: any) => {
        const stats = await fs.stat(file.path);
        return {
          ...file,
          mtime: stats.mtime
        };
      })
    );
    
    filesWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    
    res.json({ 
      success: true, 
      outputDir,
      files: filesWithStats.slice(0, 100) // 返回最新的最多100个文件
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/image/:filename - 获取单张图片
router.get('/image/:filename', async (req, res) => {
  try {
    const path = require('path');
    const os = require('os');
    
    // 从查询参数 / 本地配置 / 环境变量 解析输出目录
    let outputDir = (req.query.outputDir as string) || '';
    if (!outputDir) {
      try {
        const localConfigPath = join(process.cwd(), 'config', 'mcp-config.json');
        if (existsSync(localConfigPath)) {
          const cfgRaw = readFileSync(localConfigPath, 'utf8');
          const cfg = JSON.parse(cfgRaw);
          outputDir = cfg.globalOutputDir
            || cfg['jimeng-apicore']?.outputDir
            || cfg['jimeng-volcengine']?.outputDir
            || cfg['gemini-apicore']?.outputDir
            || '';
        }
      } catch {}
    }
    if (!outputDir) {
      outputDir = process.env.JIMENG_OUTPUT_DIR || path.join(os.homedir(), 'Pictures');
    }
    
    const imagePath = path.join(outputDir, req.params.filename);
    
    if (!existsSync(imagePath)) {
      return res.status(404).json({ error: '图片不存在' });
    }
    
    res.sendFile(imagePath);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/file/:filename - 获取任意文件（例如HTML）
router.get('/file/:filename', async (req, res) => {
  try {
    const path = require('path');
    const os = require('os');

    // 从查询参数 / 本地配置 / 环境变量 解析输出目录
    let outputDir = (req.query.outputDir as string) || '';
    if (!outputDir) {
      try {
        const localConfigPath = join(process.cwd(), 'config', 'mcp-config.json');
        if (existsSync(localConfigPath)) {
          const cfgRaw = readFileSync(localConfigPath, 'utf8');
          const cfg = JSON.parse(cfgRaw);
          outputDir = cfg.globalOutputDir
            || cfg['jimeng-apicore']?.outputDir
            || cfg['jimeng-volcengine']?.outputDir
            || cfg['gemini-apicore']?.outputDir
            || '';
        }
      } catch {}
    }
    if (!outputDir) {
      outputDir = process.env.JIMENG_OUTPUT_DIR || path.join(os.homedir(), 'Pictures');
    }

    const filePath = path.join(outputDir, req.params.filename);
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    res.sendFile(filePath);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/output-dir - 获取解析后的输出目录及来源
router.get('/output-dir', (req, res) => {
  try {
    const os = require('os');
    const path = require('path');
    let configOutputDir: string | undefined;

    try {
      const localConfigPath = join(process.cwd(), 'config', 'mcp-config.json');
      if (existsSync(localConfigPath)) {
        const cfgRaw = readFileSync(localConfigPath, 'utf8');
        const cfg = JSON.parse(cfgRaw);
        configOutputDir = cfg.globalOutputDir
          || cfg['jimeng-apicore']?.outputDir
          || cfg['jimeng-volcengine']?.outputDir
          || cfg['gemini-apicore']?.outputDir
          || undefined;
      }
    } catch {}

    const envOutputDir = process.env.JIMENG_OUTPUT_DIR;
    const fallback = path.join(os.homedir(), 'Pictures');
    const outputDir = configOutputDir || envOutputDir || fallback;

    res.json({
      success: true,
      outputDir,
      sources: {
        configOutputDir: configOutputDir || null,
        envOutputDir: envOutputDir || null,
        fallback
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/output-dir - 设置全局输出目录
router.post('/output-dir', async (req, res) => {
  try {
    const fsP = require('fs').promises;
    const path = require('path');
    const desired = (req.body && req.body.outputDir) ? String(req.body.outputDir) : '';
    if (!desired) {
      return res.status(400).json({ success: false, error: '缺少 outputDir' });
    }

    // 确保目录存在
    await fsP.mkdir(desired, { recursive: true }).catch(() => {});

    const configDir = join(process.cwd(), 'config');
    const configPath = join(configDir, 'mcp-config.json');
    await fsP.mkdir(configDir, { recursive: true });

    let cfg: any = {};
    if (existsSync(configPath)) {
      try {
        cfg = JSON.parse(readFileSync(configPath, 'utf8')) || {};
      } catch {}
    }
    cfg.globalOutputDir = desired;

    writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf8');
    res.json({ success: true, outputDir: desired });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/open-folder - 打开文件夹
router.post('/open-folder', (req, res) => {
  try {
    const { path: folderPath } = req.body || {};
    const { exec } = require('child_process');
    
    // 根据操作系统使用不同的命令
    const platform = process.platform;
    let command = '';
    
    // 解析输出目录优先级
    let targetPath = folderPath;
    if (!targetPath) {
      try {
        const localConfigPath = join(process.cwd(), 'config', 'mcp-config.json');
        if (existsSync(localConfigPath)) {
          const cfgRaw = readFileSync(localConfigPath, 'utf8');
          const cfg = JSON.parse(cfgRaw);
          targetPath = cfg.globalOutputDir
            || cfg['jimeng-apicore']?.outputDir
            || cfg['jimeng-volcengine']?.outputDir
            || cfg['gemini-apicore']?.outputDir
            || '';
        }
      } catch {}
    }
    if (!targetPath) {
      targetPath = process.env.JIMENG_OUTPUT_DIR || undefined;
    }
    
    if (platform === 'darwin') {
      // macOS
      command = `open "${targetPath || '/Users/chengfeng/Pictures'}"`;
    } else if (platform === 'win32') {
      // Windows
      command = `explorer "${targetPath || process.env.USERPROFILE + '\\Pictures'}"`;
    } else {
      // Linux
      command = `xdg-open "${targetPath || process.env.HOME + '/Pictures'}"`;
    }
    
    exec(command, (error: any) => {
      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
      res.json({ success: true, message: '文件夹已打开' });
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/covers - 更新所有封面数据
router.post('/covers', (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ success: false, error: '无效的数据格式' });
    }

    // 生成新的 covers-data.js 内容
    const jsContent = `// 封面案例数据
// 自动生成于: ${new Date().toLocaleString()}

// 默认基础提示词
const defaultPrompt = "请使用专业的AI图像生成技术，创建一张高质量、高分辨率的图片。确保图像具有良好的构图、自然的光影效果和丰富的细节表现。";

// 封面案例模板
const coverTemplates = ${JSON.stringify(data, null, 4)};

// 全局导出
window.coverTemplates = coverTemplates;
window.defaultPrompt = defaultPrompt;`;

    // 写入文件
    writeFileSync(COVERS_FILE_PATH, jsContent, 'utf8');
    
    res.json({ 
      success: true, 
      message: `已更新 ${Object.keys(data).length} 个封面案例`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
