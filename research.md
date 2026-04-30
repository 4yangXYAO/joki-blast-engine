# Research

## Question

How should the dashboard resolve the API base so local access works without manual configuration?

## Options

| Approach                              | Good                                                     | Bad                                                                      | Risk   | Score |
| ------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------ | ------ | ----- |
| A. Hardcoded local default to 3456    | Works out of the box with the existing backend port      | Needs code change if local API port changes                              | Low    | 9/10  |
| B. Public env var override            | Flexible for different environments                      | Requires env configuration before the UI becomes usable                  | Medium | 8/10  |
| C. Relative proxy through same origin | No port mismatch if a reverse proxy fronts both services | Requires deployment/runtime proxy setup that is not present in this repo | Medium | 6/10  |

## Prior Art

- The backend already listens on `3456` in local development.
- Next.js client components can only read `NEXT_PUBLIC_*` values at build time.
- Dashboards commonly keep a local default and allow env overrides for non-local deployments.

## Research Summary

Use a local default of `http://127.0.0.1:3456` and keep `NEXT_PUBLIC_API_BASE` as an override for other environments.

## Question

How should `joki-blast-engine` publish to Facebook in a way that is stable, production-friendly, and testable?

## Options

| Approach                           | Good                                                                      | Bad                                                                                | Risk   | Score |
| ---------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------ | ----- |
| A. Facebook Pages Graph API v19.0  | Official path, stable contracts, easier to test, works with access tokens | Requires Page access token and permissions, Pages only                             | Medium | 9/10  |
| B. Browser automation with cookies | Can mimic manual browser actions                                          | Fragile selectors, login challenges, high breakage, hard to test deterministically | High   | 2/10  |
| C. Manual-assisted publishing      | Safe, simple, no platform automation risk                                 | Not fully automatic, more operator work                                            | Low    | 6/10  |

## Prior Art

- Official Meta Graph API Page publishing supports posting to `/page-id/feed` with a Page access token.
- Meta documents rate limits and page permissions for the Pages API.
- Browser automation/cookie workflows are usually brittle and hard to maintain in production.

## Research Summary

The most reliable path is the official Pages Graph API. It keeps the blast flow inside the supported Meta surface and matches the repo's adapter pattern.
