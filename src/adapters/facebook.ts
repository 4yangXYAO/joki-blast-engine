import type { IAdapter, RateLimitStatus } from './IAdapter'
import axios from 'axios'

/**
 * FacebookAdapter
 *
 * Posts to a Facebook Page using the Graph API v17.
 * Credentials stored per-account as JSON:
 *   { "pageId": "123456", "accessToken": "EAAxxxxxxx" }
 *
 * Get a Page Access Token via:
 *   GET /me/accounts?access_token=<user_token>
 * Then store { pageId, accessToken } as the account credential.
 */
export interface FacebookCredentials {
  pageId: string
  accessToken: string
}

export class FacebookAdapter implements IAdapter {
  private pageId = ''
  private accessToken = ''
  private logger?: (msg: string) => void
  private rateRemaining = 100
  private rateReset = Date.now() + 60_000

  constructor(
    private rawCredential: string,
    opts?: { logger?: (msg: string) => void }
  ) {
    this.logger = opts?.logger
  }

  private log(msg: string) {
    this.logger?.(`[FacebookAdapter] ${msg}`)
  }

  async connect(): Promise<void> {
    if (!this.rawCredential) throw new Error('Facebook credentials not provided')
    let creds: FacebookCredentials
    try {
      creds = JSON.parse(this.rawCredential) as FacebookCredentials
    } catch {
      throw new Error('Facebook credentials must be JSON { pageId, accessToken }')
    }
    if (!creds.pageId || !creds.accessToken) {
      throw new Error('Facebook credentials missing pageId or accessToken')
    }
    this.pageId = creds.pageId
    this.accessToken = creds.accessToken
    this.log(`Connected to page ${this.pageId}`)
  }

  async disconnect(): Promise<void> {
    this.pageId = ''
    this.accessToken = ''
    this.log('Disconnected')
  }

  /**
   * Post a message to the Facebook Page feed.
   * @param _to   Unused — posts always go to the configured Page.
   * @param message  Post text to publish.
   */
  async sendMessage(
    _to: string,
    message: string
  ): Promise<{ success: boolean; error?: string; code?: string }> {
    if (!this.accessToken) await this.connect()
    this.maybeDrainRate()
    if (this.rateRemaining <= 0) {
      return { success: false, code: 'RATE_LIMIT_EXCEEDED', error: 'Rate limit exceeded' }
    }
    try {
      const res = await axios.post(
        `https://graph.facebook.com/v17.0/${this.pageId}/feed`,
        { message, access_token: this.accessToken }
      )
      const postId = res?.data?.id
      const ok = !!postId
      this.log(`Post result: ${postId ?? 'none'}`)
      return { success: ok, code: ok ? undefined : 'FACEBOOK_POST_ERROR' }
    } catch (e: any) {
      return {
        success: false,
        error: e?.message ?? 'Facebook post error',
        code: e?.response?.data?.error?.code?.toString() ?? 'FACEBOOK_POST_ERROR',
      }
    }
  }

  /**
   * Reply to a comment on a Page post.
   * @param to  Comment ID to reply to.
   * @param message  Reply text.
   */
  async replyToMessage(
    to: string,
    message: string
  ): Promise<{ success: boolean; error?: string; code?: string }> {
    if (!this.accessToken) await this.connect()
    try {
      const res = await axios.post(
        `https://graph.facebook.com/v17.0/${to}/comments`,
        { message, access_token: this.accessToken }
      )
      const commentId = res?.data?.id
      const ok = !!commentId
      this.log(`Reply result: ${commentId ?? 'none'}`)
      return { success: ok, code: ok ? undefined : 'FACEBOOK_REPLY_ERROR' }
    } catch (e: any) {
      return {
        success: false,
        error: e?.message ?? 'Facebook reply error',
        code: 'FACEBOOK_REPLY_ERROR',
      }
    }
  }

  async getRateLimitStatus(): Promise<RateLimitStatus | null> {
    return { limit: 100, remaining: this.rateRemaining, reset: this.rateReset }
  }

  private maybeDrainRate() {
    const now = Date.now()
    if (now > this.rateReset) {
      this.rateRemaining = 100
      this.rateReset = now + 60_000
    }
    if (this.rateRemaining > 0) this.rateRemaining--
  }
}

export default FacebookAdapter
