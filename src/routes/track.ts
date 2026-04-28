import { Router } from 'express'
import { CampaignsRepo } from '../repos/campaignsRepo'
import { LinkClicksRepo } from '../repos/linkClicksRepo'
import { parseTrackingToken } from '../utils/tracking'

let linkClicksRepo: LinkClicksRepo | null = null
export function getLinkClicksRepo(db?: any): LinkClicksRepo {
  if (linkClicksRepo) return linkClicksRepo
  linkClicksRepo = new LinkClicksRepo(db)
  return linkClicksRepo
}

let campaignsRepo: CampaignsRepo | null = null
function getRepo(db?: any): CampaignsRepo {
  if (campaignsRepo) return campaignsRepo
  campaignsRepo = new CampaignsRepo(db)
  return campaignsRepo
}

const router = Router()

/**
 * GET /v1/track/:token
 * Records click, then 302-redirects to the campaign's cta_link.
 * If cta_link is missing returns 404.
 */
router.get('/:token', (req, res) => {
  const clicksRepo = getLinkClicksRepo()
  const parsed = parseTrackingToken(req.params.token)

  if (parsed) {
    try {
      clicksRepo.record(req.params.token, parsed.campaignId, parsed.platform)
    } catch {
      // Non-fatal — don't block the redirect
    }
    try {
      const campaign = getRepo().findById(parsed.campaignId)
      if (campaign?.cta_link) {
        return res.redirect(302, campaign.cta_link)
      }
    } catch {
      // Fall through to 404
    }
  }

  res.status(404).json({ error: 'Invalid or expired tracking link' })
})

/**
 * GET /v1/track/stats/:campaignId
 * Returns click counts grouped by platform.
 */
router.get('/stats/:campaignId', (req, res) => {
  const clicksRepo = getLinkClicksRepo()
  const counts = clicksRepo.countByCampaign(req.params.campaignId)
  res.json({ campaign_id: req.params.campaignId, clicks: counts })
})

export const trackRouter = router
export default router
