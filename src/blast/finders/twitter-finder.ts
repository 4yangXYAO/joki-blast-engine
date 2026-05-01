/**
 * Twitter/X Finder — search for tweets/users via Twitter internal API.
 *
 * Uses cookie-based access to Twitter's internal GraphQL search endpoint.
 * Returns tweet IDs (for replying) and user IDs (for DMs).
 */

import { createHttpClient, parseCookies } from '../../utils/http-client'

export interface TwitterFinderResult {
  tweetIds: string[]
  userIds: string[]
}

/**
 * Search Twitter for tweets matching the query.
 *
 * @param query   Keyword or phrase to search for
 * @param cookie  Raw browser session cookie string
 * @param limit   Max targets to return (default 30)
 */
export async function findTwitterTargets(
  query: string,
  cookie: string,
  limit: number = 30
): Promise<TwitterFinderResult> {
  if (!cookie || !query) {
    return { tweetIds: [], userIds: [] }
  }

  const cookieHeader = parseCookies(cookie)
  const csrfMatch = cookieHeader.match(/ct0=([^;]+)/)
  const csrfToken = csrfMatch?.[1] ?? ''

  try {
    const client = createHttpClient({
      baseURL: 'https://twitter.com',
      timeout: 15_000,
      headers: {
        Cookie: cookieHeader,
        'X-Csrf-Token': csrfToken,
        Authorization:
          'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
        'Content-Type': 'application/json',
        'X-Twitter-Active-User': 'yes',
        'X-Twitter-Auth-Type': 'OAuth2Session',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      },
    })

    const variables = {
      rawQuery: query,
      count: Math.min(limit, 20),
      querySource: 'typed_query',
      product: 'Latest',
    }

    const features = {
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      responsive_web_graphql_timeline_navigation_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      tweetypie_unmention_optimization_enabled: true,
      responsive_web_edit_tweet_api_enabled: true,
      graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
      view_counts_everywhere_api_enabled: true,
      longform_notetweets_consumption_enabled: true,
      tweet_awards_web_tipping_enabled: false,
      freedom_of_speech_not_reach_fetch_enabled: true,
      standardized_nudges_misinfo: true,
      longform_notetweets_rich_text_read_enabled: true,
      responsive_web_enhance_cards_enabled: false,
    }

    const params = new URLSearchParams({
      variables: JSON.stringify(variables),
      features: JSON.stringify(features),
    })

    const res = await client.get(
      `/i/api/graphql/gkjsKepM6gl_HmFWoWKfgg/SearchTimeline?${params.toString()}`
    )

    const tweetIds: string[] = []
    const userIds: string[] = []

    // Parse response — Twitter nests tweets deep in timeline instructions
    const responseText = JSON.stringify(res?.data ?? {})

    // Extract tweet rest_ids
    const tweetIdRegex = /"rest_id":"(\d+)"/g
    const userIdRegex = /"user_id":"(\d+)"/g
    const screenNameRegex = /"screen_name":"([^"]+)"/g

    let match: RegExpExecArray | null
    const seen = new Set<string>()

    while ((match = tweetIdRegex.exec(responseText)) !== null) {
      if (!seen.has(match[1]) && tweetIds.length < limit) {
        seen.add(match[1])
        tweetIds.push(match[1])
      }
    }
    while ((match = userIdRegex.exec(responseText)) !== null) {
      if (!userIds.includes(match[1]) && userIds.length < limit) {
        userIds.push(match[1])
      }
    }

    return {
      tweetIds: tweetIds.slice(0, limit),
      userIds: userIds.slice(0, limit),
    }
  } catch (e: any) {
    console.error('[TwitterFinder] Search error:', e?.message)
    return { tweetIds: [], userIds: [] }
  }
}
