/**
 * Facebook Finder — search groups/posts and extract target IDs.
 *
 * Uses Facebook's internal GraphQL search endpoint (cookie-based).
 * Falls back to data/targets.txt if search yields no results.
 */

import { createHttpClient, parseCookies } from '../../../../utils/http-client'
import { getRandomTargets } from '../../../../utils/randomTargets'

export interface FacebookFinderResult {
  postIds: string[]
  userIds: string[]
}

/**
 * Search Facebook for group posts matching the query.
 * Extracts post IDs (for commenting) and user IDs (for DMs).
 *
 * @param query   Search term / keyword
 * @param cookie  Raw browser session cookie string
 * @param limit   Max targets to return (default 30)
 */
export async function findFacebookTargets(
  query: string,
  cookie: string,
  limit: number = 30
): Promise<FacebookFinderResult> {
  if (!cookie) {
    return fallbackToFile(limit)
  }

  const cookieHeader = parseCookies(cookie)
  const cUserMatch = cookieHeader.match(/\bc_user=([^;\s]+)/)
  const cUser = cUserMatch?.[1] ?? ''

  try {
    // Step 1: Fetch fb_dtsg
    const pageClient = createHttpClient({
      baseURL: 'https://www.facebook.com',
      timeout: 15_000,
      headers: {
        Cookie: cookieHeader,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
      },
    })

    const pageRes = await pageClient.get('/')
    const html = String(pageRes?.data || '')

    if (html.includes('"login_form"')) {
      console.warn('[FacebookFinder] Cookie expired, falling back to targets.txt')
      return fallbackToFile(limit)
    }

    const dtsgMatch =
      html.match(/"DTSGInitialData"[^}]*"token":"([^"]+)"/) ||
      html.match(/name="fb_dtsg"\s+value="([^"]+)"/) ||
      html.match(/"DTSGInitData"[^}]*"token":"([^"]+)"/)
    const fbDtsg = dtsgMatch?.[1] ?? ''
    const lsdMatch =
      html.match(/"LSD",[^,]*,"token":"([^"]+)"/) ||
      html.match(/name="lsd"\s+value="([^"]+)"/) ||
      html.match(/"lsd":"([^"]+)"/)
    const lsd = lsdMatch?.[1] ?? ''

    if (!fbDtsg) {
      console.warn('[FacebookFinder] Could not extract fb_dtsg, falling back to targets.txt')
      return fallbackToFile(limit)
    }

    // Step 2: Search posts via GraphQL
    const gqlClient = createHttpClient({
      baseURL: 'https://www.facebook.com',
      timeout: 20_000,
      headers: {
        Cookie: cookieHeader,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: '*/*',
        Origin: 'https://www.facebook.com',
        Referer: 'https://www.facebook.com/search/posts/',
        'X-FB-LSD': lsd,
      },
    })

    const params = new URLSearchParams({
      av: cUser,
      __user: cUser,
      __a: '1',
      fb_dtsg: fbDtsg,
      lsd: lsd,
      doc_id: '6012268648876713',
      variables: JSON.stringify({
        count: limit,
        query: query,
        search_surface: 'GROUP_SEARCH',
      }),
      fb_api_caller_class: 'RelayModern',
      fb_api_req_friendly_name: 'SearchCometResultsInitialResultsQuery',
    })

    const res = await gqlClient.post('/api/graphql/', params.toString())
    const responseText = String(res?.data ?? '')

    const postIds: string[] = []
    const userIds: string[] = []

    // Extract story/post IDs from response
    const postIdRegex = /"post_id":"(\d+)"/g
    const storyIdRegex = /"story_id":"(\d+)"/g
    const actorIdRegex = /"actor_id":"(\d+)"/g

    let match: RegExpExecArray | null
    while ((match = postIdRegex.exec(responseText)) !== null) {
      if (!postIds.includes(match[1])) postIds.push(match[1])
    }
    while ((match = storyIdRegex.exec(responseText)) !== null) {
      if (!postIds.includes(match[1])) postIds.push(match[1])
    }
    while ((match = actorIdRegex.exec(responseText)) !== null) {
      if (match[1] !== cUser && !userIds.includes(match[1])) userIds.push(match[1])
    }

    if (postIds.length === 0 && userIds.length === 0) {
      console.warn('[FacebookFinder] No targets from search, falling back to targets.txt')
      return fallbackToFile(limit)
    }

    return {
      postIds: postIds.slice(0, limit),
      userIds: userIds.slice(0, limit),
    }
  } catch (e: any) {
    console.error('[FacebookFinder] Search error:', e?.message)
    return fallbackToFile(limit)
  }
}

function fallbackToFile(limit: number): FacebookFinderResult {
  const targets = getRandomTargets(limit)
  // Heuristic: IDs with underscore are likely post IDs, pure numeric are user IDs
  const postIds: string[] = []
  const userIds: string[] = []
  for (const t of targets) {
    if (t.includes('_')) {
      postIds.push(t)
    } else {
      userIds.push(t)
    }
  }
  return { postIds, userIds }
}
