import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { initDatabase, runMigrations } from '../db/sqlite'
import JobQueue from '../queue/job-queue'
import { createCampaignsRouter } from './campaigns'
import { accountsRouter } from './accounts'
import { trackRouter } from './track'
import { webhooksRouter } from './webhooks'
import cors from 'cors'

describe('Functional Tests: Individual Features', () => {
  let server: express.Application
  let queue: JobQueue

  beforeEach(async () => {
    initDatabase(':memory:')
    runMigrations('./migrations')
    server = express()
    server.use(cors())
    server.use(express.json())

    queue = new JobQueue()
    server.use('/v1/campaigns', createCampaignsRouter(queue))
    server.use('/v1/accounts', accountsRouter)
    server.use('/v1/track', trackRouter)
    server.use('/v1/webhooks', webhooksRouter)
  })

  describe('Campaign CRUD', () => {
    it('should create campaign with valid data', async () => {
      const res = await request(server)
        .post('/v1/campaigns')
        .send({
          name: 'Test',
          content: 'Test content',
          cta_link: 'https://example.com',
          platforms: ['twitter'],
        })
      expect(res.status).toBe(201)
      expect(res.body.id).toBeDefined()
    })

    it('should reject campaign without name', async () => {
      const res = await request(server)
        .post('/v1/campaigns')
        .send({
          content: 'Test',
          cta_link: 'https://example.com',
          platforms: ['twitter'],
        })
      expect(res.status).toBe(400)
    })

    it('should reject campaign with empty platforms', async () => {
      const res = await request(server).post('/v1/campaigns').send({
        name: 'Test',
        content: 'Test',
        cta_link: 'https://example.com',
        platforms: [],
      })
      expect(res.status).toBe(400)
    })

    it('should list campaigns', async () => {
      await request(server)
        .post('/v1/campaigns')
        .send({
          name: 'C1',
          content: 'C1',
          cta_link: 'https://c1.com',
          platforms: ['twitter'],
        })
      const res = await request(server).get('/v1/campaigns')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThanOrEqual(1)
    })

    it('should get campaign by id', async () => {
      const create = await request(server)
        .post('/v1/campaigns')
        .send({
          name: 'Test',
          content: 'Test',
          cta_link: 'https://test.com',
          platforms: ['twitter'],
        })
      const id = create.body.id
      const res = await request(server).get(`/v1/campaigns/${id}`)
      expect(res.status).toBe(200)
      expect(res.body.name).toBe('Test')
    })

    it('should return 404 for unknown campaign', async () => {
      const res = await request(server).get('/v1/campaigns/unknown-id')
      expect(res.status).toBe(404)
    })
  })

  describe('Account Management', () => {
    it('should create account', async () => {
      const res = await request(server)
        .post('/v1/accounts')
        .send({
          platform: 'twitter',
          username: 'testuser',
          credentials: JSON.stringify({ key: 'value' }),
        })
      expect(res.status).toBe(201)
      expect(res.body.id).toBeDefined()
    })

    it('should list accounts', async () => {
      const res = await request(server).get('/v1/accounts')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('should delete account', async () => {
      const create = await request(server)
        .post('/v1/accounts')
        .send({
          platform: 'twitter',
          username: 'testuser',
          credentials: JSON.stringify({ key: 'value' }),
        })
      const id = create.body.id
      const del = await request(server).delete(`/v1/accounts/${id}`)
      expect(del.status).toBe(200)
      const check = await request(server).get(`/v1/accounts/${id}`)
      expect(check.status).toBe(404)
    })
  })

  describe('Tracking', () => {
    it('should return 404 for invalid tracking token', async () => {
      const res = await request(server).get('/v1/track/invalid-token')
      expect(res.status).toBe(404)
    })

    it('should return stats for campaign', async () => {
      const create = await request(server)
        .post('/v1/campaigns')
        .send({
          name: 'Track Test',
          content: 'Track Test',
          cta_link: 'https://track.com',
          platforms: ['twitter'],
        })
      const id = create.body.id
      const res = await request(server).get(`/v1/track/stats/${id}`)
      expect(res.status).toBe(200)
      expect(res.body.campaign_id).toBe(id)
      expect(Array.isArray(res.body.clicks)).toBe(true)
    })
  })

  describe('Webhooks', () => {
    it('should return leads list', async () => {
      const res = await request(server).get('/v1/webhooks/leads')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('should handle WhatsApp inbound (POST)', async () => {
      const res = await request(server)
        .post('/v1/webhooks/waha')
        .send({
          event: 'message',
          data: { chatId: '123@c.us', from: '123', body: 'Hello' },
        })
      // Should return 200 or 201
      expect([200, 201, 400]).toContain(res.status)
    })

    it('should handle Telegram inbound (POST)', async () => {
      const res = await request(server)
        .post('/v1/webhooks/telegram')
        .send({
          message: { chat: { id: 123 }, from: { id: 456 }, text: 'Hello' },
        })
      // Should return 200 or 201
      expect([200, 201, 400]).toContain(res.status)
    })
  })

  describe('Campaign Blast', () => {
    it('should enqueue jobs when blasting', async () => {
      const account = await request(server)
        .post('/v1/accounts')
        .send({
          platform: 'twitter',
          username: 'testuser',
          credentials: JSON.stringify({ key: 'value' }),
        })
      const campaign = await request(server)
        .post('/v1/campaigns')
        .send({
          name: 'Blast Test',
          content: 'Blast content',
          cta_link: 'https://blast.com',
          platforms: ['twitter', 'instagram'],
        })
      const res = await request(server)
        .post(`/v1/campaigns/${campaign.body.id}/blast`)
        .send({
          account_ids: {
            twitter: account.body.id,
            instagram: account.body.id,
          },
        })
      expect(res.status).toBe(202)
      expect(res.body.posts.length).toBeGreaterThanOrEqual(1)
    })
  })
})
