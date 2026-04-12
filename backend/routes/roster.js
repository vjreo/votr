import express from 'express';
import pool from '../db/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

/**
 * GET /api/roster
 * Get the authenticated user's saved candidates.
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT c.id, c.name, c.party, c.office, c.photo_url AS photo
       FROM user_roster ur
       JOIN candidates c ON ur.candidate_id = c.id
       WHERE ur.user_id = $1
       ORDER BY ur.created_at DESC`,
      [req.userId]
    );

    res.json(
      result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        party: row.party || 'Unknown',
        office: row.office,
        photo: row.photo,
      }))
    );
  })
);

/**
 * POST /api/roster
 * Add a candidate to the user's roster.
 * Body: { candidateId: string }
 */
router.post(
  '/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { candidateId } = req.body;

    if (!candidateId || typeof candidateId !== 'string') {
      return res.status(400).json({ error: 'candidateId is required' });
    }

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
      [req.userId, candidateId]
    );

    const c = candidateCheck.rows[0];
    res.status(201).json({ id: c.id, name: c.name, party: c.party || 'Unknown', office: c.office, photo: c.photo_url });
  })
);

/**
 * DELETE /api/roster/:candidateId
 * Remove a candidate from the user's roster.
 */
router.delete(
  '/:candidateId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      'DELETE FROM user_roster WHERE user_id = $1 AND candidate_id = $2 RETURNING id',
      [req.userId, req.params.candidateId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Roster entry not found' });
    }

    res.json({ success: true });
  })
);

/**
 * POST /api/roster/sync
 * Merge a local (anonymous) roster into the authenticated user's roster.
 * Body: { roster: Array<{ id, name, ... }> }
 */
router.post(
  '/sync',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { roster } = req.body;

    if (!Array.isArray(roster)) {
      return res.status(400).json({ error: 'roster must be an array' });
    }

    // Upsert each valid candidate ID
    for (const item of roster) {
      if (!item?.id || typeof item.id !== 'string') continue;
      const exists = await pool.query('SELECT id FROM candidates WHERE id = $1', [item.id]);
      if (exists.rows.length > 0) {
        await pool.query(
          `INSERT INTO user_roster (user_id, candidate_id)
           VALUES ($1, $2)
           ON CONFLICT (user_id, candidate_id) DO NOTHING`,
          [req.userId, item.id]
        );
      }
    }

    const result = await pool.query(
      `SELECT c.id, c.name, c.party, c.office, c.photo_url AS photo
       FROM user_roster ur
       JOIN candidates c ON ur.candidate_id = c.id
       WHERE ur.user_id = $1
       ORDER BY ur.created_at DESC`,
      [req.userId]
    );

    res.json(
      result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        party: row.party || 'Unknown',
        office: row.office,
        photo: row.photo,
      }))
    );
  })
);

export default router;
