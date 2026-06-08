const { Redis } = require('@upstash/redis');

let redis = null;

const connectRedis = () => {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.warn('⚠️  Redis env vars missing — caching disabled, running without Redis.');
      return null;
    }

    redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    console.log('✅ Upstash Redis connected');
    return redis;
  } catch (error) {
    console.error('❌ Redis connection error:', error.message);
    return null;
  }
};

const getRedis = () => redis;

module.exports = { connectRedis, getRedis };
