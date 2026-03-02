import express from 'express';
import pool from '../db/connection.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/roster
 * Get the authenticated user's roster (saved candidates)
 */
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.userId;

  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.party, c.office, c.photo_url as photo
       FROM user_roster ur
       JOIN candidates c ON ur.candidate_id = c.id
       WHERE ur.user_id = $1
       ORDER BY ur.created_at DESC`,
      [userId]
    );

    const roster = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      party: row.party || 'Unknown',
      office: row.office,
      photo: row.photo,
    }));

    res.json(roster);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch roster' });
  }
});

/**
 * POST /api/roster
 * Add a candidate to the user's roster
 * Body: { candidateId: string }
 */
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.userId;
  const { candidateId } = req.body;

  if (!candidateId) {
    return res.status(400).json({ error: 'candidateId is required' });
  }

  try {
    // Verify candidate exists
    const candidateCheck = await pool.query(
      'SELECT id, name, party, office, photo_url FROM candidates WHERE id = $1',
      [candidateId]
    );

    if (candidateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    await pool.query(
      `INSERT INTO user_roster (user_id, candidate_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, candidate_id) DO NOTHING`,
      [userId, candidateId]
    );

    const candidate = candidateCheck.rows[0];
    res.status(201).json({
      id: candidate.id,
      name: candidate.name,
      party: candidate.party || 'Unknown',
      office: candidate.office,
      photo: candidate.photo_url,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to roster' });
  }
});

/**
 * DELETE /api/roster/:candidateId
 * Remove a candidate from the user's roster
 */
router.delete('/:candidateId', authenticateToken, async (req, res) => {
  const userId = req.userId;
  const { candidateId } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM user_roster WHERE user_id = $1 AND candidate_id = $2 RETURNING id',
      [userId, candidateId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Roster entry not found' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove from roster' });
  }
});

/**
 * POST /api/roster/sync
 * Sync local roster to backend (for link-anonymous or first login)
 * Body: { roster: Array<{ id, name, party, office, photo? }> }
 */
router.post('/sync', authenticateToken, async (req, res) => {
  const userId = req.userId;
  const { roster } = req.body;

  if (!Array.isArray(roster)) {
    return res.status(400).json({ error: 'roster must be an array' });
  }

  try {
    for (const item of roster) {
      if (item?.id) {
        const candidateCheck = await pool.query(
          'SELECT id FROM candidates WHERE id = $1',
          [item.id]
        );
        if (candidateCheck.rows.length > 0) {
          await pool.query(
            `INSERT INTO user_roster (user_id, candidate_id)
             VALUES ($1, $2)
             ON CONFLICT (user_id, candidate_id) DO NOTHING`,
            [userId, item.id]
          );
        }
      }
    }

    // Return merged roster from backend
    const result = await pool.query(
      `SELECT c.id, c.name, c.party, c.office, c.photo_url as photo
       FROM user_roster ur
       JOIN candidates c ON ur.candidate_id = c.id
       WHERE ur.user_id = $1
       ORDER BY ur.created_at DESC`,
      [userId]
    );

    const syncedRoster = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      party: row.party || 'Unknown',
      office: row.office,
      photo: row.photo,
    }));

    res.json(syncedRoster);
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync roster' });
  }
});

export default router;
