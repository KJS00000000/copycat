const http = require('http');
const https = require('https');
const url = require('url');

// Configuration
const PROXY_PORT = 8083;
const TARGET_HOST = 'https://app.gethealthie.com'; // This should be your target server! 

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Serve status page for root
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <body>
          <h1>Proxy Server Running</h1>
          <p>Server is running on port ${PROXY_PORT}</p>
          <p>Proxying requests to <code>${TARGET_HOST}</code></p>
        </body>
      </html>
    `);
    return;
  }
  
  // Proxy all other requests
  const targetUrl = TARGET_HOST + req.url;
  const parsedTarget = url.parse(targetUrl);
  const isHttps = parsedTarget.protocol === 'https:';
  
  // Prepare request options
  const options = {
    hostname: parsedTarget.hostname,
    port: parsedTarget.port || (isHttps ? 443 : 80),
    path: parsedTarget.path,
    method: req.method,
    headers: {
      ...req.headers,
      host: parsedTarget.hostname // Important: update host header
    }
  };
  
  console.log(`Proxying to: ${targetUrl}`);
  
  // Choose http or https module
  const httpModule = isHttps ? https : http;
  
  // Create proxy request
  const proxyReq = httpModule.request(options, (proxyRes) => {
    // Forward status code
    res.writeHead(proxyRes.statusCode, {
      ...proxyRes.headers,
      // Preserve CORS headers we set earlier
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    });
    
    // Pipe response back to client
    proxyRes.pipe(res);
  });
  
  // Handle proxy request errors
  proxyReq.on('error', (err) => {
    console.error('Proxy request error:', err.message);
    if (!res.headersSent) {
      res.writeHead(500, { 
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(`Proxy error: ${err.message}`);
    }
  });
  
  // Handle client request errors
  req.on('error', (err) => {
    console.error('Client request error:', err.message);
    proxyReq.destroy();
  });
  
  // Handle response errors
  res.on('error', (err) => {
    console.error('Response error:', err.message);
    proxyReq.destroy();
  });
  
  // Set timeout for proxy request
  proxyReq.setTimeout(30000, () => {
    console.error('Proxy request timeout');
    proxyReq.destroy();
    if (!res.headersSent) {
      res.writeHead(504, { 
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      });
      res.end('Gateway timeout');
    }
  });
  
  // Pipe client request to proxy request
  req.pipe(proxyReq);
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err.message);
});

// Start server
server.listen(PROXY_PORT, () => {
  console.log(`Proxy server running on http://localhost:${PROXY_PORT}`);
  console.log(`Forwarding requests to ${TARGET_HOST}`);
  console.log('Press Ctrl+C to stop');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down proxy server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});