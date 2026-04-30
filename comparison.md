# Comparison

## Dashboard API Base Resolution

| Option                                | What it does                                       | Strengths                                    | Weaknesses                                                    |
| ------------------------------------- | -------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------- |
| Local default `http://127.0.0.1:3456` | Dashboard points to the running backend by default | Works immediately in this repo's local setup | Needs code update if the backend port changes                 |
| `NEXT_PUBLIC_API_BASE` override       | Dashboard reads the API base from env              | Flexible across environments                 | Fails closed if the env var is missing or incorrect           |
| Same-origin proxy                     | UI calls relative paths and lets a proxy route     | No hardcoded host/port in the UI             | Requires deployment plumbing that is not present in this repo |

## Decision

Use the local `3456` default and preserve the env override for non-local deployments.

## Options Compared

| Option                              | What it does                                      | Strengths                                                     | Weaknesses                                                         |
| ----------------------------------- | ------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------ |
| Pages Graph API v19.0               | Posts to a Facebook Page with a Page access token | Official, deterministic, easier to test, explicit permissions | Only covers Pages, not groups/forums                               |
| Cookie-based browser automation     | Drives a logged-in browser session                | Can imitate a human flow                                      | Fragile, hard to test, session-dependent, not ideal for production |
| Manual-assisted group/forum posting | System prepares content; human posts it           | Safe and simple                                               | Not fully automated                                                |

## Decision

Use the official Pages Graph API for automated Facebook posting. Keep group/forum work manual-assisted if it is needed at all.
