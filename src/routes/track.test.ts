import express from 'express'
import { trackRouter } from './track'
import { CampaignsRepo } from '../repos/campaignsRepo'
import { generateTrackingToken } from '../utils/tracking'

// We need a campaign in DB to test redirect
async function startApp() {
  const app = express()
  app.use(express.json())
  app.use('/v1/track', trackRouter)
  return new Promise<{ baseUrl: string; close: () => Promise<void> }>((resolve) => {
    const server = app.listen(0, () => {
      const addr = server.address() as any
      resolve({
        baseUrl: `http://127.0.0.1:${addr.port}`,
        close: () => new Promise((r) => server.close(() => r())),
      })
    })
  })
}

describe('Track Router', () => {
  it('returns 404 for invalid token', async () => {
    const { baseUrl, close } = await startApp()
    const res = await fetch(`${baseUrl}/v1/track/INVALIDTOKEN`, { redirect: 'manual' })
    await close()
    expect(res.status).toBe(404)
  })

  it('records click and redirects for valid token with campaign in DB', async () => {
    const { baseUrl, close } = await startApp()

    // Create a campaign directly in the DB
    const repo = new CampaignsRepo()
    const campaign = repo.create({
      name: 'Track Test',
      content: 'Track me',
      cta_link: 'https://wa.me/628test',
      platforms: ['twitter'],
    })

    const token = generateTrackingToken(campaign.id, 'twitter')
    const res = await fetch(`${baseUrl}/v1/track/${token}`, { redirect: 'manual' })
    await close()
    // Expect 302 redirect to the cta_link
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('https://wa.me/628test')
  })

  it('GET /stats/:campaignId returns click counts', async () => {
    const { baseUrl, close } = await startApp()

    const repo = new CampaignsRepo()
    const campaign = repo.create({
      name: 'Stats Test',
      content: 'Stats',
      cta_link: 'https://example.com',
      platforms: ['instagram'],
    })

    // Simulate a click by hitting the track endpoint
    const token = generateTrackingToken(campaign.id, 'instagram')
    await fetch(`${baseUrl}/v1/track/${token}`, { redirect: 'manual' })

    const statsRes = await fetch(`${baseUrl}/v1/track/stats/${campaign.id}`)
    const body = (await statsRes.json()) as any
    await close()
    expect(statsRes.status).toBe(200)
    expect(body.campaign_id).toBe(campaign.id)
    expect(Array.isArray(body.clicks)).toBe(true)
  })
})
