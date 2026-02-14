/**
 * Sample Ballot API
 * Returns ballot data (contests, candidates) for an address from Google Civic API
 * Can be displayed in-app instead of linking to state Board of Elections
 */

import express from 'express';
import civicApi from '../services/civicApi.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/sample-ballot
 * Query: location (required) - voter address
 * Returns: voterinfo with contests (races), candidates, polling locations, etc.
 */
router.get('/', async (req, res) => {
  const { location } = req.query;

  if (!location) {
    return res.status(400).json({
      error: 'location is required',
      hint: 'Provide the voter address as a query parameter',
    });
  }

  try {
    const normalizedLocation = civicApi.normalizeAddress(location);

    // Try voterinfo without electionId first (returns primary/next election for address)
    let voterInfo = null;
    try {
      voterInfo = await civicApi.getVoterInfoByAddress(normalizedLocation);
    } catch (e) {
      logger.debug('Sample ballot voterinfo failed:', e.message);
    }

    // If no contests, try with explicit election IDs from elections endpoint
    if (!voterInfo?.contests?.length) {
      const electionsRes = await civicApi.getElections();
      const elections = electionsRes.elections || [];
      const now = new Date();

      for (const election of elections) {
        const electionDay = new Date(election.electionDay);
        if (electionDay >= now && election.ocdDivisionId) {
          try {
            const info = await civicApi.getVoterInfo(normalizedLocation, election.id);
            if (info?.contests?.length > 0) {
              voterInfo = info;
              break;
            }
          } catch {
            continue;
          }
        }
      }
    }

    if (!voterInfo) {
      return res.json({
        success: false,
        message: 'No ballot data available for this address. The official state lookup may have more current information.',
        contests: [],
        pollingLocations: [],
        earlyVoteSites: [],
      });
    }

    res.json({
      success: true,
      election: voterInfo.election,
      contests: voterInfo.contests || [],
      pollingLocations: voterInfo.pollingLocations || [],
      earlyVoteSites: voterInfo.earlyVoteSites || [],
      otherElections: voterInfo.otherElections || [],
      state: voterInfo.state,
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
