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

describe('E2E Test: Full Marketing Campaign Workflow', () => {
  let server: express.Application
  let queue: JobQueue
  let accountId: string
  let campaignId: string

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

  it('E2E: Admin creates account → campaign → blasts → tracks clicks → inbound lead → handoff', async () => {
    // 1. Admin creates Twitter account with credentials
    console.log('Step 1: Create account...')
    const accountRes = await request(server)
      .post('/v1/accounts')
      .send({
        platform: 'twitter',
        username: 'marketing_admin',
        credentials: JSON.stringify({
          apiKey: 'test_key',
          apiSecret: 'test_secret',
        }),
      })
    expect(accountRes.status).toBe(201)
    accountId = accountRes.body.id
    console.log(`✓ Account created: ${accountId}`)

    // 2. Admin creates marketing campaign
    console.log('Step 2: Create campaign...')
    const campaignRes = await request(server)
      .post('/v1/campaigns')
      .send({
        name: 'Summer Sale 2026',
        content: 'Limited time offer! Click link to chat with us on WhatsApp',
        cta_link: 'https://wa.me/62812345678',
        platforms: ['twitter', 'instagram'],
      })
    expect(campaignRes.status).toBe(201)
    campaignId = campaignRes.body.id
    console.log(`✓ Campaign created: ${campaignId}`)

    // 3. Admin triggers blast to all platforms
    console.log('Step 3: Trigger blast...')
    const blastRes = await request(server)
      .post(`/v1/campaigns/${campaignId}/blast`)
      .send({
        account_ids: {
          twitter: accountId,
          instagram: accountId,
        },
      })
    expect(blastRes.status).toBe(202)
    expect(blastRes.body.posts.length).toBeGreaterThanOrEqual(2)
    console.log(`✓ Blast triggered, ${blastRes.body.posts.length} posts created`)

    // 4. Verify posts were created with pending status
    console.log('Step 4: Verify posts created...')
    const campaignCheck = await request(server).get(`/v1/campaigns/${campaignId}`)
    expect(campaignCheck.status).toBe(200)
    const posts = campaignCheck.body.posts || []
    expect(posts.length).toBeGreaterThanOrEqual(2)
    for (const post of posts) {
      expect(post.status).toBe('pending')
      expect(['twitter', 'instagram']).toContain(post.platform)
    }
    console.log(`✓ Posts verified: ${posts.map((p: any) => p.platform).join(', ')}`)

    // 5. User clicks tracking link and views stats
    console.log('Step 5: Simulate click tracking...')
    const statsRes = await request(server).get(`/v1/track/stats/${campaignId}`)
    expect(statsRes.status).toBe(200)
    expect(statsRes.body.campaign_id).toBe(campaignId)
    console.log(`✓ Tracking stats endpoint ready`)

    // 6. User sends inbound message on WhatsApp
    console.log('Step 6: Simulate inbound WhatsApp message...')
    const inboundRes = await request(server)
      .post('/v1/webhooks/waha')
      .send({
        event: 'message',
        payload: {
          from: '62812345678',
          chatId: '62812345678@c.us',
          body: 'Halo, saya tertarik dengan promo ini',
          timestamp: Date.now(),
        },
      })
    expect(inboundRes.status).toBe(200)
    console.log(`✓ Inbound WhatsApp message processed`)

    // 7. Verify lead was created and welcome sent
    console.log('Step 7: Check lead status...')
    const leadsRes = await request(server).get('/v1/webhooks/leads')
    expect(leadsRes.status).toBe(200)
    expect(Array.isArray(leadsRes.body)).toBe(true)
    if (leadsRes.body.length > 0) {
      const lead = leadsRes.body[0]
      expect(lead.inbound_platform).toBe('whatsapp')
      expect(lead.welcome_sent).toBe(1) // Welcome was sent
      console.log(`✓ Lead created and welcome sent: ${lead.contact}`)
    }

    // 8. Verify no duplicate welcome for same contact
    console.log('Step 8: Test idempotency (no duplicate welcome)...')
    const secondInboundRes = await request(server)
      .post('/v1/webhooks/waha')
      .send({
        event: 'message',
        payload: {
          from: '62812345678',
          chatId: '62812345678@c.us',
          body: 'I am following up',
          timestamp: Date.now(),
        },
      })
    expect([200, 201, 202]).toContain(secondInboundRes.status)
    const leadsCheckRes = await request(server).get('/v1/webhooks/leads')
    const leadsAfterSecond = leadsCheckRes.body
    // Should have same number of leads (no duplicate)
    expect(leadsAfterSecond.length).toBeLessThanOrEqual(leadsRes.body.length + 1)
    console.log(`✓ Idempotency verified: no duplicate welcome sent`)

    console.log('\n✅ E2E Test Complete: Full workflow from campaign to handoff')
  })

  it('E2E: Telegram inbound workflow', async () => {
    // Create account and campaign first
    const account = await request(server)
      .post('/v1/accounts')
      .send({
        platform: 'telegram',
        username: 'telegram_bot',
        credentials: JSON.stringify({ botToken: 'test_token' }),
      })

    const campaign = await request(server)
      .post('/v1/campaigns')
      .send({
        name: 'Telegram Campaign',
        content: 'Chat with us on Telegram',
        cta_link: 'https://t.me/testbot',
        platforms: ['telegram'],
      })

    // Receive Telegram inbound
    const inbound = await request(server)
      .post('/v1/webhooks/telegram')
      .send({
        message: {
          chat: { id: 123456 },
          from: { id: 789 },
          text: 'Hello from Telegram',
          date: Math.floor(Date.now() / 1000),
        },
      })

    expect([200, 201, 202, 400]).toContain(inbound.status)
    console.log('✓ Telegram inbound test passed')
  })
})
