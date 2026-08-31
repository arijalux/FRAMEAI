import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';
import { handleAnalyzeFace, handleWhyThisFrame, handleSellerInsights } from './src/server/geminiApi.ts';

dotenv.config();

function apiServerPlugin(): Plugin {
  return {
    name: 'frameai-api-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const url = req.url.split('?')[0];

        if (url === '/api/health') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'ok', app: 'FRAMEAI' }));
          return;
        }

        if (req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk) => {
            bodyStr += chunk;
          });
          req.on('end', async () => {
            try {
              const body = bodyStr ? JSON.parse(bodyStr) : {};
              res.setHeader('Content-Type', 'application/json');

              if (url === '/api/ai/analyze-face') {
                const result = await handleAnalyzeFace(body);
                if (result) {
                  return res.end(JSON.stringify(result));
                }
                return res.end(JSON.stringify({ fallback: true }));
              }

              if (url === '/api/ai/why-this-frame') {
                const explanation = await handleWhyThisFrame(body);
                return res.end(JSON.stringify({ explanation }));
              }

              if (url === '/api/ai/seller-insights') {
                const insights = await handleSellerInsights(body);
                return res.end(JSON.stringify({ insights }));
              }

              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Endpoint not found' }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
