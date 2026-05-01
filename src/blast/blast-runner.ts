/**
 * Blast Runner — sequential multi-platform blast orchestrator.
 *
 * Executes actions one at a time against a single platform:
 *  1. Load credentials for account
 *  2. Fetch targets via platform finder (or use supplied list)
 *  3. Loop up to maxActions (default 30):
 *     - Pick random action (70% comment / 30% chat)
 *     - Execute via adapter
 *     - Log result with progress (e.g. "10/30")
 *     - Apply random delay (20-40s comment, 35-60s DM)
 *     - On failure: log and skip, do NOT stop
 *  4. Return BlastResult
 *
 * Rules:
 *  - Only ONE platform per run (single provider mode)
 *  - Sequential execution only (no parallel, no multi-thread)
 *  - Max 30 actions per run (hard cap)
 */

import type {
  BlastConfig,
  BlastResult,
  BlastTarget,
  BlastAction,
  BlastLogEntry,
  BlastPlatform,
} from './types'
import { pickAction } from './action-picker'
import { getDelay, sleep } from './delay'

// ── Adapter action imports ──────────────────────────────────────────

import { postComment } from '../adapters/providers/meta/facebook/comment'
import { sendPrivateMessage } from '../adapters/providers/meta/facebook/chat'
import { sendTwitterDM } from '../adapters/providers/twitter/dm'
import { sendInstagramDM } from './actions/instagram-dm'

// ── Finder imports ──────────────────────────────────────────────────

import { findFacebookTargets } from '../adapters/providers/meta/facebook/facebook-finnder'
import { findInstagramTargets } from './finders/instagram-finder'
import { findTwitterTargets } from './finders/twitter-finder'
import { findThreadsTargets } from './finders/threads-finder'

// ── Credential resolution ───────────────────────────────────────────

import { AccountsRepo } from '../repos/accountsRepo'
import { decrypt } from '../utils/crypto'

/** Global lock — only one blast can run at a time */
let isRunning = false

export function isBlastRunning(): boolean {
  return isRunning
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

// ── Action executor per platform ────────────────────────────────────

async function executeAction(
  platform: BlastPlatform,
  action: BlastAction,
  targetId: string,
  message: string,
  cookie: string
): Promise<{ success: boolean; error?: string }> {
  switch (platform) {
    case 'facebook':
      if (action === 'comment') {
        return postComment(targetId, message, cookie)
      } else {
        return sendPrivateMessage(targetId, message, cookie)
      }

    case 'instagram':
      if (action === 'comment') {
        // Use Instagram cookie adapter's reply-to-media endpoint
        const { createHttpClient, parseCookies } = await import('../utils/http-client')
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
                'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 303.0.0.11.109',
            },
          })
          const params = new URLSearchParams({ comment_text: message })
          const res = await client.post(`/api/v1/media/${targetId}/comment/`, params.toString())
          const ok = res?.data?.status === 'ok' || res?.status === 200
          return { success: ok, error: ok ? undefined : 'IG comment failed' }
        } catch (e: any) {
          return { success: false, error: e?.message ?? 'IG comment error' }
        }
      } else {
        return sendInstagramDM(targetId, message, cookie)
      }

    case 'twitter':
      if (action === 'comment') {
        // Reply to tweet using TwitterCookieAdapter pattern
        const { createHttpClient: createClient, parseCookies: parseCk } = await import(
          '../utils/http-client'
        )
        const ckHeader = parseCk(cookie)
        const ct0Match = ckHeader.match(/ct0=([^;]+)/)
        const ct0 = ct0Match?.[1] ?? ''
        try {
          const client = createClient({
            baseURL: 'https://twitter.com',
            timeout: 15_000,
            headers: {
              Cookie: ckHeader,
              'X-Csrf-Token': ct0,
              Authorization:
                'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
              'Content-Type': 'application/json',
              'X-Twitter-Active-User': 'yes',
              'X-Twitter-Auth-Type': 'OAuth2Session',
            },
          })
          const body = {
            variables: {
              tweet_text: message,
              reply: { in_reply_to_tweet_id: targetId, exclude_reply_user_ids: [] },
              dark_request: false,
              media: { media_entities: [], possibly_sensitive: false },
              semantic_annotation_ids: [],
            },
            features: {
              tweetypie_unmention_optimization_enabled: true,
              responsive_web_edit_tweet_api_enabled: true,
              graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
              view_counts_everywhere_api_enabled: true,
              longform_notetweets_consumption_enabled: true,
              tweet_awards_web_tipping_enabled: false,
              freedom_of_speech_not_reach_fetch_enabled: true,
              standardized_nudges_misinfo: true,
              longform_notetweets_rich_text_read_enabled: true,
              responsive_web_graphql_exclude_directive_enabled: true,
              verified_phone_label_enabled: false,
              responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
              responsive_web_graphql_timeline_navigation_enabled: true,
              responsive_web_enhance_cards_enabled: false,
            },
            queryId: 'SoVnbfCycZ7fERGCwpZkYA',
          }
          const res = await client.post(
            '/i/api/graphql/SoVnbfCycZ7fERGCwpZkYA/CreateTweet',
            body
          )
          const tweetId = res?.data?.data?.create_tweet?.tweet_results?.result?.rest_id
          return { success: !!tweetId, error: tweetId ? undefined : 'Twitter reply failed' }
        } catch (e: any) {
          return { success: false, error: e?.message ?? 'Twitter reply error' }
        }
      } else {
        return sendTwitterDM(targetId, message, cookie)
      }

    case 'threads':
      if (action === 'comment') {
        // Reply to thread using ThreadsCookieAdapter pattern
        const { createHttpClient: createCl, parseCookies: parseCookiesTh } = await import(
          '../utils/http-client'
        )
        const thCookie = parseCookiesTh(cookie)
        const thCsrf = thCookie.match(/csrftoken=([^;]+)/)?.[1] ?? ''
        try {
          const client = createCl({
            baseURL: 'https://www.threads.net',
            timeout: 15_000,
            headers: {
              Cookie: thCookie,
              'X-CSRFToken': thCsrf,
              'X-IG-App-ID': '238260118697367',
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent':
                'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 303.0.0.11.109',
            },
          })
          const params = new URLSearchParams({
            text_post_app_info: JSON.stringify({ reply_control: 0, replied_to_id: targetId }),
            source_type: '4',
            caption: message,
            upload_id: String(Date.now()),
          })
          const res = await client.post(
            '/api/v1/media/configure_text_post_app_feed/',
            params.toString()
          )
          const ok = res?.data?.status === 'ok' || res?.status === 200
          return { success: ok, error: ok ? undefined : 'Threads reply failed' }
        } catch (e: any) {
          return { success: false, error: e?.message ?? 'Threads reply error' }
        }
      } else {
        // Threads DM not widely supported — log as unsupported
        return { success: false, error: 'Threads DM not supported' }
      }

    case 'whatsapp':
      // WhatsApp is chat-only, handled via adapter sendMessage
      // Import dynamically to avoid circular
      try {
        const { WhatsAppAdapter } = await import(
          '../adapters/providers/meta/Whatsapp/whatsapp'
        )
        const adapter = new WhatsAppAdapter({ mode: 'cloud-api' })
        await adapter.connect()
        const result = await adapter.sendMessage(targetId, message)
        await adapter.disconnect()
        return result
      } catch (e: any) {
        return { success: false, error: e?.message ?? 'WhatsApp error' }
      }

    default:
      return { success: false, error: `Unsupported platform: ${platform}` }
  }
}

// ── Target fetching ─────────────────────────────────────────────────

async function fetchTargets(
  platform: BlastPlatform,
  cookie: string,
  searchQuery: string,
  limit: number
): Promise<BlastTarget[]> {
  const targets: BlastTarget[] = []

  switch (platform) {
    case 'facebook': {
      const result = await findFacebookTargets(searchQuery, cookie, limit)
      for (const postId of result.postIds) {
        targets.push({ id: postId, action: 'comment' })
      }
      for (const userId of result.userIds) {
        targets.push({ id: userId, action: 'chat' })
      }
      break
    }
    case 'instagram': {
      const result = await findInstagramTargets(searchQuery, cookie, limit)
      for (const postId of result.postIds) {
        targets.push({ id: postId, action: 'comment' })
      }
      for (const userId of result.userIds) {
        targets.push({ id: userId, action: 'chat' })
      }
      break
    }
    case 'twitter': {
      const result = await findTwitterTargets(searchQuery, cookie, limit)
      for (const tweetId of result.tweetIds) {
        targets.push({ id: tweetId, action: 'comment' })
      }
      for (const userId of result.userIds) {
        targets.push({ id: userId, action: 'chat' })
      }
      break
    }
    case 'threads': {
      const result = await findThreadsTargets(searchQuery, cookie, limit)
      for (const postId of result.postIds) {
        targets.push({ id: postId, action: 'comment' })
      }
      for (const userId of result.userIds) {
        targets.push({ id: userId, action: 'chat' })
      }
      break
    }
    default:
      break
  }

  // Shuffle targets (Fisher-Yates)
  for (let i = targets.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[targets[i], targets[j]] = [targets[j], targets[i]]
  }

  return targets.slice(0, limit)
}

// ── Main blast runner ───────────────────────────────────────────────

const MAX_ACTIONS_CAP = 30

/**
 * Run a blast against a single platform.
 *
 * - Sequential only (one action at a time)
 * - Max 30 actions per run
 * - Random delay between actions
 * - On failure: log and skip (no stop)
 * - Only one blast can run at a time (global lock)
 *
 * @param config  Blast configuration
 * @param deps    Optional DI overrides (for testing)
 */
export async function runBlast(
  config: BlastConfig,
  deps?: {
    executeAction?: typeof executeAction
    fetchTargets?: typeof fetchTargets
    sleep?: typeof sleep
    getDelay?: typeof getDelay
    pickAction?: typeof pickAction
    resolveCredentials?: (accountId: string) => string
  }
): Promise<BlastResult> {
  if (isRunning) {
    return {
      platform: config.platform,
      total: 0,
      success: 0,
      failed: 0,
      log: [{ index: 0, targetId: '', action: 'comment', ok: false, error: 'Another blast is already running' }],
    }
  }

  isRunning = true

  const exec = deps?.executeAction ?? executeAction
  const fetch = deps?.fetchTargets ?? fetchTargets
  const doSleep = deps?.sleep ?? sleep
  const doGetDelay = deps?.getDelay ?? getDelay
  const doPickAction = deps?.pickAction ?? pickAction

  const maxActions = Math.min(config.maxActions ?? MAX_ACTIONS_CAP, MAX_ACTIONS_CAP)
  const log: BlastLogEntry[] = []
  let successCount = 0
  let failedCount = 0

  try {
    // Resolve credentials
    let cookie = ''
    if (deps?.resolveCredentials) {
      cookie = deps.resolveCredentials(config.accountId)
    } else {
      try {
        const accountsRepo = new AccountsRepo()
        const account = accountsRepo.findById(config.accountId)
        if (!account) {
          return {
            platform: config.platform,
            total: 0,
            success: 0,
            failed: 0,
            log: [{ index: 0, targetId: '', action: 'comment', ok: false, error: `Account not found: ${config.accountId}` }],
          }
        }
        cookie = readDecryptedCredentials(account.credentials_encrypted)
      } catch (e: any) {
        return {
          platform: config.platform,
          total: 0,
          success: 0,
          failed: 0,
          log: [{ index: 0, targetId: '', action: 'comment', ok: false, error: `Failed to load account: ${e?.message}` }],
        }
      }
    }

    // Build targets
    let targets: BlastTarget[] = []

    if (config.platform === 'whatsapp') {
      // WhatsApp: use supplied phone numbers, chat-only
      const phones = config.targets ?? []
      targets = phones.map((p) => ({ id: p, action: 'chat' as BlastAction }))
    } else if (config.targets && config.targets.length > 0) {
      // User-supplied targets
      targets = config.targets.map((t) => ({
        id: t,
        action: doPickAction(),
      }))
    } else {
      // Fetch from platform finder
      targets = await fetch(
        config.platform,
        cookie,
        config.searchQuery ?? '',
        maxActions
      )
    }

    if (targets.length === 0) {
      return {
        platform: config.platform,
        total: 0,
        success: 0,
        failed: 0,
        log: [{ index: 0, targetId: '', action: 'comment', ok: false, error: 'No targets found' }],
      }
    }

    // Sequential execution loop
    const actionCount = Math.min(targets.length, maxActions)

    for (let i = 0; i < actionCount; i++) {
      const target = targets[i]
      const action = config.platform === 'whatsapp' ? 'chat' : target.action

      console.log(`[blast] ${config.platform} | ${i + 1}/${actionCount} | ${action} → ${target.id}`)

      try {
        const result = await exec(config.platform, action, target.id, config.message, cookie)
        if (result.success) {
          successCount++
          log.push({ index: i + 1, targetId: target.id, action, ok: true })
          console.log(`[blast] ✓ ${i + 1}/${actionCount} success`)
        } else {
          failedCount++
          log.push({ index: i + 1, targetId: target.id, action, ok: false, error: result.error })
          console.log(`[blast] ✗ ${i + 1}/${actionCount} failed: ${result.error}`)
        }
      } catch (e: any) {
        // On failure: log and skip (do NOT stop)
        failedCount++
        log.push({ index: i + 1, targetId: target.id, action, ok: false, error: e?.message ?? 'Unknown error' })
        console.log(`[blast] ✗ ${i + 1}/${actionCount} error: ${e?.message}`)
      }

      // Apply delay (skip after last action)
      if (i < actionCount - 1) {
        const delayMs = doGetDelay(action)
        console.log(`[blast] waiting ${Math.round(delayMs / 1000)}s...`)
        await doSleep(delayMs)
      }
    }

    return {
      platform: config.platform,
      total: actionCount,
      success: successCount,
      failed: failedCount,
      log,
    }
  } finally {
    isRunning = false
  }
}

/** Reset running state (for testing) */
export function resetBlastState() {
  isRunning = false
}
