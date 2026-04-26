# joki-blast-engine

This repository is a minimal Node.js/TypeScript project for a small engine. It includes a lightweight environment configuration system and a validator to ensure required environment variables are present before running.

Environment configuration

- A safe template is provided in .env.example. Do not commit real secrets.
- The validator ensures all required variables exist before startup.

Required environment variables (as defined in src/config/secrets.ts):

- DATABASE_PATH
- API_PORT
- API_HOST
- DASHBOARD_PORT
- JWT_SECRET
- LOG_LEVEL

How to validate configuration locally

1. Copy .env.example to .env (or provide your own environment in your shell).
2. Run:
   npm run validate:config
3. If validation passes, you should see: Config validation: PASSED.

JWT_SECRET must be kept secret and not committed. Replace the placeholder in your local environment.

Planned notes: This section can be extended with per-variable descriptions and defaults.

## Getting started (development)

1. Requirements

- Node.js 18+ dan npm
- Untuk backend SQLite native: Visual Studio Build Tools (Desktop C++ workload) di Windows
- Untuk dashboard: tidak perlu tool tambahan selain Node.js dan npm
- Opsional, jika ingin fallback tanpa native build: sql.js sudah disiapkan di project

2. Create environment file
   - Copy .env.example to .env and fill required values.

Minimum env values for local dev (example):

```
DATABASE_PATH=data/app.db
API_PORT=3456
API_HOST=127.0.0.1
DASHBOARD_PORT=3000
JWT_SECRET=devsecret
LOG_LEVEL=debug
WHATSAPP_CLOUD_API_TOKEN=placeholder
TELEGRAM_BOT_TOKEN=placeholder
THREADS_ACCESS_TOKEN=placeholder
TWITTER_BEARER_TOKEN=placeholder
TWITTER_API_KEY=placeholder
TWITTER_API_SECRET=placeholder
```

3. Install dependencies & initialize DB
   - Install dependencies:
     npm install
   - Initialize the SQLite database and apply migrations:
     npm run db:init
   - Jika mau menjalankan dashboard juga:
     cd dashboard && npm install

Notes: npm install may try to build native modules (better-sqlite3). On Windows this requires Visual Studio build tools. If install fails, either install the build tools or request a sql.js fallback.

## What you need before running

- Node.js 18+ dan npm
- Root dependencies dengan `npm install`
- Dashboard dependencies dengan `cd dashboard && npm install`
- File `.env` yang berisi semua variable wajib
- Di Windows, Visual Studio Build Tools jika memakai `better-sqlite3`
- Kalau tidak mau native build, jalankan mode fallback `sql.js`

## Recommended local run order

1. Copy `.env.example` ke `.env`
2. Install dependency root dengan `npm install`
3. Jalankan `npm run db:init`
4. Install dependency dashboard dengan `cd dashboard && npm install`
5. Jalankan backend dengan `npm run dev:api`
6. Jalankan dashboard dengan `cd dashboard && npm run dev`
7. Buka `http://localhost:3001` lalu isi token di halaman dashboard

## UI token flow

- Backend bisa start tanpa token platform.
- Token WhatsApp, Telegram, Threads, Twitter, dan Instagram diisi dari UI dashboard.
- Token disimpan terenkripsi di SQLite lokal dan dibaca backend saat adapter dipakai.
- Field kosong di form token tidak menimpa data yang sudah tersimpan.

4. Start API server (development)
   - Jalankan:
     npm run dev:api
   - The API will be available at: http://127.0.0.1:3456/v1/

5. Start Dashboard (Next.js)
   - Change directory and install deps:
     cd dashboard && npm install
   - Set API base for dashboard (example):
     $env:NEXT_PUBLIC_API_BASE=http://127.0.0.1:3456
   - Run dev server:
     npm run dev
   - Open UI at: http://localhost:3000

## Quick API examples

- Create account (store encrypted credentials/session cookies):
  curl -X POST http://127.0.0.1:3456/v1/accounts -H "Content-Type: application/json" -d '{"platform":"telegram","username":"acc1","credentials":"{\"cookie\":\"...\"}"}'

- Create template:
  curl -X POST http://127.0.0.1:3456/v1/templates -H "Content-Type: application/json" -d '{"name":"Promo","content":"Halo {name}, cek {link}","variables":["name","link"],"type":"template"}'

- Trigger job:
  curl -X POST http://127.0.0.1:3456/v1/jobs/trigger -H "Content-Type: application/json" -d '{"template_id":"tpl_x","account_id":"acc_x","platform":"telegram","message":"Hi"}'

## Cookies / session-state

- The platform supports storing browser session state (cookies / Playwright storageState) in the account credentials field. When creating an account you may pass a JSON string containing session data in the `credentials` field; the server encrypts it into the `credentials_encrypted` column.
- Adapters that use browser automation should decrypt and load this storageState to preserve logins.

## Troubleshooting

- If npm install fails on Windows with errors about building native modules, install Visual Studio Build Tools (Desktop C++ workload) or use WSL/Linux/macOS.
- If migrations do not apply, ensure migrations/ exists and is readable by the user running npm run db:init.

## Support

If you want, I can switch the project to a sql.js (WASM) fallback so the full stack can run without native build tools — say "Please switch to sql.js" and I'll make the change and run the app here to verify.

---

## Adapter Reference

### 1. WhatsApp via WAHA (self-hosted HTTP API)

**Recommended over Cloud API for personal/business numbers.**

Set environment variables:

```
WAHA_BASE_URL=http://localhost:3001   # WAHA server base URL
WAHA_API_KEY=your-waha-api-key        # Optional, set in WAHA config
WAHA_SESSION=default                  # Session name in WAHA
```

Or store per-account in the dashboard under **Settings → Runtime Settings**.

The `WhatsAppAdapter` in `cloud-api` mode automatically picks up `WAHA_BASE_URL`.
If `WAHA_BASE_URL` is not set, it falls back to the legacy `WHATSAPP_CLOUD_API_TOKEN`.

---

### 2. Telegram MTProto — User Account (gramjs)

Use this when you need to send messages **as a regular Telegram user** (not a bot).

**Credentials required:**
| Field | Source |
|---|---|
| `apiId` | https://my.telegram.org → App configuration |
| `apiHash` | https://my.telegram.org → App configuration |
| `sessionString` | Generate once with a one-time login script (see below) |

**One-time session generation (run locally, never commit the output):**

```ts
import { TelegramClient, sessions } from 'telegram'
const client = new TelegramClient(new sessions.StringSession(''), apiId, apiHash, {})
await client.start({ phoneNumber: async () => '+62xxx' /* ... */ })
console.log(client.session.save()) // copy this string → TELEGRAM_SESSION
```

**Add account via API:**

```bash
curl -X POST http://localhost:3456/v1/accounts \
  -H "Content-Type: application/json" \
  -d '{"platform":"telegram-mtproto","username":"myuser","credentials":"{\"apiId\":12345,\"apiHash\":\"hash\",\"sessionString\":\"session\"}"}'
```

The `credentials` field is encrypted (AES-256-GCM) before storage.

---

### 3. Cookie-Based Adapters (Instagram, Twitter/X, Threads)

Use these for personal accounts that don't have Graph API/Bot API access.

**How to get cookies:**

1. Log in to the platform in your browser.
2. Open DevTools → Application → Cookies — copy all cookies for the domain.
3. Paste as a JSON array `[{"name":"k","value":"v"},...]` or plain `key=val; key2=val2` string.

**Add account via API (example for Instagram):**

```bash
curl -X POST http://localhost:3456/v1/accounts \
  -H "Content-Type: application/json" \
  -d '{"platform":"instagram-cookie","username":"myig","credentials":"[{\"name\":\"sessionid\",\"value\":\"abc\"},{\"name\":\"csrftoken\",\"value\":\"tok\"}]"}'
```

Replace `instagram-cookie` with `twitter-cookie` or `threads-cookie` as needed.

**Supported methods per cookie adapter:**

| Method                           | Instagram | Twitter/X | Threads |
| -------------------------------- | --------- | --------- | ------- |
| `sendMessage` (new post/tweet)   | ✅        | ✅        | ✅      |
| `replyToMessage` (comment/reply) | ✅        | ✅        | ✅      |
| `getRateLimitStatus`             | ✅        | ✅        | ✅      |

> **Note:** Cookie-based adapters call internal platform endpoints. These are not official APIs.
> Ensure you comply with each platform's Terms of Service.
