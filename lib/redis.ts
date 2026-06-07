import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// @ts-expect-error - global cache
const cached: { client: Redis | null } = global._redis ?? (global._redis = { client: null });

export function getRedisClient(): Redis {
  if (!cached.client) {
    cached.client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      lazyConnect: true,
    });

    cached.client.on('error', (err) => {
      console.error('Redis error:', err);
    });
  }
  return cached.client;
}

export const redis = getRedisClient();

// Key helpers with TTLs
export const REDIS_KEYS = {
  waitingQueue: (courseId: string) => `waiting:${courseId}`,
  leaderboard: (batchId: string) => `leaderboard:${batchId}`,
  batchCountdown: (courseId: string) => `countdown:${courseId}`,
  serverTime: () => 'server:time',
};

export const REDIS_TTL = {
  leaderboard: 30,      // 30 seconds
  waitingQueue: 600,    // 10 minutes
};
