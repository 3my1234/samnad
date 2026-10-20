import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEnquiryHandler } from './enquiries.mjs';
const root = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png' };
const publicFiles = new Set(['index.html', 'styles.css', 'script.js', 'samnad logo.png', 'Samnad Moonlight tanker fleet-1.png', 'Branded Samnad Moonlight tanker fleet-2.png', 'Samnad Moonlight tanker fleet-3.png']);
const enquiries = createEnquiryHandler();
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/api/diesel-enquiries') { await enquiries(req, res); return; }
    if (pathname === '/health') { res.writeHead(200); res.end('OK'); return; }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    const file = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (!publicFiles.has(file)) { res.writeHead(404); res.end('Not found'); return; }
    const body = await readFile(path.join(root, file));
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch { res.writeHead(400); res.end('Invalid request'); }
});
server.requestTimeout = 15000;
server.listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1', () => console.log(`Samnad Moonlight is ready on port ${server.address().port}`));
