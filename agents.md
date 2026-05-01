# Agent Notes

- Treat this repo as brownfield.
- The dashboard is a single-page admin UI in `dashboard/app/page.tsx`.
- The blast flow is: save integration tokens, create account, create template, set recipient, trigger or schedule job.
- Job execution resolves adapters from stored accounts and decrypts credentials.
- Facebook blast uses cookie-based auth via www.facebook.com GraphQL endpoint (not Graph API).
- WAHA is the preferred WhatsApp path.
- **Blast Runner** (`src/blast/blast-runner.ts`): Sequential multi-platform orchestrator.
  - Supports: Facebook, Instagram, Twitter, Threads, WhatsApp.
  - API: `POST /v1/blast/run` + `GET /v1/blast/status`.
  - Max 30 actions/run, 20-40s delay (comment), 35-60s delay (DM), 70/30 comment/chat ratio.
  - Single-provider mode only (one platform per run, global lock prevents concurrent blasts).
  - Platform finders: `src/blast/finders/` search for targets via internal APIs.
  - On failure: logs and skips (does NOT stop or retry).
- Keep docs in sync with behavior changes.
- Re-run `npm test` and `npm --prefix dashboard run build` after code changes.
