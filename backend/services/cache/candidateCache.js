/**
 * Candidate Data Cache
 * Simple in-memory cache for candidate data per state
 * Can be replaced with Redis for distributed systems
 */

const cache = new Map();
const DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Get cache key for state
 * @param {string} stateCode - State code
 * @param {string} office - Optional office filter
 * @returns {string} Cache key
 */
function getCacheKey(stateCode, office = null) {
  if (office) {
    return `candidate:${stateCode.toUpperCase()}:${office}`;
  }
  return `candidate:${stateCode.toUpperCase()}:all`;
}

/**
 * Get cached candidate data
 * @param {string} stateCode - State code
 * @param {string} office - Optional office filter
 * @returns {any|null} Cached data or null if expired/not found
 */
export function get(stateCode, office = null) {
  const cacheKey = getCacheKey(stateCode, office);
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
 * Set cached candidate data
 * @param {string} stateCode - State code
 * @param {any} data - Data to cache
 * @param {string} office - Optional office filter
 * @param {number} ttl - Time to live in milliseconds (default: 30 minutes)
 */
export function set(stateCode, data, office = null, ttl = DEFAULT_TTL) {
  const cacheKey = getCacheKey(stateCode, office);
  cache.set(cacheKey, {
    data,
    expiresAt: Date.now() + ttl,
  });
}

/**
 * Clear cache for a specific state
 * @param {string} stateCode - State code
 * @param {string} office - Optional specific office, or null to clear all for state
 */
export function clear(stateCode, office = null) {
  if (office) {
    const cacheKey = getCacheKey(stateCode, office);
    cache.delete(cacheKey);
  } else {
    // Clear all entries for this state
    const prefix = `candidate:${stateCode.toUpperCase()}:`;
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

export default {
  get,
  set,
  clear,
  clearAll,
};
