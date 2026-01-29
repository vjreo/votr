/**
 * Candidate Repository
 * Data access layer for candidates
 */

import pool from '../db/connection.js';

export class CandidateRepository {
  /**
   * Get candidates by state
   * @param {string} stateCode - Two-letter state code
   * @param {Object} options - Query options
   * @param {string} options.office - Optional office filter (ILIKE pattern)
   * @param {string} options.officeLevel - Optional office level filter
   * @returns {Promise<Array>} Array of candidates
   */
  async findByState(stateCode, options = {}) {
    const { office, officeLevel } = options;
    const whereClauses = ['state = $1'];
    const params = [stateCode.toUpperCase()];

    if (office) {
      const paramIndex = params.length + 1;
      whereClauses.push(`office ILIKE $${paramIndex}`);
      params.push(`%${office}%`);
    }

    if (officeLevel) {
      const paramIndex = params.length + 1;
      whereClauses.push(`office_level = $${paramIndex}`);
      params.push(officeLevel);
    }

    const query = `
      SELECT * FROM candidates 
      WHERE ${whereClauses.join(' AND ')} 
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get candidate with sources
   * @param {string} candidateId - Candidate UUID
   * @returns {Promise<Object|null>} Candidate with sources or null if not found
   */
  async findByIdWithSources(candidateId) {
    const candidateQuery = 'SELECT * FROM candidates WHERE id = $1';
    const candidateResult = await pool.query(candidateQuery, [candidateId]);

    if (candidateResult.rows.length === 0) {
      return null;
    }

    const candidate = candidateResult.rows[0];

    const sourcesQuery = `
      SELECT * FROM candidate_sources 
      WHERE candidate_id = $1 
      ORDER BY bias_score ASC
    `;
    const sourcesResult = await pool.query(sourcesQuery, [candidateId]);

    return {
      ...candidate,
      sources: sourcesResult.rows,
    };
  }

  /**
   * Get candidates with sources by state
   * @param {string} stateCode - Two-letter state code
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of candidates with sources
   */
  async findByStateWithSources(stateCode, options = {}) {
    const candidates = await this.findByState(stateCode, options);

    const candidatesWithSources = await Promise.all(
      candidates.map(async (candidate) => {
        const sourcesQuery = `
          SELECT * FROM candidate_sources 
          WHERE candidate_id = $1 
          ORDER BY bias_score ASC
        `;
        const sourcesResult = await pool.query(sourcesQuery, [candidate.id]);
        return {
          ...candidate,
          sources: sourcesResult.rows,
        };
      })
    );

    return candidatesWithSources;
  }

  /**
   * Create or update a candidate
   * @param {Object} candidateData - Candidate data
   * @returns {Promise<Object>} Created/updated candidate
   */
  async upsert(candidateData) {
    const {
      name,
      office,
      officeLevel,
      party,
      photoUrl,
      bio,
      district,
      state,
      positions = [],
      apiSource,
    } = candidateData;

    const query = `
      INSERT INTO candidates (
        name, office, office_level, party, photo_url, bio,
        district, state, positions, api_source
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (name, office, state, COALESCE(district, '')) 
      DO UPDATE SET
        party = EXCLUDED.party,
        photo_url = EXCLUDED.photo_url,
        bio = EXCLUDED.bio,
        positions = EXCLUDED.positions,
        api_source = EXCLUDED.api_source,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await pool.query(query, [
      name,
      office,
      officeLevel,
      party,
      photoUrl,
      bio,
      district,
      state.toUpperCase(),
      JSON.stringify(positions),
      apiSource,
    ]);

    return result.rows[0];
  }

  /**
   * Bulk upsert candidates
   * @param {Array<Object>} candidates - Array of candidate data
   * @returns {Promise<Array>} Array of upserted candidates
   */
  async bulkUpsert(candidates) {
    const results = [];
    for (const candidate of candidates) {
      const result = await this.upsert(candidate);
      results.push(result);
    }
    return results;
  }

  /**
   * Find candidate by ID
   * @param {string} id - Candidate UUID
   * @returns {Promise<Object|null>} Candidate or null if not found
   */
  async findById(id) {
    const query = 'SELECT * FROM candidates WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
}

export default new CandidateRepository();
