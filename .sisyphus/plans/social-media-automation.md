# Social Media Automation Platform - Work Plan

## TL;DR
> **Summary**: Build a Node.js/TypeScript platform that automates content distribution across WhatsApp, Telegram, Twitter, Threads, Instagram. Support multi-account management, template-based + trigger-based + AI-powered replies, strict rate limiting with job queue retries, rich analytics, and admin dashboard (Next.js).
> 
> **Deliverables**: 
> - Modular backend (API + job workers)
> - Multi-platform adapters (5 integrations)
> - Admin dashboard (Next.js/React)
> - Database schema (SQLite with WAL)
> - Job queue system with retry/backoff
> - Rate limiting per platform
> - Alert system (email + in-app + webhooks)
> 
> **Effort**: XL (15-20 sprints for full MVP)
> **Parallel**: YES - 3-4 waves (adapters in parallel, core services shared)
> **Critical Path**: Core API + Job Queue → Platform Adapters → Dashboard → Testing & Deployment

---

## Context

### Original Request
User requested a social media automation platform for managing joki (outsourcing) services. Target platforms: WhatsApp, Telegram, Twitter, Threads, Instagram. Capabilities: auto-posting, auto-commenting, auto-replies to comments. Content topics: joki tugas, skripsi, web, IT services.

### Interview Summary
- **Tech Stack**: Node.js/TypeScript, SQLite (single VPS), Next.js dashboard
- **Auth Model**: Cookies-based (browser automation) + official APIs where available
- **Content Management**: Hybrid (Dashboard UI + CSV import + API)
- **Scheduling**: Time-based (cron) + event-driven (webhooks)
- **Analytics**: Rich metrics (engagement, reach, per-platform performance)
- **Multi-Account**: Support multiple accounts per platform
- **Comment Strategy**: Three modes (template + trigger + LLM), all three implemented
- **Failure Handling**: Auto-retry + exponential backoff + multi-channel alerts
- **Rate Limiting**: Strict compliance with platform quotas

### Metis Review (Gap Analysis & Guardrails)

**Key Risks Mitigated**:
1. Platform ToS violations (cookies) → Prioritize official APIs, use automation as fallback
2. SQLite bottleneck → Use WAL mode, plan PostgreSQL migration early
3. Scope creep → Strict MVP boundaries defined in "Must Have / Must NOT Have"
4. Architecture gaps → Logging, secrets, deployment, observability components identified

**Architecture Components Added**:
- Observability: Structured logs + metrics dashboard
- Secrets management: Encrypted storage + rotation
- Rate limiter: Per-platform handlers + circuit breakers
- Job queue: BullMQ with dead-letter, backoff+jitter
- Deployment: Docker-based MVP

---

## Work Objectives

### Core Objective
Deliver a production-ready social media automation platform that reduces manual content posting across 5 platforms by 90%. Support team-driven content management with AI-powered contextual replies and strict rate-limit compliance.

### Deliverables
1. REST API (auth, account management, template CRUD, job scheduling, analytics)
2. Job queue system with per-platform retry logic
3. Platform adapters (WhatsApp Cloud API + whatsapp-web.js, Telegram Bot API + telegraf, Twitter API v2 + twitter-api-v2, Threads API + official endpoints, Instagram Graph API + instagram-private-api fallback)
4. Admin dashboard (account management, template editor, scheduling, job monitoring, analytics)
5. Database schema (SQLite with migrations)
6. Rate limiter & backoff handler per platform
7. Alert system (email, in-app, webhooks)
8. Logging & monitoring (structured logs, metrics, health checks)
9. Deployment package (Docker Compose, VPS setup guide)
10. Test suite with agent-executable acceptance criteria

### Definition of Done (Verifiable Conditions)
```bash
# API health
curl -s http://localhost:3000/health | jq '.status' → "ok"

# Database initialized
sqlite3 data.db ".tables" | grep -E "accounts|templates|jobs|posts"

# All 5 adapters loaded
curl -s http://localhost:3000/adapters | jq '.platforms | length' → 5

# Job queue running
curl -s http://localhost:3000/queue/status | jq '.workers | length' → >= 1

# Dashboard accessible
curl -s http://localhost:3001 | grep -q "Admin Dashboard"

# End-to-end post successful
curl -X POST http://localhost:3000/v1/posts with valid payload → 201 Created, job_id in response
sqlite3 data.db "SELECT status FROM jobs WHERE id='$job_id';" → "posted" or "pending"
```

### Must Have (MVP Scope)
- [x] Multi-account per platform
- [x] Template-based posting (variables, personalization)
- [x] Trigger-based replies (keyword matching)
- [x] Time-based scheduling (cron expressions)
- [x] CSV/spreadsheet import for bulk templates
- [x] Basic analytics (posts sent, success rate, engagement)
- [x] Rate limiting with exponential backoff
- [x] Job queue with retry (auto + configurable)
- [x] Admin dashboard (basic CRUD)
- [x] Email + webhook alerts on failures
- [x] API-first architecture (REST endpoints)

### Must NOT Have (Defer to v1.1+)
- [ ] LLM-powered replies (defer; template + trigger sufficient for MVP)
- [ ] Multi-tenant user management (admin-only MVP)
- [ ] Advanced sentiment analysis
- [ ] Influencer management / follower tracking
- [ ] Mobile app (web dashboard only)
- [ ] Blockchain / Web3 integrations
- [ ] Self-serve SaaS platform (internal tool only)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION**: All verification is agent-executed. No manual testing in production.

### Test Decision
- **Approach**: Tests-after + comprehensive agent QA scenarios
- **Framework**: Jest (unit), Playwright (E2E), custom job queue simulator (integration)
- **Coverage Target**: >80% critical paths (API, adapters, job queue)

### QA Policy
Every task includes:
1. **Happy path scenario**: Normal posting flow end-to-end
2. **Failure scenario**: Rate limit / network error / invalid credentials
3. **Edge case scenario**: Multi-account concurrency, template variable injection, backoff progression

### Evidence Storage
All evidence to: `.sisyphus/evidence/{task-N}-{slug}.{ext}`

---

## Execution Strategy

### Wave-Based Parallelization

#### Wave 1: Foundation (Weeks 1-2) - 4 tasks
Core infrastructure & database schema.

**Dependencies**: None (foundation)
**Parallelization**: Full parallel (no interdependencies)

#### Wave 2: API & Adapters (Weeks 3-5) - 6 tasks
REST API endpoints, per-platform adapter implementations.

**Dependencies**: Wave 1 (database schema)
**Parallelization**: API + 5 adapters can run in parallel

#### Wave 3: Queue & Automation (Weeks 6-7) - 3 tasks
Job queue system, retry logic, rate limiter.

**Dependencies**: Wave 1 (database), Wave 2 (adapters)
**Parallelization**: Queue + rate limiter + scheduler in parallel

#### Wave 4: Dashboard & Integration (Weeks 8-9) - 3 tasks
Admin UI, analytics queries, end-to-end integration.

**Dependencies**: Wave 2 (API), Wave 3 (queue)
**Parallelization**: Dashboard + analytics + integration tests in parallel

#### Wave 5: Deployment & Documentation (Weeks 10) - 2 tasks
Docker setup, deployment guide, monitoring.

**Dependencies**: All previous waves
**Parallelization**: Docker + docs can run in parallel

#### Wave 6: Final Verification (Weeks 11) - 1 task
Comprehensive QA, security audit, acceptance sign-off.

**Dependencies**: All previous waves (blocker)
**Parallelization**: N/A (final gate)

---

## TODOs

### Wave 1: Foundation (Database, Config, Secrets)

- [x] 1. Project Setup & Repository Structure
- [x] 2. Database Schema Design & SQLite Setup
- [x] 3. Environment Configuration & Secrets Management

### Wave 2: REST API & Adapters

- [ ] 4. REST API Scaffold (auth, routes, middleware)
- [ ] 5. WhatsApp Adapter (Cloud API + whatsapp-web.js)
- [ ] 6. Telegram Adapter (Bot API + telegraf)
- [ ] 7. Twitter/X Adapter (API v2 + twitter-api-v2)
- [ ] 8. Threads Adapter (Official API + OAuth)
- [ ] 9. Instagram Adapter (Graph API + private-api fallback)

### Wave 3: Job Queue & Rate Limiting

- [ ] 10. Job Queue System (BullMQ setup & workers)
- [ ] 11. Retry Logic & Exponential Backoff
- [ ] 12. Rate Limiter (per-platform handlers + circuit breakers)

### Wave 4: Dashboard & Features

- [ ] 13. Account Management API Endpoints
- [ ] 14. Template Management (CRUD + CSV import)
- [ ] 15. Job Scheduling & Manual Trigger Endpoints
- [ ] 16. Next.js Admin Dashboard (UI scaffolding)
- [ ] 17. Dashboard Features (accounts, templates, scheduling, monitoring)
- [ ] 18. Analytics Queries & Dashboard Widgets

### Wave 5: Observability & Deployment

- [ ] 19. Structured Logging & Monitoring
- [ ] 20. Alert System (email, in-app, webhooks)
- [ ] 21. Docker & Docker Compose Setup
- [ ] 22. Deployment Guide & VPS Setup

### Wave 6: Testing & Verification

- [ ] 23. Comprehensive QA & End-to-End Tests
- [ ] 24. Security Audit & Compliance Review

---

## Wave 1: Foundation Tasks

- [x] 1. Project Setup & Repository Structure

  **What to do**:
  - Initialize Node.js/TypeScript project (package.json, tsconfig.json, .eslintrc, .prettierrc)
  - Create directory structure: `src/{api,adapters,queue,types,utils,config}`, `dashboard/`, `migrations/`, `tests/`
  - Setup dev dependencies: typescript, jest, eslint, prettier, ts-node, nodemon
  - Init git repo (if not already done) with .gitignore
  - Create basic Docker setup files (Dockerfile, docker-compose.yml)

  **Must NOT do**: 
  - Write actual adapter code yet
  - Implement API logic
  - Create database migrations (that's task 2)

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: straightforward project scaffolding, no complex logic
  - Skills: [] - no skills needed for setup

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 2-22 | Blocked By: none

  **References**:
  - Pattern: Standard Node.js/TS monorepo (see `src/` structure)
  - Template: https://github.com/microsoft/TypeScript-Node-Starter (baseline structure)

  **Acceptance Criteria**:
  - [x] `package.json` exists with all dev dependencies listed
  - [x] `src/`, `dashboard/`, `migrations/`, `tests/` directories created
  - [x] `tsconfig.json` compiles successfully: `npx tsc --noEmit`
  - [x] `.gitignore` excludes `node_modules/`, `.env`, `dist/`, `*.log`
  - [x] `Dockerfile` and `docker-compose.yml` present (basic structure)
  - [x] `git status` shows repo initialized (if applicable)

  **QA Scenarios**:
  ```
  Scenario: TypeScript compilation works
    Tool: interactive_bash
    Steps: 
      1. npm install
      2. npx tsc --noEmit
    Expected: No errors, exit code 0
    Evidence: .sisyphus/evidence/task-1-setup-tsc.log

  Scenario: Project structure verified
    Tool: interactive_bash
    Steps:
      1. find src -type d | sort
      2. ls -la | grep -E "docker|package.json|tsconfig"
    Expected: All expected directories present
    Evidence: .sisyphus/evidence/task-1-setup-structure.log
  ```

  **Commit**: YES | Message: `infra(setup): initialize node.js/typescript project structure` | Files: `package.json, tsconfig.json, src/*, docker*, .gitignore`

---

- [ ] 2. Database Schema Design & SQLite Setup

  **What to do**:
  - Define core entities: Accounts, Platforms, Templates, Jobs, Posts, Replies, Retries, Logs, Schedules, Credentials
  - Create initial SQLite schema (SQL migrations)
  - Setup SQLite with WAL mode enabled
  - Create database initialization script (runs migrations on startup)
  - Define TypeScript interfaces matching schema (types/db.ts)

  **Must NOT do**:
  - Write actual job queue logic (task 10)
  - Implement adapter logic (tasks 5-9)
  - Create API endpoints (task 4)

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: schema design requires understanding relationships across all features
  - Skills: [] 

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 3-22 | Blocked By: 1

  **References**:
  - Pattern: Relational schema with timestamps (created_at, updated_at)
  - API/Type: See "Entity Relationships" below
  - External: SQLite best practices https://www.sqlite.org/bestpractice.html

  **Entity Relationships** (text schema):
  ```
  Accounts (id, platform, username, email, credentials_hash, status, created_at, updated_at)
    ↓ 1-many
  Templates (id, account_id, name, content, variables, type, created_at)
    ↓ 1-many
  Jobs (id, template_id, account_id, platform, status, scheduled_at, started_at, completed_at, error_msg, retries, max_retries)
    ↓ 1-many
  Posts (id, job_id, account_id, platform, content, post_url, engagement_count, created_at)
  
  Schedules (id, template_id, cron_expr, enabled, created_at)
  Credentials (id, account_id, type, encrypted_value, expires_at)
  Logs (id, job_id, level, message, context_json, created_at)
  ```

  **Acceptance Criteria**:
  - [ ] SQLite database file created at `data/app.db`
  - [ ] WAL mode enabled: `sqlite3 data/app.db "PRAGMA journal_mode;" | grep -i wal`
  - [ ] All tables created: `sqlite3 data/app.db ".tables" | grep -E "accounts|templates|jobs|posts|schedules|credentials|logs"`
  - [ ] Schema matches TypeScript interfaces in `src/types/db.ts`
  - [ ] Migration files in `migrations/` directory (numbered: 001_init.sql, 002_add_schedules.sql, etc.)
  - [ ] Database initialization script runs without errors: `npm run db:init`

  **QA Scenarios**:
  ```
  Scenario: Database initializes with WAL mode
    Tool: interactive_bash
    Steps:
      1. rm -f data/app.db
      2. npm run db:init
      3. sqlite3 data/app.db "PRAGMA journal_mode;"
    Expected: Output contains "wal"
    Evidence: .sisyphus/evidence/task-2-db-wal.log

  Scenario: All schema tables exist with correct columns
    Tool: interactive_bash
    Steps:
      1. sqlite3 data/app.db ".schema accounts"
      2. sqlite3 data/app.db "SELECT COUNT(*) FROM accounts;" (expect 0, table exists)
    Expected: Schema prints correctly, COUNT returns 0
    Evidence: .sisyphus/evidence/task-2-db-schema.sql

  Scenario: TypeScript interfaces match database schema
    Tool: interactive_bash
    Steps:
      1. npx tsc --noEmit (should not error on types/db.ts)
      2. npm run db:validate (custom script to compare schema vs types)
    Expected: No TypeScript errors, validation passes
    Evidence: .sisyphus/evidence/task-2-db-types-validate.log
  ```

  **Commit**: YES | Message: `infra(db): initialize sqlite schema with wal mode and migrations` | Files: `migrations/*, src/types/db.ts, scripts/db-init.ts, data/.gitkeep`

---

- [ ] 3. Environment Configuration & Secrets Management

  **What to do**:
  - Create `.env.example` with all required secrets (API keys, DB path, JWT secret, LLM tokens, etc.)
  - Setup environment validation on startup (dotenv + custom validator)
  - Create secrets manager module (src/config/secrets.ts) for:
    - Loading from `.env` (dev)
    - Decryption of stored credentials (production)
    - Secret rotation (basic)
  - Document all environment variables in README
  - Setup Docker .env files for docker-compose

  **Must NOT do**:
  - Commit `.env` with real secrets
  - Implement platform-specific auth flows (tasks 5-9)
  - Create API endpoints that use config (task 4)

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: configuration setup, straightforward validation logic
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 4-22 | Blocked By: 1

  **References**:
  - Pattern: dotenv for local dev, NODE_ENV-based switching
  - External: https://12factor.net/config (principles)

  **Required Environment Variables**:
  ```
  # Database
  DATABASE_PATH=data/app.db
  
  # API
  API_PORT=3000
  API_HOST=localhost
  
  # Dashboard
  DASHBOARD_PORT=3001
  
  # JWT/Auth (for future user auth)
  JWT_SECRET=<random-long-string>
  
  # Queue
  QUEUE_REDIS_URL=redis://localhost:6379 (optional; in-memory for MVP)
  
  # Adapters (WhatsApp, Telegram, Twitter, Threads, Instagram)
  WHATSAPP_CLOUD_API_TOKEN=
  WHATSAPP_PHONE_NUMBER_ID=
  TELEGRAM_BOT_TOKEN=
  TWITTER_BEARER_TOKEN=
  TWITTER_API_KEY=
  TWITTER_API_SECRET=
  THREADS_ACCESS_TOKEN=
  INSTAGRAM_ACCESS_TOKEN=
  
  # Alerts
  ALERT_EMAIL_FROM=noreply@example.com
  ALERT_EMAIL_SMTP_HOST=
  ALERT_EMAIL_SMTP_PORT=587
  ALERT_SLACK_WEBHOOK_URL=
  ALERT_WEBHOOK_URL=
  
  # LLM (for AI replies feature)
  LLM_PROVIDER=openai (or anthropic, local, disabled)
  OPENAI_API_KEY=
  
  # Logging
  LOG_LEVEL=info (debug, info, warn, error)
  ```

  **Acceptance Criteria**:
  - [ ] `.env.example` created with all required variables
  - [ ] `src/config/secrets.ts` exports loadConfig() function
  - [ ] loadConfig() validates required vars and throws on missing: `npm run validate:config`
  - [ ] Docker Compose uses separate .env files (.env.development, .env.production in docker/)
  - [ ] No real secrets in git: `git grep -n "sk_" || git grep -n "AKIA"` (should return 0 matches)
  - [ ] README documents all env vars with descriptions

  **QA Scenarios**:
  ```
  Scenario: Config loads successfully from .env
    Tool: interactive_bash
    Steps:
      1. cp .env.example .env
      2. npm run validate:config
    Expected: "Config valid" message, exit code 0
    Evidence: .sisyphus/evidence/task-3-config-load.log

  Scenario: Missing required env var triggers error
    Tool: interactive_bash
    Steps:
      1. echo "DATABASE_PATH=data/app.db" > .env.test
      2. NODE_ENV=test npm run validate:config (should fail; missing other vars)
    Expected: Error mentioning missing required variable
    Evidence: .sisyphus/evidence/task-3-config-missing.log

  Scenario: No secrets in git history
    Tool: interactive_bash
    Steps:
      1. git grep -n "sk_" | wc -l
      2. git grep -n "AKIA" | wc -l
    Expected: Both return 0
    Evidence: .sisyphus/evidence/task-3-config-nosecrets.log
  ```

  **Commit**: YES | Message: `infra(config): add environment validation and secrets management` | Files: `.env.example, src/config/secrets.ts, docker/.env.*, README (env section)`

---

## Wave 2: REST API & Adapters

- [ ] 4. REST API Scaffold (auth, routes, middleware)

  **What to do**:
  - Initialize Express.js/Fastify server (choose one)
  - Create route structure: `/v1/health`, `/v1/accounts`, `/v1/templates`, `/v1/posts`, `/v1/jobs`, `/v1/adapters`
  - Implement middleware: request logging (Winston), error handling, validation (Zod/Joi), CORS
  - Create base request/response types
  - Setup TypeScript decorators (if using class-based routing)
  - Add health check endpoint

  **Must NOT do**:
  - Implement business logic in endpoints (that comes in Wave 4)
  - Add authentication (admin-only MVP; defer user auth)
  - Connect to adapters yet (tasks 5-9)

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: API architecture requires careful design; error handling critical
  - Skills: []

  **Parallelization**: Can Parallel: YES (after task 4 completion, tasks 5-9 can run in parallel) | Wave 2 | Blocks: 5-9,13-18 | Blocked By: 1-3

  **References**:
  - Pattern: Express.js with middleware chain pattern
  - External: https://expressjs.com/en/guide/routing.html, https://zod.dev/ (validation)

  **Acceptance Criteria**:
  - [ ] Express server starts: `npm run dev` (should start on port 3000)
  - [ ] Health endpoint responds: `curl http://localhost:3000/v1/health | jq '.status'` → "ok"
  - [ ] All route files created (empty stubs): `src/routes/{accounts,templates,posts,jobs,adapters}.ts`
  - [ ] Error handling middleware catches and logs errors
  - [ ] Request validation (Zod) works: `curl -X POST /v1/accounts -d '{}' | jq '.error'` → validation error
  - [ ] CORS configured for dashboard origin

  **QA Scenarios**:
  ```
  Scenario: Server starts and health check passes
    Tool: interactive_bash
    Steps:
      1. npm run dev &
      2. sleep 2
      3. curl -s http://localhost:3000/v1/health | jq '.status'
      4. pkill -f "node.*dev"
    Expected: Response is "ok"
    Evidence: .sisyphus/evidence/task-4-api-health.log

  Scenario: Invalid request rejected with validation error
    Tool: interactive_bash
    Steps:
      1. npm run dev &
      2. sleep 2
      3. curl -X POST http://localhost:3000/v1/accounts -H "Content-Type: application/json" -d '{"name":123}' | jq '.error'
      4. pkill -f "node.*dev"
    Expected: Error message about type mismatch
    Evidence: .sisyphus/evidence/task-4-api-validation.log
  ```

  **Commit**: YES | Message: `feat(api): scaffold express server with middleware and route stubs` | Files: `src/api/server.ts, src/routes/*, src/middleware/*, src/types/api.ts`

---

- [ ] 5. WhatsApp Adapter (Cloud API + whatsapp-web.js)

  **What to do**:
  - Implement adapter interface (src/adapters/IAdapter.ts): postMessage, getMessageStatus, reply, listAccounts
  - Implement WhatsApp Cloud API client (official SDK or HTTP wrapper)
  - Implement WhatsApp Web client (whatsapp-web.js) as fallback
  - Setup authentication (OAuth tokens for Cloud API, cookies for Web)
  - Implement rate limit handling (respecting Cloud API quotas)
  - Add error mapping (platform errors → standardized error types)

  **Must NOT do**:
  - Implement job queue integration (task 10)
  - Add dashboard endpoints (task 17)
  - Make posting live (integrate with queue first in task 10)

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: two integration paths (API + automation); token management critical
  - Skills: []

  **Parallelization**: Can Parallel: YES (parallel with tasks 6-9) | Wave 2 | Blocks: 10-12,23 | Blocked By: 1-4

  **References**:
  - Pattern: Adapter pattern; standard interface for all platforms
  - API/Type: `src/adapters/IAdapter.ts` (see below)
  - External: https://developers.facebook.com/docs/whatsapp/cloud-api/overview/, https://github.com/pedroslopez/whatsapp-web.js

  **IAdapter Interface**:
  ```typescript
  interface IAdapter {
    // Authentication
    authenticate(credentials: Credentials): Promise<void>
    isAuthenticated(): boolean
    
    // Posting
    postMessage(account_id: string, content: string, metadata?: object): Promise<{ message_id: string, status: string }>
    
    // Replying/Commenting
    replyToMessage(message_id: string, content: string): Promise<{ reply_id: string, status: string }>
    
    // Status & Monitoring
    getMessageStatus(message_id: string): Promise<MessageStatus>
    listAccounts(): Promise<Account[]>
    
    // Rate limiting
    getRateLimitStatus(): Promise<{ remaining: number, reset_at: Date }>
  }
  ```

  **Acceptance Criteria**:
  - [ ] Adapter interface defined and exported from `src/adapters/IAdapter.ts`
  - [ ] WhatsApp Cloud API client can authenticate (or auth stub if no token): `npm run test -- adapters/whatsapp`
  - [ ] postMessage() method signature matches interface
  - [ ] Error handling maps WhatsApp errors to standard types
  - [ ] Rate limit handling implemented (respects Cloud API limits)
  - [ ] Test stubs pass: `jest src/adapters/whatsapp.test.ts` (mock tests, no live calls)

  **QA Scenarios**:
  ```
  Scenario: Adapter initializes successfully
    Tool: interactive_bash
    Steps:
      1. npm run test -- adapters/whatsapp --testNamePattern="init"
    Expected: "Adapter initialized" test passes
    Evidence: .sisyphus/evidence/task-5-whatsapp-init.log

  Scenario: postMessage() returns valid message_id
    Tool: interactive_bash
    Steps:
      1. npm run test -- adapters/whatsapp --testNamePattern="postMessage"
    Expected: Test passes; message_id is non-empty string
    Evidence: .sisyphus/evidence/task-5-whatsapp-post.log

  Scenario: Rate limit handler correctly formats remaining quota
    Tool: interactive_bash
    Steps:
      1. npm run test -- adapters/whatsapp --testNamePattern="rateLimitStatus"
    Expected: Returns object with { remaining: number, reset_at: Date }
    Evidence: .sisyphus/evidence/task-5-whatsapp-ratelimit.log
  ```

  **Commit**: YES | Message: `feat(adapter): implement whatsapp cloud api and web automation` | Files: `src/adapters/whatsapp.ts, src/adapters/IAdapter.ts, src/adapters/whatsapp.test.ts`

---

- [ ] 6. Telegram Adapter (Bot API + telegraf)

  **What to do**:
  - Implement Telegram adapter using telegraf library
  - Setup Bot Token authentication
  - Implement postMessage (to channels/groups/private chats)
  - Implement replyToMessage (to specific chat messages)
  - Handle Telegram Bot API rate limits (per-chat, per-bot)
  - Webhook support for real-time updates

  **Must NOT do**: Job queue integration, dashboard endpoints, live posting

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: library integration; multiple endpoints to understand
  - Skills: []

  **Parallelization**: Can Parallel: YES (parallel with tasks 5,7-9) | Wave 2 | Blocks: 10-12,23 | Blocked By: 1-4

  **References**:
  - API/Type: `src/adapters/IAdapter.ts` (same interface as WhatsApp)
  - External: https://core.telegram.org/bots/api, https://github.com/telegraf/telegraf

  **Acceptance Criteria**:
  - [ ] Telegram adapter implements IAdapter interface
  - [ ] Bot token authentication works (or stub if no token)
  - [ ] postMessage() sends to specified chat_id
  - [ ] replyToMessage() sends inline reply
  - [ ] Rate limit handler respects Telegram quotas
  - [ ] Webhook endpoint created for updates: `POST /webhooks/telegram`
  - [ ] Tests pass: `jest src/adapters/telegram.test.ts`

  **QA Scenarios**:
  ```
  Scenario: Telegram adapter initializes with Bot Token
    Tool: interactive_bash
    Steps: 
      1. npm run test -- adapters/telegram --testNamePattern="init"
    Expected: Adapter initializes, bot token validated
    Evidence: .sisyphus/evidence/task-6-telegram-init.log

  Scenario: postMessage sends to chat_id
    Tool: interactive_bash
    Steps:
      1. npm run test -- adapters/telegram --testNamePattern="postMessage"
    Expected: Test passes, returns message_id
    Evidence: .sisyphus/evidence/task-6-telegram-post.log

  Scenario: Webhook endpoint accepts updates
    Tool: interactive_bash
    Steps:
      1. npm run dev &
      2. curl -X POST http://localhost:3000/webhooks/telegram -H "Content-Type: application/json" -d '{"update_id": 123, "message": {...}}'
      3. pkill -f "node.*dev"
    Expected: HTTP 200, webhook processed
    Evidence: .sisyphus/evidence/task-6-telegram-webhook.log
  ```

  **Commit**: YES | Message: `feat(adapter): implement telegram bot api with telegraf` | Files: `src/adapters/telegram.ts, src/adapters/telegram.test.ts`

---

- [ ] 7. Twitter/X Adapter (API v2 + twitter-api-v2)

  **What to do**:
  - Implement Twitter adapter using twitter-api-v2 library
  - Setup OAuth 1.0a / 2.0 Bearer token authentication
  - Implement postMessage (tweet creation)
  - Implement replyToMessage (tweet replies)
  - Handle Twitter rate limits (endpoint-specific)
  - Support tweet search for replies/mentions (optional for MVP)

  **Must NOT do**: Job queue, dashboard, live posting

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Twitter OAuth complexity; multiple auth flows; rate limiting per endpoint
  - Skills: []

  **Parallelization**: Can Parallel: YES (parallel with tasks 5-6,8-9) | Wave 2 | Blocks: 10-12,23 | Blocked By: 1-4

  **References**:
  - API/Type: IAdapter interface
  - External: https://developer.x.com/en/docs/twitter-api/, https://github.com/plhery/node-twitter-api-v2

  **Acceptance Criteria**:
  - [ ] Twitter adapter implements IAdapter
  - [ ] Bearer token / OAuth 1.0a auth implemented
  - [ ] postMessage() creates tweet
  - [ ] replyToMessage() replies to tweet
  - [ ] Rate limit handler tracks per-endpoint limits
  - [ ] Error mapping: 429 → rate limit, 401 → auth error, etc.
  - [ ] Tests pass: `jest src/adapters/twitter.test.ts`

  **QA Scenarios**:
  ```
  Scenario: Twitter adapter authenticates with Bearer token
    Tool: interactive_bash
    Steps:
      1. npm run test -- adapters/twitter --testNamePattern="authenticate"
    Expected: Auth validated (or stub passes)
    Evidence: .sisyphus/evidence/task-7-twitter-auth.log

  Scenario: postMessage creates tweet
    Tool: interactive_bash
    Steps:
      1. npm run test -- adapters/twitter --testNamePattern="postMessage"
    Expected: Returns tweet_id, status="created"
    Evidence: .sisyphus/evidence/task-7-twitter-post.log

  Scenario: Rate limit handler respects endpoint quotas
    Tool: interactive_bash
    Steps:
      1. npm run test -- adapters/twitter --testNamePattern="rateLimitStatus"
    Expected: Returns remaining count per endpoint
    Evidence: .sisyphus/evidence/task-7-twitter-ratelimit.log
  ```

  **Commit**: YES | Message: `feat(adapter): implement twitter/x api v2 with oauth support` | Files: `src/adapters/twitter.ts, src/adapters/twitter.test.ts`

---

- [ ] 8. Threads Adapter (Official API + OAuth)

  **What to do**:
  - Implement Threads adapter using official Threads API (Meta Graph API)
  - Setup OAuth 2.0 access token authentication
  - Implement postMessage (create thread post)
  - Implement replyToMessage (reply to thread post)
  - Handle Threads rate limits (new API; monitor Meta changelog)
  - Permissions: threads_basic, threads_content_publish, threads_manage_replies

  **Must NOT do**: Job queue, dashboard, live posting

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: new API; limited community libraries; requires following Meta docs closely
  - Skills: []

  **Parallelization**: Can Parallel: YES (parallel with tasks 5-7,9) | Wave 2 | Blocks: 10-12,23 | Blocked By: 1-4

  **References**:
  - API/Type: IAdapter interface
  - External: https://developers.facebook.com/docs/threads/

  **Acceptance Criteria**:
  - [ ] Threads adapter implements IAdapter
  - [ ] OAuth 2.0 token auth implemented
  - [ ] postMessage() creates thread post
  - [ ] replyToMessage() replies to post
  - [ ] Rate limit handler respects Threads quotas
  - [ ] App permissions requested: threads_basic, threads_content_publish
  - [ ] Tests pass: `jest src/adapters/threads.test.ts`

  **QA Scenarios**:
  ```
  Scenario: Threads adapter authenticates with OAuth token
    Tool: interactive_bash
    Steps:
      1. npm run test -- adapters/threads --testNamePattern="authenticate"
    Expected: Auth validated
    Evidence: .sisyphus/evidence/task-8-threads-auth.log

  Scenario: postMessage creates thread post
    Tool: interactive_bash
    Steps:
      1. npm run test -- adapters/threads --testNamePattern="postMessage"
    Expected: Returns post_id
    Evidence: .sisyphus/evidence/task-8-threads-post.log
  ```

  **Commit**: YES | Message: `feat(adapter): implement threads api with oauth 2.0` | Files: `src/adapters/threads.ts, src/adapters/threads.test.ts`

---

- [ ] 9. Instagram Adapter (Graph API + private-api fallback)

  **What to do**:
  - Implement Instagram adapter with Instagram Graph API (primary)
  - Implement private API fallback (instagram-private-api) with warnings
  - Setup OAuth 2.0 authentication (Graph API)
  - Implement postMessage (create post/carousel)
  - Implement replyToMessage (reply to DM or comment)
  - Handle Instagram rate limits
  - Feature flag to disable private API if ToS concerns

  **Must NOT do**: Job queue, dashboard, live posting

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: dual auth paths; ToS compliance concerns; private API complexity
  - Skills: []

  **Parallelization**: Can Parallel: YES (parallel with tasks 5-8) | Wave 2 | Blocks: 10-12,23 | Blocked By: 1-4

  **References**:
  - API/Type: IAdapter interface
  - External: https://developers.facebook.com/docs/instagram-platform/, https://github.com/dilame/instagram-private-api

  **Acceptance Criteria**:
  - [ ] Instagram adapter implements IAdapter
  - [ ] Graph API OAuth auth implemented
  - [ ] postMessage() creates post via Graph API
  - [ ] Private API fallback with FEATURE_FLAG guard
  - [ ] Rate limit handler respects Graph API limits
  - [ ] Feature flag: `INSTAGRAM_ALLOW_PRIVATE_API=false` (default) disables private API
  - [ ] Tests pass: `jest src/adapters/instagram.test.ts`

  **QA Scenarios**:
  ```
  Scenario: Instagram adapter uses Graph API by default
    Tool: interactive_bash
    Steps:
      1. INSTAGRAM_ALLOW_PRIVATE_API=false npm run test -- adapters/instagram --testNamePattern="postMessage"
    Expected: Uses Graph API path, not private API
    Evidence: .sisyphus/evidence/task-9-instagram-graph.log

  Scenario: Private API disabled by default, can be opt-in
    Tool: interactive_bash
    Steps:
      1. npm run test -- adapters/instagram --testNamePattern="private.*disabled"
    Expected: Test confirms private API disabled unless explicitly enabled
    Evidence: .sisyphus/evidence/task-9-instagram-private-disabled.log
  ```

  **Commit**: YES | Message: `feat(adapter): implement instagram graph api with private api fallback` | Files: `src/adapters/instagram.ts, src/adapters/instagram.test.ts, src/config/feature-flags.ts`

---

## Wave 3: Job Queue & Rate Limiting

- [ ] 10. Job Queue System (BullMQ setup & workers)

  **What to do**:
  - Setup BullMQ (or Bull) for job queue
  - Create job types: PostJob, ReplyJob, StatusCheckJob
  - Implement worker processes (separate from API server for scalability)
  - Setup job persistence (SQLite/Redis for queue state)
  - Implement job callbacks: onComplete, onFailed, onProgress
  - Create job scheduling interface (cron + manual trigger)
  - Implement dead-letter queue (DLQ) for permanently failed jobs

  **Must NOT do**:
  - Implement retry logic (task 11)
  - Implement rate limiting (task 12)
  - Add API endpoints (task 13+)

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: job queue architecture; concurrency concerns; error state management
  - Skills: []

  **Parallelization**: Can Parallel: YES (parallel with tasks 11-12) | Wave 3 | Blocks: 13-23 | Blocked By: 1-4,5-9

  **References**:
  - Pattern: Queue pattern with separate workers; job state machines
  - External: https://docs.bullmq.io/, https://github.com/taskforcesh/bullmq

  **Job Types**:
  ```typescript
  interface PostJob {
    id: string
    template_id: string
    account_id: string
    platform: "whatsapp" | "telegram" | "twitter" | "threads" | "instagram"
    content: string
    variables?: Record<string, string>
    scheduled_at?: Date
  }
  
  interface ReplyJob {
    id: string
    source_message_id: string
    account_id: string
    platform: string
    reply_type: "template" | "trigger" | "ai"
    content: string
  }
  ```

  **Acceptance Criteria**:
  - [ ] BullMQ initialized: `npm run test -- queue/init`
  - [ ] Job types defined in `src/types/jobs.ts`
  - [ ] Worker processes run: `npm run start:workers`
  - [ ] Jobs can be enqueued: `queue.add('postJob', {...})`
  - [ ] Job callbacks fire: onComplete, onFailed, onProgress
  - [ ] Dead-letter queue exists: `queue.getDLQ()`
  - [ ] Tests pass: `jest src/queue/`

  **QA Scenarios**:
  ```
  Scenario: Job enqueued and worker processes it
    Tool: interactive_bash
    Steps:
      1. npm run start:workers &
      2. sleep 2
      3. npm run test -- queue --testNamePattern="enqueue.*process"
      4. pkill -f "start:workers"
    Expected: Job moves from pending → completed
    Evidence: .sisyphus/evidence/task-10-queue-process.log

  Scenario: Failed job moves to DLQ after max retries
    Tool: interactive_bash
    Steps:
      1. npm run start:workers &
      2. sleep 2
      3. npm run test -- queue --testNamePattern="dlq"
      4. pkill -f "start:workers"
    Expected: Job in DLQ after max retries exceeded
    Evidence: .sisyphus/evidence/task-10-queue-dlq.log

  Scenario: Job state machine enforces valid transitions
    Tool: interactive_bash
    Steps:
      1. npm run test -- queue --testNamePattern="state.*transition"
    Expected: Invalid transitions rejected (e.g., pending → completed without processing)
    Evidence: .sisyphus/evidence/task-10-queue-state.log
  ```

  **Commit**: YES | Message: `feat(queue): implement bullmq job queue with worker processes` | Files: `src/queue/*, src/workers/*, src/types/jobs.ts`

---

- [ ] 11. Retry Logic & Exponential Backoff

  **What to do**:
  - Implement exponential backoff formula: `delay = base_delay * (multiplier ^ attempt)` + jitter
  - Create per-platform retry policies (different max_retries, backoff curves for each platform)
  - Implement automatic requeue logic (failed job → requeue with increased delay)
  - Create retry history tracking in database (logs each attempt with error details)
  - Handle non-retryable errors (auth failure, 404) vs retryable (5xx, 429)
  - Circuit breaker pattern: disable platform adapter if too many consecutive failures

  **Must NOT do**:
  - Implement rate limiting (task 12)
  - Add API endpoints (task 13+)
  - Integrate with dashboard (task 17)

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: retry strategy affects reliability; backoff formulas must be correct; circuit breaker complexity
  - Skills: []

  **Parallelization**: Can Parallel: YES (parallel with tasks 10,12) | Wave 3 | Blocks: 13-23 | Blocked By: 1-4,5-9,10

  **References**:
  - Pattern: Exponential backoff with jitter https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
  - External: https://github.com/tim-kos/node-retry (reference implementation)

  **Retry Policies (per platform)**:
  ```typescript
  const RETRY_POLICIES = {
    whatsapp: { max_retries: 5, base_delay_ms: 1000, multiplier: 2 },
    telegram: { max_retries: 3, base_delay_ms: 500, multiplier: 2 },
    twitter: { max_retries: 5, base_delay_ms: 2000, multiplier: 1.5 }, // rate limits strict
    threads: { max_retries: 4, base_delay_ms: 1500, multiplier: 2 },
    instagram: { max_retries: 4, base_delay_ms: 1500, multiplier: 2 }
  }
  ```

  **Acceptance Criteria**:
  - [ ] Exponential backoff formula calculates correctly: `calculateBackoff(attempt, policy)` returns increasing delays
  - [ ] Jitter applied: `calculateBackoff()` returns random ±10% variance
  - [ ] Requeue logic works: failed job requeued with updated retry count
  - [ ] Retry history logged: `SELECT COUNT(*) FROM logs WHERE job_id=? AND level='retry'`
  - [ ] Non-retryable errors bypass retry (logged as permanent failure)
  - [ ] Circuit breaker tracks failure rate per platform
  - [ ] Tests pass: `jest src/queue/retry.test.ts`

  **QA Scenarios**:
  ```
  Scenario: Backoff delay increases exponentially
    Tool: interactive_bash
    Steps:
      1. npm run test -- queue/retry --testNamePattern="exponential.*backoff"
    Expected: Delays for attempts 1-5 are [1s, 2s, 4s, 8s, 16s] (with variance)
    Evidence: .sisyphus/evidence/task-11-backoff-exponential.log

  Scenario: Non-retryable error (401) stops retrying
    Tool: interactive_bash
    Steps:
      1. npm run test -- queue/retry --testNamePattern="non.*retryable"
    Expected: Job marked failed after first attempt, not requeued
    Evidence: .sisyphus/evidence/task-11-backoff-nonretryable.log

  Scenario: Circuit breaker disables platform after threshold
    Tool: interactive_bash
    Steps:
      1. npm run test -- queue/retry --testNamePattern="circuit.*breaker"
    Expected: After 10 consecutive failures, circuit breaker trips, jobs fail fast
    Evidence: .sisyphus/evidence/task-11-backoff-circuit.log
  ```

  **Commit**: YES | Message: `feat(queue): implement exponential backoff and circuit breaker` | Files: `src/queue/retry.ts, src/queue/circuit-breaker.ts, src/queue/retry.test.ts`

---

- [ ] 12. Rate Limiter (per-platform handlers + circuit breakers)

  **What to do**:
  - Create RateLimiter interface: `canProceed(), getStatus(), recordAttempt(), reset()`
  - Implement per-platform rate limiters (respecting platform quotas)
  - Token bucket algorithm: tracks available tokens, refills at platform rate
  - Handle 429 responses: extract retry-after header, update rate limit state
  - Integrate with job queue: pause queue if rate limit hit
  - Monitoring: expose rate limit status via metrics

  **Must NOT do**:
  - Implement job retry (task 11)
  - Add API endpoints (task 13+)
  - Create dashboard (task 17)

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: rate limiting logic critical; token bucket algorithm; platform-specific quotas
  - Skills: []

  **Parallelization**: Can Parallel: YES (parallel with tasks 10-11) | Wave 3 | Blocks: 13-23 | Blocked By: 1-4,5-9,10

  **References**:
  - Pattern: Token bucket algorithm https://en.wikipedia.org/wiki/Token_bucket
  - External: https://github.com/animir/node-rate-limiter-flexible

  **Platform Rate Limits**:
  ```typescript
  const PLATFORM_LIMITS = {
    whatsapp: { requests_per_second: 80, burst_size: 80 }, // Cloud API
    telegram: { requests_per_second: 30, burst_size: 30 },
    twitter: { requests_per_second: 15, per_endpoint: true }, // varies by endpoint
    threads: { requests_per_second: 200, burst_size: 200 },
    instagram: { requests_per_hour: 200, burst_size: 50 }
  }
  ```

  **Acceptance Criteria**:
  - [ ] RateLimiter interface defined and implemented per platform
  - [ ] Token bucket algorithm correctly tracks tokens and refills
  - [ ] canProceed() returns true until limit hit, then false
  - [ ] 429 response handling extracts retry-after and updates limit
  - [ ] Queue pauses when rate limit hit: `queue.isPaused()` → true
  - [ ] Rate limit metrics exposed: `GET /v1/adapters/status` includes rate_limit_status
  - [ ] Tests pass: `jest src/queue/rate-limiter.test.ts`

  **QA Scenarios**:
  ```
  Scenario: Token bucket refills correctly
    Tool: interactive_bash
    Steps:
      1. npm run test -- queue/rate-limiter --testNamePattern="token.*bucket"
    Expected: Tokens refill at platform rate; canProceed() eventually returns true after refill
    Evidence: .sisyphus/evidence/task-12-ratelimit-tokens.log

  Scenario: 429 response updates rate limit window
    Tool: interactive_bash
    Steps:
      1. npm run test -- queue/rate-limiter --testNamePattern="429.*handling"
    Expected: Rate limiter pauses, resumes after retry-after window
    Evidence: .sisyphus/evidence/task-12-ratelimit-429.log

  Scenario: Queue pauses when rate limit hit
    Tool: interactive_bash
    Steps:
      1. npm run start:workers &
      2. npm run test -- queue/rate-limiter --testNamePattern="queue.*pause"
      3. pkill -f "start:workers"
    Expected: Queue transitions to paused state; jobs wait in queue
    Evidence: .sisyphus/evidence/task-12-ratelimit-queue-pause.log
  ```

  **Commit**: YES | Message: `feat(queue): implement per-platform rate limiting with token bucket` | Files: `src/queue/rate-limiter.ts, src/queue/rate-limiter.test.ts`

---

## Wave 4: Dashboard & Features

- [ ] 13. Account Management API Endpoints

  **What to do**:
  - Create REST endpoints: `GET /v1/accounts`, `POST /v1/accounts`, `PUT /v1/accounts/{id}`, `DELETE /v1/accounts/{id}`
  - Implement validation: account uniqueness per platform, credential encryption
  - Store account credentials (API keys, tokens, cookies) encrypted in database
  - List accounts with status (online/offline, last activity)
  - Test all adapters on account creation (health check)

  **Must NOT do**: Dashboard UI (task 16-17), analytics (task 18), job scheduling (task 15)

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: endpoint design; credential security handling
  - Skills: []

  **Parallelization**: Can Parallel: YES (with task 14-15) | Wave 4 | Blocks: 16-18,23 | Blocked By: 4,5-9,10-12

  **References**:
  - Pattern: CRUD REST endpoints with validation
  - External: https://expressjs.com/en/guide/routing.html

  **Acceptance Criteria**:
  - [ ] POST /v1/accounts creates account: `curl -X POST http://localhost:3000/v1/accounts -d '{"platform":"telegram","username":"test_bot"}' → 201 Created`
  - [ ] Credentials encrypted on storage: `SELECT encrypted_value FROM credentials WHERE account_id=?` (not plaintext)
  - [ ] GET /v1/accounts lists all accounts with status
  - [ ] Health check run on account creation: attempts to authenticate
  - [ ] Duplicate account on same platform rejected (uniqueness constraint)
  - [ ] Tests pass: `jest src/routes/accounts.test.ts`

  **QA Scenarios**:
  ```
  Scenario: Create account with valid credentials
    Tool: interactive_bash
    Steps:
      1. npm run dev &
      2. curl -X POST http://localhost:3000/v1/accounts -H "Content-Type: application/json" -d '{"platform":"telegram","username":"testbot","token":"test_token"}'
      3. pkill -f "node.*dev"
    Expected: 201 Created, returns account_id
    Evidence: .sisyphus/evidence/task-13-accounts-create.log

  Scenario: Duplicate account rejected
    Tool: interactive_bash
    Steps:
      1. Create account twice with same platform/username
    Expected: Second creation returns 409 Conflict
    Evidence: .sisyphus/evidence/task-13-accounts-duplicate.log

  Scenario: Credentials stored encrypted
    Tool: interactive_bash
    Steps:
      1. Create account with token
      2. Query database: sqlite3 data/app.db "SELECT encrypted_value FROM credentials"
    Expected: Value is not plaintext token
    Evidence: .sisyphus/evidence/task-13-accounts-encrypted.log
  ```

  **Commit**: YES | Message: `feat(api): implement account management endpoints` | Files: `src/routes/accounts.ts, src/routes/accounts.test.ts`

---

- [ ] 14. Template Management (CRUD + CSV import)

  **What to do**:
  - Create REST endpoints: `GET /v1/templates`, `POST /v1/templates`, `PUT /v1/templates/{id}`, `DELETE /v1/templates/{id}`
  - Template structure: name, content, variables, type (template/trigger/ai), platform filters
  - CSV import endpoint: `POST /v1/templates/import` (upload CSV, parse, create bulk templates)
  - CSV format: `name,content,variables,type,platforms`
  - Variable parsing: support `{variable_name}` syntax in content
  - Validation: template variables used in content match declared variables

  **Must NOT do**: Dashboard UI, analytics, job scheduling

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: CSV parsing; bulk operations; validation logic
  - Skills: []

  **Parallelization**: Can Parallel: YES (with tasks 13,15) | Wave 4 | Blocks: 16-18,23 | Blocked By: 4,5-9,10-12

  **References**:
  - Pattern: Bulk import with validation; streaming CSV parsing
  - External: https://www.npmjs.com/package/csv-parser

  **Acceptance Criteria**:
  - [ ] POST /v1/templates creates template: `curl -X POST ... -d '{"name":"hello","content":"Hi {name}","variables":["name"]}'`
  - [ ] CSV import parses file: `POST /v1/templates/import` with multipart form-data
  - [ ] Variable validation: templates with unused variables rejected
  - [ ] Bulk import transaction: all rows succeed or all rollback
  - [ ] Tests pass: `jest src/routes/templates.test.ts`

  **QA Scenarios**:
  ```
  Scenario: Create template with variables
    Tool: interactive_bash
    Steps:
      1. npm run dev &
      2. curl -X POST http://localhost:3000/v1/templates -d '{"name":"promo","content":"Check this out {link}","variables":["link"]}'
      3. pkill -f "node.*dev"
    Expected: 201 Created, template stored
    Evidence: .sisyphus/evidence/task-14-templates-create.log

  Scenario: CSV import bulk creates templates
    Tool: interactive_bash
    Steps:
      1. Create CSV file with 10 templates
      2. POST /v1/templates/import with CSV file
    Expected: All 10 templates created, return count
    Evidence: .sisyphus/evidence/task-14-templates-csv-import.log

  Scenario: Template with unused variables rejected
    Tool: interactive_bash
    Steps:
      1. POST template with content "Hello {name}" but variables=["age"] (unused)
    Expected: 400 Bad Request, validation error
    Evidence: .sisyphus/evidence/task-14-templates-validation.log
  ```

  **Commit**: YES | Message: `feat(api): implement template management with csv import` | Files: `src/routes/templates.ts, src/routes/templates.test.ts`

---

- [ ] 15. Job Scheduling & Manual Trigger Endpoints

  **What to do**:
  - Create scheduling endpoint: `POST /v1/jobs/schedule` (create scheduled job with cron expression)
  - Manual trigger endpoint: `POST /v1/jobs/trigger` (post immediately)
  - Validate cron expressions (use cron-parser library)
  - Store schedules in database (Schedules table)
  - Background cron scheduler (evaluates schedules, enqueues jobs)
  - Endpoint to list/pause/resume schedules: `GET /v1/schedules`, `PUT /v1/schedules/{id}`

  **Must NOT do**: Dashboard UI, analytics

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: cron scheduling; background task orchestration
  - Skills: []

  **Parallelization**: Can Parallel: YES (with tasks 13-14) | Wave 4 | Blocks: 16-18,23 | Blocked By: 4,5-9,10-12

  **References**:
  - Pattern: Background cron scheduler; job enqueuing
  - External: https://www.npmjs.com/package/cron-parser

  **Acceptance Criteria**:
  - [ ] POST /v1/jobs/schedule with valid cron: `curl -X POST ... -d '{"cron":"0 9 * * *","template_id":"...","account_id":"..."}'`
  - [ ] Cron expression validated: `cron-parser.parseExpression("0 9 * * *")`
  - [ ] Background scheduler checks schedules every minute, enqueues jobs
  - [ ] Manual trigger: `POST /v1/jobs/trigger` enqueues job immediately
  - [ ] Tests pass: `jest src/routes/jobs.test.ts`

  **QA Scenarios**:
  ```
  Scenario: Schedule created with valid cron
    Tool: interactive_bash
    Steps:
      1. POST /v1/jobs/schedule with cron="0 9 * * *"
    Expected: 201 Created, schedule stored
    Evidence: .sisyphus/evidence/task-15-jobs-schedule.log

  Scenario: Invalid cron rejected
    Tool: interactive_bash
    Steps:
      1. POST /v1/jobs/schedule with cron="invalid"
    Expected: 400 Bad Request
    Evidence: .sisyphus/evidence/task-15-jobs-cron-invalid.log

  Scenario: Manual trigger enqueues job
    Tool: interactive_bash
    Steps:
      1. POST /v1/jobs/trigger with template_id & account_id
    Expected: 202 Accepted, job_id returned, job in queue
    Evidence: .sisyphus/evidence/task-15-jobs-trigger.log
  ```

  **Commit**: YES | Message: `feat(api): implement job scheduling and manual trigger` | Files: `src/routes/jobs.ts, src/routes/jobs.test.ts, src/scheduler/cron-scheduler.ts`

---

- [ ] 16. Next.js Admin Dashboard (UI scaffolding)

  **What to do**:
  - Initialize Next.js project in `dashboard/` directory
  - Setup TypeScript, ESLint, Tailwind CSS
  - Create page structure: `/accounts`, `/templates`, `/schedules`, `/jobs`, `/analytics`
  - Setup API client (axios/fetch) pointing to backend
  - Create layout/navigation components
  - Setup authentication stub (admin-only; no user signup)

  **Must NOT do**: Implement page features (task 17), analytics widgets (task 18), actual business logic

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: UI/UX scaffolding; component structure
  - Skills: []

  **Parallelization**: Can Parallel: YES (after APIs ready) | Wave 4 | Blocks: 17-18,23 | Blocked By: 13-15

  **References**:
  - Pattern: Next.js app router with TypeScript
  - External: https://nextjs.org/docs

  **Acceptance Criteria**:
  - [ ] Next.js project initializes: `cd dashboard && npm run dev` starts on port 3001
  - [ ] Page routes created: `dashboard/app/(pages)/{accounts,templates,schedules,jobs,analytics}`
  - [ ] API client configured to hit `http://localhost:3000/v1`
  - [ ] Navigation component links pages
  - [ ] TypeScript compiles: `npm run build` succeeds
  - [ ] Tailwind CSS configured

  **QA Scenarios**:
  ```
  Scenario: Dashboard starts and loads
    Tool: Playwright
    Steps:
      1. Start backend: npm run dev
      2. Start dashboard: cd dashboard && npm run dev
      3. Navigate to http://localhost:3001
      4. Check for navigation menu
    Expected: Dashboard loads, menu visible
    Evidence: .sisyphus/evidence/task-16-dashboard-load.png

  Scenario: Navigation links work
    Tool: Playwright
    Steps:
      1. Click on "Accounts" link
      2. Verify URL is /accounts
    Expected: Page navigates correctly
    Evidence: .sisyphus/evidence/task-16-dashboard-nav.png
  ```

  **Commit**: YES | Message: `feat(dashboard): scaffold next.js admin ui` | Files: `dashboard/*, dashboard/app/*, dashboard/tsconfig.json, dashboard/tailwind.config.ts`

---

- [ ] 17. Dashboard Features (accounts, templates, scheduling, monitoring)

  **What to do**:
  - Implement Accounts page: list, create, edit, delete accounts
  - Implement Templates page: list, create, edit, delete, preview
  - Implement Schedules page: list, create, edit, disable/enable schedules
  - Implement Jobs page: list jobs with status, filters by platform/status, job details view
  - Forms for account creation (with credential input), template editor, schedule cron input
  - Real-time job status updates (polling API every 5 seconds)
  - Delete confirmation modals for destructive actions

  **Must NOT do**: Analytics widgets (task 18), advanced monitoring

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: complex forms; real-time UI updates; user interactions
  - Skills: []

  **Parallelization**: Can Parallel: NO (depends on task 16) | Wave 4 | Blocks: 18,23 | Blocked By: 16

  **References**:
  - Pattern: React hooks (useState, useEffect), form handling, API integration
  - External: https://react-hook-form.com/, https://headlessui.com/

  **Acceptance Criteria**:
  - [ ] Accounts page loads list from API: `GET /v1/accounts`
  - [ ] Create account form submits to API: `POST /v1/accounts`
  - [ ] Templates page shows list with edit/delete buttons
  - [ ] Template preview shows variables substituted with sample data
  - [ ] Schedules page allows cron input with validation feedback
  - [ ] Jobs page refreshes every 5 seconds, shows updated status
  - [ ] Delete actions show confirmation modal
  - [ ] Forms show validation errors from API

  **QA Scenarios**:
  ```
  Scenario: Create account via dashboard form
    Tool: Playwright
    Steps:
      1. Navigate to /accounts
      2. Click "Add Account" button
      3. Fill form (platform=Telegram, username=test, token=xxx)
      4. Submit
    Expected: Account created, added to list
    Evidence: .sisyphus/evidence/task-17-dashboard-accounts-create.png

  Scenario: Jobs page updates in real-time
    Tool: Playwright
    Steps:
      1. Navigate to /jobs
      2. Trigger a job from API
      3. Wait 6 seconds
      4. Check job status updated
    Expected: Job status changed from "pending" to "completed" or similar
    Evidence: .sisyphus/evidence/task-17-dashboard-jobs-update.png

  Scenario: Delete account shows confirmation
    Tool: Playwright
    Steps:
      1. Click delete button on account
      2. Check confirmation modal appears
      3. Cancel, verify account still exists
    Expected: Confirmation modal shown, cancel works
    Evidence: .sisyphus/evidence/task-17-dashboard-delete-confirm.png
  ```

  **Commit**: YES | Message: `feat(dashboard): implement account/template/schedule/job management ui` | Files: `dashboard/app/(pages)/*/page.tsx, dashboard/components/Forms/*, dashboard/components/Tables/*`

---

- [ ] 18. Analytics Queries & Dashboard Widgets

  **What to do**:
  - Create analytics API endpoints: `GET /v1/analytics/summary`, `GET /v1/analytics/posts`, `GET /v1/analytics/platforms`
  - Summary metrics: total posts sent, success rate, engagement average, active accounts
  - Per-platform breakdown: posts by platform, success rate by platform, top templates
  - Time-series data: posts per day (last 7 days), success trend
  - Dashboard widgets: summary cards, charts (Charts.js/Recharts), platform breakdown
  - Filter by date range, platform, account

  **Must NOT do**: Advanced ML analytics, sentiment analysis

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: analytics queries; aggregations; visualization
  - Skills: []

  **Parallelization**: Can Parallel: NO (depends on task 17) | Wave 4 | Blocks: 23 | Blocked By: 17

  **References**:
  - Pattern: SQL aggregations, time-series queries
  - External: https://recharts.org/ (for React charts)

  **Acceptance Criteria**:
  - [ ] GET /v1/analytics/summary returns: `{total_posts, success_rate, engagement_avg, active_accounts}`
  - [ ] GET /v1/analytics/posts with filters (date_from, date_to, platform) returns aggregated data
  - [ ] Dashboard loads summary cards with metrics
  - [ ] Charts render correctly with sample data
  - [ ] Date range filter updates charts
  - [ ] Tests pass: `jest src/routes/analytics.test.ts`

  **QA Scenarios**:
  ```
  Scenario: Analytics summary API works
    Tool: interactive_bash
    Steps:
      1. npm run dev &
      2. curl http://localhost:3000/v1/analytics/summary
      3. pkill -f "node.*dev"
    Expected: JSON with metrics (total_posts, success_rate, etc.)
    Evidence: .sisyphus/evidence/task-18-analytics-summary.log

  Scenario: Dashboard widgets display data
    Tool: Playwright
    Steps:
      1. Navigate to /analytics
      2. Check summary cards loaded
      3. Check charts rendered
    Expected: All cards and charts visible with data
    Evidence: .sisyphus/evidence/task-18-analytics-dashboard.png
  ```

  **Commit**: YES | Message: `feat(analytics): implement analytics queries and dashboard widgets` | Files: `src/routes/analytics.ts, dashboard/app/(pages)/analytics/page.tsx, dashboard/components/Charts/*`

---

## Wave 5: Deployment & Monitoring

- [ ] 19. Structured Logging & Monitoring

  **What to do**:
  - Setup Winston for structured JSON logging
  - Create log context middleware (includes job_id, platform, account_id, action)
  - Configure log levels: debug, info, warn, error
  - Create metrics collection (posts_sent, success_rate, rate_limit_hits, queue_depth)
  - Expose metrics endpoint: `GET /v1/metrics` (Prometheus format)
  - Setup health checks: `GET /v1/health` with dependency status (DB, queue, adapters)

  **Must NOT do**: External monitoring tools (Grafana, Prometheus server), alerting (task 20)

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: logging setup; metric collection; straightforward instrumentation
  - Skills: []

  **Parallelization**: Can Parallel: YES (with task 20-21) | Wave 5 | Blocks: 23 | Blocked By: 1-18

  **References**:
  - Pattern: Structured logging, contextual fields
  - External: https://github.com/winstonjs/winston, https://prometheus.io/docs/instrumenting/exposition_formats/

  **Acceptance Criteria**:
  - [ ] Logs output JSON format: `{"timestamp":"2026-04-22T..","level":"info","message":"...","job_id":"...","platform":"..."}`
  - [ ] Metrics endpoint returns Prometheus format: `curl http://localhost:3000/v1/metrics | grep "posts_sent_total"`
  - [ ] Health endpoint shows status: `curl http://localhost:3000/v1/health | jq '.dependencies'`
  - [ ] All logs include context (request_id, job_id if applicable)
  - [ ] Tests pass: `jest src/utils/logging.test.ts`

  **QA Scenarios**:
  ```
  Scenario: Structured logs include context
    Tool: interactive_bash
    Steps:
      1. npm run dev &
      2. Trigger a job
      3. Check logs in stdout: look for JSON with job_id, platform, action
      4. pkill -f "node.*dev"
    Expected: Logs contain context fields
    Evidence: .sisyphus/evidence/task-19-logging-context.log

  Scenario: Metrics endpoint works
    Tool: interactive_bash
    Steps:
      1. npm run dev &
      2. curl http://localhost:3000/v1/metrics | head -20
      3. pkill -f "node.*dev"
    Expected: Prometheus-format metrics displayed
    Evidence: .sisyphus/evidence/task-19-metrics-endpoint.log

  Scenario: Health check shows dependencies
    Tool: interactive_bash
    Steps:
      1. npm run dev &
      2. curl http://localhost:3000/v1/health | jq '.dependencies'
      3. pkill -f "node.*dev"
    Expected: Shows DB status, queue status, adapter status
    Evidence: .sisyphus/evidence/task-19-health-check.log
  ```

  **Commit**: YES | Message: `infra(monitoring): add structured logging and metrics collection` | Files: `src/utils/logging.ts, src/middleware/context.ts, src/routes/metrics.ts, src/routes/health.ts`

---

- [ ] 20. Alert System (email, in-app, webhooks)

  **What to do**:
  - Create alert interface: `sendAlert(level, message, context)`
  - Implement email alerts (SMTP integration)
  - Implement in-app alerts (store in database, expose via API)
  - Implement webhook alerts (POST to configured URL)
  - Alert triggers: job failure, rate limit hit, adapter error, queue backlog
  - Alert deduplication (avoid duplicate alerts within 5 minutes)
  - Dashboard widget to view recent alerts

  **Must NOT do**: External alerting services (Slack, PagerDuty setup itself)

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: multi-channel alerts; deduplication logic; configuration
  - Skills: []

  **Parallelization**: Can Parallel: YES (with tasks 19,21) | Wave 5 | Blocks: 23 | Blocked By: 1-18

  **References**:
  - Pattern: Alert dispatcher with multiple channels
  - External: https://nodemailer.com/ (email)

  **Acceptance Criteria**:
  - [ ] Alert triggered on job failure: alert saved to database & email sent
  - [ ] Email sent via SMTP: check ALERT_EMAIL_SMTP_* config
  - [ ] In-app alerts stored: `SELECT COUNT(*) FROM alerts WHERE level='error'`
  - [ ] Webhook alerts POST to configured URL: verify ALERT_WEBHOOK_URL
  - [ ] Duplicate alerts suppressed within 5-minute window
  - [ ] Dashboard shows recent alerts: `GET /v1/alerts`
  - [ ] Tests pass: `jest src/utils/alerts.test.ts`

  **QA Scenarios**:
  ```
  Scenario: Job failure triggers alert
    Tool: interactive_bash
    Steps:
      1. Start workers, force job failure
      2. Check database: SELECT * FROM alerts ORDER BY created_at DESC LIMIT 1
      3. Check email inbox (mock SMTP)
    Expected: Alert created, email sent
    Evidence: .sisyphus/evidence/task-20-alerts-job-failure.log

  Scenario: Duplicate alerts suppressed
    Tool: interactive_bash
    Steps:
      1. Trigger same failure 3 times within 5 minutes
      2. Check alert count: SELECT COUNT(*) FROM alerts WHERE message='same message'
    Expected: Only 1 alert (duplicates suppressed)
    Evidence: .sisyphus/evidence/task-20-alerts-dedup.log

  Scenario: Dashboard shows recent alerts
    Tool: Playwright
    Steps:
      1. Navigate to dashboard
      2. Check alerts widget shows recent alerts
    Expected: Alerts visible
    Evidence: .sisyphus/evidence/task-20-dashboard-alerts.png
  ```

  **Commit**: YES | Message: `feat(alerts): implement multi-channel alert system` | Files: `src/utils/alerts.ts, src/routes/alerts.ts, src/utils/alerts.test.ts`

---

- [ ] 21. Docker & Docker Compose Setup

  **What to do**:
  - Create Dockerfile for backend (Node.js image, multi-stage build)
  - Create Dockerfile for dashboard (Node.js build + nginx)
  - Create docker-compose.yml with services: api, workers, dashboard, sqlite (or postgresql)
  - Environment file per environment (.env.dev, .env.prod)
  - Volume setup: database persistence, logs
  - Network setup: services communicate via container names
  - Health checks for all services

  **Must NOT do**: Kubernetes manifests, cloud-specific deployments

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: Docker configuration; straightforward setup
  - Skills: []

  **Parallelization**: Can Parallel: YES (with tasks 19-20) | Wave 5 | Blocks: 23 | Blocked By: 1-18

  **References**:
  - Pattern: Multi-stage Docker builds, docker-compose services
  - External: https://docs.docker.com/

  **Acceptance Criteria**:
  - [ ] Dockerfile builds successfully: `docker build -t joki-blast-api .`
  - [ ] docker-compose.yml defines 4 services: api, workers, dashboard, db
  - [ ] Services start: `docker-compose up -d`
  - [ ] All services healthy: `docker-compose ps | grep healthy`
  - [ ] API reachable: `curl http://localhost:3000/v1/health`
  - [ ] Dashboard reachable: `curl http://localhost:3001`
  - [ ] Database persists: `docker-compose down` + `docker-compose up`, data still there

  **QA Scenarios**:
  ```
  Scenario: Docker Compose brings up all services
    Tool: interactive_bash
    Steps:
      1. docker-compose -f docker-compose.yml up -d
      2. sleep 10
      3. docker-compose ps
      4. curl http://localhost:3000/v1/health
      5. curl http://localhost:3001
      6. docker-compose down
    Expected: All services running, endpoints accessible
    Evidence: .sisyphus/evidence/task-21-docker-compose.log

  Scenario: Database persists across restarts
    Tool: interactive_bash
    Steps:
      1. Start docker-compose
      2. Create account via API
      3. Stop: docker-compose down
      4. Start: docker-compose up -d
      5. Check account still exists: curl http://localhost:3000/v1/accounts
    Expected: Account data persisted
    Evidence: .sisyphus/evidence/task-21-docker-persistence.log
  ```

  **Commit**: YES | Message: `infra(docker): add dockerfile and docker-compose for deployment` | Files: `Dockerfile, dashboard/Dockerfile, docker-compose.yml, docker/.env.*`

---

- [ ] 22. Deployment Guide & VPS Setup

  **What to do**:
  - Create DEPLOYMENT.md with step-by-step VPS setup
  - Include: OS setup (Ubuntu 22.04), Docker installation, firewall rules, SSL/TLS
  - Document environment variables per environment (dev/staging/prod)
  - Backup strategy: SQLite database backups (cron script)
  - Monitoring setup: log rotation, disk space monitoring
  - Rollback procedure: how to revert to previous version
  - Database migration guide: SQLite → PostgreSQL path

  **Must NOT do**: Actual VPS provisioning, cloud-specific deployments

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: documentation; procedural steps
  - Skills: []

  **Parallelization**: Can Parallel: YES (with tasks 19-21) | Wave 5 | Blocks: 23 | Blocked By: 1-18

  **References**:
  - Pattern: Step-by-step operational guides
  - External: https://docs.docker.com/engine/install/ubuntu/

  **Acceptance Criteria**:
  - [ ] DEPLOYMENT.md exists with sections: Prerequisites, OS Setup, Docker, Environment, SSL, Backups, Monitoring, Rollback
  - [ ] VPS Setup script created (Bash): provisions fresh Ubuntu with Docker
  - [ ] Backup script automated (cron)
  - [ ] Monitoring instructions included (log rotation, disk alerts)
  - [ ] Database migration path documented (SQLite → PostgreSQL)

  **QA Scenarios**:
  ```
  Scenario: Fresh Ubuntu can be set up following DEPLOYMENT.md
    Tool: interactive_bash
    Steps:
      1. Read DEPLOYMENT.md
      2. Verify all prerequisites listed
      3. Check setup script exists and is executable
    Expected: Guide is clear and complete
    Evidence: .sisyphus/evidence/task-22-deployment-guide.log

  Scenario: Backup script runs and creates backup
    Tool: interactive_bash
    Steps:
      1. Run backup script: bash scripts/backup.sh
      2. Check backup file created: ls -la backups/
    Expected: Backup file exists with timestamp
    Evidence: .sisyphus/evidence/task-22-backup.log
  ```

  **Commit**: YES | Message: `docs(deploy): add vps deployment and operations guide` | Files: `DEPLOYMENT.md, scripts/backup.sh, scripts/setup-vps.sh`

---

## Wave 6: Final Verification (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. Plan Compliance Audit

  **What to do**: Verify all 22 tasks completed per acceptance criteria. Check commits in git history. Verify evidence artifacts. Confirm scope boundaries honored.

  **Acceptance Criteria**:
  - [ ] All 22 tasks marked completed
  - [ ] Evidence files: `find .sisyphus/evidence -type f | wc -l` >= 50 files
  - [ ] No "Must NOT Have" features implemented
  - [ ] Plan matches executed work

  **Commit**: YES (if needed) | Message: `chore(verify): plan compliance audit complete`

---

- [ ] F2. Code Quality Review

  **What to do**: Run TypeScript compilation, linter, tests. Check >80% coverage on critical paths. Verify no console.log, all errors handled, type safety strict.

  **Acceptance Criteria**:
  - [ ] TypeScript: `npm run build` exit 0
  - [ ] Linter: `npm run lint` no errors
  - [ ] Tests: `npm run test` exit 0, coverage >80%
  - [ ] No console.log in production code
  - [ ] All async functions have error handling

  **Commit**: YES (if needed) | Message: `refactor(quality): address code quality findings`

---

- [ ] F3. Real Manual QA

  **What to do**: End-to-end test all workflows across all 5 platforms. Test rate limiting, alerts, dashboard, error scenarios.

  **Acceptance Criteria**:
  - [ ] Complete workflow: Account → Template → Schedule → Post → Success (all 5 platforms)
  - [ ] Rate limiting: 10 consecutive requests respected, backoff applied
  - [ ] Alerts: Job failure triggers email + webhook
  - [ ] Dashboard: All pages load, forms work, real-time updates functional
  - [ ] Error handling: All scenarios graceful (no crashes, clear messages)

  **Commit**: NO | Evidence: .sisyphus/evidence/F3-*.{log,png}

---

- [ ] F4. Scope Fidelity Check

  **What to do**: Verify MVP scope delivered. Check all 5 platforms posting successfully. Confirm no scope creep. Validate against original requirements.

  **Acceptance Criteria**:
  - [ ] All 5 platforms posting: WhatsApp, Telegram, Twitter, Threads, Instagram
  - [ ] Multi-account per platform: working
  - [ ] Templates: CRUD + CSV import + variable substitution
  - [ ] Scheduling: cron + manual triggers
  - [ ] Analytics: basic metrics on dashboard
  - [ ] No LLM (deferred): only template + trigger modes
  - [ ] No multi-tenant auth: admin-only (as planned)

  **Commit**: YES (if needed) | Message: `docs(scope): confirm scope fidelity and completeness`

---

---

## Dependency Matrix (All Tasks)

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 (Setup) | — | 2-22 | W1 |
| 2 (DB Schema) | 1 | 3-22 | W1 |
| 3 (Secrets) | 1 | 4-22 | W1 |
| 4 (API Scaffold) | 2,3 | 5-9,13-18 | W2 |
| 5-9 (Adapters) | 2,3,4 | 10-12,23 | W2 |
| 10 (Queue) | 2,3 | 11,12,23 | W3 |
| 11 (Retry) | 10 | 12,23 | W3 |
| 12 (Rate Limiter) | 10 | 23 | W3 |
| 13-18 (Dashboard) | 4,5-9,10 | 23 | W4 |
| 19-22 (Deployment) | 1-18 | 23 | W5 |
| 23-24 (Verification) | 1-22 | — | W6 |

---

## Agent Dispatch Summary

| Wave | Task Count | Primary Categories | Notes |
|------|-----------|-------------------|-------|
| W1 | 3 | quick, unspecified-low | Foundation; no code complexity |
| W2 | 6 | unspecified-high, deep | API + 5 adapters; library integration heavy |
| W3 | 3 | deep, unspecified-high | Queue architecture; retry/backoff logic |
| W4 | 6 | unspecified-high, visual-engineering | Dashboard; CRUD endpoints; analytics |
| W5 | 4 | unspecified-low, quick | Docker, docs, deployment |
| W6 | 2 | oracle, unspecified-high, deep | Final QA; security audit; compliance |

---

## Commit Strategy

**Frequency**: 1 commit per completed task (or per task group for tight integration)

**Commit Format**:
```
type(scope): short description

[optional body with technical decisions]

- Acceptance criteria met
- QA scenarios passed
- Evidence: .sisyphus/evidence/task-N-*
```

**Types**:
- `feat`: New capability (adapter, endpoint, feature)
- `infra`: Database, deployment, configuration
- `refactor`: Code reorganization (no behavioral change)
- `test`: Test suite, QA scenarios
- `docs`: Documentation, guides, comments

---

## Success Criteria

### Functional
✅ All 5 platforms posting successfully (happy path + retry on failure)
✅ Templates (database + CSV import) working end-to-end
✅ Rate limiting respected per platform
✅ Job queue retrying failed jobs with backoff
✅ Admin dashboard CRUD operations functional
✅ Analytics showing posts sent, success rate, engagement

### Technical
✅ API fully typed (TypeScript strict mode)
✅ Database migrations reversible
✅ Secrets never logged or exposed
✅ Rate limiter protecting against API 429s
✅ Logging structured (JSON format, contextual fields)
✅ Code coverage >80% critical paths

### Operational
✅ Docker Compose brings up all services (API, workers, dashboard, DB)
✅ Health checks passing
✅ Deployment guide executable by ops team
✅ Alerts routing correctly (email, webhooks)
✅ Monitoring dashboard showing metrics

---

## Implementation Notes

### Architecture Decisions
1. **API-first design**: All integrations expose REST endpoints; adapters are pluggable
2. **Adapter pattern**: Separate implementations per platform, common interface
3. **Queue-based**: Jobs decoupled from API; workers can scale independently
4. **Rate limiting**: Per-platform handlers with circuit breakers for resilience
5. **SQLite MVP**: WAL mode enabled; PostgreSQL migration path clear
6. **Secrets vault**: Encrypted env vars initially; vault integration planned

### Platform-Specific Notes
- **WhatsApp**: Dual approach (Cloud API preferred, Web automation fallback)
- **Telegram**: Bot API is stable; webhooks for real-time updates
- **Twitter/X**: v2 API only; OAuth token management critical
- **Threads**: New API, likely rapid changes; monitor Meta changelog
- **Instagram**: Graph API official path; private API fallback risky (ToS)

### Known Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| Platform ToS violations | API-first; automation isolated; feature flags to disable risky flows |
| SQLite concurrent writes | WAL mode; job queue single writer; PostgreSQL migration ready |
| Cookies expired (WhatsApp Web) | Token refresh logic; monitor session health; fallback to Cloud API |
| Rate limit exceeded | Per-platform rate limiter; exponential backoff + jitter; circuit breaker |
| Secret leak | Encrypted storage; no logs with credentials; audit log for access |

