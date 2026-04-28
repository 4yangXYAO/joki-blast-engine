import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { initDatabase, runMigrations, getDb } from '../db/sqlite'
import { createServer } from '../api/server'

describe('Smoke Test: Server & Basic Endpoints', () => {
  let server: express.Application

  beforeEach(async () => {
    initDatabase(':memory:')
    runMigrations('./migrations')
    server = createServer()
  })

  it('should start without errors', () => {
    expect(server).toBeDefined()
  })

  it('GET /v1/health should return ok', async () => {
    const response = await request(server).get('/v1/health')
    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
  })

  it('should have database connection', () => {
    const db = getDb()
    expect(db).toBeDefined()
  })

  it('should have all migrations applied', () => {
    const db = getDb()
    const migrations = db
      .prepare(
        `
      SELECT name FROM schema_migrations ORDER BY name
    `
      )
      .all() as any[]
    expect(migrations.length).toBeGreaterThanOrEqual(4)
    expect(migrations.map((m: any) => m.name)).toContain('001_create_core_tables.sql')
  })

  it('should load without crashing', async () => {
    // If we got here, server loaded successfully
    expect(server).toBeTruthy()
  })
})
