/**
 * Data Source Adapter Factory
 * Creates appropriate adapter based on source type
 * Google Civic API removed (deprecated April 2025)
 */

import { DbOnlyAdapter } from './dbOnlyAdapter.js';

const adapters = new Map();

/**
 * Register an adapter
 * @param {string} sourceType - Source type identifier
 * @param {Class} AdapterClass - Adapter class
 */
export function registerAdapter(sourceType, AdapterClass) {
  adapters.set(sourceType, AdapterClass);
}

/**
 * Get adapter instance for a source type
 * @param {string} sourceType - Source type identifier
 * @returns {Object} Adapter instance
 */
export function getAdapter(sourceType) {
  if (!adapters.has(sourceType)) {
    throw new Error(`No adapter registered for source type: ${sourceType}`);
  }

  const AdapterClass = adapters.get(sourceType);
  
  // Return singleton instance (adapters are stateless)
  if (!AdapterClass._instance) {
    AdapterClass._instance = new AdapterClass();
  }

  return AdapterClass._instance;
}

// Register adapters
registerAdapter('db_only', DbOnlyAdapter);

export default {
  registerAdapter,
  getAdapter,
};
