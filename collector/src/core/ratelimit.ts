import type { RateLimitLike } from "./types.js";

/** Token bucket đơn giản, mỗi nguồn một budget riêng. */
export class TokenBucket implements RateLimitLike {
  private tokens: number;
  private lastRefill = Date.now();

  constructor(
    private readonly ratePerSec: number,
    private readonly capacity = Math.max(1, ratePerSec),
  ) {
    this.tokens = this.capacity;
  }

  async take(n = 1): Promise<void> {
    for (;;) {
      const now = Date.now();
      this.tokens = Math.min(
        this.capacity,
        this.tokens + ((now - this.lastRefill) / 1000) * this.ratePerSec,
      );
      this.lastRefill = now;
      if (this.tokens >= n) {
        this.tokens -= n;
        return;
      }
      const waitMs = Math.ceil(((n - this.tokens) / this.ratePerSec) * 1000);
      await new Promise((r) => setTimeout(r, Math.min(waitMs, 5000)));
    }
  }
}
