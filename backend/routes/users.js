import express from 'express';
import pool from '../db/connection.js';
import { calculateMatchScore } from '../services/matchScoring.js';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// Valid US state codes for location validation
const VALID_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
]);

// ── Deprecated endpoint kept for backward-compat ───────────────────────────────
/**
 * POST /api/users  (deprecated — use POST /api/auth/anonymous)
 * Removed the open insert; redirect callers to the proper auth route.
 */
router.post('/', (req, res) => {
  res.status(410).json({ error: 'Deprecated. Use POST /api/auth/anonymous instead.' });
});

// ── User profile ───────────────────────────────────────────────────────────────

/**
 * GET /api/users/me
 * Get the authenticated user's profile. Must come before /:id.
 */
router.get(
  '/me',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT id, email, auth_provider, is_anonymous, preferences, location,
              gamification, notification_preferences, created_at, last_login
       FROM users WHERE id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(formatUser(result.rows[0]));
  })
);

/**
 * GET /api/users/:id
 * Get user by ID — users may only access their own record.
 */
router.get(
  '/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

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

    res.json(formatUser(result.rows[0]));
  })
);

// ── Preferences ────────────────────────────────────────────────────────────────

/**
 * POST /api/users/:id/preferences
 * Replace a user's issue preferences.
 */
router.post(
  '/:id/preferences',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { preferences } = req.body;

    if (id !== req.userId) return res.status(403).json({ error: 'Access denied' });
    if (!Array.isArray(preferences)) {
      return res.status(400).json({ error: 'preferences must be an array' });
    }
    if (preferences.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 preferences allowed' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Replace all preferences atomically
      await client.query('DELETE FROM user_preferences WHERE user_id = $1', [id]);

      const preferencesJson = [];

      for (const pref of preferences) {
        const issueName = (pref.issueName || pref.issueId || '').trim();
        if (!issueName || issueName.length > 255) continue;

        // Upsert issue (race-safe)
        const issueResult = await client.query(
          `INSERT INTO issues (name) VALUES ($1)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [issueName]
        );
        const issueId = issueResult.rows[0].id;

        const importance = Number(pref.importance);
        const safeImportance = Number.isInteger(importance) && importance >= 1 && importance <= 5
          ? importance
          : 3;

        await client.query(
          `INSERT INTO user_preferences (user_id, issue_id, importance)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, issue_id) DO UPDATE SET importance = $3`,
          [id, issueId, safeImportance]
        );

        preferencesJson.push({
          issueId: String(issueId),
          issueName,
          importance: safeImportance,
        });
      }

      // Sync users.preferences JSONB so GET /users/me returns fresh data
      await client.query(
        'UPDATE users SET preferences = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [JSON.stringify(preferencesJson), id]
      );

      await client.query('COMMIT');
      res.json({ success: true, preferences: preferencesJson });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

// ── Swipes ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/users/:id/swipes
 * Record a swipe and update gamification.
 */
router.post(
  '/:id/swipes',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (id !== req.userId) return res.status(403).json({ error: 'Access denied' });

    const { candidateId, direction } = req.body;
    if (!candidateId || typeof candidateId !== 'string') {
      return res.status(400).json({ error: 'candidateId is required' });
    }
    if (!['left', 'right', 'up'].includes(direction)) {
      return res.status(400).json({ error: 'direction must be left, right, or up' });
    }

    // Verify candidate exists
    const candidateCheck = await pool.query('SELECT id, positions FROM candidates WHERE id = $1', [candidateId]);
    if (candidateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    let matchScore = null;
    if (direction === 'right') {
      const userPrefsResult = await pool.query(
        `SELECT up.importance, i.id as issue_id, i.name as issue_name
         FROM user_preferences up JOIN issues i ON up.issue_id = i.id
         WHERE up.user_id = $1`,
        [id]
      );
      const candidatePositions = candidateCheck.rows[0].positions || [];
      const userPreferences = userPrefsResult.rows.map((row) => ({
        issueId: row.issue_id,
        issueName: row.issue_name,
        importance: row.importance,
      }));
      matchScore = calculateMatchScore(userPreferences, candidatePositions).score;
    }

    const result = await pool.query(
      `INSERT INTO swipes (user_id, candidate_id, direction, match_score)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, candidateId, direction, matchScore]
    );

    // Update gamification asynchronously — don't block the response
    updateGamificationStats(id, direction).catch((err) =>
      console.error('Gamification update failed silently:', err.message)
    );

    res.json(result.rows[0]);
  })
);

// ── Gamification ───────────────────────────────────────────────────────────────

/**
 * GET /api/users/:id/gamification
 */
router.get(
  '/:id/gamification',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (id !== req.userId) return res.status(403).json({ error: 'Access denied' });

    const [userResult, achievementsResult, streakResult] = await Promise.all([
      pool.query('SELECT gamification FROM users WHERE id = $1', [id]),
      pool.query('SELECT * FROM achievements WHERE user_id = $1 ORDER BY unlocked_at DESC', [id]),
      pool.query(
        `SELECT COUNT(DISTINCT DATE(timestamp)) as streak_days
         FROM swipes WHERE user_id = $1 AND timestamp >= CURRENT_DATE - INTERVAL '30 days'`,
        [id]
      ),
    ]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      ...(userResult.rows[0].gamification || {}),
      streak: parseInt(streakResult.rows[0]?.streak_days || 0, 10),
      badges: achievementsResult.rows,
    });
  })
);

// ── Location ───────────────────────────────────────────────────────────────────

/**
 * POST /api/users/:id/location
 */
router.post(
  '/:id/location',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (id !== req.userId) return res.status(403).json({ error: 'Access denied' });

    const { latitude, longitude, address, district, state, zipCode } = req.body;

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({ error: 'latitude must be a number between -90 and 90' });
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'longitude must be a number between -180 and 180' });
    }
    if (!state || typeof state !== 'string') {
      return res.status(400).json({ error: 'state is required' });
    }

    const stateCode = state.toUpperCase();
    if (!VALID_STATES.has(stateCode)) {
      return res.status(400).json({ error: 'Invalid US state code' });
    }

    const locationJson = JSON.stringify({ latitude: lat, longitude: lng, address, district, state: stateCode, zipCode });

    await pool.query(
      'UPDATE users SET location = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [locationJson, id]
    );

    // Upsert the primary location record
    await pool.query(
      `INSERT INTO user_locations (user_id, latitude, longitude, address, district, state, zip_code, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       ON CONFLICT (user_id, state) DO UPDATE
         SET latitude = $2, longitude = $3, address = $4, district = $5, zip_code = $7, is_primary = true`,
      [id, lat, lng, address || null, district || null, stateCode, zipCode || null]
    );

    res.json({ success: true });
  })
);

// ── Private helpers ────────────────────────────────────────────────────────────

function formatUser(row) {
  return {
    id: row.id,
    email: row.email,
    authProvider: row.auth_provider,
    isAnonymous: row.is_anonymous,
    preferences: row.preferences,
    location: row.location,
    gamification: row.gamification,
    notificationPreferences: row.notification_preferences,
    createdAt: row.created_at,
    lastLogin: row.last_login,
  };
}

const POINT_MAP = { right: 10, up: 5, left: 1 };
const MAX_POINTS = 1_000_000; // Prevent integer overflow in gamification

async function updateGamificationStats(userId, direction) {
  const userResult = await pool.query('SELECT gamification FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) return;

  const gamification = userResult.rows[0]?.gamification || { points: 0, streak: 0, level: 1, badges: [] };

  const points = Math.min((gamification.points || 0) + (POINT_MAP[direction] ?? 1), MAX_POINTS);
  const level = Math.floor(points / 100) + 1;

  const swipeCountResult = await pool.query('SELECT COUNT(*) as count FROM swipes WHERE user_id = $1', [userId]);
  const swipeCount = parseInt(swipeCountResult.rows[0]?.count || 0, 10);

  const badges = gamification.badges || [];
  const newBadges = [...badges];

  if (swipeCount >= 10 && !badges.find((b) => b.type === 'informed_voter')) {
    newBadges.push({ type: 'informed_voter', name: 'Informed Voter', description: 'Reviewed 10+ candidates' });
    await pool.query(
      'INSERT INTO achievements (user_id, badge_type) VALUES ($1, $2) ON CONFLICT (user_id, badge_type) DO NOTHING',
      [userId, 'informed_voter']
    );
  }

  await pool.query(
    'UPDATE users SET gamification = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [JSON.stringify({ points, level, streak: gamification.streak || 0, badges: newBadges }), userId]
  );
}

export default router;
