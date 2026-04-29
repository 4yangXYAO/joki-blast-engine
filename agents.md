# Agent Notes

- Treat this repo as brownfield.
- The dashboard is a single-page admin UI in `dashboard/app/page.tsx`.
- The blast flow is: save integration tokens, create account, create template, set recipient, trigger or schedule job.
- Job execution resolves adapters from stored accounts and decrypts credentials.
- Facebook Pages blast uses the official Graph API v19.0 path with Page access tokens.
- WAHA is the preferred WhatsApp path.
- Keep docs in sync with behavior changes.
- Re-run `npm test` and `npm --prefix dashboard run build` after code changes.
