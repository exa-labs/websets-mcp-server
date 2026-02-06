---
name: websets-hdd
description: HDD workflow for Websets MCP Server integration testing with real Exa API.
hooks:
  Stop:
    - hooks:
        - type: command
          command: "echo 'Stopping Websets HDD session'"
---

# /websets-hdd

Hypothesis-Driven Development (HDD) workflow for **real integration tests** against the Exa Websets API.

## Context

- **Objective**: Replace mock-only tests with integration tests that hit the real Exa API, validating that all 38 handlers actually work.
- **Prerequisite**: `EXA_API_KEY` set in `.env` (loaded via dotenv or vitest env config).
- **Current state**: 23 mock-only tests exist. They verify internal logic (validation rules, param assembly) but not SDK compatibility.

## Prior Work (Complete)

- ADR-001 accepted: unified dispatcher (`manage_websets`) with 38 operations across 8 domains
- All handlers implemented in `src/handlers/`
- Mock tests in `src/handlers/__tests__/` covering validation logic
- Output dir standardized to `dist/`

## Hypotheses

1. **SDK Compatibility**: All 38 handler functions produce params that the real Exa API accepts without 400/422 errors.
2. **Response Shape**: API responses match what `successResult()` can serialize — no circular refs, no missing fields.
3. **Error Fidelity**: When the API rejects a request, our `errorResult()` captures the actual error message (not just "Unknown error").

## Phases

### Phase 1: Research & Test Infrastructure
- Determine how to load `.env` in vitest (dotenv plugin or `globalSetup`)
- Decide test isolation strategy: create a test webset per suite, clean up after
- Check which operations are safe to test (create + delete cycles) vs read-only
- Map out test dependency order: websets first (needed by searches, items, enrichments, monitors)

### Phase 2: Integration Tests (by domain)
Write tests using real `Exa` client against live API. Each domain gets its own test file in `src/handlers/__tests__/`.

**Test order matters** — later domains depend on earlier ones:

1. **Websets** (`integration/websets.test.ts`): create → get → list → update → cancel/delete
2. **Searches** (`integration/searches.test.ts`): create search on test webset → get → cancel
3. **Items** (`integration/items.test.ts`): list items from search results → get → delete
4. **Enrichments** (`integration/enrichments.test.ts`): create → get → update → cancel → delete
5. **Monitors** (`integration/monitors.test.ts`): create → get → list → update → delete, runs.list, runs.get
6. **Webhooks** (`integration/webhooks.test.ts`): create → get → list → update → delete, list_attempts
7. **Imports** (`integration/imports.test.ts`): create → get → list → update → delete
8. **Events** (`integration/events.test.ts`): list → get (read-only, depends on activity from other tests)

### Phase 3: Error Path Testing
- Invalid/missing IDs → expect structured error, not crash
- Auth failures (bad API key) → expect clear error message
- Validation edge cases (malformed cron, >150 options, missing required fields)
- Rate limiting behavior if applicable

## Agent Instructions

1. Use `bd create` / `bd close` for issue tracking (beads, not TodoWrite).
2. Integration tests should be in a separate directory (`src/handlers/__tests__/integration/`) so they can be run independently from unit tests.
3. Tests MUST clean up after themselves — delete any websets/monitors/webhooks created during testing.
4. Use `describe.sequential` or similar to ensure ordered execution within a domain suite.
5. Tag integration tests so they can be skipped in CI without an API key: `describe.skipIf(!process.env.EXA_API_KEY)`.
6. Keep existing mock tests — they test validation logic that doesn't need API calls.
