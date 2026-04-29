# Research

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
