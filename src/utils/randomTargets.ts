import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'data')
const TARGETS_FILE = join(DATA_DIR, 'targets.txt')

const EXAMPLE_CONTENT = `# Facebook Blast Targets
# ---------------------
# One Facebook user ID or post ID per line.
# Lines starting with # are comments and are ignored.
# Blank lines are ignored.
#
# For comment blast: use post IDs (e.g. "123456789_987654321" or just "987654321")
# For chat blast: use numeric user IDs (e.g. "100012345678901")
#
# Example:
# 100012345678901
# 100023456789012
# 561234567890_123456789012345
#
# Fill this file with target IDs (one per line) then run the blast.
`

/**
 * Read targets.txt, filter comments and blank lines, return shuffled slice.
 *
 * @param count  Number of unique random targets to return.
 *               If file has fewer entries than count, returns all.
 * @returns Array of target ID strings.
 */
export function getRandomTargets(count: number): string[] {
  if (!existsSync(TARGETS_FILE)) {
    // Create example file so user knows what to do
    try {
      if (!existsSync(DATA_DIR)) {
        mkdirSync(DATA_DIR, { recursive: true })
      }
      writeFileSync(TARGETS_FILE, EXAMPLE_CONTENT, 'utf8')
    } catch {
      // Non-fatal: can't write example, just continue
    }
    console.warn(
      `[randomTargets] targets.txt not found — created example at ${TARGETS_FILE}. ` +
        'Fill it with one target ID per line and try again.'
    )
    return []
  }

  const raw = readFileSync(TARGETS_FILE, 'utf8')
  const entries = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))

  if (entries.length === 0) {
    console.warn('[randomTargets] targets.txt is empty or contains only comments.')
    return []
  }

  // Deduplicate
  const unique = [...new Set(entries)]

  // Fisher-Yates shuffle
  for (let i = unique.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[unique[i], unique[j]] = [unique[j], unique[i]]
  }

  return unique.slice(0, count)
}

/**
 * Return total number of targets in the file (excluding comments/blanks).
 */
export function countTargets(): number {
  if (!existsSync(TARGETS_FILE)) return 0
  const raw = readFileSync(TARGETS_FILE, 'utf8')
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#')).length
}

export { TARGETS_FILE }
