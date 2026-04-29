# Claude Notes

Use this project as a production-oriented blast engine.

Rules:

- Do not assume a flow works until you verify it against the code and tests.
- The UI blast flow is on the dashboard home page.
- The worker now instantiates adapters from stored accounts.
- Facebook Pages posting is implemented through the Graph API v19.0 path in `src/adapters/facebook.ts`.
- Prefer WAHA for WhatsApp.
- Keep `README.md`, `docs/architecture.md`, and `docs/decisions/*` synchronized with code.
- Validate with backend tests plus dashboard build.
