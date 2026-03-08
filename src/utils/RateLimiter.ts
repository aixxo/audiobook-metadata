/**
 * Token Bucket Rate Limiter
 * Limits the rate of operations (e.g., API calls) to prevent overwhelming external services
 */
export class RateLimiter {
	private tokens: number;
	private readonly maxTokens: number;
	private readonly refillRate: number; // tokens per millisecond
	private lastRefill: number;
	private readonly queue: Array<() => void> = [];
	private processing = false;

	/**
	 * Create a new rate limiter
	 * @param requestsPerMinute Maximum number of requests allowed per minute
	 */
	constructor(requestsPerMinute: number) {
		this.maxTokens = requestsPerMinute;
		this.tokens = requestsPerMinute;
		this.refillRate = requestsPerMinute / 60000; // Convert to per millisecond
		this.lastRefill = Date.now();
	}

	/**
	 * Refill tokens based on elapsed time
	 */
	private refill(): void {
		const now = Date.now();
		const elapsed = now - this.lastRefill;
		const tokensToAdd = elapsed * this.refillRate;
		
		this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
		this.lastRefill = now;
	}

	/**
	 * Acquire a token, waiting if necessary
	 * @returns Promise that resolves when a token is available
	 */
	async acquire(): Promise<void> {
		return new Promise((resolve) => {
			this.queue.push(resolve);
			this.processQueue();
		});
	}

	/**
	 * Process the queue of waiting requests
	 */
	private processQueue(): void {
		if (this.processing || this.queue.length === 0) {
			return;
		}

		this.processing = true;
		this.refill();

		if (this.tokens >= 1) {
			this.tokens -= 1;
			const resolve = this.queue.shift();
			if (resolve) {
				resolve();
			}
			this.processing = false;
			// Process next item if available
			if (this.queue.length > 0) {
				this.processQueue();
			}
		} else {
			// Calculate wait time until next token is available
			const waitTime = (1 - this.tokens) / this.refillRate;
			setTimeout(() => {
				this.processing = false;
				this.processQueue();
			}, waitTime);
		}
	}

	/**
	 * Get current token count (for debugging/monitoring)
	 */
	getTokenCount(): number {
		this.refill();
		return this.tokens;
	}

	/**
	 * Reset the rate limiter
	 */
	reset(): void {
		this.tokens = this.maxTokens;
		this.lastRefill = Date.now();
		this.queue.length = 0;
		this.processing = false;
	}
}
