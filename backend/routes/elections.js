import express from 'express';
import pool from '../db/connection.js';
import { DEFAULTS } from '../constants.js';
import { getStateHandler } from '../services/stateHandlers/stateRegistry.js';
import electionRepository from '../repositories/electionRepository.js';
import electionCache from '../services/cache/electionCache.js';
import adapterFactory from '../integrations/stateAdapters/adapterFactory.js';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

/**
 * GET /api/elections
 * Upcoming elections for a state and optional district.
 * Query params: state, district
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { state = DEFAULTS.STATE, district } = req.query;

    if (typeof state !== 'string' || state.length !== 2) {
      return res.status(400).json({ error: 'state must be a 2-letter code' });
    }

    const stateCode = state.toUpperCase();
    const cacheKey = district ? `district:${district}` : 'all';
    const cached = electionCache.get(stateCode, cacheKey);
    if (cached) return res.json(cached);

    const stateHandler = getStateHandler(stateCode);

    const dbElections = await electionRepository.findByState(stateCode, { district, minDate: new Date() });
    if (dbElections.length > 0) {
      electionCache.set(stateCode, dbElections, cacheKey);
      return res.json(dbElections);
    }

    // Try adapter as fallback
    try {
      const dataSources = stateHandler.getDataSources();
      const adapter = adapterFactory.getAdapter(dataSources.primary);
      const electionsData = await adapter.getElections();
      const filtered = stateHandler.filterElections(electionsData);

      const toStore = filtered.map((e) => ({
        name: e.name,
        date: e.electionDay,
        type: DEFAULTS.ELECTION_TYPE,
        state: stateCode,
        district: district || null,
        offices: [],
      }));

      await electionRepository.bulkUpsert(toStore);

      const stored = await electionRepository.findByState(stateCode, { district, minDate: new Date() });
      electionCache.set(stateCode, stored, cacheKey);
      return res.json(stored);
    } catch {
      // Adapter failure is non-fatal; return empty list
      return res.json([]);
    }
  })
);

/**
 * GET /api/elections/upcoming
 * Upcoming elections for the authenticated user's saved location.
 * Requires: authentication (userId comes from token, not query string)
 */
router.get(
  '/upcoming',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userResult = await pool.query('SELECT location FROM users WHERE id = $1', [req.userId]);
    const location = userResult.rows[0]?.location;

    if (!location || !location.state) {
      return res.status(400).json({ error: 'User location not set' });
    }

    const stateCode = location.state.toUpperCase();
    const cached = electionCache.get(stateCode, 'upcoming');
    if (cached) {
      return res.json(cached.slice(0, DEFAULTS.UPCOMING_ELECTIONS_LIMIT));
    }

    const elections = await electionRepository.findUpcoming(stateCode, DEFAULTS.UPCOMING_ELECTIONS_LIMIT);
    electionCache.set(stateCode, elections, 'upcoming');
    res.json(elections);
  })
);

export default router;
