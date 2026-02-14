/**
 * State Configuration Loader
 * Loads state-specific configuration from JSON files
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let statesConfig = null;
let electionRulesConfig = null;
let dataSourceConfig = null;

/**
 * Load state configuration files
 */
function loadConfig() {
  if (!statesConfig) {
    const configPath = join(__dirname, '../../config/states');
    
    try {
      statesConfig = JSON.parse(
        readFileSync(join(configPath, 'states.json'), 'utf8')
      );
      electionRulesConfig = JSON.parse(
        readFileSync(join(configPath, 'electionRules.json'), 'utf8')
      );
      dataSourceConfig = JSON.parse(
        readFileSync(join(configPath, 'dataSourceConfig.json'), 'utf8')
      );
    } catch (error) {
      // Return empty configs on error - config loading failures are handled gracefully
      statesConfig = { states: {} };
      electionRulesConfig = { default: {} };
      dataSourceConfig = { default: {} };
    }
  }
}

/**
 * Get state metadata
 * @param {string} stateCode - Two-letter state code
 * @returns {Object} State metadata
 */
export function getStateMetadata(stateCode) {
  loadConfig();
  const normalizedCode = stateCode.toUpperCase();
  return statesConfig.states[normalizedCode] || null;
}

/**
 * Get election rules for a state
 * @param {string} stateCode - Two-letter state code
 * @returns {Object} Election rules (merged with defaults)
 */
export function getElectionRules(stateCode) {
  loadConfig();
  const normalizedCode = stateCode.toUpperCase();
  const defaultRules = electionRulesConfig.default || {};
  const stateRules = electionRulesConfig[normalizedCode] || {};
  
  return {
    ...defaultRules,
    ...stateRules,
  };
}

/**
 * Get data source configuration for a state
 * @param {string} stateCode - Two-letter state code
 * @returns {Object} Data source configuration
 */
export function getDataSourceConfig(stateCode) {
  loadConfig();
  const normalizedCode = stateCode.toUpperCase();
  const defaultConfig = dataSourceConfig.default || {};
  const stateConfig = dataSourceConfig[normalizedCode] || {};
  
  return {
    ...defaultConfig,
    ...stateConfig,
  };
}

/**
 * Reload configuration (useful for testing or runtime updates)
 */
export function reloadConfig() {
  statesConfig = null;
  electionRulesConfig = null;
  dataSourceConfig = null;
  loadConfig();
}

export default {
  getStateMetadata,
  getElectionRules,
  getDataSourceConfig,
  reloadConfig,
};
