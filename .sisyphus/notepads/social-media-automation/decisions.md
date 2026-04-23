## Decisionlog: Instagram Adapter
- Chose Graph API as primary path for publishing IG content; fallback guarded by INSTAGRAM_ALLOW_PRIVATE_API flag for environments where the private API is available.
- Token management: reuse INSTAGRAM_ACCESS_TOKEN from secrets/env; IG user id provided via INSTAGRAM_BUSINESS_ACCOUNT_ID or env.
- Tests implemented with axios mocks to validate main flows without real network calls.
- No queueing or background job integration implemented, per plan requirements.
- Updated test env handling: added THREADS_ACCESS_TOKEN to instagram.test.ts to satisfy config secrets requirements while keeping tests deterministic.
