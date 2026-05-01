/**
 * Instagram DM — send a direct message via Instagram's internal API.
 *
 * Uses cookie-based access to Instagram's direct messaging endpoint.
 */

import { createHttpClient, parseCookies } from '../../utils/http-client'

/**
 * Send an Instagram direct message to a user.
 *
 * @param userId   Instagram user ID (numeric string / pk)
 * @param message  Text content of the message
 * @param cookie   Raw browser session cookie string
 * @returns { success: boolean, error?: string }
 */
export async function sendInstagramDM(
  userId: string,
  message: string,
  cookie: string
): Promise<{ success: boolean; error?: string }> {
  if (!cookie) return { success: false, error: 'Cookie not provided' }
  if (!userId) return { success: false, error: 'userId not provided' }
  if (!message) return { success: false, error: 'message not provided' }

  const cookieHeader = parseCookies(cookie)
  const csrfMatch = cookieHeader.match(/csrftoken=([^;]+)/)
  const csrfToken = csrfMatch?.[1] ?? ''

  try {
    const client = createHttpClient({
      baseURL: 'https://www.instagram.com',
      timeout: 15_000,
      headers: {
        Cookie: cookieHeader,
        'X-CSRFToken': csrfToken,
        'X-IG-App-ID': '936619743392459',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 303.0.0.11.109',
      },
    })

    const params = new URLSearchParams({
      recipient_users: JSON.stringify([userId]),
      action: 'send_item',
      client_context: String(Date.now()),
      text: message,
    })

    const res = await client.post('/api/v1/direct_v2/threads/broadcast/text/', params.toString())
    const ok = res?.data?.status === 'ok' || res?.status === 200

    return {
      success: ok,
      error: ok ? undefined : `DM not confirmed. Status: ${res?.status}`,
    }
  } catch (e: any) {
    return {
      success: false,
      error: e?.message ?? 'Instagram DM error',
    }
  }
}
