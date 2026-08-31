import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { handleAnalyzeFace, handleWhyThisFrame, handleSellerInsights } from './src/server/geminiApi';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'FRAMEAI', timestamp: new Date().toISOString() });
  });

  // AI Analyze Face
  app.post('/api/ai/analyze-face', async (req, res) => {
    try {
      const result = await handleAnalyzeFace(req.body);
      if (result) {
        return res.json(result);
      }
      res.status(200).json({ error: 'Fallback triggered', usingFallback: true });
    } catch (err: any) {
      console.error('Server /api/ai/analyze-face error:', err);
      res.status(200).json({ error: 'Fallback triggered', usingFallback: true });
    }
  });

  // AI Why This Frame
  app.post('/api/ai/why-this-frame', async (req, res) => {
    try {
      const explanation = await handleWhyThisFrame(req.body);
      if (explanation) {
        return res.json({ explanation });
      }
      res.status(200).json({ explanation: null });
    } catch (err: any) {
      console.error('Server /api/ai/why-this-frame error:', err);
      res.status(200).json({ explanation: null });
    }
  });

  // AI Seller Insights
  app.post('/api/ai/seller-insights', async (req, res) => {
    try {
      const insights = await handleSellerInsights(req.body);
      if (insights) {
        return res.json({ insights });
      }
      res.status(200).json({ insights: null });
    } catch (err: any) {
      console.error('Server /api/ai/seller-insights error:', err);
      res.status(200).json({ insights: null });
    }
  });

  // Vite middleware for development vs static in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FRAMEAI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
