# joki-blast-engine

Production-focused Node.js/TypeScript blast engine with a Next.js dashboard, SQLite persistence, and platform adapters for WhatsApp, Telegram, Instagram, Twitter/X, Threads, and Facebook Pages.

## What works now

- **Campaign Management**: Create marketing campaigns targeting multiple social platforms (Twitter, Threads, Instagram, Facebook).
- **Link Tracking**: Generate deterministic tracking tokens per campaign/platform and record click statistics.
- **Inbound Auto-Reply**: Receive messages on WhatsApp/Telegram and send deterministic welcome message, then hand off to sales.
- **Blast Engine**: Post content to multiple platforms simultaneously with exponential backoff retry and platform-specific rate limiting.
- **Facebook Pages**: Publish page posts through the official Graph API v19.0 with Page access tokens.
- Health check and runtime settings from the dashboard.
- Create accounts, templates, and jobs from the dashboard UI.
- Trigger an immediate blast from the dashboard UI.
- Schedule jobs through the API.
- Store integration tokens and credentials encrypted in SQLite.
- WhatsApp via WAHA is configured through runtime settings or `.env`.

## Facebook Pages Blast

- The supported Facebook blast path is Pages posting through the Graph API v19.0.
- The credential payload must contain `pageId` and `accessToken`.
- Rate limit errors are mapped to a deterministic adapter code.
- Expired token errors are mapped to a deterministic adapter code.
- This repository does not implement browser-cookie automation for Facebook groups or forums.

## Campaign Workflow

### 1. Create Campaign

1. Open dashboard at `http://localhost:3001`
2. Navigate to **Campaigns** section
3. Fill in campaign details:
   - **Campaign Name**: Descriptive title (e.g., "Summer Sale 2024")
   - **Campaign Content**: Message to post on platforms
   - **CTA Link**: URL destination (WhatsApp, Telegram, webshop, etc.)
   - **Platforms**: Select target platforms (Twitter, Threads, Instagram, Facebook)
4. Click **Create Campaign**

### 2. Blast to Platforms

1. After campaign created, click **Blast Campaign**
2. System enqueues one PostJob per selected platform
3. Each job includes a unique tracking link per platform
4. Jobs are processed with exponential backoff retry (max 5 retries)

### 3. Track Link Clicks

- When user clicks the tracking link, the system records click metadata (timestamp, platform)
- User is 302-redirected to the CTA link destination
- View statistics with: `GET /v1/track/stats/:campaignId`

### 4. Inbound Auto-Reply

- When user messages on WhatsApp or Telegram, the system:
  1. Creates a lead record with contact info
  2. Sends deterministic welcome message ("Halo! Terima kasih sudah menghubungi kami...")
  3. Marks lead as "awaiting_handoff" for manual sales negotiation
  4. Prevents duplicate welcome messages via idempotent lead storage

## Getting Started

These steps show a quick local setup for development and testing.

1. Clone the repo and install root dependencies:

  ```bash
  git clone <repo-url>
  cd joki-blast-engine
  npm install
  ```

2. Install and run the dashboard (in a separate terminal):

  ```bash
  cd dashboard
  npm install
  npm run dev        # runs the Next.js dashboard in dev mode (port configured in dashboard/package.json)
  ```

3. Initialize the database (creates local SQLite DB and runs migrations):

  ```bash
  npm run db:init
  ```

4. Start the backend API in development mode:

  ```bash
  npm run dev:api
  ```

  The API entrypoint uses `src/api/server`. The `dev:api` script starts the server with `ts-node` and `dotenv`.

5. Build the dashboard for production (optional):

  ```bash
  npm --prefix dashboard run build
  ```

6. Run tests and validations:

  ```bash
  npm test                      # run backend tests (Vitest)
  npm run validate:config       # run config validation checks
  ```

7. Environment and runtime

  - Create a `.env` file at the repo root for local secrets (see `Environment` below).
  - The API will read runtime settings and credentials from environment variables and from the SQLite database.

8. Helpful script references (root `package.json`):

  - `npm run db:init` — initialize DB + run migrations
  - `npm run dev:api` — run API in dev (ts-node)
  - `npm test` — run test suite (Vitest)

Open the dashboard in your browser (default port configured in `dashboard/package.json`), for example:

```
http://localhost:3001
```

## Environment

Required core variables:

- `DATABASE_PATH`
- `API_PORT`
- `API_HOST`
- `DASHBOARD_PORT`
- `JWT_SECRET`
- `LOG_LEVEL`

Useful integration variables:

- `WAHA_BASE_URL`
- `WAHA_API_KEY`
- `WAHA_SESSION`
- `WHATSAPP_CLOUD_API_TOKEN`
- `TELEGRAM_BOT_TOKEN`
- `THREADS_ACCESS_TOKEN`
- `TWITTER_BEARER_TOKEN`
- `TWITTER_API_KEY`
- `TWITTER_API_SECRET`
- `INSTAGRAM_ACCESS_TOKEN`
- `INSTAGRAM_BUSINESS_ACCOUNT_ID`
- `INSTAGRAM_ALLOW_PRIVATE_API`
- `WHATSAPP_WEBJS_API_KEY`

## API routes

- `GET /v1/health`
- `GET/POST/PUT/DELETE /v1/accounts`
- `GET/POST/PUT/DELETE /v1/templates`
- `POST /v1/jobs/trigger`
- `POST /v1/jobs/schedule`
- `GET/PUT /v1/settings/integrations`

## Dashboard flow

1. Check API health.
2. Save integration tokens if needed.
3. Create an account.
4. Create a template.
5. Enter a recipient/target.
6. Click `Blast now` or schedule the job.

## Verification

- Backend tests: `npm test`
- Dashboard build: `npm --prefix dashboard run build`
- Config validation: `npm run validate:config`

## Notes

- The dashboard page is a single-page admin surface in `dashboard/app/page.tsx`.
- Job execution now resolves adapters from stored accounts and decrypts their credentials.
- WAHA is the preferred WhatsApp path in this workspace.
