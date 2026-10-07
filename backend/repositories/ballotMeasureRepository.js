import pool from '../db/connection.js';
import logger from '../utils/logger.js';

/**
 * Ballot Measure Repository
 * Handles database operations for ballot measures (amendments, bonds, referendums)
 */

/**
 * Find ballot measures by state and optional filters
 */
async function findByState(state, options = {}) {
  const { county, city, electionDate, type } = options;
  const params = [state.toUpperCase()];
  let whereClause = 'WHERE state = $1';
  let paramIndex = 2;

  if (electionDate) {
    whereClause += ` AND election_date = $${paramIndex}`;
    params.push(electionDate);
    paramIndex++;
  }

  if (county) {
    whereClause += ` AND (county = $${paramIndex} OR county IS NULL)`;
    params.push(county);
    paramIndex++;
  }

  if (city) {
    whereClause += ` AND (city = $${paramIndex} OR city IS NULL)`;
    params.push(city);
    paramIndex++;
  }

  if (type) {
    whereClause += ` AND type = $${paramIndex}`;
    params.push(type);
    paramIndex++;
  }

  const result = await pool.query(
    `SELECT * FROM ballot_measures ${whereClause} ORDER BY type, title`,
    params
  );
  return result.rows;
}

/**
 * Find a ballot measure by ID
 */
async function findById(id) {
  const result = await pool.query('SELECT * FROM ballot_measures WHERE id = $1', [id]);
  return result.rows[0] || null;
}

/**
 * Find a ballot measure by measure_id
 */
async function findByMeasureId(measureId) {
  const result = await pool.query('SELECT * FROM ballot_measures WHERE measure_id = $1', [measureId]);
  return result.rows[0] || null;
}

/**
 * Upsert a ballot measure
 */
async function upsert(measure) {
  const result = await pool.query(
    `INSERT INTO ballot_measures (
      measure_id, type, title, short_title, ballot_question,
      official_summary, explanation, source_law, choices,
      state, county, city, election_date,
      principal, estimated_cost, estimated_tax_impact, sources
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    ON CONFLICT (measure_id) DO UPDATE SET
      type = EXCLUDED.type,
      title = EXCLUDED.title,
      short_title = EXCLUDED.short_title,
      ballot_question = EXCLUDED.ballot_question,
      official_summary = EXCLUDED.official_summary,
      explanation = EXCLUDED.explanation,
      source_law = EXCLUDED.source_law,
      choices = EXCLUDED.choices,
      state = EXCLUDED.state,
      county = EXCLUDED.county,
      city = EXCLUDED.city,
      election_date = EXCLUDED.election_date,
      principal = EXCLUDED.principal,
      estimated_cost = EXCLUDED.estimated_cost,
      estimated_tax_impact = EXCLUDED.estimated_tax_impact,
      sources = EXCLUDED.sources,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *`,
    [
      measure.id || measure.measure_id,
      measure.type,
      measure.title,
      measure.shortTitle || measure.short_title || null,
      measure.ballotQuestion || measure.ballot_question,
      measure.officialSummary || measure.official_summary || null,
      measure.explanation || null,
      measure.sourcelaw || measure.source_law || null,
      JSON.stringify(measure.choices || ['Yes', 'No']),
      measure.state,
      measure.county || null,
      measure.city || null,
      measure.electionDate || measure.election_date,
      measure.principal || null,
      measure.estimatedCost || measure.estimated_cost || null,
      measure.estimatedTaxImpact || measure.estimated_tax_impact || null,
      JSON.stringify(measure.sources || []),
    ]
  );
  return result.rows[0];
}

/**
 * Bulk upsert ballot measures
 */
async function bulkUpsert(measures) {
  const results = [];
  for (const measure of measures) {
    try {
      const result = await upsert(measure);
      results.push(result);
    } catch (error) {
      logger.error(`Failed to upsert measure ${measure.id || measure.title}:`, error.message);
    }
  }
  return results;
}

export default {
  findByState,
  findById,
  findByMeasureId,
  upsert,
  bulkUpsert,
};
