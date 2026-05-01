# Data Flow

## Blast Runner Flow (Multi-Platform)

1. Client calls `POST /v1/blast/run` with `{ platform, accountId, message }`.
2. System validates single-platform mode (rejects if a blast is already running).
3. Account credentials are loaded and decrypted from the `accounts` table.
4. Platform finder searches for targets (posts/users) via internal APIs.
   - Facebook: GraphQL search → postIds + userIds (fallback: `data/targets.txt`).
   - Instagram: Hashtag/explore API → postIds + userIds.
   - Twitter: GraphQL search → tweetIds + userIds.
   - Threads: Internal search API → postIds + userIds.
   - WhatsApp: Uses supplied phone number list (no finder needed).
5. Targets are shuffled randomly.
6. Sequential loop (max 30 actions):
   - Pick action type: 70% comment, 30% chat (DM).
   - Execute action via platform adapter (cookie-based).
   - Log result with progress (e.g. `[blast] 10/30`).
   - Apply random delay: 20-40s (comment), 35-60s (DM).
   - On failure: log error and skip to next target.
7. Return `BlastResult` with total/success/failed counts and full log.

## Facebook Pages Blast Flow (Legacy)

1. Operator creates or updates a Facebook account in the dashboard.
2. The account credential stores a JSON payload with `pageId` and `accessToken`.
3. The operator creates a campaign and selects `facebook` in the platform list.
4. The dashboard calls `POST /v1/campaigns/:id/blast`.
5. The campaign route enqueues a `PostJob` for the Facebook platform.
6. The worker reads the stored account credential, decrypts it, and instantiates `FacebookAdapter`.
7. `FacebookAdapter` posts via GraphQL to www.facebook.com.
8. The adapter returns success or a structured error code.
9. The repo stores the campaign post record for traceability.

## Error Flow

- Code `4` becomes `RATE_LIMIT_EXCEEDED`.
- Code `190` becomes `TOKEN_EXPIRED`.
- Other Graph errors bubble back as adapter failures.
- Blast runner: errors are logged per-action and skipped (no stop, no retry).
