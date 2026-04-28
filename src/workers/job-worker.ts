import { JobQueue } from '../queue/job-queue'
import { IAdapter } from '../adapters/IAdapter'
import { AccountsRepo } from '../repos/accountsRepo'
import { decrypt } from '../utils/crypto'
import { getConfig } from '../config/secrets'
import { WhatsAppAdapter } from '../adapters/whatsapp'
import { TelegramAdapter } from '../adapters/telegram'
import { TelegramMTProtoAdapter } from '../adapters/telegram-mtproto'
import { InstagramAdapter } from '../adapters/instagram'
import { InstagramCookieAdapter } from '../adapters/instagram-cookie'
import { TwitterAdapter } from '../adapters/twitter'
import { TwitterCookieAdapter } from '../adapters/twitter-cookie'
import { ThreadsAdapter } from '../adapters/threads'
import { ThreadsCookieAdapter } from '../adapters/threads-cookie'
import { FacebookAdapter } from '../adapters/facebook'
// (Types not strictly required here; jobs are routed via the generic payload in queue processor)

// In this worker, we route jobs to platform adapters based on the job.platform field.
// The worker is intentionally DI-friendly: tests can supply a custom adapterFactory
// to observe calls without depending on real network calls.

type AdapterFactory = (
  platform: string,
  context?: { accountId?: string; credentials?: string }
) => IAdapter | Promise<IAdapter>

export interface WorkerOptions {
  adapterFactory?: AdapterFactory
}

function unwrapCredentials(value: unknown): string {
  if (value == null) return ''
  if (Buffer.isBuffer(value)) return value.toString('utf8')
  return String(value)
}

function readDecryptedCredentials(value: unknown): string {
  const raw = unwrapCredentials(value)
  if (!raw) return ''
  try {
    return decrypt(raw)
  } catch {
    return raw
  }
}

function parseTelegramMtprotoCredentials(raw: string) {
  const parsed = JSON.parse(raw)
  if (
    !parsed ||
    typeof parsed.apiId !== 'number' ||
    typeof parsed.apiHash !== 'string' ||
    typeof parsed.sessionString !== 'string'
  ) {
    throw new Error('Invalid Telegram MTProto credentials payload')
  }
  return { apiId: parsed.apiId, apiHash: parsed.apiHash, sessionString: parsed.sessionString }
}

function createDefaultAdapterFactory() {
  const accountsRepo = new AccountsRepo()

  return (platform: string, context?: { accountId?: string; credentials?: string }) => {
    const cfg = getConfig()
    const account = context?.accountId ? accountsRepo.findById(context.accountId) : null
    const rawCredentials =
      context?.credentials ?? readDecryptedCredentials(account?.credentials_encrypted)

    switch (platform) {
      case 'whatsapp':
        return new WhatsAppAdapter({ mode: 'cloud-api' })
      case 'whatsapp-webjs':
        return new WhatsAppAdapter({ mode: 'webjs' })
      case 'telegram':
        return new TelegramAdapter(rawCredentials || cfg.TELEGRAM_BOT_TOKEN || '')
      case 'telegram-mtproto':
        return new TelegramMTProtoAdapter(parseTelegramMtprotoCredentials(rawCredentials))
      case 'instagram-cookie':
        return new InstagramCookieAdapter(rawCredentials)
      case 'instagram':
        return new InstagramAdapter()
      case 'twitter-cookie':
        return new TwitterCookieAdapter(rawCredentials)
      case 'twitter':
        return new TwitterAdapter()
      case 'threads-cookie':
        return new ThreadsCookieAdapter(rawCredentials)
      case 'threads':
        return new ThreadsAdapter()
      case 'facebook':
      case 'facebook-page':
        return new FacebookAdapter(rawCredentials)
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }
  }
}

export async function initializeJobWorker(queue: JobQueue, options?: WorkerOptions) {
  const adaptersFactory = options?.adapterFactory ?? createDefaultAdapterFactory()

  // Processor that uses platform adapters to deliver messages
  queue.setProcessor(async ({ id, data }: { id: string; data: any }) => {
    const platform = data?.platform
    if (!platform) {
      throw new Error('Missing platform in job data')
    }
    const adapter = await adaptersFactory(platform, { accountId: data?.account_id })
    // Route by job type
    if (data.type === 'PostJob') {
      const to = (data.to as string) || data.account_id
      const msg = data.message as string
      // Use adapter interface if available; if adapt is missing, skip
      if ((adapter as any).sendMessage) {
        await (adapter as any).sendMessage(to, msg)
        return
      }
      throw new Error('Adapter missing sendMessage implementation')
    } else if (data.type === 'ReplyJob') {
      const chatId = data.chatId as string
      const messageId = data.messageId as string
      const text = data.message as string
      if ((adapter as any).replyToMessage) {
        await (adapter as any).replyToMessage(chatId, messageId, text)
        return
      }
      throw new Error('Adapter missing replyToMessage implementation')
    }
    throw new Error('Unknown job type')
  })
}

export default initializeJobWorker
