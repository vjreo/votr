/**
 * State Repository
 * Data access layer for state-specific configuration and metadata
 */

import pool from '../db/connection.js';

export class StateRepository {
  /**
   * Get state configuration
   * @param {string} stateCode - Two-letter state code
   * @param {string} configKey - Configuration key
   * @returns {Promise<Object|null>} Configuration value or null
   */
  async getConfig(stateCode, configKey) {
    const query = `
      SELECT config_value 
      FROM state_config 
      WHERE state_code = $1 AND config_key = $2
    `;
    const result = await pool.query(query, [stateCode.toUpperCase(), configKey]);
    return result.rows[0]?.config_value || null;
  }

  /**
   * Set state configuration
   * @param {string} stateCode - Two-letter state code
   * @param {string} configKey - Configuration key
   * @param {any} configValue - Configuration value (will be JSON stringified)
   * @returns {Promise<Object>} Updated configuration
   */
  async setConfig(stateCode, configKey, configValue) {
    const query = `
      INSERT INTO state_config (state_code, config_key, config_value)
      VALUES ($1, $2, $3)
      ON CONFLICT (state_code, config_key)
      DO UPDATE SET
        config_value = EXCLUDED.config_value,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await pool.query(query, [
      stateCode.toUpperCase(),
      configKey,
      JSON.stringify(configValue),
    ]);
    return result.rows[0];
  }

  /**
   * Get all configuration for a state
   * @param {string} stateCode - Two-letter state code
   * @returns {Promise<Object>} Object with config keys as keys
   */
  async getAllConfig(stateCode) {
    const query = `
      SELECT config_key, config_value 
      FROM state_config 
      WHERE state_code = $1
    `;
    const result = await pool.query(query, [stateCode.toUpperCase()]);
    
    const config = {};
    for (const row of result.rows) {
      try {
        config[row.config_key] = JSON.parse(row.config_value);
      } catch (e) {
        config[row.config_key] = row.config_value;
      }
    }
    
    return config;
  }

  /**
   * Get preferred data sources for a state
   * @param {string} stateCode - Two-letter state code
   * @returns {Promise<Array>} Array of data source configurations
   */
  async getDataSources(stateCode) {
    const query = `
      SELECT source_type, source_config, priority
      FROM state_data_sources
      WHERE state_code = $1
      ORDER BY priority ASC
    `;
    const result = await pool.query(query, [stateCode.toUpperCase()]);
    return result.rows;
  }

  /**
   * Set data source for a state
   * @param {string} stateCode - Two-letter state code
   * @param {string} sourceType - Source type identifier
   * @param {Object} sourceConfig - Source configuration
   * @param {number} priority - Priority (lower = higher priority)
   * @returns {Promise<Object>} Updated data source configuration
   */
  async setDataSource(stateCode, sourceType, sourceConfig, priority = 1) {
    const query = `
      INSERT INTO state_data_sources (state_code, source_type, source_config, priority)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (state_code, source_type)
      DO UPDATE SET
        source_config = EXCLUDED.source_config,
        priority = EXCLUDED.priority,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await pool.query(query, [
      stateCode.toUpperCase(),
      sourceType,
      JSON.stringify(sourceConfig),
      priority,
    ]);
    return result.rows[0];
  }
}

export default new StateRepository();
