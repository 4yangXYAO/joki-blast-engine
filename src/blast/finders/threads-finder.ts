/**
 * Threads Finder — search for threads/users via Threads internal API.
 *
 * Uses cookie-based access to Threads (by Meta) internal endpoints.
 * Returns thread post IDs (for replying) and user IDs.
 */

import { createHttpClient, parseCookies } from '../../utils/http-client'

export interface ThreadsFinderResult {
  postIds: string[]
  userIds: string[]
}

/**
 * Search Threads for posts matching the query.
 *
 * @param query   Keyword or phrase to search for
 * @param cookie  Raw browser session cookie string
 * @param limit   Max targets to return (default 30)
 */
export async function findThreadsTargets(
  query: string,
  cookie: string,
  limit: number = 30
): Promise<ThreadsFinderResult> {
  if (!cookie || !query) {
    return { postIds: [], userIds: [] }
  }

  const cookieHeader = parseCookies(cookie)
  const csrfMatch = cookieHeader.match(/csrftoken=([^;]+)/)
  const csrfToken = csrfMatch?.[1] ?? ''

  try {
    const client = createHttpClient({
      baseURL: 'https://www.threads.net',
      timeout: 15_000,
      headers: {
        Cookie: cookieHeader,
        'X-CSRFToken': csrfToken,
        'X-IG-App-ID': '238260118697367',
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 303.0.0.11.109',
        Accept: '*/*',
      },
    })

    // Search via Threads search endpoint
    const res = await client.get('/api/v1/text_feed/recommended_search/', {
      params: { query: query },
    })

    const data = res?.data
    const postIds: string[] = []
    const userIds: string[] = []

    // Extract from search results
    if (data?.items) {
      for (const item of data.items) {
        if (item?.thread?.thread_items) {
          for (const threadItem of item.thread.thread_items) {
            const post = threadItem?.post
            if (post?.pk) {
              postIds.push(String(post.pk))
            }
            if (post?.user?.pk) {
              const uid = String(post.user.pk)
              if (!userIds.includes(uid)) userIds.push(uid)
            }
          }
        }
      }
    }

    // Fallback: try user search if no posts found
    if (postIds.length === 0 && userIds.length === 0) {
      const userRes = await client.get('/api/v1/users/search/', {
        params: { q: query },
      })
      const userData = userRes?.data
      if (userData?.users) {
        for (const u of userData.users) {
          const uid = String(u?.pk ?? '')
          if (uid && !userIds.includes(uid)) userIds.push(uid)
        }
      }
    }

    return {
      postIds: postIds.slice(0, limit),
      userIds: userIds.slice(0, limit),
    }
  } catch (e: any) {
    console.error('[ThreadsFinder] Search error:', e?.message)
    return { postIds: [], userIds: [] }
  }
}
