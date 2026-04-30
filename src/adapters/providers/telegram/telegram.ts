import type { IAdapter, RateLimitStatus } from '../../IAdapter'

// Telegram Adapter using telegraf (lazy require to avoid runtime hard dependency in tests)
export class TelegramAdapter implements IAdapter {
  private token: string
  private bot: any
  private rateLimit: RateLimitStatus | null = null

  constructor(token: string) {
    this.token = token
    this.bot = undefined
  }

  async connect(): Promise<void> {
    try {
      // Lazy require to avoid pulling in the dependency at import time
      const { Telegraf } = require('telegraf')
      // Initialize bot but do not launch a polling webhook to avoid external calls in tests
      this.bot = new Telegraf(this.token)
      // Basic error handling hook to surface issues without failing startup
      this.bot.catch((err: any) => {
        // Swallow in startup; tests can mock behavior
        // Intentionally do not throw
      })
    } catch (e: any) {
      // If telegraf is not installed or any error occurs, keep bot undefined
      this.bot = undefined
    }
  }

  async sendMessage(
    to: string,
    message: string
  ): Promise<{ success: boolean; error?: string; code?: string }> {
    if (!this.bot) {
      await this.connect()
    }
    try {
      if (!this.bot) {
        return { success: false, error: 'Telegram bot not initialized' }
      }
      await this.bot.telegram.sendMessage(to, message)
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e?.message ?? 'Telegram API error', code: e?.code }
    }
  }

  // Compatibility alias for plan: postMessage
  async postMessage(
    to: string,
    message: string
  ): Promise<{ success: boolean; error?: string; code?: string }> {
    return this.sendMessage(to, message)
  }

  // Reply to a specific message in a chat
  async replyToMessage(
    chatId: string,
    messageId: number,
    text: string
  ): Promise<{ success: boolean; error?: string; code?: string }> {
    if (!this.bot) {
      await this.connect()
    }
    try {
      if (!this.bot) {
        return { success: false, error: 'Telegram bot not initialized' }
      }
      await this.bot.telegram.sendMessage(chatId, text, { reply_to_message_id: messageId })
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e?.message ?? 'Telegram API error', code: e?.code }
    }
  }

  async disconnect(): Promise<void> {
    if (this.bot && typeof this.bot.stop === 'function') {
      try {
        this.bot.stop()
      } catch {
        // ignore
      }
    }
  }

  async getRateLimitStatus(): Promise<RateLimitStatus | null> {
    // Telegraf does not expose a straightforward rate-limit; expose placeholder
    return this.rateLimit
  }
}

export type { RateLimitStatus } // re-export for external type checks
