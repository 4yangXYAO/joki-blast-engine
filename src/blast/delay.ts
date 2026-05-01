/**
 * Blast Runner — delay utilities.
 *
 * Provides random delays between actions to simulate natural behavior.
 * Comment actions: 20–40 seconds
 * Chat/DM actions: 35–60 seconds (longer to avoid detection)
 */

/**
 * Return a random delay in milliseconds for the given action type.
 * - comment: 20_000 – 40_000 ms
 * - chat:    35_000 – 60_000 ms
 */
export function getDelay(action: 'comment' | 'chat'): number {
  if (action === 'chat') {
    // 35–60 seconds
    return 35_000 + Math.floor(Math.random() * 25_001)
  }
  // comment: 20–40 seconds
  return 20_000 + Math.floor(Math.random() * 20_001)
}

/**
 * Sleep for the given number of milliseconds.
 * Returns a promise that resolves after the delay.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
