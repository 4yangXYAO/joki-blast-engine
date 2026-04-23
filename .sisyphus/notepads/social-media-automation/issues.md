## [2026-04-22 18:50] Initial Issues
- `npm install better-sqlite3` failed initially due to missing Visual Studio Build Tools.
- Current status: Proceeding with foundation waves.
- Environment config scaffolding added: .env.example, secrets.ts, and validate:config workflow.
- [Bug] WhatsApp adapter paths fail in non-web environments unless tests mock cloud API token.
- [Note] Ensure secrets are supplied via environment in CI to avoid runtime errors.
