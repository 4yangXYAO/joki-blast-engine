/**
 * Tracking token utilities.
 *
 * Structure: base64url( campaign_id + ":" + platform )
 * Simple, auditable, no HMAC needed — just obscures the IDs in URLs.
 * Real verification is done by looking up the campaign in DB.
 */

export function generateTrackingToken(campaignId: string, platform: string): string {
  const raw = `${campaignId}:${platform}`
  return Buffer.from(raw).toString('base64url')
}

export function parseTrackingToken(token: string): { campaignId: string; platform: string } | null {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8')
    const sep = raw.indexOf(':')
    if (sep < 1) return null
    const campaignId = raw.substring(0, sep)
    const platform = raw.substring(sep + 1)
    if (!campaignId || !platform) return null
    return { campaignId, platform }
  } catch {
    return null
  }
}
