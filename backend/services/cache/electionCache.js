/**
 * Election Data Cache
 * Simple in-memory cache for election data per state
 * Can be replaced with Redis for distributed systems
 */

const cache = new Map();
const DEFAULT_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Cache entry structure
 * {
 *   data: any,
 *   expiresAt: number (timestamp)
 * }
 */

/**
 * Get cache key for state
 * @param {string} stateCode - State code
 * @param {string} key - Additional key identifier
 * @returns {string} Cache key
 */
function getCacheKey(stateCode, key = 'default') {
  return `election:${stateCode.toUpperCase()}:${key}`;
}

/**
 * Get cached election data
 * @param {string} stateCode - State code
 * @param {string} key - Cache key identifier
 * @returns {any|null} Cached data or null if expired/not found
 */
export function get(stateCode, key = 'default') {
  const cacheKey = getCacheKey(stateCode, key);
  const entry = cache.get(cacheKey);

  if (!entry) {
    return null;
  }

  // Check if expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(cacheKey);
    return null;
  }

  return entry.data;
}

/**
 * Set cached election data
 * @param {string} stateCode - State code
 * @param {any} data - Data to cache
 * @param {string} key - Cache key identifier
 * @param {number} ttl - Time to live in milliseconds (default: 1 hour)
 */
export function set(stateCode, data, key = 'default', ttl = DEFAULT_TTL) {
  const cacheKey = getCacheKey(stateCode, key);
  cache.set(cacheKey, {
    data,
    expiresAt: Date.now() + ttl,
  });
}

/**
 * Clear cache for a specific state
 * @param {string} stateCode - State code
 * @param {string} key - Optional specific key, or null to clear all for state
 */
export function clear(stateCode, key = null) {
  if (key) {
    const cacheKey = getCacheKey(stateCode, key);
    cache.delete(cacheKey);
  } else {
    // Clear all entries for this state
    const prefix = `election:${stateCode.toUpperCase()}:`;
    for (const [cacheKey] of cache.entries()) {
      if (cacheKey.startsWith(prefix)) {
        cache.delete(cacheKey);
      }
    }
  }
}

/**
 * Clear all cache
 */
export function clearAll() {
  cache.clear();
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export function getStats() {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;

  for (const entry of cache.values()) {
    if (now > entry.expiresAt) {
      expiredEntries++;
    } else {
      validEntries++;
    }
  }

  return {
    totalEntries: cache.size,
    validEntries,
    expiredEntries,
  };
}

export default {
  get,
  set,
  clear,
  clearAll,
  getStats,
};
