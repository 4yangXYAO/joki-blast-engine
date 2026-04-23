# Twitter Adapter Implementation Learnings

- Implemented a TwitterAdapter under src/adapters/twitter.ts that integrates with Twitter via the twitter-api-v2 library in a lazy manner to avoid runtime hard dependencies during tests.
- Supports OAuth 1.0a and OAuth 2.0 (Bearer) by attempting to initialize readWrite client when credentials exist; falls back gracefully when libraries or credentials are not present.
- postMessage creates a tweet; replyToMessage posts a reply to a given tweet id. Both methods include basic error mapping to standardized codes.
- Implemented a simple in-memory rate-limiting placeholder to satisfy the engine's expectations and to be expanded later with real rate-limit data if needed.
- Updated secrets.ts to require TWITTER_BEARER_TOKEN, TWITTER_API_KEY, TWITTER_API_SECRET and extended AppConfig to carry these values.
Notes from implementing Threads Adapter:
- Added ThreadsAdapter to src/adapters/threads.ts using Meta Threads Graph API pattern (publish, replies, status, accounts).
- Enabled THREADS_ACCESS_TOKEN in config secrets and exposed via getConfig().
- Wrote unit tests (src/adapters/threads.test.ts) with axios mocked to verify publishing, replying, status, and accounts flows.
- Followed established adapter patterns from WhatsApp and Twitter adapters for consistency (connect, disconnect, rate-limit scaffolding).
- Next: refine endpoints to reflect exact Meta Threads API surface and expand error mappings if meta exposes more detailed error codes.
