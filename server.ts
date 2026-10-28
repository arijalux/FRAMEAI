import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { apiRouter } from './src/server/geminiRouter';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Body parsing with 10MB limit for camera snapshots and base64 imagery
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount Gemini API proxy routes
app.use('/api', apiRouter);

// Serve static build assets in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start HTTP server
const server = app.listen(port, () => {
  console.log(`[FrameAI] Production server running on port ${port}`);
});

// Graceful termination for Cloud Run container lifecycle
const shutdown = () => {
  console.log('[FrameAI] Received termination signal. Closing server gracefully...');
  server.close(() => {
    console.log('[FrameAI] Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
