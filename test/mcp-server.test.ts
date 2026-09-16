import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterAll, describe, expect, it } from 'vitest';
import { describeMatrix, VIRTUAL_MATRIX } from '../src/matrix.js';
import { createKanamFixerServer } from '../src/mcp-server.js';
import { settingsPanel } from './fixtures/settings-panel.js';

interface ToolResult {
  passed?: boolean;
  error?: string;
  phrases?: string[];
  expected?: string[];
  announced?: string[];
  matrix?: { reader: string; version: string; os: string };
}

function parseTextResult(content: unknown): ToolResult {
  if (!Array.isArray(content) || content.length === 0) {
    throw new Error(`unexpected MCP content: ${JSON.stringify(content)}`);
  }
  const item = content[0] as { type: string; text: string };
  if (item.type !== 'text') {
    throw new Error(`unexpected MCP content type: ${item.type}`);
  }
  return JSON.parse(item.text) as ToolResult;
}

const client = new Client({ name: 'kanam-fixer-test', version: '0.0.1-test' });
let connected = false;

describe('kanam-fixer MCP server', () => {
  it('hands out both tools over MCP', async () => {
    const server = createKanamFixerServer({ name: 'kanam-fixer', version: '0.0.2' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
    connected = true;

    const tools = await client.listTools();
    const names = tools.tools.map((tool) => tool.name).sort();
    expect(names).toEqual(['assert_announcement', 'read_announcements']);
  });

  it('reads the announcement of a panel (virtual plane)', async () => {
    const result = await client.callTool({
      name: 'read_announcements',
      arguments: { html: settingsPanel() },
    });
    const parsed = parseTextResult(result.content);

    expect(parsed.error).toBeUndefined();
    expect(parsed.phrases).toContain('heading, Notification settings, level 1');
    expect(parsed.phrases).toContain('button, Email, pressed');
    expect(parsed.matrix).toEqual(VIRTUAL_MATRIX);
  });

  it('passes when the announcement matches the expected sequence', async () => {
    const result = await client.callTool({
      name: 'assert_announcement',
      arguments: {
        html: settingsPanel(),
        expected: [
          'document',
          'main',
          'heading, Notification settings, level 1',
          'form',
          'group, Channels',
          'button, Email, pressed',
          'button, SMS, not pressed',
          'end of group, Channels',
          'end of form',
          'end of main',
          'end of document',
        ],
      },
    });
    const parsed = parseTextResult(result.content);

    expect(parsed.error).toBeUndefined();
    expect(parsed.passed).toBe(true);
  });

  it('fails when the announcement breaks, with the actual phrases in the result', async () => {
    const result = await client.callTool({
      name: 'assert_announcement',
      arguments: {
        html: settingsPanel({ break: 'missingGroupName' }),
        expected: [
          'document',
          'main',
          'heading, Notification settings, level 1',
          'form',
          'group, Channels',
          'button, Email, pressed',
          'button, SMS, not pressed',
          'end of group, Channels',
          'end of form',
          'end of main',
          'end of document',
        ],
      },
    });
    const parsed = parseTextResult(result.content);

    expect(parsed.error).toBeUndefined();
    expect(parsed.passed).toBe(false);
    expect(parsed.announced).not.toContain('group, Channels');
  });

  it('reports the matrix in every result (ADR-0002)', async () => {
    const result = await client.callTool({
      name: 'read_announcements',
      arguments: { html: '<h1>Hello</h1>' },
    });
    const parsed = parseTextResult(result.content);

    expect(parsed.matrix).toEqual(VIRTUAL_MATRIX);
    expect(
      describeMatrix(parsed.matrix as { reader: string; version: string; os: string }),
    ).toMatch(/^virtual /);
  });
});

afterAll(async () => {
  if (connected) {
    await client.close();
  }
});
