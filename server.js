const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'content');

const routes = {
  '/api/lessons': path.join(DATA_DIR, 'lessons.json'),
  '/api/resources': path.join(DATA_DIR, 'library.json'),
  '/api/ages': path.join(DATA_DIR, 'ages.json'),
};

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function send(res, status, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

function sendJson(res, filePath) {
  try {
    const body = fs.readFileSync(filePath, 'utf8');
    JSON.parse(body);
    send(res, 200, body, 'application/json; charset=utf-8');
  } catch (error) {
    send(res, 500, JSON.stringify({ error: 'content_unavailable' }), 'application/json; charset=utf-8');
  }
}

function sendServerRenderedHome(res) {
  try {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const lessons = JSON.parse(fs.readFileSync(routes['/api/lessons'], 'utf8'));
    const resources = JSON.parse(fs.readFileSync(routes['/api/resources'], 'utf8'));
    const ages = JSON.parse(fs.readFileSync(routes['/api/ages'], 'utf8'));
    const embedded = JSON.stringify({ lessons, resources, ages }).replace(/</g, '\\u003c');
    const body = html.replace('</head>', `<script>window.__IMAGINE_CONTENT__=${embedded};</script></head>`);
    send(res, 200, body, 'text/html; charset=utf-8');
  } catch (error) {
    send(res, 500, 'Imagine content is temporarily unavailable');
  }
}

const PUBLIC_FILES = new Set([
  'index.html',
  'content/lessons.json',
  'content/library.json',
  'content/ages.json',
  'imagine-static-full.png',
  'sanjianke/index.html',
  'sanjianke/styles.css',
  'sanjianke/content.js',
  'sanjianke/app.js',
]);

function safeStaticPath(urlPath) {
  try {
    const pathname = decodeURIComponent(urlPath.split('?')[0]);
    const requested = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
    const resolved = path.resolve(ROOT, `.${requested}`);
    if (!resolved.startsWith(`${ROOT}${path.sep}`)) return null;
    const relative = path.relative(ROOT, resolved).split(path.sep).join('/');
    return PUBLIC_FILES.has(relative) ? resolved : null;
  } catch {
    return null;
  }
}

const server = http.createServer((req, res) => {
  const urlPath = req.url || '/';

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, 'Method Not Allowed');
  }

  if (urlPath.split('?')[0] === '/sanjianke') {
    res.writeHead(308, { Location: `/sanjianke/${urlPath.includes('?') ? `?${urlPath.split('?').slice(1).join('?')}` : ''}` });
    return res.end();
  }

  if (urlPath.split('?')[0] === '/health') {
    return send(res, 200, JSON.stringify({ ok: true, service: 'imagine' }), 'application/json; charset=utf-8');
  }

  if (routes[urlPath.split('?')[0]]) {
    return sendJson(res, routes[urlPath.split('?')[0]]);
  }

  const filePath = safeStaticPath(urlPath);
  if (!filePath) return send(res, 403, 'Forbidden');
  if (filePath === path.join(ROOT, 'index.html')) {
    if (req.method === 'HEAD') return res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end();
    return sendServerRenderedHome(res);
  }

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) return send(res, 404, 'Not Found');
    const type = contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Imagine server listening on http://${HOST}:${PORT}`);
});
