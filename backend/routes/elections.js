import express from 'express';
import pool from '../db/connection.js';
import { DEFAULTS } from '../constants.js';
import { getStateHandler } from '../services/stateHandlers/stateRegistry.js';
import electionRepository from '../repositories/electionRepository.js';
import electionCache from '../services/cache/electionCache.js';
import adapterFactory from '../integrations/stateAdapters/adapterFactory.js';

const router = express.Router();

/**
 * GET /api/elections
 * Get upcoming elections
 * Query params: state, district
 */
router.get('/', async (req, res, next) => {
  const { state = DEFAULTS.STATE, district } = req.query;
  const stateCode = state.toUpperCase();

  // Check cache first
  const cacheKey = district ? `district:${district}` : 'all';
  const cached = electionCache.get(stateCode, cacheKey);
  if (cached) {
    return res.json(cached);
  }

  // Get state handler
  const stateHandler = getStateHandler(stateCode);

  // Try database first
  const dbElections = await electionRepository.findByState(stateCode, {
    district,
    minDate: new Date(),
  });

  if (dbElections.length > 0) {
    // Cache and return
    electionCache.set(stateCode, dbElections, cacheKey);
    return res.json(dbElections);
  }

  // Fetch from API if not in database
  try {
    const dataSources = stateHandler.getDataSources();
    const adapter = adapterFactory.getAdapter(dataSources.primary);

    const electionsData = await adapter.getElections();
    
    // Filter elections using state handler
    const filteredElections = stateHandler.filterElections(electionsData);

    // Normalize and store elections
    const electionsToStore = filteredElections.map(election => ({
      name: election.name,
      date: election.electionDay,
      type: DEFAULTS.ELECTION_TYPE,
      state: stateCode,
      district: district || null,
      offices: [],
    }));

    await electionRepository.bulkUpsert(electionsToStore);

    // Fetch stored elections
    const storedElections = await electionRepository.findByState(stateCode, {
      district,
      minDate: new Date(),
    });

    // Cache and return
    electionCache.set(stateCode, storedElections, cacheKey);
    res.json(storedElections);
  } catch (apiError) {
    // API errors are non-fatal - return empty array
    res.json([]);
  }
});

/**
 * GET /api/elections/upcoming
 * Get upcoming elections for a user's location
 * Query params: userId
 */
router.get('/upcoming', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  // Get user location
  const userResult = await pool.query('SELECT location FROM users WHERE id = $1', [userId]);
  const location = userResult.rows[0]?.location;

  if (!location || !location.state) {
    return res.status(400).json({ error: 'User location not set' });
  }

  const stateCode = location.state.toUpperCase();

  // Check cache
  const cached = electionCache.get(stateCode, 'upcoming');
  if (cached) {
    return res.json(cached.slice(0, DEFAULTS.UPCOMING_ELECTIONS_LIMIT));
  }

  // Get upcoming elections using repository
  const elections = await electionRepository.findUpcoming(
    stateCode,
    DEFAULTS.UPCOMING_ELECTIONS_LIMIT
  );

  // Cache and return
  electionCache.set(stateCode, elections, 'upcoming');
  res.json(elections);
});

export default router;

