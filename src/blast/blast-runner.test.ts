import { describe, it, expect, beforeEach, vi } from 'vitest'
import { runBlast, resetBlastState } from './blast-runner'
import type { BlastConfig, BlastAction, BlastTarget, BlastPlatform } from './types'

// Mock all heavy dependencies to avoid real network/db calls
vi.mock('../adapters/providers/meta/facebook/comment', () => ({
  postComment: vi.fn().mockResolvedValue({ success: true }),
}))
vi.mock('../adapters/providers/meta/facebook/chat', () => ({
  sendPrivateMessage: vi.fn().mockResolvedValue({ success: true }),
}))
vi.mock('../adapters/providers/twitter/dm', () => ({
  sendTwitterDM: vi.fn().mockResolvedValue({ success: true }),
}))
vi.mock('./actions/instagram-dm', () => ({
  sendInstagramDM: vi.fn().mockResolvedValue({ success: true }),
}))
vi.mock('../adapters/providers/meta/facebook/facebook-finnder', () => ({
  findFacebookTargets: vi.fn().mockResolvedValue({ postIds: [], userIds: [] }),
}))
vi.mock('./finders/instagram-finder', () => ({
  findInstagramTargets: vi.fn().mockResolvedValue({ postIds: [], userIds: [] }),
}))
vi.mock('./finders/twitter-finder', () => ({
  findTwitterTargets: vi.fn().mockResolvedValue({ tweetIds: [], userIds: [] }),
}))
vi.mock('./finders/threads-finder', () => ({
  findThreadsTargets: vi.fn().mockResolvedValue({ postIds: [], userIds: [] }),
}))
vi.mock('../repos/accountsRepo', () => ({
  AccountsRepo: vi.fn().mockImplementation(() => ({
    findById: vi.fn().mockReturnValue({
      id: 'acc1',
      platform: 'facebook',
      credentials_encrypted: 'c_user=123; xs=abc',
    }),
  })),
}))
vi.mock('../utils/crypto', () => ({
  decrypt: vi.fn().mockImplementation((v: string) => v),
}))

beforeEach(() => {
  vi.clearAllMocks()
  resetBlastState()
})

function makeMockDeps(overrides?: Partial<Parameters<typeof runBlast>[1]>) {
  const executedActions: Array<{ platform: BlastPlatform; action: BlastAction; targetId: string }> = []
  return {
    deps: {
      executeAction: vi.fn().mockImplementation(
        async (platform: BlastPlatform, action: BlastAction, targetId: string) => {
          executedActions.push({ platform, action, targetId })
          return { success: true }
        }
      ),
      fetchTargets: vi.fn().mockImplementation(
        async (_p: BlastPlatform, _c: string, _q: string, limit: number): Promise<BlastTarget[]> => {
          const targets: BlastTarget[] = []
          for (let i = 0; i < Math.min(limit, 10); i++) {
            targets.push({ id: `target-${i}`, action: i % 3 === 0 ? 'chat' : 'comment' })
          }
          return targets
        }
      ),
      sleep: vi.fn().mockResolvedValue(undefined),
      getDelay: vi.fn().mockReturnValue(100),
      pickAction: vi.fn().mockReturnValue('comment' as BlastAction),
      resolveCredentials: vi.fn().mockReturnValue('c_user=123; xs=abc'),
      ...overrides,
    },
    executedActions,
  }
}

describe('runBlast', () => {
  it('respects maxActions cap of 30', async () => {
    const { deps } = makeMockDeps({
      fetchTargets: vi.fn().mockResolvedValue(
        Array.from({ length: 50 }, (_, i) => ({ id: `t-${i}`, action: 'comment' as BlastAction }))
      ),
    })

    const config: BlastConfig = {
      platform: 'facebook',
      accountId: 'acc1',
      message: 'Hello',
      maxActions: 100, // should be capped to 30
    }

    const result = await runBlast(config, deps)
    expect(result.total).toBeLessThanOrEqual(30)
    expect(deps.executeAction).toHaveBeenCalledTimes(result.total)
  })

  it('executes actions sequentially', async () => {
    const callOrder: number[] = []
    const { deps } = makeMockDeps({
      executeAction: vi.fn().mockImplementation(async () => {
        callOrder.push(Date.now())
        return { success: true }
      }),
    })

    const config: BlastConfig = {
      platform: 'facebook',
      accountId: 'acc1',
      message: 'Test',
      maxActions: 5,
    }

    await runBlast(config, deps)
    // Verify sequential: each call should be after the previous
    for (let i = 1; i < callOrder.length; i++) {
      expect(callOrder[i]).toBeGreaterThanOrEqual(callOrder[i - 1])
    }
  })

  it('logs progress correctly', async () => {
    const { deps } = makeMockDeps()
    const config: BlastConfig = {
      platform: 'facebook',
      accountId: 'acc1',
      message: 'Hello',
      maxActions: 5,
    }

    const result = await runBlast(config, deps)
    expect(result.log.length).toBe(result.total)
    for (let i = 0; i < result.log.length; i++) {
      expect(result.log[i].index).toBe(i + 1)
      expect(result.log[i].ok).toBe(true)
    }
  })

  it('handles errors gracefully — logs and skips, does not stop', async () => {
    let callCount = 0
    const { deps } = makeMockDeps({
      executeAction: vi.fn().mockImplementation(async () => {
        callCount++
        if (callCount === 2) {
          return { success: false, error: 'Simulated failure' }
        }
        if (callCount === 4) {
          throw new Error('Network crash')
        }
        return { success: true }
      }),
    })

    const config: BlastConfig = {
      platform: 'facebook',
      accountId: 'acc1',
      message: 'Test',
      maxActions: 5,
    }

    const result = await runBlast(config, deps)
    expect(result.total).toBe(5)
    expect(result.success).toBe(3)
    expect(result.failed).toBe(2)
    // Failed entries should have errors
    const failedEntries = result.log.filter((e) => !e.ok)
    expect(failedEntries.length).toBe(2)
    expect(failedEntries[0].error).toBe('Simulated failure')
    expect(failedEntries[1].error).toBe('Network crash')
  })

  it('applies delays between actions', async () => {
    const { deps } = makeMockDeps()
    const config: BlastConfig = {
      platform: 'facebook',
      accountId: 'acc1',
      message: 'Test',
      maxActions: 3,
    }

    await runBlast(config, deps)
    // sleep should be called (total - 1) times (not after last action)
    expect(deps.sleep).toHaveBeenCalledTimes(2)
  })

  it('rejects concurrent blasts', async () => {
    const { deps } = makeMockDeps({
      executeAction: vi.fn().mockImplementation(async () => {
        await new Promise((r) => setTimeout(r, 50))
        return { success: true }
      }),
    })

    const config: BlastConfig = {
      platform: 'facebook',
      accountId: 'acc1',
      message: 'Test',
      maxActions: 3,
    }

    // Start first blast (don't await yet)
    const blast1 = runBlast(config, deps)
    // Try second blast immediately
    const blast2Result = await runBlast(config, deps)

    expect(blast2Result.total).toBe(0)
    expect(blast2Result.log[0].error).toContain('Another blast is already running')

    await blast1 // cleanup
  })

  it('uses supplied targets for WhatsApp', async () => {
    const { deps, executedActions } = makeMockDeps({
      executeAction: vi.fn().mockImplementation(
        async (platform: BlastPlatform, action: BlastAction, targetId: string) => {
          executedActions.push({ platform, action, targetId })
          return { success: true }
        }
      ),
    })
    const executedActionsRef = executedActions

    const config: BlastConfig = {
      platform: 'whatsapp',
      accountId: 'acc1',
      message: 'Hello from WA',
      targets: ['6281234567890', '6281234567891', '6281234567892'],
    }

    const result = await runBlast(config, deps)
    expect(result.total).toBe(3)
    expect(result.platform).toBe('whatsapp')
    // All actions should be 'chat' for WhatsApp
    for (const entry of result.log) {
      expect(entry.action).toBe('chat')
    }
    // fetchTargets should NOT be called for WhatsApp
    expect(deps.fetchTargets).not.toHaveBeenCalled()
  })

  it('returns empty result when no targets found', async () => {
    const { deps } = makeMockDeps({
      fetchTargets: vi.fn().mockResolvedValue([]),
    })

    const config: BlastConfig = {
      platform: 'instagram',
      accountId: 'acc1',
      message: 'Test',
    }

    const result = await runBlast(config, deps)
    expect(result.total).toBe(0)
    expect(result.log[0].error).toBe('No targets found')
  })

  it('resets running state after blast completes', async () => {
    const { deps } = makeMockDeps()
    const config: BlastConfig = {
      platform: 'facebook',
      accountId: 'acc1',
      message: 'Test',
      maxActions: 2,
    }

    await runBlast(config, deps)
    // Should be able to run another blast now
    const result2 = await runBlast(config, deps)
    expect(result2.total).toBeGreaterThan(0)
  })
})
