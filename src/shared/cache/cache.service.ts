import NodeCache from 'node-cache';

export class CacheService {
  private cache: NodeCache;

  constructor(stdTTL: number = 60) {
    this.cache = new NodeCache({ stdTTL, checkperiod: 10 });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set<T>(key: string, value: T, ttlSeconds?: number): void {
    if (ttlSeconds !== undefined) {
      this.cache.set(key, value, ttlSeconds);
    } else {
      this.cache.set(key, value);
    }
  }

  invalidatePattern(pattern: string): void {
    const keys = this.cache.keys();
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    keys.forEach((key) => {
      if (regex.test(key)) {
        this.cache.del(key);
      }
    });
  }

  clear(): void {
    this.cache.flushAll();
  }
}
