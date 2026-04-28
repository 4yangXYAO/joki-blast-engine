import express from 'express'
import { createWebhooksRouter } from './webhooks'

function makeQueue() {
  return { enqueuePostJob: vi.fn().mockResolvedValue('job_welcome_001') }
}

async function startApp(queue = makeQueue()) {
  const app = express()
  app.use(express.json())
  app.use('/v1/webhooks', createWebhooksRouter(queue as any))
  return new Promise<{ baseUrl: string; close: () => Promise<void>; queue: typeof queue }>(
    (resolve) => {
      const server = app.listen(0, () => {
        const addr = server.address() as any
        resolve({
          baseUrl: `http://127.0.0.1:${addr.port}`,
          close: () => new Promise((r) => server.close(() => r())),
          queue,
        })
      })
    }
  )
}

describe('Webhooks: WAHA inbound', () => {
  it('processes inbound message and creates lead', async () => {
    const queue = makeQueue()
    const { baseUrl, close } = await startApp(queue)
    const res = await fetch(`${baseUrl}/v1/webhooks/waha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'message',
        payload: { from: '6281234567890@c.us', body: 'Halo' },
      }),
    })
    const body = (await res.json()) as any
    await close()
    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.lead_id).toBeTruthy()
    expect(queue.enqueuePostJob).toHaveBeenCalledOnce()
    const call = queue.enqueuePostJob.mock.calls[0][0] as any
    expect(call.platform).toBe('whatsapp')
    expect(call.to).toBe('6281234567890@c.us')
  })

  it('skips non-message events', async () => {
    const queue = makeQueue()
    const { baseUrl, close } = await startApp(queue)
    const res = await fetch(`${baseUrl}/v1/webhooks/waha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'session.status', payload: {} }),
    })
    const body = (await res.json()) as any
    await close()
    expect(res.status).toBe(200)
    expect(body.skipped).toBe(true)
    expect(queue.enqueuePostJob).not.toHaveBeenCalled()
  })

  it('returns 400 for missing from field', async () => {
    const { baseUrl, close } = await startApp()
    const res = await fetch(`${baseUrl}/v1/webhooks/waha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'message', payload: {} }),
    })
    await close()
    expect(res.status).toBe(400)
  })

  it('sends welcome only once for same contact', async () => {
    const queue = makeQueue()
    const { baseUrl, close } = await startApp(queue)
    const body = JSON.stringify({
      event: 'message',
      payload: { from: '628_same@c.us', body: 'hi' },
    })
    await fetch(`${baseUrl}/v1/webhooks/waha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    await fetch(`${baseUrl}/v1/webhooks/waha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    await close()
    // welcome only once
    expect(queue.enqueuePostJob).toHaveBeenCalledOnce()
  })
})

describe('Webhooks: Telegram inbound', () => {
  it('processes inbound message and creates lead', async () => {
    const queue = makeQueue()
    const { baseUrl, close } = await startApp(queue)
    const res = await fetch(`${baseUrl}/v1/webhooks/telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: { chat: { id: 99887766 }, text: 'Halo' } }),
    })
    const body = (await res.json()) as any
    await close()
    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(queue.enqueuePostJob).toHaveBeenCalledOnce()
    const call = queue.enqueuePostJob.mock.calls[0][0] as any
    expect(call.platform).toBe('telegram')
    expect(call.to).toBe('99887766')
  })

  it('returns 400 for missing chat.id', async () => {
    const { baseUrl, close } = await startApp()
    const res = await fetch(`${baseUrl}/v1/webhooks/telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: {} }),
    })
    await close()
    expect(res.status).toBe(400)
  })
})

describe('Webhooks: GET /leads', () => {
  it('returns leads list', async () => {
    const { baseUrl, close } = await startApp()
    // Create a lead via inbound
    await fetch(`${baseUrl}/v1/webhooks/waha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'message', payload: { from: '62800leads@c.us', body: 'test' } }),
    })
    const res = await fetch(`${baseUrl}/v1/webhooks/leads`)
    const body = (await res.json()) as any[]
    await close()
    expect(res.status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBeGreaterThan(0)
  })
})
