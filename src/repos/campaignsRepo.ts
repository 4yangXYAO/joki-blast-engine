import { DB, getDb } from '../db/sqlite'
import { randomUUID } from 'crypto'

export type Campaign = {
  id: string
  name: string
  content: string
  cta_link?: string
  platforms: string[] // parsed from JSON
  status: string // draft | scheduled | completed
  created_at?: string
}

export type CampaignPost = {
  id: string
  campaign_id: string
  platform: string
  job_id?: string
  status: string // pending | sent | failed
  created_at?: string
}

export class CampaignsRepo {
  db?: DB

  constructor(db?: DB) {
    this.db = db
  }

  private getDatabase(): DB {
    return this.db ?? getDb()
  }

  create(input: {
    name: string
    content: string
    cta_link?: string
    platforms: string[]
  }): Campaign {
    const id = randomUUID()
    const platforms = JSON.stringify(input.platforms)
    const db = this.getDatabase()
    db.prepare(
      `INSERT INTO campaigns (id, name, content, cta_link, platforms, status) VALUES (?, ?, ?, ?, ?, 'draft')`
    ).run(id, input.name, input.content, input.cta_link ?? null, platforms)
    return { id, ...input, status: 'draft', created_at: new Date().toISOString() }
  }

  findById(id: string): Campaign | null {
    const db = this.getDatabase()
    const row: any = db.prepare(`SELECT * FROM campaigns WHERE id = ? LIMIT 1`).get(id)
    if (!row) return null
    return { ...row, platforms: this.parsePlatforms(row.platforms) }
  }

  list(): Campaign[] {
    const db = this.getDatabase()
    const rows: any[] = db.prepare(`SELECT * FROM campaigns ORDER BY created_at DESC`).all()
    return rows.map((r) => ({ ...r, platforms: this.parsePlatforms(r.platforms) }))
  }

  updateStatus(id: string, status: string): void {
    const db = this.getDatabase()
    db.prepare(`UPDATE campaigns SET status = ? WHERE id = ?`).run(status, id)
  }

  delete(id: string): boolean {
    const db = this.getDatabase()
    const res = db.prepare(`DELETE FROM campaigns WHERE id = ?`).run(id)
    return res.changes > 0
  }

  addPost(campaignId: string, platform: string, jobId?: string): CampaignPost {
    const id = randomUUID()
    const db = this.getDatabase()
    db.prepare(
      `INSERT INTO campaign_posts (id, campaign_id, platform, job_id, status) VALUES (?, ?, ?, ?, 'pending')`
    ).run(id, campaignId, platform, jobId ?? null)
    return {
      id,
      campaign_id: campaignId,
      platform,
      job_id: jobId,
      status: 'pending',
      created_at: new Date().toISOString(),
    }
  }

  listPosts(campaignId: string): CampaignPost[] {
    const db = this.getDatabase()
    return db
      .prepare(`SELECT * FROM campaign_posts WHERE campaign_id = ? ORDER BY created_at ASC`)
      .all(campaignId)
  }

  markPostStatus(postId: string, status: string): void {
    const db = this.getDatabase()
    db.prepare(`UPDATE campaign_posts SET status = ? WHERE id = ?`).run(status, postId)
  }

  markPostStatusByJobId(jobId: string, status: string): CampaignPost | null {
    const db = this.getDatabase()
    const row: any = db.prepare(`SELECT * FROM campaign_posts WHERE job_id = ? LIMIT 1`).get(jobId)
    if (!row) return null
    db.prepare(`UPDATE campaign_posts SET status = ? WHERE job_id = ?`).run(status, jobId)
    return { ...row, status }
  }

  hasPendingPosts(campaignId: string): boolean {
    const db = this.getDatabase()
    const row: any = db
      .prepare(
        `SELECT COUNT(1) AS count FROM campaign_posts WHERE campaign_id = ? AND status = 'pending'`
      )
      .get(campaignId)
    return Number(row?.count ?? 0) > 0
  }

  private parsePlatforms(raw: string): string[] {
    try {
      return JSON.parse(raw) as string[]
    } catch {
      return []
    }
  }
}
