-- 005_create_link_clicks.sql
BEGIN;

CREATE TABLE IF NOT EXISTS link_clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL,
  campaign_id TEXT,
  platform TEXT,
  clicked_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_link_clicks_token ON link_clicks(token);
CREATE INDEX IF NOT EXISTS idx_link_clicks_campaign ON link_clicks(campaign_id);

COMMIT;
