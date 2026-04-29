import type { IAdapter, RateLimitStatus } from './IAdapter'

/**
 * FacebookAdapter
 *
 * Posts to a Facebook Page using the Graph API v19.0.
 * Credentials stored per-account as JSON:
 *   { "pageId": "123456", "accessToken": "EAAxxxxxxx" }
 */
export interface FacebookCredentials {
  pageId: string
  accessToken: string
}

type FacebookGraphError = {
  error?: {
    message?: string
    code?: number
    type?: string
    fbtrace_id?: string
  }
}

type FacebookGraphResponse = {
  id?: string
  success?: boolean
} & FacebookGraphError

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

  private get apiBaseUrl() {
    return 'https://graph.facebook.com/v19.0'
  }

  private async safeParseJson(response: Response): Promise<any> {
    const text = await response.text()
    if (!text) return {}
    try {
      return JSON.parse(text)
    } catch {
      return { raw: text }
    }
  }

  private async postGraph(path: string, fields: Record<string, string>) {
    const body = new URLSearchParams({
      ...fields,
      access_token: this.accessToken,
    })

    const response = await fetch(`${this.apiBaseUrl}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    const payload = (await this.safeParseJson(response)) as FacebookGraphResponse

    if (response.ok) {
      return payload
    }

    const errorCode = payload?.error?.code
    const errorMessage = payload?.error?.message ?? 'Facebook Graph API request failed'

    const err = new Error(errorMessage)
    if (errorCode === 4) {
      ;(err as any).code = 'RATE_LIMIT_EXCEEDED'
    } else if (errorCode === 190) {
      ;(err as any).code = 'TOKEN_EXPIRED'
    } else {
      ;(err as any).code = errorCode?.toString() ?? 'FACEBOOK_GRAPH_ERROR'
    }
    throw err
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
      const res = (await this.postGraph(`${this.pageId}/feed`, {
        message,
      })) as FacebookGraphResponse
      const postId = res?.id
      const ok = !!postId
      this.log(`Post result: ${postId ?? 'none'}`)
      return { success: ok, code: ok ? undefined : 'FACEBOOK_POST_ERROR' }
    } catch (e: any) {
      if (e?.code === 'RATE_LIMIT_EXCEEDED') {
        this.rateRemaining = 0
      }
      if (e?.code === 'TOKEN_EXPIRED') {
        this.accessToken = ''
      }
      return {
        success: false,
        error: e?.message ?? 'Facebook post error',
        code: e?.code ?? 'FACEBOOK_POST_ERROR',
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
      const res = (await this.postGraph(`${to}/comments`, { message })) as FacebookGraphResponse
      const commentId = res?.id
      const ok = !!commentId
      this.log(`Reply result: ${commentId ?? 'none'}`)
      return { success: ok, code: ok ? undefined : 'FACEBOOK_REPLY_ERROR' }
    } catch (e: any) {
      if (e?.code === 'RATE_LIMIT_EXCEEDED') {
        this.rateRemaining = 0
      }
      if (e?.code === 'TOKEN_EXPIRED') {
        this.accessToken = ''
      }
      return {
        success: false,
        error: e?.message ?? 'Facebook reply error',
        code: e?.code ?? 'FACEBOOK_REPLY_ERROR',
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
