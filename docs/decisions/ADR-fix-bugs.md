# ADR-001: Improve cookie-based adapters, DB locking, and worker observability

Date: 2026-04-30

## Status

Accepted

## Context

Several issues were observed when running the system end-to-end and in unit tests:

- Cookie-based adapters for Meta platforms required more robust page parsing (fb_dtsg, lst, c_user).
- The SQLite layer did not set a busy timeout which can lead to transient `SQLITE_BUSY` errors under contention.
- Worker failures were not persisted to the database logs table, making diagnosis harder.
- The dashboard lacked auto-refresh which made observing job state slower during development.

## Decision

1. Implement a dedicated `FacebookAdapter` (cookie-based) that:
   - Accepts cookies (plain string or JSON array) via stored credentials.
   - Fetches `https://m.facebook.com/` with a mobile User-Agent and extracts `fb_dtsg`, `lst`, and `c_user` where available.
   - Posts using `POST /a/home.php` with `av`, `lst`, `fb_dtsg`, and `xhpc_message_text` form fields.
   - Throws `AuthError` when authentication appears expired (login redirect).

2. Update SQLite initialization (`initDatabase`) to set:
   - `journal_mode = WAL` (already present)
   - `busy_timeout = 30000` to reduce `SQLITE_BUSY` races

3. Persist worker/adapter failures into the `logs` table with job_id, level, message, and meta JSON.

4. Ensure adapters expose realistic `getRateLimitStatus()` and locally decrement quotas (`maybeDrainRate`) to prevent fast-fire retries.

5. Add a small dashboard auto-refresh (`refreshCollections`) that executes every 10 seconds.

6. Add minimal compatibility export for legacy tests referencing a Facebook-named cookie adapter.

## Consequences

- Better observability: worker failures are recorded to the DB logs table.
- Reduced transient DB locking issues due to busy timeout.
- Cookie-based Facebook posting can operate where Graph API is not desired, but it requires valid browser session cookies and may break if Facebook changes UI.
- Unit tests were adjusted/supported so the suite remains green.

## Reversal

If cookie-based posting proves brittle or becomes a maintenance burden, revert and prefer Graph API-only path for Facebook Pages. Rollback plan: revert adapter file, restore tests, and update docs accordingly.
