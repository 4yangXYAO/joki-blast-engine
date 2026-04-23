import { Router, Request, Response } from 'express'
import { TelegramAdapter } from '../adapters/telegram'
import { getConfig } from '../config/secrets'

export const webhooksRouter = Router()

let telegramAdapter: TelegramAdapter | null = null

async function ensureAdapter(): Promise<TelegramAdapter> {
  if (!telegramAdapter) {
    const cfg = getConfig()
    telegramAdapter = new TelegramAdapter(cfg.TELEGRAM_BOT_TOKEN)
    await telegramAdapter.connect()
  }
  // Non-null assertion is safe after ensureAdapter()
  return telegramAdapter as TelegramAdapter
}

// Telegram webhook endpoint to receive updates
webhooksRouter.post('/telegram', async (req: Request, res: Response) => {
  try {
    const update = req.body
    // Minimal handling: echo text back to sender if possible
    if (update && update.message && update.message.chat && update.message.text) {
      const chatId = String(update.message.chat.id)
      const text = update.message.text
      const adapter = await ensureAdapter()
      await adapter.sendMessage(chatId, `You said: ${text}`)
    }
    res.status(200).json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? 'Internal Server Error' })
  }
})
