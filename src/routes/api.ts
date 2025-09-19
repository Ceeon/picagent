import { Router } from 'express';
import { terminalManager } from '../services/terminal';

const router = Router();

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

export default router;