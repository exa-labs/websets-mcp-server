# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Exa Websets MCP Server — a Model Context Protocol server that exposes Exa's Websets API as tools for Claude Desktop, Cursor, and other MCP clients. Websets are self-updating collections of web entities (companies, people, papers) with search, enrichment, and monitoring capabilities.

## Build & Development Commands

```bash
npm run build              # TypeScript compile to dist/ + chmod +x
npm run watch              # TypeScript watch mode (tsc --watch, outputs to dist/)
npm run start              # Run the server (node dist/index.js)
npm run dev                # Dev mode with auto-restart
npm run inspector          # Run MCP inspector against dist/index.js
npm run test               # Run tests (vitest run)
npx vitest run src/handlers/__tests__/enrichments.test.ts  # Run a single test file
```

## Architecture

### Unified Dispatcher (v2.0.0)

The server exposes a **single MCP tool** (`manage_websets`) that dispatches to 38 operations across 8 domains. This follows the Thoughtbox hub tool pattern.

### Entry Point

`src/index.ts` — Express + StreamableHTTPServerTransport. Registers the single `manage_websets` tool via `registerManageWebsetsTool(server, exa)`.

### Tool Input Schema

```typescript
{
  operation: z.enum([...38 operation names]),  // e.g. "websets.create", "searches.get"
  args: z.record(z.string(), z.unknown()).optional()  // operation-specific args
}
```

### Dispatcher

`src/tools/manageWebsets.ts` — contains the OPERATIONS registry (Map of operation name → handler + summary), builds the tool description, and dispatches to domain handlers.

### Domain Handlers (src/handlers/)

| File | Operations | Count |
|------|-----------|-------|
| `websets.ts` | create, get, list, update, delete, cancel, preview | 7 |
| `searches.ts` | create, get, cancel | 3 |
| `items.ts` | list, get, delete | 3 |
| `enrichments.ts` | create, get, cancel, update, delete | 5 |
| `monitors.ts` | create, get, list, update, delete, runsList, runsGet | 7 |
| `webhooks.ts` | create, get, list, update, delete, listAttempts | 6 |
| `imports.ts` | create, get, list, update, delete | 5 |
| `events.ts` | list, get | 2 |

Each handler exports named functions with signature `(args: Record<string, unknown>, exa: Exa) => Promise<ToolResult>`.

### Key Modules

- `src/handlers/types.ts` — `ToolResult`, `OperationHandler` types, `successResult()` and `errorResult()` helpers
- `src/lib/exa.ts` — Singleton Exa client
- `src/utils/logger.ts` — Debug-conditional stderr logging with request ID generation

### Application-Level Validations

Three handlers have validation beyond what the SDK enforces:
- `enrichments.create` — options required when format='options', max 150 options
- `monitors.create` — cron expression must have exactly 5 fields
- `searches.create` — error messages include "Common issues" hints

### Parameter Format Gotchas

AI callers commonly get these wrong:
- `criteria` must be `[{description: "..."}]` (array of objects, not strings)
- `entity` must be `{type: "company"}` (object, not string)
- `options` must be `[{label: "..."}]` (array of objects, not strings)
- `cron` must be 5-field format: `"minute hour day month weekday"`

## Testing

Tests use **Vitest** with config in `vitest.config.ts` (excludes `dist/` dir). Test files live in `src/handlers/__tests__/`. Tests mock the Exa client to verify handler logic, validation, and error formatting.

## Environment

- **Required**: `EXA_API_KEY` environment variable (or passed via config)
- **Node**: >=18.0.0
- **Module system**: ESM (`"type": "module"` in package.json)
- TypeScript target: ES2022, module: Node16, strict mode

## Issue Tracking

This project uses **bd** (beads) for issue tracking. See `bd ready` for available work, `bd sync` to push beads state with git.
