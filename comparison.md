# Comparison

## Options Compared

| Option                              | What it does                                      | Strengths                                                     | Weaknesses                                                         |
| ----------------------------------- | ------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------ |
| Pages Graph API v19.0               | Posts to a Facebook Page with a Page access token | Official, deterministic, easier to test, explicit permissions | Only covers Pages, not groups/forums                               |
| Cookie-based browser automation     | Drives a logged-in browser session                | Can imitate a human flow                                      | Fragile, hard to test, session-dependent, not ideal for production |
| Manual-assisted group/forum posting | System prepares content; human posts it           | Safe and simple                                               | Not fully automated                                                |

## Decision

Use the official Pages Graph API for automated Facebook posting. Keep group/forum work manual-assisted if it is needed at all.
