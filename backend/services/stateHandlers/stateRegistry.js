/**
 * State Registry
 * Factory for creating and caching state handlers
 * Implements lazy loading and singleton pattern per state
 *
 * SCOPE: Currently NC-only (Mecklenburg County 2026 midterms).
 * Other state handlers can be added here when the product expands.
 *
 * AGENT-LAYER SEAM: This registry is the extension point for adding
 * state-specific ballot data adapters. Each handler encapsulates:
 * - Election rules (early voting, registration deadlines)
 * - Data sources (Open States, curated DB, future APIs)
 * - Office structure (federal, state, local levels)
 */

import { BaseStateHandler } from './baseStateHandler.js';
import { DefaultStateHandler } from './handlers/defaultStateHandler.js';
import { NCStateHandler } from './handlers/ncStateHandler.js';

// Cache for state handler instances
const handlerCache = new Map();

/**
 * Registry of available state handlers.
 * NC is the only active handler for the 2026 dogfood.
 */
const handlerRegistry = {
  NC: NCStateHandler,
};

/**
 * Get state handler for a given state code
 * @param {string} stateCode - Two-letter state code (e.g., 'NC', 'CA')
 * @returns {BaseStateHandler} State handler instance
 */
export function getStateHandler(stateCode) {
  if (!stateCode) {
    throw new Error('State code is required');
  }

  const normalizedCode = stateCode.toUpperCase();

  // Return cached handler if available
  if (handlerCache.has(normalizedCode)) {
    return handlerCache.get(normalizedCode);
  }

  // Get handler class from registry or use default
  const HandlerClass = handlerRegistry[normalizedCode] || DefaultStateHandler;

  // Create and cache handler instance
  const handler = new HandlerClass(normalizedCode);
  handlerCache.set(normalizedCode, handler);

  return handler;
}

/**
 * Register a new state handler
 * @param {string} stateCode - Two-letter state code
 * @param {Class} HandlerClass - Handler class extending BaseStateHandler
 */
export function registerStateHandler(stateCode, HandlerClass) {
  const normalizedCode = stateCode.toUpperCase();
  
  if (!HandlerClass.prototype instanceof BaseStateHandler) {
    throw new Error('Handler must extend BaseStateHandler');
  }

  handlerRegistry[normalizedCode] = HandlerClass;
  
  // Clear cache for this state if it exists
  if (handlerCache.has(normalizedCode)) {
    handlerCache.delete(normalizedCode);
  }
}

/**
 * Clear handler cache (useful for testing or config reloads)
 */
export function clearCache() {
  handlerCache.clear();
}

/**
 * Get list of supported states
 * @returns {Array<string>} Array of state codes
 */
export function getSupportedStates() {
  return Object.keys(handlerRegistry);
}

export default {
  getStateHandler,
  registerStateHandler,
  clearCache,
  getSupportedStates,
};
