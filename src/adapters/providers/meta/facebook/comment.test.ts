import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoist mocks before module import
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

import { postComment } from './comment'

// HTML that satisfies all regex patterns in comment.ts:
//   name="fb_dtsg" value="..."   → fb_dtsg
//   "LSD",[],"token":"..."        → lsd
//   c_user= from cookie (already on cookieHeader)
const VALID_HTML = `<html><head></head><body>
<input name="fb_dtsg" value="AQHdtesttoken">
<input name="lsd" value="testlsd">
</body></html>`

beforeEach(() => {
  vi.clearAllMocks()
  getMock.mockResolvedValue({ status: 200, data: VALID_HTML })
  postMock.mockResolvedValue({
    status: 200,
    data: { data: { comment_create: { feedback_comment: { id: 'comment_123' } } } },
  })
})

describe('postComment', () => {
  it('returns error when cookie is empty', async () => {
    const result = await postComment('post123', 'Hello!', '')
    expect(result.success).toBe(false)
    expect(result.error).toContain('Cookie')
  })

  it('returns error when postId is empty', async () => {
    const result = await postComment('', 'Hello!', 'c_user=1; xs=abc')
    expect(result.success).toBe(false)
    expect(result.error).toContain('postId')
  })

  it('returns error when message is empty', async () => {
    const result = await postComment('post123', '', 'c_user=1; xs=abc')
    expect(result.success).toBe(false)
    expect(result.error).toContain('message')
  })

  it('returns error when login page is detected', async () => {
    getMock.mockResolvedValueOnce({
      status: 200,
      data: '<html><body><form action="https://www.facebook.com/login">login_form content</form></body></html>',
    })
    const result = await postComment('post123', 'Hello!', 'c_user=1; xs=abc')
    expect(result.success).toBe(false)
    expect(result.error).toContain('login')
  })

  it('returns error when fb_dtsg cannot be extracted', async () => {
    getMock.mockResolvedValueOnce({
      status: 200,
      data: '<html><body>No tokens here</body></html>',
    })
    const result = await postComment('post123', 'Hello!', 'c_user=1; xs=abc')
    expect(result.success).toBe(false)
    expect(result.error).toContain('fb_dtsg')
  })

  it('posts to /api/graphql/ with correct doc_id', async () => {
    await postComment('post123', 'Great post!', 'c_user=12345; xs=abc')
    // postMock receives (path, bodyString, options)  — the body is URLSearchParams.toString()
    expect(postMock).toHaveBeenCalledWith(
      '/api/graphql/',
      expect.stringContaining('doc_id=1612153915386838')
    )
  })

  it('returns success with commentId when GraphQL returns data', async () => {
    const result = await postComment('post123', 'Great!', 'c_user=1; xs=abc')
    expect(result.success).toBe(true)
    expect(result.commentId).toBe('comment_123')
  })

  it('returns error on GraphQL errors field', async () => {
    postMock.mockResolvedValueOnce({
      status: 200,
      data: { errors: [{ message: 'Permission denied' }] },
    })
    const result = await postComment('post123', 'Hello!', 'c_user=1; xs=abc')
    expect(result.success).toBe(false)
    expect(result.error).toContain('Permission denied')
  })

  it('returns error when HTTP throws', async () => {
    postMock.mockRejectedValueOnce(new Error('Network timeout'))
    const result = await postComment('post123', 'Hello!', 'c_user=1; xs=abc')
    expect(result.success).toBe(false)
    expect(result.error).toContain('Network timeout')
  })
})
