import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png' };
const publicFiles = new Set(['index.html', 'styles.css', 'script.js', 'samnad logo.png', 'Samnad Moonlight tanker fleet-1.png', 'Branded Samnad Moonlight tanker fleet-2.png', 'Samnad Moonlight tanker fleet-3.png']);
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (!publicFiles.has(file)) { res.writeHead(404); res.end('Not found'); return; }
    const body = await readFile(path.join(root, file));
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    res.end(body);
  } catch { res.writeHead(400); res.end('Invalid request'); }
});
server.listen(Number(process.env.PORT || 3000), '127.0.0.1', () => console.log(`Samnad Moonlight is ready at http://localhost:${server.address().port}`));
