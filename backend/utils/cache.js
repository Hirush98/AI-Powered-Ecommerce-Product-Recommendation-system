const { getRedis } = require('../config/redis');

// TTL constants (seconds)
const TTL = {
  RECOMMENDATIONS: 30 * 60,   // 30 minutes — AI results per user
  PRODUCTS:        10 * 60,   // 10 minutes — product listings
  ANALYTICS:       5  * 60,   // 5  minutes — dashboard stats
};

/**
 * Get a value from cache.
 * Returns parsed value or null if missing / Redis unavailable.
 */
const cacheGet = async (key) => {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const value = await redis.get(key);
    return value ?? null;
  } catch (error) {
    console.error(`Cache GET error [${key}]:`, error.message);
    return null; // fail open — never crash because of cache
  }
};

/**
 * Set a value in cache with TTL.
 * Silently fails if Redis unavailable.
 */
const cacheSet = async (key, value, ttlSeconds = TTL.RECOMMENDATIONS) => {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
  } catch (error) {
    console.error(`Cache SET error [${key}]:`, error.message);
  }
};

/**
 * Delete a specific cache key.
 */
const cacheDel = async (key) => {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (error) {
    console.error(`Cache DEL error [${key}]:`, error.message);
  }
};

/**
 * Delete all keys matching a pattern.
 * Use sparingly — SCAN is O(N) over all keys.
 * Example: invalidatePattern('recommendations:*')
 */
const invalidatePattern = async (pattern) => {
  const redis = getRedis();
  if (!redis) return;

  try {
    let cursor = 0;
    do {
      const result = await redis.scan(cursor, { match: pattern, count: 100 });
      cursor = result[0];
      const keys = result[1];
      if (keys.length > 0) {
        await Promise.all(keys.map((k) => redis.del(k)));
      }
    } while (cursor !== 0);
  } catch (error) {
    console.error(`Cache invalidatePattern error [${pattern}]:`, error.message);
  }
};

/**
 * Cache key builders — centralised so keys are consistent everywhere
 */
const CacheKeys = {
  recommendations: (userId)   => `recommendations:${userId}`,
  productList:     (queryHash) => `products:list:${queryHash}`,
  analytics:       (type)      => `analytics:${type}`,
};

module.exports = { cacheGet, cacheSet, cacheDel, invalidatePattern, CacheKeys, TTL };
