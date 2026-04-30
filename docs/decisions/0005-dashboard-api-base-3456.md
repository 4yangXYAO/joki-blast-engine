# Decision 0005: Dashboard API base defaults to port 3456

## Status

Accepted.

## Context

The dashboard is a client-side admin UI and needs a stable API base to reach the backend during local development. The backend listens on `3456`, but the UI previously defaulted to a different port.

## Decision

Default the dashboard API base to `http://127.0.0.1:3456` and still allow `NEXT_PUBLIC_API_BASE` or `NEXT_PUBLIC_API_BASE_URL` to override it.

## Reasoning

- It matches the backend's actual development port.
- It removes the need for manual environment setup for local use.
- It keeps remote or deployed environments configurable.

## Consequences

- Local dashboard access works without extra config when the API runs on `3456`.
- A misconfigured override can still break the UI, so the health card remains important.
- If the backend port changes in the future, the default must be updated in the dashboard.

## Reversal Trigger

If the backend development port changes or the repository adopts a same-origin proxy, revisit the default and the override strategy.
