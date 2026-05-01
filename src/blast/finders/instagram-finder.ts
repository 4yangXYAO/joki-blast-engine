/**
 * Instagram Finder — search for posts/users via Instagram internal API.
 *
 * Uses cookie-based access to Instagram's explore/hashtag endpoints.
 * Returns post IDs (for commenting) and user IDs (for DMs).
 */

import { createHttpClient, parseCookies } from '../../utils/http-client'

export interface InstagramFinderResult {
  postIds: string[]
  userIds: string[]
}

/**
 * Search Instagram for posts matching the query (hashtag or keyword).
 *
 * @param query   Hashtag or keyword to search for
 * @param cookie  Raw browser session cookie string
 * @param limit   Max targets to return (default 30)
 */
export async function findInstagramTargets(
  query: string,
  cookie: string,
  limit: number = 30
): Promise<InstagramFinderResult> {
  if (!cookie || !query) {
    return { postIds: [], userIds: [] }
  }

  const cookieHeader = parseCookies(cookie)
  const csrfMatch = cookieHeader.match(/csrftoken=([^;]+)/)
  const csrfToken = csrfMatch?.[1] ?? ''

  try {
    // Clean hashtag: remove # prefix if present
    const tag = query.replace(/^#/, '').trim()

    const client = createHttpClient({
      baseURL: 'https://www.instagram.com',
      timeout: 15_000,
      headers: {
        Cookie: cookieHeader,
        'X-CSRFToken': csrfToken,
        'X-IG-App-ID': '936619743392459',
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 303.0.0.11.109',
        Accept: '*/*',
      },
    })

    // Search via hashtag endpoint
    const res = await client.get(`/api/v1/tags/${encodeURIComponent(tag)}/sections/`, {
      params: { max_id: '', tab: 'recent', page: 1 },
    })

    const data = res?.data
    const postIds: string[] = []
    const userIds: string[] = []

    // Extract media IDs and user IDs from sections
    if (data?.sections) {
      for (const section of data.sections) {
        const medias = section?.layout_content?.medias ?? []
        for (const item of medias) {
          const media = item?.media
          if (media?.pk) {
            postIds.push(String(media.pk))
          }
          if (media?.user?.pk) {
            const uid = String(media.user.pk)
            if (!userIds.includes(uid)) userIds.push(uid)
          }
        }
      }
    }

    // Fallback: try top search endpoint
    if (postIds.length === 0) {
      const searchRes = await client.get('/api/v1/web/search/topsearch/', {
        params: { query: query, context: 'blended' },
      })
      const searchData = searchRes?.data
      if (searchData?.users) {
        for (const u of searchData.users) {
          const uid = String(u?.user?.pk ?? '')
          if (uid && !userIds.includes(uid)) userIds.push(uid)
        }
      }
    }

    return {
      postIds: postIds.slice(0, limit),
      userIds: userIds.slice(0, limit),
    }
  } catch (e: any) {
    console.error('[InstagramFinder] Search error:', e?.message)
    return { postIds: [], userIds: [] }
  }
}
