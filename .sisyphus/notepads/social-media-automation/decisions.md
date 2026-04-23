## [2026-04-22 18:50] Initial Decisions
- Database: SQLite with WAL mode.
- Project Structure: Modular `src/` directory with `api`, `adapters`, `queue`, `scheduler`, `workers`, etc.
- Wave 1 progress: Task 1 and 2 completed.
- Added environment config plan: include .env.example, secrets.ts, and validate:config script.
- Decision: Implement WhatsApp Adapter with Cloud API and whatsapp-web.js fallback as a single cohesive task. Use mocks for tests; no real API calls in CI.
- Rationale: Provides a robust adapter abstraction that can switch between Cloud API and automation, while enabling test-driven development.
Decision log - Threads Adapter
- Chosen approach: Implement a dedicated ThreadsAdapter interfacing with Meta Threads Graph API endpoints (publish, replies, get status, list accounts).
- Authentication: OAuth2 Bearer token obtained from THREADS_ACCESS_TOKEN via config loader. Implemented authenticate/isAuthenticated helpers and a connect step.
- Data flow: postMessage wraps publish call; replyToMessage wraps replies; getMessageStatus for status; listAccounts for accounts; getRateLimitStatus uses in-memory counters similar to other adapters.
- Testing: Jest-based unit tests with axios mocked; tests focus on endpoint calls and error mapping patterns consistent with Twitter/WhatsApp adapters.
- Risks/Notes: Exact Threads Graph API surface is evolving; adapt to official endpoints if needed; ensure environment variable coverage aligns with plan (THREADS_ACCESS_TOKEN required).
