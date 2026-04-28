import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { initDatabase, runMigrations } from '../db/sqlite'
import JobQueue from '../queue/job-queue'
import { createCampaignsRouter } from './campaigns'
import { accountsRouter } from './accounts'
import { trackRouter } from './track'
import { webhooksRouter } from './webhooks'
import cors from 'cors'

describe('Campaign Integration Flow', () => {
  let server: express.Application
  let queue: JobQueue

  beforeEach(async () => {
    // Setup database
    initDatabase(':memory:')
    runMigrations('./migrations')

    // Create app and setup routes
    server = express()
    server.use(cors())
    server.use(express.json())

    queue = new JobQueue()
    server.use('/v1/campaigns', createCampaignsRouter(queue))
    server.use('/v1/accounts', accountsRouter)
    server.use('/v1/track', trackRouter)
    server.use('/v1/webhooks', webhooksRouter)
  })

  afterEach(() => {
    // Cleanup
  })

  it('should complete full blast funnel: create campaign → blast → verify posts', async () => {
    // 1. Create account for Twitter
    const createAccountRes = await request(server)
      .post('/v1/accounts')
      .send({
        platform: 'twitter',
        username: 'test_user',
        credentials: JSON.stringify({ apiKey: 'test_key', apiSecret: 'test_secret' }),
      })
    expect(createAccountRes.status).toBe(201)
    const accountId = createAccountRes.body.id

    // 2. Create campaign
    const createCampaignRes = await request(server)
      .post('/v1/campaigns')
      .send({
        name: 'Test Blast Campaign',
        content: 'Check out our offer!',
        cta_link: 'https://wa.me/62812345678',
        platforms: ['twitter', 'instagram'],
      })
    expect(createCampaignRes.status).toBe(201)
    expect(createCampaignRes.body.id).toBeDefined()
    expect(createCampaignRes.body.name).toBe('Test Blast Campaign')
    expect(createCampaignRes.body.status).toBe('draft')
    const campaignId = createCampaignRes.body.id

    // 3. Get campaign details
    const getRes = await request(server).get(`/v1/campaigns/${campaignId}`)
    expect(getRes.status).toBe(200)
    expect(getRes.body.posts).toEqual([]) // No posts initially

    // 4. Blast campaign
    const blastRes = await request(server)
      .post(`/v1/campaigns/${campaignId}/blast`)
      .send({
        account_ids: {
          twitter: accountId,
          instagram: accountId,
        },
      })
    expect(blastRes.status).toBe(202) // Accepted for async operation
    expect(blastRes.body.campaign_id).toBe(campaignId)
    expect(blastRes.body.posts).toBeDefined()
    expect(blastRes.body.posts.length).toBeGreaterThanOrEqual(2) // At least 2 platforms

    // 5. Verify posts created
    const postsRes = await request(server).get(`/v1/campaigns/${campaignId}`)
    expect(postsRes.status).toBe(200)
    const posts = postsRes.body.posts || []
    expect(posts.length).toBeGreaterThanOrEqual(2)

    // 6. Verify each post has platform and status
    for (const post of posts) {
      expect(post.platform).toBeDefined()
      expect(['twitter', 'instagram']).toContain(post.platform)
      expect(post.status).toBe('pending')
    }
  })

  it('should track clicks on campaign links', async () => {
    // 1. Create campaign
    const createRes = await request(server)
      .post('/v1/campaigns')
      .send({
        name: 'Click Track Campaign',
        content: 'Click here!',
        cta_link: 'https://example.com',
        platforms: ['twitter'],
      })
    expect(createRes.status).toBe(201)
    const campaignId = createRes.body.id

    // 2. Check stats (should show 0 clicks for new campaign)
    const statsRes = await request(server).get(`/v1/track/stats/${campaignId}`)
    expect(statsRes.status).toBe(200)
    expect(statsRes.body.campaign_id).toBe(campaignId)
    expect(statsRes.body.clicks).toBeDefined()
    expect(Array.isArray(statsRes.body.clicks)).toBe(true)
  })

  it('should list campaigns with their posts', async () => {
    // 1. Create two campaigns
    const campaign1 = await request(server)
      .post('/v1/campaigns')
      .send({
        name: 'Campaign 1',
        content: 'Content 1',
        cta_link: 'https://link1.com',
        platforms: ['twitter'],
      })
    const campaign2 = await request(server)
      .post('/v1/campaigns')
      .send({
        name: 'Campaign 2',
        content: 'Content 2',
        cta_link: 'https://link2.com',
        platforms: ['instagram', 'facebook'],
      })

    // 2. List all campaigns
    const listRes = await request(server).get('/v1/campaigns')
    expect(listRes.status).toBe(200)
    expect(Array.isArray(listRes.body)).toBe(true)
    expect(listRes.body.length).toBeGreaterThanOrEqual(2)

    // 3. Verify campaign structure
    const campaigns = listRes.body
    for (const campaign of campaigns) {
      expect(campaign.id).toBeDefined()
      expect(campaign.name).toBeDefined()
      expect(campaign.status).toBeDefined()
    }
  })

  it('should handle campaign deletion', async () => {
    // 1. Create campaign
    const createRes = await request(server)
      .post('/v1/campaigns')
      .send({
        name: 'Campaign to Delete',
        content: 'Delete me',
        cta_link: 'https://delete.com',
        platforms: ['twitter'],
      })
    const campaignId = createRes.body.id

    // 2. Delete campaign
    const deleteRes = await request(server).delete(`/v1/campaigns/${campaignId}`)
    expect(deleteRes.status).toBe(200)

    // 3. Verify campaign is deleted
    const getRes = await request(server).get(`/v1/campaigns/${campaignId}`)
    expect(getRes.status).toBe(404)
  })
})
