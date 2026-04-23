## [2026-04-22 18:50] Initial Learnings
- Node.js version 24+ might have issues with some native modules like `better-sqlite3` on Windows without build tools.
- Workaround: Use `--ignore-scripts` or ensure build tools are installed.
- SQLite WAL mode is confirmed to be used for concurrency.

## [2026-04-23 12:00] Additional Learnings
- Added environment configuration scaffold: .env.example, src/config/secrets.ts, and a validation workflow.
- Validation script passes locally (validate:config) by loading .env.example and ensuring LOG_LEVEL is set.
## [2026-04-23 15:10] Plan refinement: Expanded environment variables
- Updated src/config/secrets.ts to require: DATABASE_PATH, API_PORT, API_HOST, DASHBOARD_PORT, JWT_SECRET, LOG_LEVEL.
- Expanded .env.example with placeholders for all new variables, including JWT_SECRET and ports/host/database path.
- Updated README.md with Environment Variables documentation and validation steps.
- Validation still passes with the complete .env.example when running npm run validate:config.
