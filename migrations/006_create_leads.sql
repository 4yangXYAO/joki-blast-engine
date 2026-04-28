-- 006_create_leads.sql
BEGIN;

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  inbound_platform TEXT NOT NULL,
  contact TEXT NOT NULL,
  campaign_id TEXT,
  welcome_sent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_platform_contact ON leads(inbound_platform, contact);

COMMIT;
