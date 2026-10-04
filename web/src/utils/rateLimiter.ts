class RateLimiter {
  private timestamps: number[] = [];
  private limit: number;
  private windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  checkLimit(): boolean {
    const now = Date.now();
    // Remove timestamps that are older than the window
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
    
    if (this.timestamps.length >= this.limit) {
      return false; // Rate limit exceeded
    }
    
    this.timestamps.push(now);
    return true;
  }
}

// Global instance for search API to prevent exceeding iTunes API limits
// Limit to 10 requests per minute (very safe for iTunes public API)
export const searchRateLimiter = new RateLimiter(10, 60000);
