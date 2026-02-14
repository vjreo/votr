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
import civicApi from '../services/civicApi.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Prevent client caching and ETag so we always get full response (not 304)
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  next();
});

/**
 * GET /api/candidates
 * Get candidates for a specific office/location
 * Query params: office, location, state
 */
router.get('/', async (req, res) => {
  const { office, location, state = DEFAULTS.STATE } = req.query;
  const stateCode = state.toUpperCase();
  const cacheKey = office || 'all';

  // Skip cache when location is provided - results are address-specific
  const useCache = !location;
  let cached = null;
  if (useCache) {
    cached = candidateCache.get(stateCode, cacheKey);
    if (cached) {
      return res.json(cached);
    }
  }

  // Get state handler
  const stateHandler = getStateHandler(stateCode);

  // When no location: use DB only (browse by state)
  // When location: prefer fresh API fetch for address-specific ballot
  if (!location) {
    const dbCandidates = await candidateRepository.findByStateWithSources(stateCode, {
      office,
    });
    if (dbCandidates.length > 0) {
      candidateCache.set(stateCode, dbCandidates, cacheKey);
      return res.json(dbCandidates);
    }
    logger.debug('No location provided; no candidates in DB. Add your address in Profile to see your ballot.');
    return res.json([]);
  }

  // With location: always fetch fresh from Civic API (address-specific)
  let fetchedCandidates = [];
  let apiSource = 'google_civic_api';
  const normalizedLocation = civicApi.normalizeAddress(location);

  try {
    logger.debug(`Fetching candidates for location: ${location} (normalized: ${normalizedLocation})`);
    // Strategy 1: Voterinfo without electionId (returns ballot for next/primary election)
    try {
      const voterInfo = await civicApi.getVoterInfoByAddress(normalizedLocation);
      fetchedCandidates = civicApi.extractCandidatesFromVoterInfo(voterInfo);
      if (fetchedCandidates.length > 0) {
        logger.debug(`Voterinfo (no electionId) returned ${fetchedCandidates.length} candidates for ${location}`);
      }
    } catch (e1) {
      logger.debug('Voterinfo by address failed:', e1.message);
    }

    // Strategy 2: If empty, try with explicit upcoming election
    if (fetchedCandidates.length === 0) {
      const dataSources = stateHandler.getDataSources();
      const adapter = adapterFactory.getAdapter(dataSources.primary);
      const electionsData = await adapter.getElections();
      const filteredElections = stateHandler.filterElections(electionsData);
      const upcomingElection = filteredElections.find((e) =>
        new Date(e.electionDay) >= new Date()
      );

      if (upcomingElection) {
        const candidates = await adapter.getCandidatesForElection(normalizedLocation, upcomingElection.id);
        if (candidates.length > 0) {
          fetchedCandidates = candidates;
          logger.debug(`Voterinfo (election ${upcomingElection.id}) returned ${candidates.length} candidates`);
        }
      }
    }

    // Strategy 3: Representatives API fallback (current officeholders - no election needed)
    if (fetchedCandidates.length === 0) {
      try {
        fetchedCandidates = await civicApi.getRepresentativesAsCandidates(normalizedLocation);
        apiSource = 'google_civic_representatives';
        if (fetchedCandidates.length > 0) {
          logger.debug(`Representatives API returned ${fetchedCandidates.length} officials for ${location}`);
        }
      } catch (e2) {
        logger.debug('Representatives API failed:', e2.message);
      }
    }

    if (fetchedCandidates.length > 0) {
      const normalizedCandidates = fetchedCandidates.map((c) => ({
        name: c.name,
        office: c.office,
        officeLevel: stateHandler.determineOfficeLevel(c.office),
        party: c.party || 'Unknown',
        photoUrl: c.photoUrl,
        bio: null,
        district: stateHandler.normalizeDistrict(c.district),
        state: stateCode,
        positions: [],
        apiSource,
      }));

      const upserted = await candidateRepository.bulkUpsert(normalizedCandidates);
      // Return address-specific candidates (not full state) - add sources
      const candidatesWithSources = await Promise.all(
        upserted.map(async (c) => {
          const sourcesResult = await pool.query(
            'SELECT * FROM candidate_sources WHERE candidate_id = $1 ORDER BY bias_score ASC',
            [c.id]
          );
          return { ...c, sources: sourcesResult.rows };
        })
      );
      // Don't cache - results are address-specific
      return res.json(candidatesWithSources);
    }
    logger.debug(`All strategies returned empty for ${location}`);
  } catch (apiError) {
    logger.warn('Candidates API fetch failed:', apiError.message);
    if (apiError.response?.status === 403) {
      logger.warn('Check GOOGLE_CIVIC_API_KEY: enable Civic Information API at console.cloud.google.com');
    }
  }

  // Fallback: return DB candidates if we have any (e.g. from prior fetches)
  const dbFallback = await candidateRepository.findByStateWithSources(stateCode, { office });
  if (dbFallback.length > 0) {
    return res.json(dbFallback);
  }
  res.json([]);
});

/**
 * GET /api/candidates/:id
 * Get a specific candidate with sources
 */
router.get('/:id', async (req, res) => {
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
});

/**
 * GET /api/candidates/:id/match-score
 * Get match score for a candidate based on user preferences
 * Query params: userId
 */
router.get('/:id/match-score', async (req, res) => {
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
});

/**
 * POST /api/candidates/:id/sources
 * Add a source for a candidate
 */
router.post('/:id/sources', async (req, res) => {
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
});

export default router;

