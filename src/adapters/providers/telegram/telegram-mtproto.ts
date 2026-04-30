import type { IAdapter, RateLimitStatus } from '../../IAdapter'

/**
 * TelegramMTProtoAdapter
 *
 * Telegram user-account adapter using gramjs (MTProto protocol).
 * This is the TypeScript equivalent of Python's Telethon.
 *
 * Use this adapter when you need to send messages as a regular Telegram user
 * (not a bot). Requires:
 *   - TELEGRAM_API_ID   — obtained from https://my.telegram.org
 *   - TELEGRAM_API_HASH — obtained from https://my.telegram.org
 *   - TELEGRAM_SESSION  — StringSession string (generated once at first login)
 *
 * The existing TelegramAdapter (telegraf/Bot API) is NOT replaced.
 */
export interface TelegramMTProtoCredentials {
  apiId: number
  apiHash: string
  /** gramjs StringSession string. Obtain once via interactive login, store encrypted. */
  sessionString: string
}

export class TelegramMTProtoAdapter implements IAdapter {
  private credentials: TelegramMTProtoCredentials
  private client: any // gramjs TelegramClient
  private logger?: (msg: string) => void
  private connected = false
  /** Optional injectable client factory — used in tests to bypass lazy require. */
  private readonly clientFactory?: () => Promise<any>

  constructor(
    credentials: TelegramMTProtoCredentials,
    opts?: {
      logger?: (msg: string) => void
      /** Inject a pre-built TelegramClient instance (for testing). */
      clientFactory?: () => Promise<any>
    }
  ) {
    this.credentials = credentials
    this.logger = opts?.logger
    this.clientFactory = opts?.clientFactory
  }

  private log(msg: string) {
    this.logger?.(`[TelegramMTProto] ${msg}`)
  }

  /**
   * Initialize gramjs TelegramClient and connect.
   * If `clientFactory` was provided in opts, uses that (for tests / DI).
   * Otherwise lazy-requires gramjs to avoid hard dependency at import time.
   */
  async connect(): Promise<void> {
    if (this.connected) return
    try {
      if (this.clientFactory) {
        this.client = await this.clientFactory()
        if (typeof this.client.connect === 'function') {
          await this.client.connect()
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const {
          TelegramClient,
          sessions: { StringSession },
        } = require('telegram')
        const session = new StringSession(this.credentials.sessionString)
        this.client = new TelegramClient(
          session,
          this.credentials.apiId,
          this.credentials.apiHash,
          {
            connectionRetries: 3,
            retryDelay: 1000,
            autoReconnect: true,
            baseLogger: {
              warn: (msg: string) => this.log(`WARN: ${msg}`),
              error: (msg: string) => this.log(`ERROR: ${msg}`),
              info: () => {},
              debug: () => {},
            },
          }
        )
        await this.client.connect()
      }
      this.connected = true
      this.log('Connected via MTProto (gramjs)')
    } catch (e: any) {
      this.client = undefined
      this.connected = false
      this.log('gramjs connect failed: ' + (e?.message ?? String(e)))
      throw e
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && typeof this.client.disconnect === 'function') {
      try {
        await this.client.disconnect()
      } catch {
        // ignore
      }
    }
    this.connected = false
    this.log('Disconnected')
  }

  /**
   * Send a message to a Telegram entity.
   * @param to  Username (@user), phone number, chat ID, or channel username.
   * @param message  Text message to send.
   */
  async sendMessage(
    to: string,
    message: string
  ): Promise<{ success: boolean; error?: string; code?: string }> {
    if (!this.connected) {
      try {
        await this.connect()
      } catch (e: any) {
        return {
          success: false,
          error: e?.message ?? 'Connection failed',
          code: 'MTPROTO_CONNECT_ERROR',
        }
      }
    }
    try {
      await this.client.sendMessage(to, { message })
      this.log(`Sent to ${to}: ${message.substring(0, 40)}`)
      return { success: true }
    } catch (e: any) {
      return {
        success: false,
        error: e?.message ?? 'Send failed',
        code: e?.code ?? 'MTPROTO_SEND_ERROR',
      }
    }
  }

  /**
   * Reply to a specific message in a chat.
   * @param to  Chat ID or username.
   * @param message  Reply text. Prefix with msgId like "123::text" (parsed internally).
   */
  async replyToMessage(
    to: string,
    message: string
  ): Promise<{ success: boolean; error?: string; code?: string }> {
    if (!this.connected) {
      try {
        await this.connect()
      } catch (e: any) {
        return {
          success: false,
          error: e?.message ?? 'Connection failed',
          code: 'MTPROTO_CONNECT_ERROR',
        }
      }
    }
    try {
      // Expect `message` to optionally encode `replyToMsgId` as "msgId::text"
      let replyToMsgId: number | undefined
      let text = message
      const sep = message.indexOf('::')
      if (sep > 0) {
        const id = parseInt(message.substring(0, sep), 10)
        if (!isNaN(id)) {
          replyToMsgId = id
          text = message.substring(sep + 2)
        }
      }
      await this.client.sendMessage(to, { message: text, replyTo: replyToMsgId })
      return { success: true }
    } catch (e: any) {
      return {
        success: false,
        error: e?.message ?? 'Reply failed',
        code: e?.code ?? 'MTPROTO_REPLY_ERROR',
      }
    }
  }

  async getRateLimitStatus(): Promise<RateLimitStatus | null> {
    // MTProto rate limits are handled server-side; return a safe default
    return { limit: 30, remaining: 30, reset: Date.now() + 60_000 }
  }
}

export default TelegramMTProtoAdapter
