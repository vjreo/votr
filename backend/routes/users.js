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
});

/**
 * GET /api/users/me
 * Get current authenticated user
 */
router.get('/me', authenticateToken, async (req, res) => {
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
});

/**
 * GET /api/users/:id
 * Get user by ID (for backward compatibility, requires auth)
 */
router.get('/:id', authenticateToken, async (req, res) => {
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
});

/**
 * POST /api/users/:id/preferences
 * Update user preferences
 */
router.post('/:id/preferences', authenticateToken, async (req, res) => {
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
    const displayName = pref.issueName || pref.issueId || String(pref);
    if (!displayName) continue;

    const issueName = pref.issueName || displayName;
    let issueResult = await pool.query(
      'SELECT id FROM issues WHERE LOWER(name) = LOWER($1)',
      [issueName]
    );

    let issueId;
    if (issueResult.rows.length > 0) {
      issueId = issueResult.rows[0].id;
    } else {
      const newIssue = await pool.query(
        'INSERT INTO issues (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
        [issueName]
      );
      issueId = newIssue.rows[0].id;
    }

    await pool.query(
      `INSERT INTO user_preferences (user_id, issue_id, importance)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, issue_id) DO UPDATE SET importance = $3`,
      [id, issueId, pref.importance || 1]
    );
  }

  res.json({ success: true, preferences });
});

/**
 * POST /api/users/:id/swipes
 * Record a swipe action
 */
router.post('/:id/swipes', authenticateToken, async (req, res) => {
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
});

/**
 * GET /api/users/:id/gamification
 * Get user gamification stats
 */
router.get('/:id/gamification', authenticateToken, async (req, res) => {
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
     AND timestamp >= CURRENT_DATE - INTERVAL '30 days'`,
    [id]
  );

  res.json({
    ...gamification,
    streak: streakResult.rows[0]?.streak_days || 0,
    badges: achievementsResult.rows,
  });
});

/**
 * POST /api/users/:id/location
 * Update user location
 */
router.post('/:id/location', authenticateToken, async (req, res) => {
  const { id } = req.params;

  // Users can only update their own location
  if (id !== req.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { latitude, longitude, address, district, state, zipCode } = req.body;

  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !state) {
    return res.status(400).json({
      error: 'latitude, longitude, and state are required',
      received: { latitude, longitude, state },
    });
  }

  // Update user location
  await pool.query(
    `UPDATE users SET location = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [
      JSON.stringify({ latitude: lat, longitude: lng, address, district, state, zipCode }),
      id,
    ]
  );

  // Also store in user_locations table
  try {
    await pool.query(
      `INSERT INTO user_locations (user_id, latitude, longitude, address, district, state, zip_code, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
      [id, lat, lng, address || null, district || null, state, zipCode || null]
    );
  } catch (err) {
    if (err.code === '23505') {
      // Unique violation - location already exists, update instead
      await pool.query(
        `UPDATE user_locations SET latitude = $2, longitude = $3, address = $4, district = $5, state = $6, zip_code = $7, is_primary = true
         WHERE user_id = $1`,
        [id, lat, lng, address || null, district || null, state, zipCode || null]
      );
    } else {
      throw err;
    }
  }

  res.json({ success: true });
});

/**
 * Update gamification stats after a swipe
 * @private
 */
async function updateGamificationStats(userId, direction) {
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
}

export default router;

