/**
 * Blast Runner — action randomization.
 *
 * Probabilistic logic:
 *   70% comment
 *   30% chat (DM)
 *
 * Avoids fixed patterns to simulate natural user behavior.
 */

import type { BlastAction } from './types'

/** Threshold for comment probability (0.0 – 1.0). */
const COMMENT_PROBABILITY = 0.7

/**
 * Pick a random action type based on configured probabilities.
 * Returns 'comment' ~70% of the time, 'chat' ~30%.
 */
export function pickAction(): BlastAction {
  return Math.random() < COMMENT_PROBABILITY ? 'comment' : 'chat'
}
