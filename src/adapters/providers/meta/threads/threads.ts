import { IAdapter, RateLimitStatus } from '../../../IAdapter'
import { getConfig } from '../../../../config/secrets'
import axios, { AxiosRequestConfig } from 'axios'

// Threads Adapter: Meta Threads Graph API (simplified for tests)
// This adapter uses OAuth2 Bearer token from THREADS_ACCESS_TOKEN.
export class ThreadsAdapter implements IAdapter {
  private token?: string
  private rateRemaining: number = 100
  private rateReset: number = Date.now() + 60_000
  private logger?: (msg: string) => void

  constructor(opts?: { logger?: (msg: string) => void }) {
    this.logger = opts?.logger
  }

  private log(msg: string) {
    this.logger?.(`[ThreadsAdapter] ${msg}`)
  }

  async connect(): Promise<void> {
    const cfg = getConfig()
    const t = (cfg as any).THREADS_ACCESS_TOKEN
    if (!t) {
      throw new Error('Threads access token not configured')
    }
    this.token = t
    this.log('Authenticated with Threads access token')
  }

  async disconnect(): Promise<void> {
    this.token = undefined
    this.log('Disconnected')
  }

  // Backwards-compatible endpoint: tests call authenticate/isAuthenticated
  async authenticate(): Promise<boolean> {
    if (this.token) return true
    try {
      await this.connect()
      return !!this.token
    } catch {
      return false
    }
  }

  isAuthenticated(): boolean {
    return !!this.token
  }

  // Publish a new thread/post
  async postMessage(
    to: string,
    message: string
  ): Promise<{ success: boolean; error?: string; code?: string }> {
    if (!this.token) {
      await this.connect()
    }
    if (!this.token) {
      return { success: false, error: 'Not authenticated', code: 'THREADS_NOT_AUTHENTICATED' }
    }
    const url = `https://graph.facebook.com/v14.0/${to}/publish`
    try {
      await axios.post(url, { message }, <AxiosRequestConfig>{
        headers: { Authorization: `Bearer ${this.token}` },
      })
      this.maybeDrainRate()
      return { success: true }
    } catch (e: any) {
      const error = e?.message ?? 'Threads publish error'
      return { success: false, error, code: e?.code ?? 'THREADS_PUBLISH_ERROR' }
    }
  }

  // Reply to an existing thread/post
  async replyToMessage(
    to: string,
    message: string
  ): Promise<{ success: boolean; error?: string; code?: string }> {
    if (!this.token) {
      await this.connect()
    }
    if (!this.token) {
      return { success: false, error: 'Not authenticated', code: 'THREADS_NOT_AUTHENTICATED' }
    }
    const url = `https://graph.facebook.com/v14.0/${to}/replies`
    try {
      await axios.post(url, { message }, <AxiosRequestConfig>{
        headers: { Authorization: `Bearer ${this.token}` },
      })
      this.maybeDrainRate()
      return { success: true }
    } catch (e: any) {
      const error = e?.message ?? 'Threads reply error'
      return { success: false, error, code: e?.code ?? 'THREADS_REPLY_ERROR' }
    }
  }

  // Fetch status for a given message/post
  async getMessageStatus(messageId: string): Promise<{ status: string; id: string } | null> {
    if (!this.token) {
      await this.connect()
    }
    if (!this.token) return null
    const url = `https://graph.facebook.com/v14.0/${messageId}`
    try {
      const resp = await axios.get(url, <AxiosRequestConfig>{
        headers: { Authorization: `Bearer ${this.token}` },
      })
      return { status: resp?.data?.status ?? 'unknown', id: messageId }
    } catch {
      return null
    }
  }

  // List available Threads accounts for the user
  async listAccounts(): Promise<any[]> {
    if (!this.token) {
      await this.connect()
    }
    if (!this.token) return []
    const url = `https://graph.facebook.com/v14.0/me/threads_accounts`
    try {
      const resp = await axios.get(url, <AxiosRequestConfig>{
        headers: { Authorization: `Bearer ${this.token}` },
      })
      return resp?.data?.data ?? []
    } catch {
      return []
    }
  }

  async getRateLimitStatus(): Promise<RateLimitStatus | null> {
    const now = Date.now()
    if (now > this.rateReset) {
      this.rateRemaining = 100
      this.rateReset = now + 60_000
    }
    return {
      limit: 100,
      remaining: this.rateRemaining,
      reset: this.rateReset,
    }
  }

  private maybeDrainRate() {
    const now = Date.now()
    if (now > this.rateReset) {
      this.rateRemaining = 100
      this.rateReset = now + 60_000
    }
    if (this.rateRemaining > 0) this.rateRemaining--
  }

  // Backwards compatibility shim: IAdapter requires sendMessage
  async sendMessage(
    to: string,
    message: string
  ): Promise<{ success: boolean; error?: string; code?: string }> {
    return this.postMessage(to, message)
  }
}

export default ThreadsAdapter
