/**
 * Sample Ballot API
 * Returns ballot data (contests, candidates) built from our candidate sources:
 * Open States (NC legislators) + curated DB (governor, senate, local)
 * No longer uses deprecated Google Civic API.
 */

import express from 'express';
import candidateRepository from '../repositories/candidateRepository.js';
import openStatesApi from '../services/openStatesApi.js';
import { DEFAULTS } from '../constants.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Build contests from candidates (group by office)
 */
function buildContestsFromCandidates(candidates) {
  const byOffice = new Map();
  for (const c of candidates) {
    const office = c.office || 'Unknown';
    if (!byOffice.has(office)) {
      byOffice.set(office, []);
    }
    byOffice.get(office).push({
      name: c.name,
      party: c.party || 'Unknown',
      photoUrl: c.photo_url || c.photo,
    });
  }
  return Array.from(byOffice.entries()).map(([office, cands]) => ({
    office,
    candidates: cands,
  }));
}

/**
 * GET /api/sample-ballot
 * Query: location (optional), state, lat, lng
 * Returns: ballot contests built from Open States + curated candidates
 */
router.get('/', async (req, res) => {
  const { location, state = DEFAULTS.STATE, lat, lng } = req.query;
  const stateCode = state.toUpperCase();
  const hasGeo = lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));

  try {
    let candidates = [];

    // NC: fetch from Open States (if geo) + DB curated
    if (stateCode === 'NC') {
      if (hasGeo) {
        const geoLegislators = await openStatesApi.getNCLegislators({
          lat: Number(lat),
          lng: Number(lng),
        });
        if (geoLegislators.length > 0) {
          await candidateRepository.bulkUpsert(geoLegislators);
        }
      }
      const dbCandidates = await candidateRepository.findByStateWithSources(stateCode, {});
      const seen = new Set();
      for (const c of dbCandidates) {
        const key = `${(c.name || '').toLowerCase()}|${(c.office || '').toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        candidates.push(c);
      }
    } else {
      candidates = await candidateRepository.findByStateWithSources(stateCode, {});
    }

    const contests = buildContestsFromCandidates(candidates);

    res.json({
      success: true,
      message: contests.length > 0
        ? 'Ballot built from Open States and curated candidate data.'
        : 'No ballot data for this location. Add your address in Profile or use the official state lookup.',
      contests,
      pollingLocations: [],
      earlyVoteSites: [],
      state: stateCode,
    });
  } catch (error) {
    logger.error('Sample ballot error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch sample ballot',
      message: error.message,
    });
  }
});

export default router;
