import { Router } from 'express';
import { mcpDetector } from '../services/mcp-detector';

const router = Router();

router.get('/status', async (req, res) => {
  try {
    const statuses = await mcpDetector.checkAllStatus();
    res.json({ success: true, data: statuses });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/install', async (req, res) => {
  try {
    const { mcpName } = req.body;
    if (!mcpName) {
      return res.status(400).json({ success: false, error: 'MCP name is required' });
    }
    
    const result = await mcpDetector.installMCP(mcpName);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/test', async (req, res) => {
  try {
    const { mcpName } = req.body;
    if (!mcpName) {
      return res.status(400).json({ success: false, error: 'MCP name is required' });
    }
    
    const result = await mcpDetector.testMCPConnection(mcpName);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;