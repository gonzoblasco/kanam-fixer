/**
 * kanam-fixer MCP companion server.
 *
 * Exposes the announcement assertion over MCP so AI agents can verify what a
 * screen reader announces for a piece of HTML, without opening a browser or
 * driving a real screen reader.
 *
 * Two tools:
 * - read_announcements: observe what the reader announces for the HTML.
 * - assert_announcement: verify the announcement against an expected sequence.
 *
 * The virtual plane is the default driver (runs on any host, CI-safe). The
 * real plane (VoiceOver/NVDA through Guidepup) is available only on a host
 * whose platform is supported; requesting it elsewhere returns a structured
 * error instead of a silent fallback.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { JSDOM } from 'jsdom';
import { z } from 'zod';

import { readAnnouncements } from './expect-announcement.js';
import {
  describeError,
  type ReaderDriver,
  realDriver,
  realReaderAvailability,
  virtualDriver,
} from './readers.js';

const driverSchema = z.enum(['virtual', 'real']).default('virtual');

const readAnnouncementsSchema = {
  html: z
    .string()
    .min(1)
    .describe(
      'HTML snippet to read with the screen reader. A fragment is fine; it is wrapped in a document.',
    ),
  driver: driverSchema.describe(
    'Reader plane: virtual runs on any host, real (VoiceOver/NVDA) needs a supported platform.',
  ),
};

const assertAnnouncementSchema = {
  html: z
    .string()
    .min(1)
    .describe(
      'HTML snippet to read with the screen reader. A fragment is fine; it is wrapped in a document.',
    ),
  expected: z
    .array(z.string())
    .min(1)
    .describe('Ordered phrases the reader must announce, exactly as spoken.'),
  driver: driverSchema.describe(
    'Reader plane: virtual runs on any host, real (VoiceOver/NVDA) needs a supported platform.',
  ),
};

async function resolveDriver(
  requested: 'virtual' | 'real' | undefined,
): Promise<{ ok: true; driver: ReaderDriver } | { ok: false; reason: string }> {
  if (requested === 'real') {
    const availability = await realReaderAvailability();
    if (!availability.available) {
      return { ok: false, reason: availability.reason };
    }
    return { ok: true, driver: realDriver };
  }
  return { ok: true, driver: virtualDriver };
}

/** Wrap raw HTML into a container node the reader can walk. */
function containerFromHtml(html: string): Node {
  return new JSDOM(html).window.document.body;
}

export interface KanamFixerServerInfo {
  name: string;
  version: string;
}

/**
 * Builds the MCP server. Connect it to any transport: stdio for a CLI agent,
 * in-memory for tests, HTTP for a remote client.
 */
export function createKanamFixerServer(info: KanamFixerServerInfo): McpServer {
  const server = new McpServer(
    { name: info.name, version: info.version },
    {
      capabilities: { tools: {} },
      instructions:
        'kanam-fixer asserts what a screen reader announces, not DOM attributes. ' +
        'Use read_announcements to observe the announcement for some HTML, and ' +
        'assert_announcement to verify it against an expected phrase sequence. ' +
        'Every result carries the reader matrix (reader, version, OS): the announcement ' +
        'is only valid against that matrix, never universal. The virtual plane is the ' +
        'default and the only one that runs on any host.',
    },
  );

  server.registerTool(
    'read_announcements',
    {
      title: 'Read screen reader announcements',
      description:
        'Walks the given HTML with a screen reader and returns every phrase it announces, ' +
        'in order, plus the reader matrix the phrases are valid against.',
      inputSchema: readAnnouncementsSchema,
    },
    async (args) => {
      const driver = args.driver ?? 'virtual';
      const resolved = await resolveDriver(driver);
      if (!resolved.ok) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: resolved.reason }, null, 2) }],
          isError: true,
        };
      }

      try {
        const { phrases, matrix } = await readAnnouncements(containerFromHtml(args.html), {
          driver: resolved.driver,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify({ phrases, matrix }, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            { type: 'text', text: JSON.stringify({ error: describeError(error) }, null, 2) },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    'assert_announcement',
    {
      title: 'Assert screen reader announcements',
      description:
        'Reads the given HTML with a screen reader and checks the announced phrase sequence ' +
        'against the expected one. Returns passed, the expected sequence, what was actually ' +
        'announced, and the reader matrix.',
      inputSchema: assertAnnouncementSchema,
    },
    async (args) => {
      const driver = args.driver ?? 'virtual';
      const resolved = await resolveDriver(driver);
      if (!resolved.ok) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: resolved.reason }, null, 2) }],
          isError: true,
        };
      }

      try {
        const { phrases, matrix } = await readAnnouncements(containerFromHtml(args.html), {
          driver: resolved.driver,
        });
        const passed =
          phrases.length === args.expected.length &&
          phrases.every((phrase, index) => phrase === args.expected[index]);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { passed, expected: args.expected, announced: phrases, matrix },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            { type: 'text', text: JSON.stringify({ error: describeError(error) }, null, 2) },
          ],
          isError: true,
        };
      }
    },
  );

  return server;
}
