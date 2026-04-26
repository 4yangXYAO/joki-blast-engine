import { DB, getDb } from "../db/sqlite";
import { decryptRuntimeSecret, encryptRuntimeSecret } from "../config/runtime-secret-store";

export const INTEGRATION_SETTING_KEYS = [
  "WHATSAPP_CLOUD_API_TOKEN",
  "TELEGRAM_BOT_TOKEN",
  "THREADS_ACCESS_TOKEN",
  "TWITTER_BEARER_TOKEN",
  "TWITTER_API_KEY",
  "TWITTER_API_SECRET",
  "INSTAGRAM_ACCESS_TOKEN",
  "INSTAGRAM_BUSINESS_ACCOUNT_ID",
  "INSTAGRAM_ALLOW_PRIVATE_API",
  "WHATSAPP_WEBJS_API_KEY",
] as const;

export type IntegrationSettingKey = (typeof INTEGRATION_SETTING_KEYS)[number];
export type IntegrationSettingsInput = Partial<Record<IntegrationSettingKey, string>>;
export type IntegrationSettingsStatus = Record<IntegrationSettingKey, boolean>;

export class RuntimeSettingsRepo {
  db?: DB;

  constructor(db?: DB) {
    this.db = db;
  }

  private getDatabase(): DB {
    return this.db ?? getDb();
  }

  private getRow(key: IntegrationSettingKey): { value_encrypted: string } | null {
    const db = this.getDatabase();
    const row = db
      .prepare("SELECT value_encrypted FROM runtime_settings WHERE key = ? LIMIT 1")
      .get(key);
    return row ?? null;
  }

  getValue(key: IntegrationSettingKey): string | undefined {
    const row = this.getRow(key);
    if (!row?.value_encrypted) return undefined;
    try {
      return decryptRuntimeSecret(row.value_encrypted);
    } catch {
      return undefined;
    }
  }

  getStatuses(): IntegrationSettingsStatus {
    const statuses = {} as IntegrationSettingsStatus;
    for (const key of INTEGRATION_SETTING_KEYS) {
      statuses[key] = !!this.getValue(key);
    }
    return statuses;
  }

  upsertMany(input: IntegrationSettingsInput): IntegrationSettingsStatus {
    const db = this.getDatabase();
    for (const key of INTEGRATION_SETTING_KEYS) {
      const value = input[key];
      if (value === undefined) continue;
      if (value === "") {
        db.prepare("DELETE FROM runtime_settings WHERE key = ?").run(key);
        continue;
      }

      const encryptedValue = encryptRuntimeSecret(value);
      db.prepare(
        `INSERT INTO runtime_settings (key, value_encrypted, created_at, updated_at)
         VALUES (?, ?, datetime('now'), datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value_encrypted = excluded.value_encrypted, updated_at = datetime('now')`
      ).run(key, encryptedValue);
    }

    return this.getStatuses();
  }
}
