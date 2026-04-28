import { Router } from 'express'
import { LeadsRepo } from '../repos/leadsRepo'
import type { JobQueue } from '../queue/job-queue'
import { readRuntimeSettingValue } from '../config/runtime-secret-store'

const DEFAULT_WELCOME =
  'Halo! Terima kasih sudah menghubungi kami. Tim kami akan segera merespons 🙏'

function getWelcomeMessage(): string {
  try {
    return readRuntimeSettingValue('WELCOME_MESSAGE') ?? DEFAULT_WELCOME
  } catch {
    return DEFAULT_WELCOME
  }
}

let leadsRepo: LeadsRepo | null = null
export function getLeadsRepo(db?: any): LeadsRepo {
  if (leadsRepo) return leadsRepo
  leadsRepo = new LeadsRepo(db)
  return leadsRepo
}

export function createWebhooksRouter(queue: Pick<JobQueue, 'enqueuePostJob'>): Router {
  const router = Router()

  /**
   * POST /v1/webhooks/waha
   * WAHA sends inbound messages here. We:
   *  1. Parse contact from payload.from
   *  2. Find-or-create lead
   *  3. Enqueue welcome PostJob to whatsapp platform
   *  4. Mark lead as awaiting_handoff
   */
  router.post('/waha', async (req, res) => {
    try {
      const event = req.body?.event
      if (event !== 'message' && event !== 'message.any') {
        return res.json({ ok: true, skipped: true })
      }
      const from: string = req.body?.payload?.from ?? req.body?.payload?.chatId ?? ''
      if (!from) return res.status(400).json({ error: 'Missing from field' })

      const campaignId: string | undefined = req.body?.meta?.campaign_id

      const repo = getLeadsRepo()
      const lead = repo.findOrCreate('whatsapp', from, campaignId)

      // Only send welcome once
      if (!lead.welcome_sent) {
        await queue.enqueuePostJob({
          platform: 'whatsapp',
          to: from,
          message: getWelcomeMessage(),
          account_id: '',
        } as any)
        repo.markWelcomeSent(lead.id)
      }

      repo.markAwaitingHandoff(lead.id)
      res.json({ ok: true, lead_id: lead.id })
    } catch (e: any) {
      res.status(500).json({ error: e?.message ?? 'Webhook error' })
    }
  })

  /**
   * POST /v1/webhooks/telegram
   * Telegram sends update objects here.
   */
  router.post('/telegram', async (req, res) => {
    try {
      const chatId = req.body?.message?.chat?.id
      if (!chatId) return res.status(400).json({ error: 'Missing chat.id' })

      const contact = String(chatId)
      const repo = getLeadsRepo()
      const lead = repo.findOrCreate('telegram', contact)

      if (!lead.welcome_sent) {
        await queue.enqueuePostJob({
          platform: 'telegram',
          to: contact,
          message: getWelcomeMessage(),
          account_id: '',
        } as any)
        repo.markWelcomeSent(lead.id)
      }

      repo.markAwaitingHandoff(lead.id)
      res.json({ ok: true, lead_id: lead.id })
    } catch (e: any) {
      res.status(500).json({ error: e?.message ?? 'Webhook error' })
    }
  })

  /**
   * GET /v1/webhooks/leads
   * List all leads ordered by newest first.
   */
  router.get('/leads', (_req, res) => {
    try {
      const repo = getLeadsRepo()
      res.json(repo.list())
    } catch (e: any) {
      res.status(500).json({ error: e?.message ?? 'Internal error' })
    }
  })

  return router
}

// Default singleton router (used by server.ts)
import { defaultJobQueue } from './jobs'
export const webhooksRouter = createWebhooksRouter(defaultJobQueue)
export default webhooksRouter