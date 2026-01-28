import express from 'express';
import pool from '../db/connection.js';
import civicApi from '../services/civicApi.js';
import { calculateMatchScore } from '../services/matchScoring.js';
import { rankSources } from '../services/sourceRanking.js';

const router = express.Router();

/**
 * GET /api/candidates
 * Get candidates for a specific office/location
 * Query params: office, location, state
 */
router.get('/', async (req, res) => {
  try {
    const { office, location, state = 'NC' } = req.query;

    // Try to get from database first
    let query = 'SELECT * FROM candidates WHERE state = $1';
    const params = [state];

    if (office) {
      query += ' AND office ILIKE $2';
      params.push(`%${office}%`);
    }

    query += ' ORDER BY created_at DESC';

    const dbResult = await pool.query(query, params);

    if (dbResult.rows.length > 0) {
      // Enhance with sources
      const candidatesWithSources = await Promise.all(
        dbResult.rows.map(async (candidate) => {
          const sourcesResult = await pool.query(
            'SELECT * FROM candidate_sources WHERE candidate_id = $1 ORDER BY bias_score ASC',
            [candidate.id]
          );
          return {
            ...candidate,
            sources: sourcesResult.rows,
          };
        })
      );

      return res.json(candidatesWithSources);
    }

    // If no candidates in DB, fetch from API
    if (location) {
      try {
        const elections = await civicApi.getElections();
        const upcomingElection = elections.elections?.find(e => 
          e.ocdDivisionId?.includes(state.toLowerCase())
        );

        if (upcomingElection) {
          const candidates = await civicApi.getCandidatesForElection(
            location,
            upcomingElection.id
          );

          // Store in database
          const storedCandidates = await Promise.all(
            candidates.map(async (candidate) => {
              const result = await pool.query(
                `INSERT INTO candidates (name, office, office_level, party, photo_url, district, state, api_source)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT DO NOTHING
                 RETURNING *`,
                [
                  candidate.name,
                  candidate.office,
                  candidate.level,
                  candidate.party,
                  candidate.photoUrl,
                  candidate.district,
                  state,
                  'google_civic_api',
                ]
              );
              return result.rows[0] || candidate;
            })
          );

          return res.json(storedCandidates);
        }
      } catch (apiError) {
        console.error('Error fetching from API:', apiError);
      }
    }

    res.json([]);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

/**
 * GET /api/candidates/:id
 * Get a specific candidate with sources
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const candidateResult = await pool.query(
      'SELECT * FROM candidates WHERE id = $1',
      [id]
    );

    if (candidateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const candidate = candidateResult.rows[0];

    // Get sources and rank them
    const sourcesResult = await pool.query(
      'SELECT * FROM candidate_sources WHERE candidate_id = $1',
      [id]
    );

    const rankedSources = await rankSources(sourcesResult.rows);

    res.json({
      ...candidate,
      sources: rankedSources,
    });
  } catch (error) {
    console.error('Error fetching candidate:', error);
    res.status(500).json({ error: 'Failed to fetch candidate' });
  }
});

/**
 * GET /api/candidates/:id/match-score
 * Get match score for a candidate based on user preferences
 * Query params: userId
 */
router.get('/:id/match-score', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get user preferences
    const userPrefsResult = await pool.query(
      `SELECT up.importance, i.id as issue_id, i.name as issue_name
       FROM user_preferences up
       JOIN issues i ON up.issue_id = i.id
       WHERE up.user_id = $1`,
      [userId]
    );

    // Get candidate positions
    const candidateResult = await pool.query(
      'SELECT positions FROM candidates WHERE id = $1',
      [id]
    );

    if (candidateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const userPreferences = userPrefsResult.rows.map(row => ({
      issueId: row.issue_id,
      issueName: row.issue_name,
      importance: row.importance,
    }));

    const candidatePositions = candidateResult.rows[0].positions || [];

    const matchScore = calculateMatchScore(userPreferences, candidatePositions);

    res.json({
      candidateId: id,
      ...matchScore,
    });
  } catch (error) {
    console.error('Error calculating match score:', error);
    res.status(500).json({ error: 'Failed to calculate match score' });
  }
});

/**
 * POST /api/candidates/:id/sources
 * Add a source for a candidate
 */
router.post('/:id/sources', async (req, res) => {
  try {
    const { id } = req.params;
    const { url, sourceType, title } = req.body;

    if (!url || !sourceType) {
      return res.status(400).json({ error: 'url and sourceType are required' });
    }

    // Analyze bias
    const { analyzeSourceBias } = await import('../services/biasDetection.js');
    const biasAnalysis = await analyzeSourceBias(url, sourceType);

    const result = await pool.query(
      `INSERT INTO candidate_sources (candidate_id, url, source_type, title, bias_score, bias_tier, last_analyzed)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, url, sourceType, title, biasAnalysis.biasScore, biasAnalysis.biasTier]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding source:', error);
    res.status(500).json({ error: 'Failed to add source' });
  }
});

export default router;

