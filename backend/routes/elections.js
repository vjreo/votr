import express from 'express';
import pool from '../db/connection.js';
import civicApi from '../services/civicApi.js';

const router = express.Router();

/**
 * GET /api/elections
 * Get upcoming elections
 * Query params: state, district
 */
router.get('/', async (req, res) => {
  try {
    const { state = 'NC', district } = req.query;

    // Try database first
    let query = 'SELECT * FROM elections WHERE state = $1 AND date >= CURRENT_DATE ORDER BY date ASC';
    const params = [state];

    if (district) {
      query = query.replace('WHERE', 'WHERE (district = $2 OR district IS NULL) AND');
      params.push(district);
    }

    const dbResult = await pool.query(query, params);

    if (dbResult.rows.length > 0) {
      return res.json(dbResult.rows);
    }

    // Fetch from API if not in database
    try {
      const electionsData = await civicApi.getElections();
      const elections = electionsData.elections || [];

      const filteredElections = elections.filter(e => {
        if (state && !e.ocdDivisionId?.includes(state.toLowerCase())) {
          return false;
        }
        return true;
      });

      // Store in database
      for (const election of filteredElections) {
        await pool.query(
          `INSERT INTO elections (name, date, type, state)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [
            election.name,
            election.electionDay,
            'general', // Default type
            state,
          ]
        );
      }

      const storedElections = await pool.query(query, params);
      res.json(storedElections.rows);
    } catch (apiError) {
      console.error('Error fetching from API:', apiError);
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching elections:', error);
    res.status(500).json({ error: 'Failed to fetch elections' });
  }
});

/**
 * GET /api/elections/upcoming
 * Get upcoming elections for a user's location
 * Query params: userId
 */
router.get('/upcoming', async (req, res) => {
  try {
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

    const elections = await pool.query(
      `SELECT * FROM elections 
       WHERE state = $1 AND date >= CURRENT_DATE 
       ORDER BY date ASC 
       LIMIT 10`,
      [location.state]
    );

    res.json(elections.rows);
  } catch (error) {
    console.error('Error fetching upcoming elections:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming elections' });
  }
});

export default router;

