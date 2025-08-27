export type RetryStrategy = {
  maxRetries?: number;
  statusCodes?: number[];
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
};

export class RetryConfig {
  maxRetries: number;
  statusCodes: number[];
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;

  constructor({
    base,
    override,
  }: {
    base?: RetryStrategy | undefined;
    override?: RetryStrategy | undefined;
  }) {
    this.maxRetries = override?.maxRetries ?? base?.maxRetries ?? 5;
    this.statusCodes = override?.statusCodes ??
      base?.statusCodes ?? [
        5, // 5XX
        408, // Timeout
        409, // Conflict
        429, // Too Many Requests
      ];
    this.initialDelay = override?.initialDelay ?? base?.initialDelay ?? 500;
    this.maxDelay = override?.maxDelay ?? base?.maxDelay ?? 10000;
    this.backoffFactor = override?.backoffFactor ?? base?.backoffFactor ?? 2.0;
  }

  /**
   * Custom status code comparison to support exact match and
   * range matches
   */
  private matchesCode({
    statusCode,
    retryCode,
  }: {
    statusCode: number;
    retryCode: number;
  }): boolean {
    if (retryCode < 6) {
      // range check (e.g. 4 means 400-499)
      return (
        retryCode * 100 <= statusCode && statusCode < (retryCode + 1) * 100
      );
    } else {
      // exact match
      return statusCode === retryCode;
    }
  }

  /**
   * Checks if a retry is allowed according to the config
   */
  public shouldRetry({
    attempt,
    statusCode,
  }: {
    attempt: number;
    statusCode: number;
  }): boolean {
    return (
      attempt <= this.maxRetries &&
      this.statusCodes.some((retryCode) =>
        this.matchesCode({ statusCode, retryCode })
      )
    );
  }

  /**
   * Calculates the time (ms) the retrier should wait before the
   * next attempt according to the config
   */
  public calcNextDelay({ currDelay }: { currDelay: number }): number {
    return Math.min(this.maxDelay, currDelay * this.backoffFactor);
  }
}

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
