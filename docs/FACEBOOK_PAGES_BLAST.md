# Facebook Blast — Cookie Guide

**Auth method:** Browser session cookie via `m.facebook.com`  
**Adapter:** `FacebookAdapter` in `src/adapters/providers/meta/facebook/facebook.ts`

---

## How It Works

1. You paste your Facebook session cookie string into the dashboard
2. The adapter gets `m.facebook.com` to extract `fb_dtsg` (CSRF token) and `c_user`
3. It POSTs your message to `/a/home.php` using the mobile endpoint
4. The post appears on your Facebook feed/timeline

---

## Step-by-Step Setup

### 1. Get Your Facebook Session Cookie

You need to copy your browser's cookie from an active Facebook session.

**Using Chrome / Edge:**
1. Log in to [facebook.com](https://www.facebook.com) in your browser
2. Open **DevTools** → F12
3. Go to **Application** tab → **Cookies** → `https://www.facebook.com`
4. Copy the values you need (or use a cookie-export extension)

**Key cookies required:**
| Cookie | Purpose |
|--------|---------|
| `c_user` | Your Facebook user ID |
| `xs` | Session token |
| `datr` | Browser fingerprint |
| `sb` | Browser identifier |

**Format to paste:**
```
c_user=12345678; xs=AbCdEf; datr=XyZaBc; sb=defGHI
```

> **Note:** You can also use a browser extension like "EditThisCookie" or "Cookie-Editor" to export cookies in `key=value; key2=value2` format.

---

### 2. Create a Facebook Account in Dashboard

1. Open dashboard at `http://localhost:3001`
2. Navigate to **Create Account**
3. Select platform: `facebook`
4. Enter a username (any label, e.g. "My FB Account")
5. In the **Facebook Session Cookie** textarea, paste your cookie string
6. Click **Save**
7. Copy the Account ID shown

The cookie is stored **encrypted** in SQLite using AES-256-GCM.

---

### 3. Create a Campaign

```
Campaign Name:    My Promo
Campaign Content: Check this out! Click the link below.
CTA Link:         https://wa.me/628123456789
Platform:         facebook
```

→ Click **Create Facebook Campaign**

---

### 4. Blast

→ Select your Facebook account from the dropdown  
→ Click **Blast Facebook Campaign**  
→ The post will appear on your Facebook account

---

## API Reference

### Create Facebook Account
```http
POST /v1/accounts
Content-Type: application/json

{
  "platform": "facebook",
  "username": "My FB Account",
  "credentials": "c_user=12345; xs=abc; datr=xyz"
}
```

### Create Campaign
```http
POST /v1/campaigns
Content-Type: application/json

{
  "name": "My Promo",
  "content": "Check this out!",
  "cta_link": "https://wa.me/628123456789",
  "platforms": ["facebook"]
}
```

### Blast Campaign
```http
POST /v1/campaigns/{campaign_id}/blast
Content-Type: application/json

{
  "account_ids": {
    "facebook": "{account_id}"
  }
}
```

---

## Error Codes

| Code | Meaning | Fix |
|------|---------|-----|
| `AUTH_EXPIRED` | Cookie expired or account logged out | Re-login and paste new cookie |
| `RATE_LIMIT_EXCEEDED` | Too many posts (> 30/min) | Wait and retry |
| `FB_POST_FAILED` | Post accepted but response empty | Check cookie validity |
| `FB_POST_ERROR` | Network or HTTP error | Check connectivity |

---

## Troubleshooting

**Post not appearing:**
- Check that `c_user` and `xs` cookies are present in your string
- Make sure you are still logged in on Facebook in your browser
- The cookie may have expired — re-export from browser

**AUTH_EXPIRED immediately:**
- Your Facebook session is expired or logged out
- Log in again on facebook.com and re-copy the cookies

**Rate limit hit:**
- The adapter allows 30 posts per minute
- Spread blast across time if posting to multiple accounts

---

## Security Notes

- Cookies are stored **encrypted** (AES-256-GCM) in `data/app.db`
- Never share your cookie string — it acts like a password
- Cookie expires when you log out of Facebook on that browser
- Use a dedicated account for blasting, not your personal account
