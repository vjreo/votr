/**
 * Candidate Repository
 * Data access layer for candidates.
 * All multi-source fetches use JOINs to avoid N+1 queries.
 */

import pool from '../db/connection.js';

export class CandidateRepository {
  /**
   * Get candidates by state with sources in a single JOIN query.
   * @param {string} stateCode
   * @param {Object} options - { office?: string, officeLevel?: string }
   * @returns {Promise<Array>}
   */
  async findByStateWithSources(stateCode, options = {}) {
    const { office, officeLevel } = options;
    const whereClauses = ['c.state = $1'];
    const params = [stateCode.toUpperCase()];

    if (office) {
      params.push(`%${office}%`);
      whereClauses.push(`c.office ILIKE $${params.length}`);
    }
    if (officeLevel) {
      params.push(officeLevel);
      whereClauses.push(`c.office_level = $${params.length}`);
    }

    // Single JOIN — eliminates N+1 (one query instead of 1 + N)
    const query = `
      SELECT
        c.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id',            cs.id,
              'candidate_id',  cs.candidate_id,
              'url',           cs.url,
              'source_type',   cs.source_type,
              'title',         cs.title,
              'bias_score',    cs.bias_score,
              'bias_tier',     cs.bias_tier,
              'last_analyzed', cs.last_analyzed,
              'created_at',    cs.created_at
            ) ORDER BY cs.bias_score ASC NULLS LAST
          ) FILTER (WHERE cs.id IS NOT NULL),
          '[]'
        ) AS sources
      FROM candidates c
      LEFT JOIN candidate_sources cs ON cs.candidate_id = c.id
      WHERE ${whereClauses.join(' AND ')}
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get a single candidate with its sources.
   * @param {string} candidateId
   * @returns {Promise<Object|null>}
   */
  async findByIdWithSources(candidateId) {
    const query = `
      SELECT
        c.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id',            cs.id,
              'candidate_id',  cs.candidate_id,
              'url',           cs.url,
              'source_type',   cs.source_type,
              'title',         cs.title,
              'bias_score',    cs.bias_score,
              'bias_tier',     cs.bias_tier,
              'last_analyzed', cs.last_analyzed,
              'created_at',    cs.created_at
            ) ORDER BY cs.bias_score ASC NULLS LAST
          ) FILTER (WHERE cs.id IS NOT NULL),
          '[]'
        ) AS sources
      FROM candidates c
      LEFT JOIN candidate_sources cs ON cs.candidate_id = c.id
      WHERE c.id = $1
      GROUP BY c.id
    `;

    const result = await pool.query(query, [candidateId]);
    return result.rows[0] || null;
  }

  /**
   * Find candidate by ID (no sources).
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const result = await pool.query('SELECT * FROM candidates WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Create or update a candidate (upsert).
   * Unique key: (name, office, state, COALESCE(district, ''))
   * @param {Object} candidateData
   * @returns {Promise<Object>}
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
      career = [],
      apiSource,
    } = candidateData;

    const query = `
      INSERT INTO candidates (
        name, office, office_level, party, photo_url, bio,
        district, state, positions, career, api_source
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (name, office, state, COALESCE(district, ''))
      DO UPDATE SET
        party      = EXCLUDED.party,
        photo_url  = EXCLUDED.photo_url,
        bio        = EXCLUDED.bio,
        positions  = EXCLUDED.positions,
        career     = EXCLUDED.career,
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
      JSON.stringify(Array.isArray(positions) ? positions : []),
      JSON.stringify(Array.isArray(career) ? career : []),
      apiSource,
    ]);

    return result.rows[0];
  }

  /**
   * Bulk upsert candidates.
   * @param {Array<Object>} candidates
   * @returns {Promise<Array>}
   */
  async bulkUpsert(candidates) {
    const results = [];
    for (const candidate of candidates) {
      results.push(await this.upsert(candidate));
    }
    return results;
  }
}

export default new CandidateRepository();
