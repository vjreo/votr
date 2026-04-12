import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db/connection.js';
import { generateAccessToken, generateRefreshToken, verifyToken, authenticateToken } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';

const router = express.Router();

// ── Helper ─────────────────────────────────────────────────────────────────────

/** Persist a new session and return tokens */
async function createSession(client, userId) {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await client.query(
    'INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES ($1, $2, $3)',
    [userId, refreshToken, expiresAt]
  );
  return { accessToken, refreshToken };
}

// ── Routes ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/anonymous
 * Create an anonymous user. Rate-limited upstream.
 */
router.post(
  '/anonymous',
  asyncHandler(async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `INSERT INTO users (auth_provider, is_anonymous, gamification)
         VALUES ($1, $2, $3)
         RETURNING id, is_anonymous, created_at`,
        ['anonymous', true, JSON.stringify({ points: 0, streak: 0, level: 1, badges: [] })]
      );
      const user = result.rows[0];
      const { accessToken, refreshToken } = await createSession(client, user.id);
      await client.query('COMMIT');

      res.status(201).json({
        user: { id: user.id, isAnonymous: user.is_anonymous },
        accessToken,
        refreshToken,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

/**
 * POST /api/auth/register
 * Register with email/password.
 */
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Basic email format check (full validation is done by DB unique constraint)
    if (typeof email !== 'string' || !email.includes('@') || email.length > 255) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: 'Password must be 8–128 characters' });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `INSERT INTO users (email, password_hash, auth_provider, is_anonymous, is_email_verified)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, is_anonymous`,
        [email.toLowerCase(), passwordHash, 'email', false, false]
      );
      const user = result.rows[0];
      const { accessToken, refreshToken } = await createSession(client, user.id);
      await client.query('COMMIT');

      res.status(201).json({
        user: { id: user.id, email: user.email, isAnonymous: user.is_anonymous },
        accessToken,
        refreshToken,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

/**
 * POST /api/auth/login
 * Login with email/password.
 */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query(
      'SELECT id, email, password_hash, is_anonymous FROM users WHERE email = $1',
      [typeof email === 'string' ? email.toLowerCase() : email]
    );

    const user = result.rows[0];

    // Use constant-time comparison even when user doesn't exist to resist timing attacks
    const dummyHash = '$2a$12$invalidhashtopreventtimingattacks000000000000000000000';
    const isValid = user?.password_hash
      ? await bcrypt.compare(password, user.password_hash)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!user || !isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Fire-and-forget last_login update inside transaction for consistency
      await client.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
      const { accessToken, refreshToken } = await createSession(client, user.id);
      await client.query('COMMIT');

      res.json({
        user: { id: user.id, email: user.email, isAnonymous: user.is_anonymous },
        accessToken,
        refreshToken,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

/**
 * POST /api/auth/oauth
 * OAuth login/register (Google / Apple).
 */
router.post(
  '/oauth',
  asyncHandler(async (req, res) => {
    const { provider, providerId, email, name } = req.body;

    if (!provider || !providerId) {
      return res.status(400).json({ error: 'Provider and providerId are required' });
    }
    if (!['google', 'apple'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' });
    }
    if (typeof providerId !== 'string' || providerId.length > 255) {
      return res.status(400).json({ error: 'Invalid providerId' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let user;

      // 1. Look up existing OAuth account
      const existing = await client.query(
        'SELECT id, email, is_anonymous FROM users WHERE auth_provider = $1 AND provider_id = $2',
        [provider, providerId]
      );

      if (existing.rows.length > 0) {
        user = existing.rows[0];
        // Update email if newly provided
        if (email && !user.email) {
          await client.query('UPDATE users SET email = $1 WHERE id = $2', [email.toLowerCase(), user.id]);
          user.email = email.toLowerCase();
        }
      } else {
        // 2. Try to link to existing email account
        if (email) {
          const emailResult = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
          if (emailResult.rows.length > 0) {
            await client.query(
              'UPDATE users SET auth_provider = $1, provider_id = $2, is_anonymous = false WHERE id = $3',
              [provider, providerId, emailResult.rows[0].id]
            );
            user = { ...emailResult.rows[0], email: email.toLowerCase(), is_anonymous: false };
          }
        }

        // 3. Create new user
        if (!user) {
          const created = await client.query(
            `INSERT INTO users (email, auth_provider, provider_id, is_anonymous, is_email_verified)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, email, is_anonymous`,
            [email ? email.toLowerCase() : null, provider, providerId, false, !!email]
          );
          user = created.rows[0];
        }
      }

      await client.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
      const { accessToken, refreshToken } = await createSession(client, user.id);
      await client.query('COMMIT');

      res.json({
        user: { id: user.id, email: user.email, isAnonymous: user.is_anonymous },
        accessToken,
        refreshToken,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

/**
 * POST /api/auth/link-anonymous
 * Merge an anonymous user's data into the authenticated account.
 * Runs entirely inside a single transaction to prevent partial merges.
 */
router.post(
  '/link-anonymous',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { anonymousUserId } = req.body;
    const userId = req.userId;

    if (!anonymousUserId || typeof anonymousUserId !== 'string') {
      return res.status(400).json({ error: 'anonymousUserId is required' });
    }

    // Prevent linking to yourself
    if (anonymousUserId === userId) {
      return res.status(400).json({ error: 'Cannot link account to itself' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const anonResult = await client.query(
        'SELECT * FROM users WHERE id = $1 AND is_anonymous = true',
        [anonymousUserId]
      );
      if (anonResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Anonymous user not found' });
      }

      const anonUser = anonResult.rows[0];
      const authResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
      if (authResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Authenticated user not found' });
      }

      const authUser = authResult.rows[0];

      // Merge preferences (auth takes precedence on duplicate issues)
      const authPrefs = authUser.preferences || [];
      const anonPrefs = anonUser.preferences || [];
      const authPrefIds = new Set(authPrefs.map((p) => p.issueId));
      const mergedPrefs = [...authPrefs, ...anonPrefs.filter((p) => !authPrefIds.has(p.issueId))];

      // Merge gamification (take higher values)
      const authGam = authUser.gamification || {};
      const anonGam = anonUser.gamification || {};
      const mergedGam = {
        points: Math.max(authGam.points || 0, anonGam.points || 0),
        streak: Math.max(authGam.streak || 0, anonGam.streak || 0),
        level: Math.max(authGam.level || 1, anonGam.level || 1),
        badges: [...new Set([...(authGam.badges || []), ...(anonGam.badges || [])])],
      };

      await client.query(
        'UPDATE users SET preferences = $1, gamification = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [JSON.stringify(mergedPrefs), JSON.stringify(mergedGam), userId]
      );

      // Reassign swipes (ignore duplicates)
      await client.query(
        `INSERT INTO swipes (user_id, candidate_id, direction, match_score, timestamp)
         SELECT $1, candidate_id, direction, match_score, timestamp FROM swipes WHERE user_id = $2
         ON CONFLICT DO NOTHING`,
        [userId, anonymousUserId]
      );

      // Reassign achievements (ignore duplicates)
      await client.query(
        `INSERT INTO achievements (user_id, badge_type, unlocked_at)
         SELECT $1, badge_type, unlocked_at FROM achievements WHERE user_id = $2
         ON CONFLICT (user_id, badge_type) DO NOTHING`,
        [userId, anonymousUserId]
      );

      // Transfer roster
      await client.query(
        `INSERT INTO user_roster (user_id, candidate_id)
         SELECT $1, candidate_id FROM user_roster WHERE user_id = $2
         ON CONFLICT (user_id, candidate_id) DO NOTHING`,
        [userId, anonymousUserId]
      );

      // Delete anonymous user (cascades sessions, old swipes, etc.)
      await client.query('DELETE FROM users WHERE id = $1', [anonymousUserId]);

      await client.query('COMMIT');
      res.json({ success: true, message: 'Anonymous data linked successfully' });
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('link-anonymous failed, rolled back:', err.message);
      throw err;
    } finally {
      client.release();
    }
  })
);

/**
 * POST /api/auth/refresh
 * Exchange a valid refresh token for a new access token.
 */
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken || typeof refreshToken !== 'string') {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const decoded = verifyToken(refreshToken);
    if (!decoded || decoded.type !== 'refresh') {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const session = await pool.query(
      'SELECT * FROM sessions WHERE refresh_token = $1 AND expires_at > CURRENT_TIMESTAMP',
      [refreshToken]
    );
    if (session.rows.length === 0) {
      return res.status(403).json({ error: 'Refresh token expired or invalid' });
    }

    const accessToken = generateAccessToken(decoded.userId);
    res.json({ accessToken });
  })
);

/**
 * POST /api/auth/logout
 * Invalidate a refresh token.
 */
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken && typeof refreshToken === 'string') {
      await pool.query('DELETE FROM sessions WHERE refresh_token = $1', [refreshToken]);
    }
    res.json({ success: true });
  })
);

export default router;
