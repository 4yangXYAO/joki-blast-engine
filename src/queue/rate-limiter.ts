export interface RateLimitQuota {
  capacity: number;
  refillRate: number; // tokens per second
}

export const PLATFORM_QUOTAS: Record<string, RateLimitQuota> = {
  whatsapp: { capacity: 80, refillRate: 80 },
  telegram: { capacity: 30, refillRate: 30 },
  twitter: { capacity: 15, refillRate: 1 }, // Conservative default for Twitter
  threads: { capacity: 200, refillRate: 200 },
  instagram: { capacity: 50, refillRate: 10 },
  default: { capacity: 10, refillRate: 1 }
};

export class RateLimiter {
  private buckets: Map<string, { tokens: number; lastRefill: number; blockedUntil?: number }> = new Map();

  private getBucket(platform: string) {
    if (!this.buckets.has(platform)) {
      const quota = PLATFORM_QUOTAS[platform] || PLATFORM_QUOTAS.default;
      this.buckets.set(platform, {
        tokens: quota.capacity,
        lastRefill: Date.now()
      });
    }
    return this.buckets.get(platform)!;
  }

  private refill(platform: string) {
    const bucket = this.getBucket(platform);
    const quota = PLATFORM_QUOTAS[platform] || PLATFORM_QUOTAS.default;
    const now = Date.now();
    const elapsed = (now - bucket.lastRefill) / 1000;
    
    if (elapsed > 0) {
      bucket.tokens = Math.min(quota.capacity, bucket.tokens + elapsed * quota.refillRate);
      bucket.lastRefill = now;
    }
  }

  public canProceed(platform: string): boolean {
    const bucket = this.getBucket(platform);
    if (bucket.blockedUntil && Date.now() < bucket.blockedUntil) {
      return false;
    }
    this.refill(platform);
    return bucket.tokens >= 1;
  }

  public consume(platform: string): boolean {
    if (this.canProceed(platform)) {
      const bucket = this.getBucket(platform);
      bucket.tokens -= 1;
      return true;
    }
    return false;
  }

  public blockFor(platform: string, seconds: number) {
    const bucket = this.getBucket(platform);
    bucket.blockedUntil = Date.now() + seconds * 1000;
    bucket.tokens = 0; // Drain tokens when blocked
  }

  public async waitForToken(platform: string): Promise<void> {
    while (!this.consume(platform)) {
      const bucket = this.getBucket(platform);
      let waitTime = 100; // Default poll
      
      if (bucket.blockedUntil && bucket.blockedUntil > Date.now()) {
        waitTime = bucket.blockedUntil - Date.now();
      } else if (bucket.tokens < 1) {
        const quota = PLATFORM_QUOTAS[platform] || PLATFORM_QUOTAS.default;
        // Wait for at least 1 token to refill
        waitTime = Math.ceil((1 - bucket.tokens) / quota.refillRate * 1000);
      }
      
      await new Promise(resolve => setTimeout(resolve, Math.max(10, waitTime)));
    }
  }
}
