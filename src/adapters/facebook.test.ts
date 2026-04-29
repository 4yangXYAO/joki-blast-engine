import { FacebookAdapter } from './facebook'

const PAGE_POST_RESPONSE = { id: '123456789_987654321' }
const VALID_CREDS = JSON.stringify({ pageId: '123456789', accessToken: 'EAAtest' })

function makeAdapter(creds = VALID_CREDS) {
  return new FacebookAdapter(creds)
}

function mockFetchOnce(payload: any, ok = true, status = 200) {
  const response = {
    ok,
    status,
    text: vi.fn().mockResolvedValue(JSON.stringify(payload)),
  }
  globalThis.fetch = vi.fn().mockResolvedValue(response as any) as any
  return response
}

describe('FacebookAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(JSON.stringify(PAGE_POST_RESPONSE)),
    } as any) as any
  })

  test('connect parses credentials correctly', async () => {
    const adapter = makeAdapter()
    await expect(adapter.connect()).resolves.toBeUndefined()
  })

  test('connect throws when credentials are empty', async () => {
    const adapter = new FacebookAdapter('')
    await expect(adapter.connect()).rejects.toThrow('credentials not provided')
  })

  test('connect throws on invalid JSON', async () => {
    const adapter = new FacebookAdapter('not-json')
    await expect(adapter.connect()).rejects.toThrow('must be JSON')
  })

  test('connect throws on missing pageId', async () => {
    const adapter = new FacebookAdapter(JSON.stringify({ accessToken: 'tok' }))
    await expect(adapter.connect()).rejects.toThrow('missing pageId')
  })

  test('sendMessage posts to page feed and returns success', async () => {
    const adapter = makeAdapter()
    const res = await adapter.sendMessage('unused', 'Hello from blast!')
    expect(res.success).toBe(true)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v19.0/123456789/feed'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
      })
    )
  })

  test('sendMessage returns failure on HTTP error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: vi
        .fn()
        .mockResolvedValue(JSON.stringify({ error: { message: 'Network error', code: 500 } })),
    } as any) as any
    const adapter = makeAdapter()
    const res = await adapter.sendMessage('unused', 'fail')
    expect(res.success).toBe(false)
    expect(res.code).toBe('500')
  })

  test('replyToMessage posts to comment thread', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(JSON.stringify({ id: 'comment_123' })),
    } as any) as any
    const adapter = makeAdapter()
    const res = await adapter.replyToMessage('comment_999', 'Nice post!')
    expect(res.success).toBe(true)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v19.0/comment_999/comments'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  test('getRateLimitStatus returns expected shape', async () => {
    const adapter = makeAdapter()
    const status = await adapter.getRateLimitStatus()
    expect(status!.limit).toBe(100)
    expect(typeof status!.remaining).toBe('number')
  })

  test('sendMessage maps Graph code 4 to rate limit error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: vi
        .fn()
        .mockResolvedValue(JSON.stringify({ error: { message: 'rate limited', code: 4 } })),
    } as any) as any
    const adapter = makeAdapter()
    const res = await adapter.sendMessage('unused', 'Hello')
    expect(res.success).toBe(false)
    expect(res.code).toBe('RATE_LIMIT_EXCEEDED')
  })

  test('sendMessage maps Graph code 190 to token expired', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: vi
        .fn()
        .mockResolvedValue(JSON.stringify({ error: { message: 'token expired', code: 190 } })),
    } as any) as any
    const adapter = makeAdapter()
    const res = await adapter.sendMessage('unused', 'Hello')
    expect(res.success).toBe(false)
    expect(res.code).toBe('TOKEN_EXPIRED')
  })
})
