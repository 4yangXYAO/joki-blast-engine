# Agent Notes

- Treat this repo as brownfield.
- The dashboard is a single-page admin UI in `dashboard/app/page.tsx`.
- The blast flow is: save integration tokens, create account, create template, set recipient, trigger or schedule job.
- Job execution resolves adapters from stored accounts and decrypts credentials.
- WAHA is the preferred WhatsApp path.
- Keep docs in sync with behavior changes.
- Re-run `npm test` and `npm --prefix dashboard run build` after code changes.
