# Decision 0003: Keep sql.js as a fallback

## Status

Accepted.

## Context

The native `better-sqlite3` binding can fail on Windows when the Node ABI changes.

## Decision

Keep `sql.js` as a fallback path for database initialization and testing.

## Reasoning

This preserves a working system in environments where the native binding is unavailable or needs a rebuild.

## Consequences

- Development remains portable.
- Tests can run even when the native binding is broken.
- The code must handle both native and sql.js database behaviors.
