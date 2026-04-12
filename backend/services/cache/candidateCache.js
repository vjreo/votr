/**
 * Candidate Data Cache
 * Bounded in-memory LRU-style cache for candidate data per state.
 * Capped at MAX_ENTRIES to prevent unbounded memory growth on long-running servers.
 * Can be replaced with Redis for distributed / multi-instance deployments.
 */

const DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_ENTRIES = 200; // ~200 state+office combinations before eviction

// Map preserves insertion order, allowing LRU eviction by deleting the first key.
const cache = new Map();

function getCacheKey(stateCode, office = null) {
  return office
    ? `candidate:${stateCode.toUpperCase()}:${office}`
    : `candidate:${stateCode.toUpperCase()}:all`;
}

/**
 * Get cached data. Returns null if missing or expired.
 */
export function get(stateCode, office = null) {
  const key = getCacheKey(stateCode, office);
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  // Move to end (most-recently-used) for LRU semantics
  cache.delete(key);
  cache.set(key, entry);
  return entry.data;
}

/**
 * Cache candidate data. Evicts the oldest entry when the cap is reached.
 */
export function set(stateCode, data, office = null, ttl = DEFAULT_TTL) {
  const key = getCacheKey(stateCode, office);

  // Evict the oldest entry when at capacity
  if (cache.size >= MAX_ENTRIES && !cache.has(key)) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }

  cache.set(key, { data, expiresAt: Date.now() + ttl });
}

/**
 * Clear cache for a specific state (and optional office filter).
 */
export function clear(stateCode, office = null) {
  if (office) {
    cache.delete(getCacheKey(stateCode, office));
  } else {
    const prefix = `candidate:${stateCode.toUpperCase()}:`;
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) cache.delete(key);
    }
  }
}

/** Clear the entire cache. */
export function clearAll() {
  cache.clear();
}

/** Expose cache size for monitoring/health checks. */
export function size() {
  return cache.size;
}

export default { get, set, clear, clearAll, size };
