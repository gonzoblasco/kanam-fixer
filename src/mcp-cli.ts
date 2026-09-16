#!/usr/bin/env node

/**
 * CLI entry point for the kanam-fixer MCP server (stdio transport).
 *
 * Usage: node dist/mcp-cli.js
 *
 * The server speaks MCP over stdin/stdout. A client (Claude Code, OpenClaw
 * tool gateway, any MCP-aware agent) launches it as a subprocess.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { version } from './index.js';
import { createKanamFixerServer } from './mcp-server.js';

const server = createKanamFixerServer({ name: 'kanam-fixer', version });

const transport = new StdioServerTransport();
await server.connect(transport);
