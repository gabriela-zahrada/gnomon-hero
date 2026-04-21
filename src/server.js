import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const server = http.createServer((req, res) => {
  const target = req.url === '/' ? '/src/web/index.html' : req.url;
  const filePath = path.join(root, target);
  if (!fs.existsSync(filePath)) {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath);
  const type = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.png': 'image/png',
    '.pdf': 'application/pdf'
  }[ext] || 'application/octet-stream';
  res.setHeader('content-type', type);
  fs.createReadStream(filePath).pipe(res);
});

server.listen(4173, () => {
  console.log('Preview server: http://localhost:4173');
});
