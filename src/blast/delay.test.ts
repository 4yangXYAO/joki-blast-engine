import { describe, it, expect } from 'vitest'
import { getDelay, sleep } from './delay'

describe('getDelay', () => {
  it('returns a number between 20000 and 40000 for comment', () => {
    for (let i = 0; i < 50; i++) {
      const d = getDelay('comment')
      expect(d).toBeGreaterThanOrEqual(20_000)
      expect(d).toBeLessThanOrEqual(40_000)
    }
  })

  it('returns a number between 35000 and 60000 for chat', () => {
    for (let i = 0; i < 50; i++) {
      const d = getDelay('chat')
      expect(d).toBeGreaterThanOrEqual(35_000)
      expect(d).toBeLessThanOrEqual(60_000)
    }
  })

  it('returns an integer', () => {
    const d = getDelay('comment')
    expect(Number.isInteger(d)).toBe(true)
  })
})

describe('sleep', () => {
  it('resolves after the given delay', async () => {
    const start = Date.now()
    await sleep(50)
    const elapsed = Date.now() - start
    expect(elapsed).toBeGreaterThanOrEqual(40) // allow small timing variance
  })

  it('returns a promise', () => {
    const result = sleep(0)
    expect(result).toBeInstanceOf(Promise)
  })
})
