import express from 'express';
import pool from '../db/connection.js';
import { calculateMatchScore } from '../services/matchScoring.js';
import { rankSources } from '../services/sourceRanking.js';
import { DEFAULTS } from '../constants.js';
import { getStateHandler } from '../services/stateHandlers/stateRegistry.js';
import candidateRepository from '../repositories/candidateRepository.js';
import electionRepository from '../repositories/electionRepository.js';
import candidateCache from '../services/cache/candidateCache.js';
import adapterFactory from '../integrations/stateAdapters/adapterFactory.js';

const router = express.Router();

/**
 * GET /api/candidates
 * Get candidates for a specific office/location
 * Query params: office, location, state
 */
router.get('/', async (req, res) => {
  try {
    const { office, location, state = DEFAULTS.STATE } = req.query;
    const stateCode = state.toUpperCase();

    // Check cache first
    const cacheKey = office || 'all';
    const cached = candidateCache.get(stateCode, cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Get state handler
    const stateHandler = getStateHandler(stateCode);

    // Try database first
    const dbCandidates = await candidateRepository.findByStateWithSources(stateCode, {
      office,
    });

    if (dbCandidates.length > 0) {
      // Cache and return
      candidateCache.set(stateCode, dbCandidates, cacheKey);
      return res.json(dbCandidates);
    }

    // If no candidates in DB, fetch from API
    if (location) {
      try {
        const dataSources = stateHandler.getDataSources();
        const adapter = adapterFactory.getAdapter(dataSources.primary);

        // Get elections and find upcoming one for this state
        const electionsData = await adapter.getElections();
        const filteredElections = stateHandler.filterElections(electionsData);
        const upcomingElection = filteredElections.find(e => 
          new Date(e.electionDay) >= new Date()
        );

        if (upcomingElection) {
          const candidates = await adapter.getCandidatesForElection(
            location,
            upcomingElection.id
          );

          // Normalize district using state handler
          const normalizedCandidates = candidates.map(candidate => ({
            name: candidate.name,
            office: candidate.office,
            officeLevel: stateHandler.determineOfficeLevel(candidate.office),
            party: candidate.party,
            photoUrl: candidate.photoUrl,
            bio: null,
            district: stateHandler.normalizeDistrict(candidate.district),
            state: stateCode,
            positions: [],
            apiSource: adapter.getSourceType(),
          }));

          // Store in database
          const storedCandidates = await candidateRepository.bulkUpsert(normalizedCandidates);

          // Fetch with sources
          const candidatesWithSources = await candidateRepository.findByStateWithSources(
            stateCode,
            { office }
          );

          // Cache and return
          candidateCache.set(stateCode, candidatesWithSources, cacheKey);
          return res.json(candidatesWithSources);
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

    const candidate = await candidateRepository.findByIdWithSources(id);

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Rank sources
    const rankedSources = await rankSources(candidate.sources || []);

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

