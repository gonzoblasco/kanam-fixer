/** Smoke test for the MCP stdio entrypoint (not part of the suite). */
import { spawn } from 'node:child_process';

const child = spawn('node', ['dist/mcp-cli.js'], { stdio: ['pipe', 'pipe', 'pipe'] });
const timeout = setTimeout(() => {
  console.error('SMOKE_TIMEOUT');
  child.kill('SIGKILL');
  process.exit(1);
}, 15000);

let buffer = '';
const lines = [];
let stderr = '';

child.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  let idx = buffer.indexOf('\n');
  while (idx >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (line) lines.push(JSON.parse(line));
    idx = buffer.indexOf('\n');
  }
});

child.stderr.on('data', (chunk) => {
  stderr += chunk.toString();
});

function send(message) {
  child.stdin.write(`${JSON.stringify(message)}\n`);
}

child.on('close', (code) => {
  if (code !== 0) {
    console.error('SMOKE_CHILD_EXIT', code);
    console.error(stderr.slice(-2000));
    process.exit(1);
  }
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const main = async () => {
  send({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'smoke', version: '0' },
    },
  });

  for (let i = 0; i < 50; i += 1) {
    if (lines.some((l) => l.id === 1)) break;
    await sleep(100);
  }

  const init = lines.find((l) => l.id === 1);
  if (!init || init.error) {
    console.error('SMOKE_INIT_FAILED', JSON.stringify(init ?? lines));
    child.kill('SIGKILL');
    process.exit(1);
  }
  console.log('SMOKE_INIT_OK', init.result.serverInfo.name, init.result.serverInfo.version);

  send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  await sleep(200);

  send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });

  for (let i = 0; i < 50; i += 1) {
    if (lines.some((l) => l.id === 2)) break;
    await sleep(100);
  }

  const tools = lines.find((l) => l.id === 2);
  if (!tools || tools.error) {
    console.error('SMOKE_TOOLS_FAILED', JSON.stringify(tools ?? lines));
    child.kill('SIGKILL');
    process.exit(1);
  }

  const names = tools.result.tools.map((t) => t.name).sort();
  console.log('SMOKE_TOOLS_OK', names.join(','));

  clearTimeout(timeout);
  child.kill('SIGTERM');
  process.exit(names.join(',') === 'assert_announcement,read_announcements' ? 0 : 1);
};

main();
