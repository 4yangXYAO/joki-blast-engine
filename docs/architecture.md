# Architecture

## System Overview

The repository has two runtime surfaces:

- Root backend in `src/`.
- Next.js dashboard in `dashboard/`.

The backend owns persistence, job orchestration, adapter selection, and delivery. The dashboard is an admin surface that writes integration settings and creates accounts, templates, and jobs through HTTP.

## Current data flow

1. The dashboard saves integration tokens through `PUT /v1/settings/integrations`.
2. The dashboard creates an account through `POST /v1/accounts`.
3. The dashboard creates a template through `POST /v1/templates`.
4. The dashboard triggers or schedules a job through `POST /v1/jobs/trigger` or `POST /v1/jobs/schedule`.
5. The worker resolves the adapter from the stored account and decrypts credentials when needed.
6. The adapter sends the payload to the target recipient or publishes to the configured Facebook Page.

## Storage

- SQLite is the primary persistent store.
- Runtime settings are encrypted before storage.
- Account credentials are encrypted before storage.
- `sql.js` is used as a resilient fallback when the native SQLite binding is unavailable in this environment.
- Facebook Page credentials are stored as JSON with `pageId` and `accessToken` and are decrypted only when the worker starts a job.

## UI surface

The dashboard contains one page with these sections:

- API health
- Integration tokens
- Create account
- Create template
- Blast / schedule job
- Current records

The Facebook blast path uses the same worker queue and repository flow as the other supported platforms. The only difference is the adapter target and the Graph API call format.

### Cookie-based adapters

- Several adapters offer a cookie-based delivery path (Instagram, Facebook mobile, Threads, Twitter cookie path). These adapters accept a browser session cookie string or JSON cookie array and perform mobile-site scraping to extract CSRF tokens (e.g., `fb_dtsg`) and account identifiers. Use these paths only when official API tokens are unavailable. The backend records adapter errors to the `logs` table for troubleshooting.

### SQLite and concurrency

- The SQLite initialization sets `journal_mode = WAL` and `busy_timeout = 30000` to reduce contention under concurrent worker and API access.

When a queued post job completes or fails, the server updates the matching `campaign_posts` row by `job_id` and advances the campaign to `completed` once no posts remain pending.

## Dashboard API base

- The dashboard defaults to `http://127.0.0.1:3456` for API calls.
- Set `NEXT_PUBLIC_API_BASE` or `NEXT_PUBLIC_API_BASE_URL` if the API runs elsewhere.
- The dashboard health card should be treated as offline if the configured API base is unreachable.

## Constraints

- The dashboard does not manage a multi-page navigation structure.
- Blast requires an explicit recipient/target.
- Job execution depends on the selected platform and stored account credentials.
- All behavior must be kept in sync with tests and docs.
