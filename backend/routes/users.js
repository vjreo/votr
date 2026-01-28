import express from 'express';
import pool from '../db/connection.js';
import { calculateMatchScore } from '../services/matchScoring.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/users
 * Create a new user (deprecated - use /api/auth/anonymous instead)
 */
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { preferences, location } = req.body;

    const result = await pool.query(
      `INSERT INTO users (preferences, location, gamification)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [
        JSON.stringify(preferences || []),
        location ? JSON.stringify(location) : null,
        JSON.stringify({ points: 0, streak: 0, level: 1, badges: [] }),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * GET /api/users/me
 * Get current authenticated user
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, auth_provider, is_anonymous, preferences, location, 
              gamification, notification_preferences, created_at, last_login
       FROM users WHERE id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      authProvider: user.auth_provider,
      isAnonymous: user.is_anonymous,
      preferences: user.preferences,
      location: user.location,
      gamification: user.gamification,
      notificationPreferences: user.notification_preferences,
      createdAt: user.created_at,
      lastLogin: user.last_login,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * GET /api/users/:id
 * Get user by ID (for backward compatibility, requires auth)
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only access their own data
    if (id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT id, email, auth_provider, is_anonymous, preferences, location, 
              gamification, notification_preferences, created_at, last_login
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      authProvider: user.auth_provider,
      isAnonymous: user.is_anonymous,
      preferences: user.preferences,
      location: user.location,
      gamification: user.gamification,
      notificationPreferences: user.notification_preferences,
      createdAt: user.created_at,
      lastLogin: user.last_login,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * POST /api/users/:id/preferences
 * Update user preferences
 */
router.post('/:id/preferences', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { preferences } = req.body;

    // Users can only update their own preferences
    if (id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!Array.isArray(preferences)) {
      return res.status(400).json({ error: 'preferences must be an array' });
    }

    // Delete existing preferences
    await pool.query('DELETE FROM user_preferences WHERE user_id = $1', [id]);

    // Insert new preferences
    for (const pref of preferences) {
      // Ensure issue exists
      let issueResult = await pool.query(
        'SELECT id FROM issues WHERE id = $1 OR name = $2',
        [pref.issueId, pref.issueName]
      );

      let issueId;
      if (issueResult.rows.length === 0 && pref.issueName) {
        // Create issue if it doesn't exist
        const newIssue = await pool.query(
          'INSERT INTO issues (name) VALUES ($1) RETURNING id',
          [pref.issueName]
        );
        issueId = newIssue.rows[0].id;
      } else {
        issueId = issueResult.rows[0].id;
      }

      await pool.query(
        `INSERT INTO user_preferences (user_id, issue_id, importance)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, issue_id) DO UPDATE SET importance = $3`,
        [id, issueId, pref.importance || 1]
      );
    }

    res.json({ success: true, preferences });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

/**
 * POST /api/users/:id/swipes
 * Record a swipe action
 */
router.post('/:id/swipes', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only record swipes for themselves
    if (id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { candidateId, direction } = req.body;

    if (!candidateId || !direction) {
      return res.status(400).json({ error: 'candidateId and direction are required' });
    }

    if (!['left', 'right', 'up'].includes(direction)) {
      return res.status(400).json({ error: 'direction must be left, right, or up' });
    }

    // Calculate match score if swiping right
    let matchScore = null;
    if (direction === 'right') {
      const userPrefsResult = await pool.query(
        `SELECT up.importance, i.id as issue_id, i.name as issue_name
         FROM user_preferences up
         JOIN issues i ON up.issue_id = i.id
         WHERE up.user_id = $1`,
        [id]
      );

      const candidateResult = await pool.query(
        'SELECT positions FROM candidates WHERE id = $1',
        [candidateId]
      );

      if (candidateResult.rows.length > 0) {
        const userPreferences = userPrefsResult.rows.map(row => ({
          issueId: row.issue_id,
          issueName: row.issue_name,
          importance: row.importance,
        }));

        const candidatePositions = candidateResult.rows[0].positions || [];
        const match = calculateMatchScore(userPreferences, candidatePositions);
        matchScore = match.score;
      }
    }

    // Record swipe
    const result = await pool.query(
      `INSERT INTO swipes (user_id, candidate_id, direction, match_score)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, candidateId, direction, matchScore]
    );

    // Update gamification stats
    await updateGamificationStats(id, direction);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error recording swipe:', error);
    res.status(500).json({ error: 'Failed to record swipe' });
  }
});

/**
 * GET /api/users/:id/gamification
 * Get user gamification stats
 */
router.get('/:id/gamification', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only access their own gamification
    if (id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const userResult = await pool.query('SELECT gamification FROM users WHERE id = $1', [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const gamification = userResult.rows[0].gamification || {};

    // Get achievements
    const achievementsResult = await pool.query(
      'SELECT * FROM achievements WHERE user_id = $1 ORDER BY unlocked_at DESC',
      [id]
    );

    // Calculate current streak
    const streakResult = await pool.query(
      `SELECT COUNT(DISTINCT DATE(timestamp)) as streak_days
       FROM swipes
       WHERE user_id = $1
       AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
       ORDER BY timestamp DESC`,
      [id]
    );

    res.json({
      ...gamification,
      streak: streakResult.rows[0]?.streak_days || 0,
      badges: achievementsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching gamification:', error);
    res.status(500).json({ error: 'Failed to fetch gamification stats' });
  }
});

/**
 * POST /api/users/:id/location
 * Update user location
 */
router.post('/:id/location', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only update their own location
    if (id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { latitude, longitude, address, district, state, zipCode } = req.body;

    if (!latitude || !longitude || !state) {
      return res.status(400).json({ error: 'latitude, longitude, and state are required' });
    }

    // Update user location
    await pool.query(
      `UPDATE users SET location = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [
        JSON.stringify({ latitude, longitude, address, district, state, zipCode }),
        id,
      ]
    );

    // Also store in user_locations table
    await pool.query(
      `INSERT INTO user_locations (user_id, latitude, longitude, address, district, state, zip_code, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       ON CONFLICT DO NOTHING`,
      [id, latitude, longitude, address, district, state, zipCode]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

/**
 * Update gamification stats after a swipe
 * @private
 */
async function updateGamificationStats(userId, direction) {
  try {
    const userResult = await pool.query('SELECT gamification FROM users WHERE id = $1', [userId]);
    const gamification = userResult.rows[0]?.gamification || { points: 0, streak: 0, level: 1 };

    // Award points
    let points = gamification.points || 0;
    if (direction === 'right') {
      points += 10; // Good match
    } else if (direction === 'up') {
      points += 5; // Learning more
    } else {
      points += 1; // Any engagement
    }

    // Update level (every 100 points = 1 level)
    const level = Math.floor(points / 100) + 1;

    // Check for badge unlocks
    const swipeCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM swipes WHERE user_id = $1',
      [userId]
    );
    const swipeCount = parseInt(swipeCountResult.rows[0]?.count || 0);

    const badges = gamification.badges || [];
    const newBadges = [...badges];

    if (swipeCount >= 10 && !badges.find(b => b.type === 'informed_voter')) {
      newBadges.push({
        type: 'informed_voter',
        name: 'Informed Voter',
        description: 'Reviewed 10+ candidates',
      });
      await pool.query(
        'INSERT INTO achievements (user_id, badge_type) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, 'informed_voter']
      );
    }

    await pool.query(
      `UPDATE users SET gamification = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [JSON.stringify({ points, level, badges: newBadges }), userId]
    );
  } catch (error) {
    console.error('Error updating gamification stats:', error);
  }
}

export default router;

