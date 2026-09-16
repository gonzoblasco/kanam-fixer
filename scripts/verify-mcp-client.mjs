/**
 * End-to-end verification of the kanam-fixer MCP server through a real
 * stdio client (the official MCP SDK), the same way an agent consumes it.
 *
 * Launches `node dist/mcp-cli.js` as a subprocess, performs the MCP
 * handshake, lists tools, then exercises both tools:
 * - read_announcements on a plain button
 * - assert_announcement that passes (expected phrase taken from the read)
 * - assert_announcement that fails (impossible phrase)
 *
 * Usage: node scripts/verify-mcp-client.mjs
 * Exit 0 with VERIFY_OK when every step behaves; exit 1 otherwise.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SERVER_COMMAND = process.execPath;
const SERVER_ARGS = [path.join(repoRoot, 'dist', 'mcp-cli.js')];
const HTML = '<button>Send</button>';

function fail(step, detail) {
  console.error(`VERIFY_FAIL ${step}: ${detail}`);
  process.exit(1);
}

const transport = new StdioClientTransport({
  command: SERVER_COMMAND,
  args: SERVER_ARGS,
});
const client = new Client({ name: 'kanam-fixer-verify', version: '0.0.1-verify' });

try {
  await client.connect(transport);
  console.log('VERIFY_INIT_OK');

  const tools = await client.listTools();
  const names = tools.tools.map((tool) => tool.name).sort();
  if (names.join(',') !== 'assert_announcement,read_announcements') {
    fail('tools', `unexpected tool names: ${names.join(',')}`);
  }
  console.log('VERIFY_TOOLS_OK assert_announcement,read_announcements');

  const readResult = await client.callTool({
    name: 'read_announcements',
    arguments: { html: HTML },
  });
  const readText = readResult.content?.[0]?.text;
  if (typeof readText !== 'string') {
    fail('read', `unexpected content: ${JSON.stringify(readResult.content)}`);
  }
  const read = JSON.parse(readText);
  if (read.error || !Array.isArray(read.phrases) || read.phrases.length === 0) {
    fail('read', `expected phrases, got: ${readText}`);
  }
  if (!read.matrix || !read.matrix.reader) {
    fail('read-matrix', `expected reader matrix, got: ${readText}`);
  }
  console.log(
    `VERIFY_READ_OK phrases=${read.phrases.length} reader=${read.matrix.reader}@${read.matrix.version}`,
  );

  const passResult = await client.callTool({
    name: 'assert_announcement',
    arguments: { html: HTML, expected: read.phrases },
  });
  const pass = JSON.parse(passResult.content?.[0]?.text);
  if (pass.error || pass.passed !== true) {
    fail('assert-pass', `expected passed:true, got: ${passResult.content?.[0]?.text}`);
  }
  console.log(`VERIFY_ASSERT_PASS_OK exact sequence (${read.phrases.length} phrases)`);

  // Contract check: the assertion matches the ordered sequence exactly, not
  // by containment. A client asking for a subset receives passed:false with
  // announced phrases - that is intended behavior, documented here so agents
  // know the full sequence is the assertion unit.
  const subsetResult = await client.callTool({
    name: 'assert_announcement',
    arguments: { html: HTML, expected: [read.phrases[0]] },
  });
  const subset = JSON.parse(subsetResult.content?.[0]?.text);
  if (subset.error || subset.passed !== false) {
    fail(
      'assert-subset',
      `expected passed:false for a subset, got: ${subsetResult.content?.[0]?.text}`,
    );
  }
  if (!Array.isArray(subset.announced) || subset.announced.length === 0) {
    fail(
      'assert-subset-announced',
      `expected announced phrases, got: ${subsetResult.content?.[0]?.text}`,
    );
  }
  console.log('VERIFY_ASSERT_SUBSET_FAIL_OK exact-sequence contract confirmed');

  const failResult = await client.callTool({
    name: 'assert_announcement',
    arguments: { html: HTML, expected: ['this phrase is never announced'] },
  });
  const failed = JSON.parse(failResult.content?.[0]?.text);
  if (failed.error || failed.passed !== false) {
    fail('assert-fail', `expected passed:false, got: ${failResult.content?.[0]?.text}`);
  }
  if (!Array.isArray(failed.announced) || failed.announced.length === 0) {
    fail(
      'assert-fail-announced',
      `expected announced phrases, got: ${failResult.content?.[0]?.text}`,
    );
  }
  console.log(`VERIFY_ASSERT_FAIL_OK announced=${failed.announced.length}`);

  console.log('VERIFY_OK');
  await client.close();
} catch (error) {
  fail('client', error instanceof Error ? error.message : String(error));
}
