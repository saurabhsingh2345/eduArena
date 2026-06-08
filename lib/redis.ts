// Key helpers
export const REDIS_KEYS = {
  waitingQueue: (courseId: string) => `waiting:${courseId}`,
  leaderboard: (batchId: string) => `leaderboard:${batchId}`,
  batchCountdown: (courseId: string) => `countdown:${courseId}`,
  serverTime: () => 'server:time',
};

export const REDIS_TTL = {
  leaderboard: 30,
  waitingQueue: 600,
};

// ── Pure in-memory store (always used; falls back if Redis is absent) ─────────
const memStore = new Map<string, string>();
const memLists = new Map<string, string[]>();

// ── Optional Redis backing ────────────────────────────────────────────────────
// We attempt one quick ping at startup. If it fails we set redisOk = false and
// never try Redis again this process lifetime — zero log noise.
let redisOk = false;
let redisClient: import('ioredis').Redis | null = null;

async function tryRedis() {
  try {
    const Redis = (await import('ioredis')).default;
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    const client = new Redis(url, {
      connectTimeout: 1500,
      maxRetriesPerRequest: 0,
      enableOfflineQueue: false,
      lazyConnect: true,
    });
    client.on('error', () => { /* silenced */ });
    await client.connect();
    await client.ping();
    redisClient = client;
    redisOk = true;
    console.log('[redis] connected ✓');
    client.on('error', () => { redisOk = false; });
  } catch {
    console.log('[redis] not available — using in-memory store');
  }
}

// Fire once per process. In Next.js dev hot-reloads the module but the process lives on,
// so guard with a global flag.
// @ts-expect-error global
if (!global.__redisTried) {
  // @ts-expect-error global
  global.__redisTried = true;
  tryRedis();
}

// ── safeRedis — the only export callers should use ───────────────────────────
export const safeRedis = {
  async get(key: string): Promise<string | null> {
    if (redisOk && redisClient) {
      try { return await redisClient.get(key); } catch { redisOk = false; }
    }
    return memStore.get(key) ?? null;
  },

  async setex(key: string, _ttl: number, value: string): Promise<void> {
    if (redisOk && redisClient) {
      try { await redisClient.setex(key, _ttl, value); return; } catch { redisOk = false; }
    }
    memStore.set(key, value);
  },

  async lpush(key: string, value: string): Promise<void> {
    if (redisOk && redisClient) {
      try { await redisClient.lpush(key, value); return; } catch { redisOk = false; }
    }
    const list = memLists.get(key) ?? [];
    list.unshift(value);
    memLists.set(key, list);
  },

  async expire(key: string, ttl: number): Promise<void> {
    if (redisOk && redisClient) {
      try { await redisClient.expire(key, ttl); return; } catch { redisOk = false; }
    }
    // no-op for memory store
  },

  async lrange(key: string, start: number, end: number): Promise<string[]> {
    if (redisOk && redisClient) {
      try { return await redisClient.lrange(key, start, end); } catch { redisOk = false; }
    }
    const list = memLists.get(key) ?? [];
    return end === -1 ? [...list] : list.slice(start, end + 1);
  },

  async llen(key: string): Promise<number> {
    if (redisOk && redisClient) {
      try { return await redisClient.llen(key); } catch { redisOk = false; }
    }
    return (memLists.get(key) ?? []).length;
  },

  async del(key: string): Promise<void> {
    if (redisOk && redisClient) {
      try { await redisClient.del(key); return; } catch { redisOk = false; }
    }
    memStore.delete(key);
    memLists.delete(key);
  },
};

// Kept for any legacy imports — do not use directly in new code
export const redis = {
  get: safeRedis.get.bind(safeRedis),
  setex: safeRedis.setex.bind(safeRedis),
  lpush: safeRedis.lpush.bind(safeRedis),
  lrange: safeRedis.lrange.bind(safeRedis),
  llen: safeRedis.llen.bind(safeRedis),
  del: safeRedis.del.bind(safeRedis),
  expire: safeRedis.expire.bind(safeRedis),
};
