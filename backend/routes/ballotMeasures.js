/**
 * Ballot Measures API
 * Returns ballot measures (amendments, bonds, referendums) for a state/location
 */

import express from 'express';
import ballotMeasureRepository from '../repositories/ballotMeasureRepository.js';
import { DEFAULTS } from '../constants.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/ballot-measures
 * Query params: state, county, city, electionDate, type
 */
router.get('/', async (req, res) => {
  const { state = DEFAULTS.STATE, county, city, electionDate, type } = req.query;

  try {
    const measures = await ballotMeasureRepository.findByState(state, {
      county,
      city,
      electionDate,
      type,
    });

    res.json({
      success: true,
      count: measures.length,
      measures,
    });
  } catch (error) {
    logger.error('Ballot measures error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch ballot measures',
      message: error.message,
    });
  }
});

/**
 * GET /api/ballot-measures/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const measure = await ballotMeasureRepository.findById(req.params.id);
    if (!measure) {
      return res.status(404).json({ error: 'Ballot measure not found' });
    }
    res.json(measure);
  } catch (error) {
    logger.error('Ballot measure fetch error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch ballot measure',
      message: error.message,
    });
  }
});

export default router;
