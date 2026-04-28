import { DB, getDb } from '../db/sqlite'
import { randomUUID } from 'crypto'

export type Template = {
  id: string
  name: string
  content: string
  variables?: string[]
  type: string
  created_at?: string
  updated_at?: string
}

export class TemplatesRepo {
  db?: DB

  constructor(db?: DB) {
    // Lazy resolve DB to avoid forcing initialization during module import
    this.db = db
  }

  create(input: { name: string; content: string; variables?: string[]; type: string }): Template {
    const id = randomUUID()
    const vars = input.variables ? JSON.stringify(input.variables) : JSON.stringify([])
    const db = this.db ?? getDb()
    const isSqlJs = !!(db && (db as any).__isSqlJs)
    if (db.prepare && !isSqlJs) {
      db.prepare(
        `INSERT INTO templates (id, name, content, variables, type) VALUES (?, ?, ?, ?, ?)`
      ).run(id, input.name, input.content, vars, input.type)
    } else {
      // sql.js path or no prepare available
      const safeName = String(input.name).replace(/'/g, "''")
      const safeContent = String(input.content).replace(/'/g, "''")
      const safeVars = String(vars).replace(/'/g, "''")
      const safeType = String(input.type).replace(/'/g, "''")
      db.exec(
        `INSERT INTO templates (id, name, content, variables, type, created_at) VALUES ('${id}', '${safeName}', '${safeContent}', '${safeVars}', '${safeType}', datetime('now'))`
      )
    }
    return {
      id,
      ...input,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  list(): Template[] {
    const db = this.db ?? getDb()
    const rows = db
      .prepare(
        'SELECT id, name, content, variables, created_at, type FROM templates ORDER BY created_at DESC'
      )
      .all()
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      content: r.content,
      variables: r.variables ? JSON.parse(r.variables) : [],
      type: r.type,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }))
  }

  findById(id: string): Template | null {
    const db = this.db ?? getDb()
    const r = db
      .prepare(
        'SELECT id, name, content, variables, created_at, type FROM templates WHERE id = ? LIMIT 1'
      )
      .get(id)
    if (!r) return null
    return {
      id: r.id,
      name: r.name,
      content: r.content,
      variables: r.variables ? JSON.parse(r.variables) : [],
      type: r.type,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }
  }

  delete(id: string): boolean {
    const db = this.db ?? getDb()
    const res = db.prepare('DELETE FROM templates WHERE id = ?').run(id)
    return res.changes > 0
  }
}
