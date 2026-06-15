const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
  '.xsl': 'application/xml; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // Parse URL to get the path without query params or hash
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Clean URL rewrite logic
  let targetPath = pathname;
  
  // Clean news detail URLs rewrite
  if (pathname.startsWith('/noticies/') && pathname.split('/').filter(Boolean).length >= 2) {
    targetPath = '/noticies.html';
  } else if (pathname.startsWith('/es/noticies/') && pathname.split('/').filter(Boolean).length >= 3) {
    targetPath = '/es/noticies.html';
  } else {
    // Check if path exists. If not, and it has no extension, try appending .html
    const absolutePath = path.join(__dirname, pathname);
    try {
      const stats = fs.statSync(absolutePath);
      if (stats.isDirectory()) {
        targetPath = path.join(pathname, 'index.html');
      }
    } catch (err) {
      const ext = path.extname(pathname);
      if (!ext) {
        const htmlPath = absolutePath + '.html';
        if (fs.existsSync(htmlPath)) {
          targetPath = pathname + '.html';
        }
      }
    }
  }

  const fileAbsolutePath = path.join(__dirname, targetPath);

  fs.readFile(fileAbsolutePath, (err, data) => {
    const status = err ? 404 : 200;
    console.log(`[HTTP] ${req.method} ${req.url} -> ${targetPath} (${status})`);
    if (err) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(fileAbsolutePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Iniciando servidor local en http://localhost:${PORT} (con soporte para URLs limpias)...`);
});
