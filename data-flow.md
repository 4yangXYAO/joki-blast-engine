# Data Flow

## Facebook Pages Blast Flow

1. Operator creates or updates a Facebook account in the dashboard.
2. The account credential stores a JSON payload with `pageId` and `accessToken`.
3. The operator creates a campaign and selects `facebook` in the platform list.
4. The dashboard calls `POST /v1/campaigns/:id/blast`.
5. The campaign route enqueues a `PostJob` for the Facebook platform.
6. The worker reads the stored account credential, decrypts it, and instantiates `FacebookAdapter`.
7. `FacebookAdapter` posts to `https://graph.facebook.com/v19.0/{page-id}/feed`.
8. The adapter returns success or a structured error code.
9. The repo stores the campaign post record for traceability.

## Error Flow

- Code `4` becomes `RATE_LIMIT_EXCEEDED`.
- Code `190` becomes `TOKEN_EXPIRED`.
- Other Graph errors bubble back as adapter failures.
