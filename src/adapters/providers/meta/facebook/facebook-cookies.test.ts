import { beforeEach, describe, expect, test, vi } from 'vitest'

// Unit tests for FacebookAdapter — mocks the shared HTTP client
const { getMock, postMock, createHttpClientMock, parseCookiesMock } = vi.hoisted(() => {
  const getMock = vi.fn()
  const postMock = vi.fn()
  return {
    getMock,
    postMock,
    createHttpClientMock: vi.fn(() => ({ get: getMock, post: postMock })),
    parseCookiesMock: vi.fn((raw: string) => raw.trim()),
  }
})

vi.mock('../../../../utils/http-client', () => ({
  createHttpClient: createHttpClientMock,
  parseCookies: parseCookiesMock,
}))

import { FacebookAdapter } from './facebook'

function makeAdapter(cookie = 'sessionid=abc; c_user=12345; xs=tok') {
  return new FacebookAdapter(cookie)
}

describe('FacebookAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getMock.mockResolvedValue({
      data: '<input name="fb_dtsg" value="fb-token"><input name="lst" value="lst-token">',
    })
    postMock.mockResolvedValue({ status: 200, data: { status: 'ok' } })
  })

  test('connect parses cookies and loads fb_dtsg', async () => {
    const adapter = makeAdapter()
    await expect(adapter.connect()).resolves.toBeUndefined()
    expect(parseCookiesMock).toHaveBeenCalledWith('sessionid=abc; c_user=12345; xs=tok')
  })

  test('connect throws when cookie is empty', async () => {
    const adapter = new FacebookAdapter('')
    await expect(adapter.connect()).rejects.toThrow('Facebook cookie not provided')
  })

  test('sendMessage posts to mobile create endpoint and returns success', async () => {
    const adapter = makeAdapter()
    const res = await adapter.sendMessage('unused', 'Hello FB!')
    expect(res.success).toBe(true)
    expect(postMock).toHaveBeenCalledWith(
      '/a/home.php',
      expect.stringContaining('xhpc_message_text=Hello+FB%21'),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    )
  })

  test('sendMessage returns AUTH_EXPIRED on login redirect', async () => {
    getMock.mockResolvedValueOnce({
      data: '<form action="https://m.facebook.com/login.php"><input name="login" /></form>',
    })
    const adapter = makeAdapter()
    const res = await adapter.sendMessage('unused', 'fail')
    expect(res.success).toBe(false)
    expect(res.code).toBe('AUTH_EXPIRED')
  })

  test('getRateLimitStatus returns expected shape', async () => {
    const adapter = makeAdapter()
    const status = await adapter.getRateLimitStatus()
    expect(status).not.toBeNull()
    expect(status!.limit).toBe(30)
    expect(typeof status!.remaining).toBe('number')
  })

  test('disconnect clears cookie state', async () => {
    const adapter = makeAdapter()
    await adapter.connect()
    await adapter.disconnect()
    getMock.mockResolvedValueOnce({
      data: '<input name="fb_dtsg" value="fb-token"><input name="lst" value="lst-token">',
    })
    const res = await adapter.sendMessage('unused', 're-connect test')
    expect(res.success).toBe(true)
  })
})
