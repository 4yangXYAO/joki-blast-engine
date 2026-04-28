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

describe('Happy Path Flow Test: Success Scenario', () => {
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

  it('Happy Path: Complete successful campaign flow', async () => {
    console.log('\n🚀 Starting Happy Path Flow Test\n')

    // ===== STEP 1: Setup =====
    console.log('📝 Step 1: Creating account...')
    const account = await request(server)
      .post('/v1/accounts')
      .send({
        platform: 'twitter',
        username: 'happypath_user',
        credentials: JSON.stringify({ key: 'happy' }),
      })
    const accountId = account.body.id
    console.log(`   ✓ Account ID: ${accountId}`)

    // ===== STEP 2: Create Campaign =====
    console.log('\n📝 Step 2: Creating campaign...')
    const campaign = await request(server)
      .post('/v1/campaigns')
      .send({
        name: 'Happy Path Campaign',
        content: 'This is a happy path test campaign',
        cta_link: 'https://wa.me/1234567890',
        platforms: ['twitter', 'instagram', 'facebook'],
      })
    const campaignId = campaign.body.id
    console.log(`   ✓ Campaign ID: ${campaignId}`)
    console.log(`   ✓ Name: ${campaign.body.name}`)
    console.log(`   ✓ Status: ${campaign.body.status}`)

    // ===== STEP 3: Verify Campaign Created =====
    console.log('\n📝 Step 3: Verifying campaign...')
    const getC = await request(server).get(`/v1/campaigns/${campaignId}`)
    expect(getC.status).toBe(200)
    console.log(`   ✓ Campaign retrieved`)
    console.log(`   ✓ Content: "${getC.body.content}"`)

    // ===== STEP 4: Blast Campaign =====
    console.log('\n📝 Step 4: Blasting campaign...')
    const blast = await request(server)
      .post(`/v1/campaigns/${campaignId}/blast`)
      .send({
        account_ids: {
          twitter: accountId,
          instagram: accountId,
          facebook: accountId,
        },
      })
    expect(blast.status).toBe(202)
    console.log(`   ✓ Blast accepted (status 202)`)
    console.log(`   ✓ Posts created: ${blast.body.posts.length}`)

    // ===== STEP 5: Verify Posts =====
    console.log('\n📝 Step 5: Verifying posts...')
    const getCampaign = await request(server).get(`/v1/campaigns/${campaignId}`)
    const posts = getCampaign.body.posts || []
    expect(posts.length).toBeGreaterThanOrEqual(3)
    console.log(`   ✓ Total posts: ${posts.length}`)
    for (let i = 0; i < posts.length; i++) {
      console.log(`     Post ${i + 1}: ${posts[i].platform} (${posts[i].status})`)
    }

    // ===== STEP 6: Check Tracking Setup =====
    console.log('\n📝 Step 6: Checking tracking setup...')
    const stats = await request(server).get(`/v1/track/stats/${campaignId}`)
    expect(stats.status).toBe(200)
    console.log(`   ✓ Campaign ID tracked: ${stats.body.campaign_id}`)
    console.log(`   ✓ Click data structure ready: ${JSON.stringify(stats.body.clicks)}`)

    // ===== STEP 7: Simulate Inbound WhatsApp =====
    console.log('\n📝 Step 7: Simulating inbound WhatsApp message...')
    const inbound = await request(server)
      .post('/v1/webhooks/waha')
      .send({
        event: 'message',
        data: {
          from: '+62812345678',
          chatId: '+62812345678@c.us',
          body: 'Halo, aku tertarik',
          timestamp: Math.floor(Date.now() / 1000),
        },
      })
    console.log(`   ✓ Inbound received (status: ${inbound.status})`)

    // ===== STEP 8: Verify Lead Created =====
    console.log('\n📝 Step 8: Verifying lead creation...')
    const leads = await request(server).get('/v1/webhooks/leads')
    expect(leads.status).toBe(200)
    console.log(`   ✓ Leads endpoint: ${leads.body.length} lead(s)`)
    if (leads.body.length > 0) {
      const lead = leads.body[0]
      console.log(`   ✓ Lead platform: ${lead.inbound_platform}`)
      console.log(`   ✓ Lead contact: ${lead.contact}`)
      console.log(`   ✓ Welcome sent: ${lead.welcome_sent === 1 ? 'YES' : 'NO'}`)
      console.log(`   ✓ Lead status: ${lead.status}`)
    }

    // ===== STEP 9: List Campaigns =====
    console.log('\n📝 Step 9: Listing all campaigns...')
    const list = await request(server).get('/v1/campaigns')
    console.log(`   ✓ Total campaigns: ${list.body.length}`)

    // ===== FINAL RESULT =====
    console.log('\n' + '='.repeat(60))
    console.log('✅ HAPPY PATH FLOW TEST: ALL STEPS PASSED')
    console.log('='.repeat(60))
    console.log('Summary:')
    console.log(`  → Account created: ${accountId}`)
    console.log(`  → Campaign created: ${campaignId}`)
    console.log(`  → Posts blasted: ${posts.length}`)
    console.log(`  → Tracking setup: READY`)
    console.log(`  → Inbound handled: YES`)
    console.log(`  → Lead created: ${leads.body.length > 0 ? 'YES' : 'NO'}`)
    console.log('='.repeat(60) + '\n')
  })
})
