#!/usr/bin/env node
const endpoint = process.env.ACTIVEPIECES_ENDPOINT || 'http://localhost:8080';
const apiKey = process.env.ACTIVEPIECES_API_KEY || '';

function jsonrpc(id, method, params) {
  return JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
}

function readline() {
  return new Promise((resolve) => {
    let buffer = '';
    process.stdin.on('data', (chunk) => {
      buffer += chunk.toString();
      const idx = buffer.indexOf('\n');
      if (idx >= 0) { resolve(buffer.slice(0, idx)); buffer = buffer.slice(idx + 1); }
    });
  });
}

async function callAPI(action, params) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    if (action === 'list') {
      const res = await fetch(`${endpoint}/api/v1/workflows`, { headers, signal: AbortSignal.timeout(10000) });
      if (!res.ok) return { error: `Activepieces returned ${res.status}` };
      const data = await res.json();
      return { workflows: (data.data || []).map(w => ({ id: w.id, name: w.displayName, status: w.status })) };
    }

    if (action === 'execute') {
      const res = await fetch(`${endpoint}/api/v1/webhooks/${params.workflowId}`, {
        method: 'POST', headers,
        body: JSON.stringify(params.payload || {}),
        signal: AbortSignal.timeout(parseInt(process.env.MCP_TIMEOUT) || 30000)
      });
      if (!res.ok) return { error: `Execution returned ${res.status}` };
      const data = await res.json();
      return { executionId: data.id || data.executionId, status: 'completed' };
    }

    if (action === 'status') {
      const res = await fetch(`${endpoint}/api/v1/executions/${params.executionId}`, { headers, signal: AbortSignal.timeout(10000) });
      if (!res.ok) return { error: `Status returned ${res.status}` };
      const data = await res.json();
      return { executionId: params.executionId, status: data.status };
    }

    return { error: `Unknown action: ${action}` };
  } catch (err) {
    return { error: err.message };
  }
}

async function main() {
  process.stdout.write(jsonrpc(null, 'tools/list', {
    tools: [
      { name: 'workflow_execute', description: 'Execute an Activepieces workflow by ID. Can pass browser_step payload to trigger stealth_browser actions.', inputSchema: { type: 'object', properties: { workflowId: { type: 'string' }, payload: { type: 'object' } }, required: ['workflowId'] } },
      { name: 'workflow_list', description: 'List all Activepieces workflows', inputSchema: { type: 'object', properties: {} } },
      { name: 'workflow_status', description: 'Check workflow execution status', inputSchema: { type: 'object', properties: { executionId: { type: 'string' } }, required: ['executionId'] } }
    ]
  }));

  while (true) {
    const line = await readline();
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.method === 'tools/call') {
        const { name, arguments: args } = msg.params;
        let result;
        if (name === 'workflow_execute') result = await callAPI('execute', args);
        else if (name === 'workflow_list') result = await callAPI('list', {});
        else if (name === 'workflow_status') result = await callAPI('status', args);
        else result = { error: `Unknown tool: ${name}` };
        process.stdout.write(jsonrpc(msg.id, null, result));
      }
    } catch {}
  }
}

main().catch(err => { process.stderr.write(err.message); process.exit(1); });
