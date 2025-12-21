#!/usr/bin/env npx tsx
/**
 * Local Print Proxy
 *
 * Runs on your Mac and receives print jobs from the production app.
 * Production calls your Tailscale IP → this proxy → lp → Zebra printer
 *
 * Usage: npx tsx scripts/print-proxy.ts
 *
 * Then configure production to POST to http://100.88.172.122:3001/print
 */

import { createServer } from 'http';
import { spawn } from 'child_process';

const PORT = 3001;

const server = createServer(async (req, res) => {
  // CORS headers for production app
  res.setHeader('Access-Control-Allow-Origin', 'https://www.cladari.ai');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/print') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { zpl } = JSON.parse(body);

        if (!zpl) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Missing zpl field' }));
          return;
        }

        // Send to Zebra printer
        const result = await new Promise<{ success: boolean; jobId?: string; error?: string }>((resolve) => {
          const lp = spawn('lp', ['-d', 'Zebra', '-o', 'raw', '-']);
          let stdout = '';
          let stderr = '';

          lp.stdout.on('data', (data) => { stdout += data.toString(); });
          lp.stderr.on('data', (data) => { stderr += data.toString(); });

          lp.on('error', (err) => resolve({ success: false, error: err.message }));
          lp.on('close', (code) => {
            if (code === 0) {
              const jobMatch = stdout.match(/request id is ([\w-]+)/);
              resolve({ success: true, jobId: jobMatch?.[1] || 'unknown' });
            } else {
              resolve({ success: false, error: stderr || `Exit code ${code}` });
            }
          });

          lp.stdin.write(zpl);
          lp.stdin.end();

          setTimeout(() => {
            lp.kill();
            resolve({ success: false, error: 'Timeout' });
          }, 10000);
        });

        res.writeHead(result.success ? 200 : 500);
        res.end(JSON.stringify(result));
        console.log(`[${new Date().toISOString()}] Print ${result.success ? '✓' : '✗'} ${result.jobId || result.error}`);

      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`🖨️  Print proxy listening on http://localhost:${PORT}`);
  console.log(`   Production can POST to http://100.88.172.122:${PORT}/print`);
  console.log(`   Body: { "zpl": "^XA...^XZ" }`);
});
