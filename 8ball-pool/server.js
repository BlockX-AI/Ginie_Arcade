const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3005;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm',
  '.fnt': 'text/plain'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './pro-game.html';
  }

  // Handle /games/ginix-bridge.js request
  if (req.url === '/games/ginix-bridge.js') {
    filePath = '../ginix-bridge.js';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // File not found
        console.error(`404 Not Found: ${filePath}`);
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        // Server error
        console.error(`500 Server Error: ${error.code}`);
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, 'utf-8');
      }
    } else {
      // Success
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`🎱 8-Ball Pool Game Server Running!`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🎮 Open your browser and navigate to the URL above`);
  console.log(`Press Ctrl+C to stop the server\n`);
});
