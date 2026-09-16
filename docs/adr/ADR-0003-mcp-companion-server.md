# ADR-0003: MCP Companion Server

**Status:** Accepted
**Date:** 2026-09-15
**Context:** kanam-fixer 0.0.1 closed (S3 declared as a limitation, 2026-09-15), cycle 0.0.2 opened.

## Context

The 0.0.1 cycle closed with a measured, partial verdict: the virtual plane is a cheap regression net for attribute and composition bugs, and misses timing and viewport bugs. The real plane is the only judge for that class, and it depends on Guidepup shipping a Darwin 27 asset (blocked upstream, guidepup/guidepup#149).

The project's value, however, is an assertion over the announcement. The 0.0.1 outcome left that value locked behind a platform the machine cannot drive. While the real plane waits upstream, there is an audience that can use the same assertion today: AI agents. Agents that build, review or test UI (Claude Code, OpenClaw tool gateway, any MCP-aware tool) cannot hear a screen reader, but they can call a tool that returns what a reader announces for a snippet of HTML. That turns the announcement assertion into a capability agents can verify with, in CI and in the loop.

The Model Context Protocol (MCP) is the standard for exposing tools to agents. It is transport-agnostic, so the same server works over stdio for a CLI agent and over HTTP for a remote client.

## Decision

Ship an **MCP companion server** that exposes the announcement assertion as two tools:

- `read_announcements(html, driver?)` - walk the given HTML with a reader and return every phrase announced, in order, plus the reader matrix (ADR-0002).
- `assert_announcement(html, expected, driver?)` - check the announced sequence against an expected one; return `passed`, the expected sequence, what was announced, and the matrix.

The server is a **companion**: it reuses the existing public layer (`readAnnouncements` from ADR-0001). It adds no new assertion logic. The MCP surface is a thin adapter over the same contract the library exposes.

The virtual plane is the default driver (runs on any host, CI-safe). Requesting the real plane on a host whose platform is unsupported returns a **structured error** with the reason (the availability check from the library), never a silent fallback to virtual: an agent must know which plane it got.

Every tool result carries the reader matrix (reader, version, OS), per ADR-0002: the announcement is valid against that matrix, never universal. The server instructions tell the agent this.

## Why a server, not just the library

- The library exists for code. Agents do not run JavaScript against arbitrary HTML in a browser; they call tools over a protocol. MCP is where agents already are.
- It unblocks the value of the announcement assertion without waiting for S3: `read_announcements` over the virtual plane is demoable today, in CI and in agent loops.
- It is the natural next consumer of the same API, so it forces the public layer to stay small and stable instead of growing ad-hoc client code.

## Why not instead

- **A new project**: the earlier proposal (2026-09-15) listed an MCP server of announcement testing for AI agents as a separate idea (#9) and rejected it as a lone project. As a companion surface of kanam-fixer it has one owner, one matrix, one contract. That is the reason it lives here.
- **A browser extension**: the extension captures announcements of a live page and needs a real screen reader anyway; it inherits the same S3 blocker. The MCP server runs the virtual plane without any platform dependency and remains useful in CI.
- **Only the library**: it leaves agent integration to users, which is where the value is thin.

## Consequences

- New runtime dependencies: `@modelcontextprotocol/sdk`, `jsdom` (moved from dev), `zod` (schema of the tool inputs).
- The server is launched as a subprocess (`node dist/mcp-cli.js`) over stdio. The CLI entrypoint lives in `src/mcp-cli.ts`, the server in `src/mcp-server.ts`.
- The in-memory transport is used in tests, so the suite runs without spawning subprocesses.
- Publishing to npm is still a separate decision that requires explicit approval. The MCP server is a distribution vehicle, not a decision to publish.
- The 0.0.2 cycle is opened around this surface; S3 remains a declared limitation in the matrix (ADR-0002), unchanged.
- The project's English-only public surface rule applies: ADRs, README and code are in English.
