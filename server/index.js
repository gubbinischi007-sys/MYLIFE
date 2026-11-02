import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApiRequest } from './api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

const server = http.createServer(async (req, res) => {
  // 1. API routes
  if (req.url.startsWith('/api/')) {
    await handleApiRequest(req, res);
    return;
  }

  // 2. Serve static files from dist/ if built
  if (fs.existsSync(distDir)) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let filePath = path.join(distDir, url.pathname === '/' ? 'index.html' : url.pathname);

    // Single Page App fallback
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }

    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found. Run "npm run dev" for the Vite development server.');
});

server.listen(PORT, HOST, () => {
  console.log(`\n🚀 MYLIFE SQLite Backend Server running at: http://localhost:${PORT}`);
  console.log(`📁 Database: data/mylife.db\n`);
});

