## [2026-04-22 18:50] Initial Decisions
- Database: SQLite with WAL mode.
- Project Structure: Modular `src/` directory with `api`, `adapters`, `queue`, `scheduler`, `workers`, etc.
- Wave 1 progress: Task 1 and 2 completed.
- Added environment config plan: include .env.example, secrets.ts, and validate:config script.
- Decision: Implement WhatsApp Adapter with Cloud API and whatsapp-web.js fallback as a single cohesive task. Use mocks for tests; no real API calls in CI.
- Rationale: Provides a robust adapter abstraction that can switch between Cloud API and automation, while enabling test-driven development.
