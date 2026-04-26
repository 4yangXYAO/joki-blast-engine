# Learnings from Task: Template Management API (CRUD + CSV import)

- Implemented a MVP Template Management API under src/routes/templates.ts: CRUD endpoints for templates and a dedicated import endpoint for CSV payloads.
- Added lightweight CSV parser capable of handling simple quoted fields and embedded commas for MVP use.
- Implemented variable usage validation: all declared variables must appear in content within {var} syntax.
- Created unit-style tests scaffold at src/routes/templates.test.ts to exercise CRUD and import endpoints via an Express app and supertest-like flow.
- In-memory storage used for MVP; DB integration can be added with minimal changes to route layer.
- Next improvements: replace in-memory store with a database (SQLite), enhance CSV parsing to support full RFC4180, add more exhaustive tests (edge cases, error paths).
