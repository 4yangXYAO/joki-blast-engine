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
6. The adapter sends the payload to the target recipient.

## Storage

- SQLite is the primary persistent store.
- Runtime settings are encrypted before storage.
- Account credentials are encrypted before storage.
- `sql.js` is used as a resilient fallback when the native SQLite binding is unavailable in this environment.

## UI surface

The dashboard contains one page with these sections:

- API health
- Integration tokens
- Create account
- Create template
- Blast / schedule job
- Current records

## Constraints

- The dashboard does not manage a multi-page navigation structure.
- Blast requires an explicit recipient/target.
- Job execution depends on the selected platform and stored account credentials.
- All behavior must be kept in sync with tests and docs.
