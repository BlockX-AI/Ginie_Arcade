import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

const BASE_DIR = path.join(process.cwd(), 'public', 'games');

const FALLBACK_ORIGIN = process.env.GINIX_GAME_ASSET_FALLBACK_ORIGIN || 'https://arcade-web-chi.vercel.app';
const FALLBACK_PREFIXES = ['flappy', 'sudoku'];

function getContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.svg':
      return 'image/svg+xml';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.ico':
      return 'image/x-icon';
    case '.mp3':
      return 'audio/mpeg';
    case '.wav':
      return 'audio/wav';
    case '.ogg':
      return 'audio/ogg';
    case '.mp4':
      return 'video/mp4';
    case '.wasm':
      return 'application/wasm';
    case '.txt':
      return 'text/plain; charset=utf-8';
    case '.woff':
      return 'font/woff';
    case '.woff2':
      return 'font/woff2';
    case '.ttf':
      return 'font/ttf';
    default:
      return 'application/octet-stream';
  }
}

async function serveFile(filePath: string) {
  const data = await readFile(filePath);
  return new NextResponse(data, {
    headers: {
      'Content-Type': getContentType(filePath),
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    },
  });
}

async function tryServeFromFallback(req: NextRequest, rel: string) {
  const firstSegment = rel.split('/')[0] || '';
  if (!FALLBACK_PREFIXES.includes(firstSegment)) return null;

  const url = new URL(`/games/${rel}`, FALLBACK_ORIGIN);
  const res = await fetch(url, {
    method: req.method,
    headers: {
      accept: req.headers.get('accept') || '*/*',
      range: req.headers.get('range') || '',
    },
    redirect: 'follow',
    cache: 'no-store',
  });

  if (!res.ok) return null;

  const contentType = res.headers.get('content-type') || getContentType(rel);
  const body = req.method === 'HEAD' ? null : await res.arrayBuffer();
  return new NextResponse(body, {
    status: res.status,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    },
  });
}

function notFoundHtml(relPath: string) {
  const safe = relPath.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Game Not Found</title>
    <style>
      html, body { height: 100%; margin: 0; background: #000; color: #e5e7eb; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; }
      .wrap { height: 100%; display: grid; place-items: center; padding: 24px; }
      .card { max-width: 560px; width: 100%; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px; background: rgba(255,255,255,0.02); }
      h1 { font-size: 18px; margin: 0 0 10px; letter-spacing: 0.08em; text-transform: uppercase; }
      p { margin: 0; color: rgba(229,231,235,0.7); line-height: 1.5; }
      .path { margin-top: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas; font-size: 12px; color: rgba(229,231,235,0.55); word-break: break-all; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <h1>Game asset not found</h1>
        <p>This game build is not available on the server.</p>
        <p class="path">Requested: /games/${safe}</p>
      </div>
    </div>
  </body>
</html>`;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await ctx.params;
  const rel = Array.isArray(segments) ? segments.join('/') : '';

  const resolved = path.normalize(path.join(BASE_DIR, rel));
  if (!resolved.startsWith(BASE_DIR)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const info = await stat(resolved);
    if (info.isDirectory()) {
      return serveFile(path.join(resolved, 'index.html'));
    }
    return serveFile(resolved);
  } catch {
    try {
      const fallback = await tryServeFromFallback(req, rel);
      if (fallback) return fallback;
    } catch {
      // ignore fallback errors
    }
    const ext = path.extname(rel).toLowerCase();
    const looksLikeHtml = ext === '.html' || ext === '';
    if (looksLikeHtml) {
      return new NextResponse(notFoundHtml(rel), {
        status: 404,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      });
    }
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function HEAD(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const res = await GET(req, ctx);
  return new NextResponse(null, { status: res.status, headers: res.headers });
}
