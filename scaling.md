# Scaling

## Current Behavior

- The worker processes jobs through the existing queue processor.
- Facebook posts are one API call per post job.
- Rate limits are tracked per adapter instance.

## Scaling Risks

- High-frequency blast jobs can hit Page rate limits.
- Token expiry can create a retry backlog if not corrected quickly.
- Link-heavy posts can increase campaign support load if destination pages are unstable.

## Scaling Guidelines

- Keep blast jobs small and platform-specific.
- Spread campaigns over time instead of firing large bursts.
- Retry only after the operator fixes the credential issue when code `190` appears.
- Stop retrying immediately when rate limit code `4` is returned.
