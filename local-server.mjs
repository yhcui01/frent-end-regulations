import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize } from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const archiveRoot = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(archiveRoot, 'f2e-spec');
const port = Number(process.env.PORT || 4173);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function sendFile(response, filePath) {
  response.writeHead(200, {
    'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream',
  });
  createReadStream(filePath).pipe(response);
}

const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);

  if (pathname === '/') {
    response.writeHead(302, { Location: '/f2e-spec/zh/' });
    response.end();
    return;
  }

  if (!pathname.startsWith('/f2e-spec/')) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }

  const relativePath = normalize(pathname.slice('/f2e-spec/'.length)).replace(/^(\.\.[/\\])+/, '');
  let filePath = join(siteRoot, relativePath);

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html');
  }

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    sendFile(response, filePath);
    return;
  }

  // The published documentation is a single-page app. Unknown chapter paths
  // must fall back to index.html so refreshing a page works offline.
  sendFile(response, join(siteRoot, 'index.html'));
});

server.listen(port, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${port}/f2e-spec/zh/`;
  console.log(`\n阿里巴巴前端规约已启动：${url}`);
  console.log('按 Control + C 停止本地服务。\n');
  execFile('open', [url], () => {});
});

