#!/usr/bin/env node
// HTTP ↔ MCP Bridge
// Listens for HTTP requests from Activepieces workflows and forwards them
// to the camofox MCP server. Enables bidirectional communication between
// the workflow engine and browser automation.

import http from 'http';

const PORT = parseInt(process.env.BRIDGE_PORT || '9128');
const CAMOFOX_CMD = process.env.CAMOFOX_PATH || 'camofox';

let camofoxClient = null;
let requestId = 0;

class CamofoxMCPClient {
  constructor() {
    this.proc = null;
    this.buffer = '';
    this.pending = new Map();
    this.connected = false;
  }

  async connect() {
    const { spawn } = await import('child_process');
    const [cmd, ...args] = CAMOFOX_CMD.split(' ');

    this.proc = spawn(cmd, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, MCP_HEADLESS: 'true' }
    });

    this.proc.stdout.on('data', (chunk) => {
      this.buffer += chunk.toString();
      this.processMessages();
    });

    this.proc.stderr.on('data', () => {});
    this.proc.on('exit', () => { this.connected = false; });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Camofox connect timeout')), 10000);
      this.proc.stdout.once('data', () => {
        clearTimeout(timeout);
        this.connected = true;
        resolve();
      });
    });

    return this;
  }

  processMessages() {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.id !== undefined && msg.id !== null) {
          const pending = this.pending.get(msg.id);
          if (pending) { pending.resolve(msg); this.pending.delete(msg.id); }
        }
      } catch {}
    }
  }

  async callTool(name, args = {}) {
    if (!this.connected || !this.proc) throw new Error('Camofox not connected');
    const id = ++requestId;
    const msg = JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } }) + '\n';

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Tool ${name} timed out`));
      }, 30000);

      this.pending.set(id, { resolve: (result) => { clearTimeout(timeout); resolve(result); }, reject });
      this.proc.stdin.write(msg);
    });
  }

  close() {
    if (this.proc) { this.proc.kill(); this.proc = null; }
    this.connected = false;
    this.pending.clear();
  }
}

async function handleRequest(req, res) {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', camofox: camofoxClient?.connected || false, port: PORT }));
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      if (!camofoxClient || !camofoxClient.connected) {
        res.writeHead(503);
        res.end(JSON.stringify({ error: 'Camofox not connected' }));
        return;
      }

      const { action, params } = JSON.parse(body);
      if (!action) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'action is required' }));
        return;
      }

      const result = await camofoxClient.callTool(action, params || {});
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, result }));
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}

async function main() {
  console.error(`[Bridge] Starting HTTP↔MCP bridge on port ${PORT}...`);

  try {
    camofoxClient = await new CamofoxMCPClient().connect();
    console.error(`[Bridge] Camofox MCP connected`);
  } catch (err) {
    console.error(`[Bridge] Failed to connect camofox: ${err.message}`);
    console.error(`[Bridge] Will retry on each request`);
  }

  const server = http.createServer(handleRequest);
  server.listen(PORT, '127.0.0.1', () => {
    console.error(`[Bridge] Listening on http://127.0.0.1:${PORT}`);
    console.error(`[Bridge] Endpoints:`);
    console.error(`  POST /  - Execute browser action`);
    console.error(`    Body: { "action": "navigate", "params": { "url": "..." } }`);
    console.error(`    Body: { "action": "screenshot", "params": {} }`);
    console.error(`    Body: { "action": "click", "params": { "selector": "..." } }`);
    console.error(`    Body: { "action": "evaluate", "params": { "code": "..." } }`);
    console.error(`  GET /health - Check bridge status`);
    console.error(``);
    console.error(`[Bridge] Activepieces workflow can POST to this endpoint`);
    console.error(`[Bridge] to trigger browser actions autonomously.`);
  });

  const cleanup = () => {
    console.error(`\n[Bridge] Shutting down...`);
    if (camofoxClient) camofoxClient.close();
    server.close();
    process.exit(0);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch(err => { console.error(`[Bridge] Fatal: ${err.message}`); process.exit(1); });
