import type { IAdapter, RateLimitStatus } from '../../../IAdapter'
import { createHttpClient, parseCookies } from '../../../../utils/http-client'

class AuthError extends Error {
  constructor(message?: string) {
    super(message ?? 'Authentication failed')
    this.name = 'AuthError'
  }
}

/**
 * FacebookAdapter (cookie-based)
 *
 * - Extracts fb_dtsg and user identifiers from m.facebook.com using the provided cookies
 * - Posts using the mobile endpoint `/a/home.php` with required form fields
 */
export class FacebookAdapter implements IAdapter {
  private cookieHeader: string = ''
  private fbDtsg: string = ''
  private cUser: string = '' // c_user cookie (account id)
  private lst: string = ''
  private rateRemaining = 30
  private rateReset = Date.now() + 60_000

  constructor(
    private rawCookie: string,
    opts?: { logger?: (msg: string) => void }
  ) {}

  private log(msg: string) {
    // no-op for now; keep extension point
    // console.debug(`[FacebookAdapter] ${msg}`)
  }

  async connect(): Promise<void> {
    if (!this.rawCookie) throw new Error('Facebook cookie not provided')
    this.cookieHeader = parseCookies(this.rawCookie)

    // Try to extract c_user from cookie first (fast path)
    const m = this.cookieHeader.match(/\bc_user=([^;\s]+)/)
    if (m) this.cUser = m[1]

    // Fetch mobile page to obtain fb_dtsg and potential lst value
    const client = createHttpClient({
      baseURL: 'https://m.facebook.com',
      timeout: 15_000,
      headers: {
        Cookie: this.cookieHeader,
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Facebook/303.0.0.11.109',
      },
    })

    const res = await client.get('/')
    const html = String(res?.data || '')

    // Try multiple patterns to find fb_dtsg
    let match =
      html.match(/name=\"fb_dtsg\" value=\"([^\"]+)\"/) ||
      html.match(/fb_dtsg\\\"\s*:\s*\"([^\"]+)\"/)
    if (match) this.fbDtsg = match[1]

    // Try to extract lst (sometimes present in forms)
    match = html.match(/name=\"lst\" value=\"([^\"]+)\"/)
    if (match) this.lst = match[1]

    // If c_user wasn't available from cookie, try to extract from HTML
    if (!this.cUser) {
      match =
        html.match(/c_user\\\"?:\\\"?(\\d{5,})/) || html.match(/\\"c_user\\"\s*:\s*\\"?(\\d{5,})/)
      if (match) this.cUser = match[1]
    }

    if (!this.fbDtsg) {
      // If page redirected to login or fb_dtsg not present -> likely auth expired
      const isLogin = /name=\"login\"|action=\"https:\/\/m\.facebook\.com\/login\.php\"/.test(html)
      if (isLogin) throw new AuthError('Cookie appears expired (redirected to login)')
      // Otherwise, leave fbDtsg empty and let sendMessage attempt
    }
  }

  async disconnect(): Promise<void> {
    this.cookieHeader = ''
    this.fbDtsg = ''
    this.cUser = ''
    this.lst = ''
  }

  async sendMessage(
    _to: string,
    message: string
  ): Promise<{ success: boolean; error?: string; code?: string }> {
    if (!this.cookieHeader) await this.connect()
    this.maybeDrainRate()
    if (this.rateRemaining <= 0) {
      return { success: false, code: 'RATE_LIMIT_EXCEEDED', error: 'Rate limit exceeded' }
    }

    if (!this.fbDtsg) {
      // Try to reconnect to obtain fb_dtsg
      try {
        await this.connect()
      } catch (err: any) {
        if (err?.name === 'AuthError')
          return { success: false, code: 'AUTH_EXPIRED', error: String(err.message) }
        return {
          success: false,
          code: 'CONNECT_FAILED',
          error: String(err?.message ?? 'connect failed'),
        }
      }
    }

    try {
      const client = createHttpClient({
        baseURL: 'https://m.facebook.com',
        timeout: 15000,
        headers: {
          Cookie: this.cookieHeader,
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        },
      })

      // Primary attempt: post to the mobile create endpoint
      const form = new URLSearchParams()
      if (this.cUser) form.set('av', this.cUser)
      if (this.lst) form.set('lst', this.lst)
      form.set('fb_dtsg', this.fbDtsg)
      // Common field used by mobile UI for status update text
      form.set('xhpc_message_text', message)

      const res = await client.post('/a/home.php', form.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      // Detect auth redirect (login) from response headers or body
      if (res?.request?.res?.responseUrl && String(res.request.res.responseUrl).includes('login')) {
        throw new AuthError('Auth redirect detected when posting')
      }

      // Accept 200 as success; some form responses return HTML fragment
      const ok = res?.status === 200
      return {
        success: ok,
        code: ok ? undefined : 'FB_POST_FAILED',
        error: ok ? undefined : String(res?.statusText ?? 'unknown'),
      }
    } catch (e: any) {
      if (e?.name === 'AuthError')
        return { success: false, code: 'AUTH_EXPIRED', error: String(e.message) }
      return { success: false, code: 'FB_POST_ERROR', error: String(e?.message ?? 'post error') }
    }
  }

  async getRateLimitStatus(): Promise<RateLimitStatus | null> {
    return { limit: 30, remaining: this.rateRemaining, reset: this.rateReset }
  }

  private maybeDrainRate() {
    const now = Date.now()
    if (now > this.rateReset) {
      this.rateRemaining = 30
      this.rateReset = now + 60_000
    }
    if (this.rateRemaining > 0) this.rateRemaining--
  }
}

export default FacebookAdapter
