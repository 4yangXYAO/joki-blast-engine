<<<<<<< HEAD
# jockey-blast-engine

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
2.Run: 
npm run validate:config
3. If validation passes, you should see: Config validation: PASSED.

JWT_SECRET must be kept secret and not committed. Replace the placeholder in your local environment.

Planned notes: This section can be extended with per-variable descriptions and defaults.

## Getting started (development)

1. Requirements

- Node.js 18+ and npm
- For native SQLite backend: Visual Studio Build Tools (Desktop C++ workload) on Windows
- For dashboards: no additional tools needed other than Node.js and npm
- Optional, if you want a fallback without a native build: sql.js is already set up in the project

2. Create environment files 
- Copy .env.example to .env and fill required values.

Minimum env values ​​for local dev (example):

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
- If you want to run the dashboard too: 
cd dashboard && npm install

Notes: npm install may try to build native modules (better-sqlite3). On Windows this requires Visual Studio build tools. If install fails, either install the build tools or request a sql.js fallback.

## What you need before running

- Node.js 18+ and npm
- Root dependencies with `npm install`
- Dashboard dependencies with `cd dashboard && npm install`
- A `.env` file containing all required variables
- On Windows, Visual Studio Build Tools if using `better-sqlite3`
- If you don't want a native build, run the `sql.js` fallback mode

## Recommended local run order

1. Copy `.env.example` to `.env`
2. Install the root dependency with `npm install`
3. Run `npm run db:init`
4. Install the dashboard dependency with `cd dashboard && npm install`
5. Run the backend with `npm run dev:api`
6. Run the dashboard with `cd dashboard && npm run dev`
7. Go to `http://localhost:3001` and enter the token on the page dashboard

## UI token flow

- The backend can be started without a platform token.
- WhatsApp, Telegram, Threads, Twitter, and Instagram tokens are populated from the dashboard UI.
- Tokens are stored encrypted in local SQLite and read by the backend when the adapter is used.
- Empty fields in the token form do not overwrite already stored data.

4. Start API server (development) 
- Run: 
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

- Create templates: 
curl -X POST http://127.0.0.1:3456/v1/templates -H "Content-Type: application/json" -d '{"name":"Promo","content":"Hello {name}, check {link}","variables":["name","link"],"type":"template"}'

- Trigger jobs: 
curl -X POST http://127.0.0.1:3456/v1/jobs/trigger -H "Content-Type: application/json" -d '{"template_id":"tpl_x","account_id":"acc_x","platform":"telegram","message":"Hi"}'

## Cookies / session-state

- The platform supports storing browser session state (cookies / Playwright storageState) in the account credentials field. When creating an account you may pass a JSON string containing session data in the `credentials` field; the server encrypts it into the `credentials_encrypted` column.
- Adapters that use browser automation should decrypt and load this storageState to preserve logins.

## Troubleshooting

- If npm install fails on Windows with errors about building native modules, install Visual Studio Build Tools (Desktop C++ workload) or use WSL/Linux/macOS.
- If migrations do not apply, ensure migrations/ exists and is readable by the user running npm run db:ini
