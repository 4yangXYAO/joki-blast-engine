# Risks

## Dashboard Access Risks

- If the dashboard points at the wrong API port, health checks and form submissions fail even when the backend is healthy.
- If `NEXT_PUBLIC_API_BASE` is set incorrectly, the UI can appear offline until the env value is corrected.
- If the backend port changes without a matching UI update, local access breaks again.

## Mitigations

- Keep the dashboard default aligned with the backend dev port.
- Allow an explicit env override for non-local deployments.
- Verify the health endpoint in tests and during manual smoke checks.

## Technical Risks

- Token expiry can stop posting until a new Page access token is stored.
- Rate limits can throttle repeated blast jobs.
- Graph API contract changes can require version updates.
- Posts with links can fail if the destination is not reachable or not permitted.

## Operational Risks

- The Page must have the correct task and permission set.
- Operators need to manage tokens in the dashboard correctly.
- If a Page is removed or permissions are revoked, blast jobs fail.

## Mitigations

- Use explicit error codes for rate limit and token expiration.
- Keep the adapter isolated and covered by tests.
- Pin the Graph API version in code.
- Document the Page access token requirements in README.
