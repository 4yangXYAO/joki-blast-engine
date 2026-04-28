import { DB, getDb } from '../db/sqlite'
import { randomUUID } from 'crypto'

export type Lead = {
  id: string
  inbound_platform: string  // 'whatsapp' | 'telegram'
  contact: string           // phone number / chat id
  campaign_id?: string
  welcome_sent: number      // 0 | 1
  status: string            // new | awaiting_handoff | handed_off
  created_at?: string
  updated_at?: string
}

export class LeadsRepo {
  db?: DB

  constructor(db?: DB) {
    this.db = db
  }

  private getDatabase(): DB {
    return this.db ?? getDb()
  }

  /**
   * Returns existing lead or creates a new one.
   * Idempotent — unique on (inbound_platform, contact).
   */
  findOrCreate(platform: string, contact: string, campaignId?: string): Lead {
    const db = this.getDatabase()
    const existing: any = db
      .prepare(`SELECT * FROM leads WHERE inbound_platform = ? AND contact = ? LIMIT 1`)
      .get(platform, contact)
    if (existing) return existing

    const id = randomUUID()
    db.prepare(
      `INSERT INTO leads (id, inbound_platform, contact, campaign_id, welcome_sent, status) VALUES (?, ?, ?, ?, 0, 'new')`
    ).run(id, platform, contact, campaignId ?? null)
    return { id, inbound_platform: platform, contact, campaign_id: campaignId, welcome_sent: 0, status: 'new', created_at: new Date().toISOString() }
  }

  markWelcomeSent(id: string): void {
    const db = this.getDatabase()
    db.prepare(
      `UPDATE leads SET welcome_sent = 1, updated_at = datetime('now') WHERE id = ?`
    ).run(id)
  }

  markHandedOff(id: string): void {
    const db = this.getDatabase()
    db.prepare(
      `UPDATE leads SET status = 'handed_off', updated_at = datetime('now') WHERE id = ?`
    ).run(id)
  }

  markAwaitingHandoff(id: string): void {
    const db = this.getDatabase()
    db.prepare(
      `UPDATE leads SET status = 'awaiting_handoff', updated_at = datetime('now') WHERE id = ?`
    ).run(id)
  }

  list(limit = 100): Lead[] {
    const db = this.getDatabase()
    return db
      .prepare(`SELECT * FROM leads ORDER BY created_at DESC LIMIT ?`)
      .all(limit)
  }

  findById(id: string): Lead | null {
    const db = this.getDatabase()
    return (db.prepare(`SELECT * FROM leads WHERE id = ? LIMIT 1`).get(id) as Lead) ?? null
  }
}
