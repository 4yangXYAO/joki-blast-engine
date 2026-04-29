# Security

## Credentials

- Facebook Page access tokens are stored encrypted in SQLite.
- Decryption happens only when the worker builds the adapter.
- The adapter keeps the token in memory only for the active job.

## API Surface

- The adapter uses HTTPS Graph API calls.
- The Graph API version is pinned to v19.0 in code.
- No browser cookies are stored for Facebook Pages posting in this implementation.

## Failure Handling

- Rate limits return a deterministic error code.
- Expired tokens return a deterministic error code.
- Failed posts do not leak credentials in response bodies.

## Operational Notes

- Rotate tokens through the dashboard when permissions change.
- Revoke credentials if a Page is no longer managed.
