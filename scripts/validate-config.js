#!/usr/bin/env node
// Lightweight config validation script used by `npm run validate:config`.
// It loads environment variables from .env.example (via inline parser),
// then requires the TypeScript secrets module with ts-node/register.

const fs = require('fs');
const path = require('path');

function parseEnvLike(content) {
  const env = {};
  for (const line of content.split('\n')) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const idx = s.indexOf('=');
    if (idx <= 0) continue;
    const key = s.substring(0, idx).trim();
    const value = s.substring(idx + 1).trim().replace(/^"|"$/g, '');
    env[key] = value;
  }
  return env;
}

try {
  // Load .env.example values into process.env for validation context
  const envExamplePath = path.resolve(__dirname, '..', '.env.example');
  if (fs.existsSync(envExamplePath)) {
    const raw = fs.readFileSync(envExamplePath, 'utf8');
    const parsed = parseEnvLike(raw);
    Object.assign(process.env, parsed);
  }

  // Enable TS support at runtime for the secrets.ts module
  require('ts-node/register');
  const secrets = require('../src/config/secrets.ts');
  // Run the validator – will throw if required vars are missing
  secrets.loadConfig();
  console.log('Config validation: PASSED');
  process.exit(0);
} catch (err) {
  console.error('Config validation: FAILED');
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
}
