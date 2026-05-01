import { describe, it, expect } from 'vitest'
import { pickAction } from './action-picker'

describe('pickAction', () => {
  it('returns only "comment" or "chat"', () => {
    for (let i = 0; i < 100; i++) {
      const action = pickAction()
      expect(['comment', 'chat']).toContain(action)
    }
  })

  it('produces roughly 70% comment / 30% chat over 1000 calls', () => {
    let commentCount = 0
    let chatCount = 0
    const runs = 1000
    for (let i = 0; i < runs; i++) {
      const action = pickAction()
      if (action === 'comment') commentCount++
      else chatCount++
    }
    // Allow generous tolerance (±15%) due to randomness
    const commentRatio = commentCount / runs
    expect(commentRatio).toBeGreaterThan(0.55) // at least 55%
    expect(commentRatio).toBeLessThan(0.85) // at most 85%
  })

  it('returns a string', () => {
    const action = pickAction()
    expect(typeof action).toBe('string')
  })
})
