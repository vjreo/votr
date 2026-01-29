/**
 * Election Repository
 * Data access layer for elections
 */

import pool from '../db/connection.js';

export class ElectionRepository {
  /**
   * Get elections by state
   * @param {string} stateCode - Two-letter state code
   * @param {Object} options - Query options
   * @param {string} options.district - Optional district filter
   * @param {Date} options.minDate - Optional minimum date filter
   * @returns {Promise<Array>} Array of elections
   */
  async findByState(stateCode, options = {}) {
    const { district, minDate } = options;
    const whereClauses = ['state = $1'];
    const params = [stateCode.toUpperCase()];

    if (minDate) {
      whereClauses.push('date >= $2');
      params.push(minDate);
    } else {
      whereClauses.push('date >= CURRENT_DATE');
    }

    if (district) {
      const paramIndex = params.length + 1;
      whereClauses.push(`(district = $${paramIndex} OR district IS NULL)`);
      params.push(district);
    }

    const query = `
      SELECT * FROM elections 
      WHERE ${whereClauses.join(' AND ')} 
      ORDER BY date ASC
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get upcoming elections for a user's location
   * @param {string} stateCode - Two-letter state code
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} Array of elections
   */
  async findUpcoming(stateCode, limit = 10) {
    const query = `
      SELECT * FROM elections 
      WHERE state = $1 AND date >= CURRENT_DATE 
      ORDER BY date ASC 
      LIMIT $2
    `;

    const result = await pool.query(query, [stateCode.toUpperCase(), limit]);
    return result.rows;
  }

  /**
   * Create or update an election
   * @param {Object} electionData - Election data
   * @returns {Promise<Object>} Created/updated election
   */
  async upsert(electionData) {
    const {
      name,
      date,
      type,
      state,
      district = null,
      offices = [],
      earlyVotingStart = null,
      earlyVotingEnd = null,
    } = electionData;

    // Use a simpler approach: try insert, catch conflict and update
    const insertQuery = `
      INSERT INTO elections (
        name, date, type, state, district, offices, 
        early_voting_start, early_voting_end
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (name, date, state, COALESCE(district, '')) 
      DO UPDATE SET
        type = EXCLUDED.type,
        offices = EXCLUDED.offices,
        early_voting_start = EXCLUDED.early_voting_start,
        early_voting_end = EXCLUDED.early_voting_end,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      name,
      date,
      type,
      state.toUpperCase(),
      district,
      JSON.stringify(offices),
      earlyVotingStart,
      earlyVotingEnd,
    ]);

    return result.rows[0];
  }

  /**
   * Bulk upsert elections
   * @param {Array<Object>} elections - Array of election data
   * @returns {Promise<Array>} Array of upserted elections
   */
  async bulkUpsert(elections) {
    const results = [];
    for (const election of elections) {
      const result = await this.upsert(election);
      results.push(result);
    }
    return results;
  }

  /**
   * Find election by ID
   * @param {string} id - Election UUID
   * @returns {Promise<Object|null>} Election or null if not found
   */
  async findById(id) {
    const query = 'SELECT * FROM elections WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
}

export default new ElectionRepository();
