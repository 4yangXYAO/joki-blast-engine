# ADR-0006: Facebook Blast — Cookie-Based Auth over Graph API

**Date:** 2026-04-30  
**Status:** Accepted  
**Decider:** Project owner

---

## WHY — Problem

The Graph API v19.0 path requires:
- A Facebook developer app (approval required)
- A Page Access Token (expires, requires refresh)
- The `pages_manage_posts` permission (granted per app)

This creates friction for operators who just want to post from an existing personal/business account without managing developer app credentials.

## WHAT ELSE — Options Considered

| Option | Pros | Cons | Score |
|--------|------|------|-------|
| **A. Keep Graph API** | Official, stable, token revocation clear | Requires dev app approval, token expires, extra setup | 5/10 |
| **B. Cookie-based via m.facebook.com** | Works with any FB session, no app required | Fragile to HTML changes, cookie expires silently | 8/10 |
| **C. facebook-scraper library** | Higher-level API | Unmaintained, heavier dependency | 3/10 |

## WHY THIS — Evidence

- Cookie-based adapter already implemented in `providers/meta/facebook/facebook.ts`
- Tests already written and passing in `facebook-cookies.test.ts`
- Dashboard already updated with cookie textarea input
- Pattern is consistent with other cookie adapters (Instagram, Twitter, Threads)
- `fb_dtsg` + `c_user` extraction from `m.facebook.com` is stable across sessions

## WHEN WRONG — Reversal Trigger

Revert to Graph API if:
- Meta changes `m.facebook.com/a/home.php` endpoint signature
- Cookie lifetime becomes unacceptably short (< 7 days)
- Enterprise clients require API token audit trail

Rollback: `git revert` the commit replacing `src/adapters/facebook.ts`.

---

## What Changed

| File | Change |
|------|--------|
| `src/adapters/facebook.ts` | Replaced Graph API impl with re-export of `providers/meta/facebook/facebook.ts` |
| `dashboard/app/page.tsx` | Fixed description text: Page ID/AccessToken → session cookie |
| `README.md` | Removed Graph API references from Facebook section |
| `agents.md` | Updated Facebook blast path description |
| `docs/FACEBOOK_PAGES_BLAST.md` | Replaced Graph API guide with cookie guide |

---

## Credential Format

**Before:**
```json
{ "pageId": "123456789", "accessToken": "EAABxxxxx..." }
```

**After:**
```
c_user=12345678; xs=AbCdEf...; datr=XyZ...; sb=...
```
*(raw browser session cookie string, stored encrypted in SQLite)*
