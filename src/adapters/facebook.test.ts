// Unit tests for FacebookAdapter — mocks axios
import { FacebookAdapter } from './facebook'

vi.mock('axios', () => {
  const instance = {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  }
  return { default: { create: vi.fn(() => instance), post: vi.fn(), get: vi.fn(), ...instance }, __esModule: true }
})

import axios from 'axios'
const mockedAxios = axios as any

const PAGE_POST_RESPONSE = { data: { id: '123456789_987654321' } }
const VALID_CREDS = JSON.stringify({ pageId: '123456789', accessToken: 'EAAtest' })

function makeAdapter(creds = VALID_CREDS) {
  return new FacebookAdapter(creds)
}

describe('FacebookAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedAxios.post = vi.fn().mockResolvedValue(PAGE_POST_RESPONSE)
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
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/feed'),
      expect.objectContaining({ message: 'Hello from blast!' })
    )
  })

  test('sendMessage returns failure on HTTP error', async () => {
    mockedAxios.post = vi.fn().mockRejectedValue(new Error('Network error'))
    const adapter = makeAdapter()
    const res = await adapter.sendMessage('unused', 'fail')
    expect(res.success).toBe(false)
    expect(res.code).toBe('FACEBOOK_POST_ERROR')
  })

  test('replyToMessage posts to comment thread', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: { id: 'comment_123' } })
    const adapter = makeAdapter()
    const res = await adapter.replyToMessage('comment_999', 'Nice post!')
    expect(res.success).toBe(true)
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('comment_999/comments'),
      expect.objectContaining({ message: 'Nice post!' })
    )
  })

  test('getRateLimitStatus returns expected shape', async () => {
    const adapter = makeAdapter()
    const status = await adapter.getRateLimitStatus()
    expect(status!.limit).toBe(100)
    expect(typeof status!.remaining).toBe('number')
  })
})
