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
1) Copy .env.example to .env (or provide your own environment in your shell).
2) Run:
   npm run validate:config
3) If validation passes, you should see: Config validation: PASSED.

JWT_SECRET must be kept secret and not committed. Replace the placeholder in your local environment.

Planned notes: This section can be extended with per-variable descriptions and defaults.
