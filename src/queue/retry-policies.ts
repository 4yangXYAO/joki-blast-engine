export interface RetryPolicy {
  maxRetries: number
  baseDelay: number
  multiplier: number
  jitter: number
}

export const RETRY_POLICIES: Record<string, RetryPolicy> = {
  whatsapp: { maxRetries: 5, baseDelay: 1000, multiplier: 2, jitter: 0.1 },
  telegram: { maxRetries: 3, baseDelay: 500, multiplier: 2, jitter: 0.1 },
  twitter: { maxRetries: 5, baseDelay: 2000, multiplier: 1.5, jitter: 0.1 },
  threads: { maxRetries: 4, baseDelay: 1500, multiplier: 2, jitter: 0.1 },
  instagram: { maxRetries: 4, baseDelay: 1500, multiplier: 2, jitter: 0.1 },
  facebook: { maxRetries: 50, baseDelay: 1000, multiplier: 1.2, jitter: 0.1 },
  default: { maxRetries: 3, baseDelay: 1000, multiplier: 2, jitter: 0.1 },
}

export function getPolicyForPlatform(platform: string): RetryPolicy {
  return RETRY_POLICIES[platform] || RETRY_POLICIES.default
}
