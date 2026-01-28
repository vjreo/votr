import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db/connection.js';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * POST /api/auth/anonymous
 * Create an anonymous user (no authentication required)
 */
router.post('/anonymous', async (req, res) => {
  try {
    // Generate anonymous user
    const result = await pool.query(
      `INSERT INTO users (auth_provider, is_anonymous, gamification)
       VALUES ($1, $2, $3)
       RETURNING id, is_anonymous, created_at`,
      [
        'anonymous',
        true,
        JSON.stringify({ points: 0, streak: 0, level: 1, badges: [] }),
      ]
    );

    const user = result.rows[0];
    
    // Generate tokens (anonymous users can still have sessions)
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await pool.query(
      'INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    res.status(201).json({
      user: {
        id: user.id,
        isAnonymous: user.is_anonymous,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Error creating anonymous user:', error);
    res.status(500).json({ error: 'Failed to create anonymous user' });
  }
});

/**
 * POST /api/auth/register
 * Register with email/password
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, auth_provider, is_anonymous, is_email_verified)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, is_anonymous, created_at`,
      [email, passwordHash, 'email', false, false]
    );

    const user = result.rows[0];
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await pool.query(
      'INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        isAnonymous: user.is_anonymous,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

/**
 * POST /api/auth/login
 * Login with email/password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, email, password_hash, is_anonymous FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (!user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await pool.query(
      'INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        isAnonymous: user.is_anonymous,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

/**
 * POST /api/auth/oauth
 * OAuth login (Google/Apple)
 */
router.post('/oauth', async (req, res) => {
  try {
    const { provider, providerId, email, name } = req.body;

    if (!provider || !providerId) {
      return res.status(400).json({ error: 'Provider and providerId are required' });
    }

    if (!['google', 'apple'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    // Check if user exists with this provider
    let result = await pool.query(
      'SELECT id, email, is_anonymous FROM users WHERE auth_provider = $1 AND provider_id = $2',
      [provider, providerId]
    );

    let user;
    if (result.rows.length > 0) {
      // Existing user
      user = result.rows[0];
      
      // Update email if provided and not set
      if (email && !user.email) {
        await pool.query('UPDATE users SET email = $1 WHERE id = $2', [email, user.id]);
        user.email = email;
      }
    } else {
      // Check if email exists (link accounts)
      if (email) {
        const emailResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (emailResult.rows.length > 0) {
          // Link OAuth to existing email account
          await pool.query(
            'UPDATE users SET auth_provider = $1, provider_id = $2, is_anonymous = false WHERE id = $3',
            [provider, providerId, emailResult.rows[0].id]
          );
          user = { ...emailResult.rows[0], email, is_anonymous: false };
        }
      }

      // Create new user if still doesn't exist
      if (!user) {
        result = await pool.query(
          `INSERT INTO users (email, auth_provider, provider_id, is_anonymous, is_email_verified)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, email, is_anonymous`,
          [email || null, provider, providerId, false, !!email]
        );
        user = result.rows[0];
      }
    }

    // Update last login
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await pool.query(
      'INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        isAnonymous: user.is_anonymous,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Error with OAuth login:', error);
    res.status(500).json({ error: 'Failed to authenticate' });
  }
});

/**
 * POST /api/auth/link-anonymous
 * Link anonymous user data to authenticated account
 */
router.post('/link-anonymous', async (req, res) => {
  try {
    const { anonymousUserId } = req.body;
    const userId = req.userId; // From authenticateToken middleware

    if (!anonymousUserId) {
      return res.status(400).json({ error: 'anonymousUserId is required' });
    }

    // Verify anonymous user exists
    const anonymousUser = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND is_anonymous = true',
      [anonymousUserId]
    );

    if (anonymousUser.rows.length === 0) {
      return res.status(404).json({ error: 'Anonymous user not found' });
    }

    const anonUser = anonymousUser.rows[0];

    // Merge data: preferences, swipes, achievements
    // Get authenticated user's current data
    const authUser = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

    // Merge preferences (combine unique issues)
    const mergedPrefs = [...(authUser.rows[0].preferences || [])];
    const anonPrefs = anonUser.preferences || [];
    anonPrefs.forEach((pref) => {
      if (!mergedPrefs.find((p) => p.issueId === pref.issueId)) {
        mergedPrefs.push(pref);
      }
    });

    // Merge gamification (take higher values)
    const authGam = authUser.rows[0].gamification || {};
    const anonGam = anonUser.gamification || {};
    const mergedGam = {
      points: Math.max(authGam.points || 0, anonGam.points || 0),
      streak: Math.max(authGam.streak || 0, anonGam.streak || 0),
      level: Math.max(authGam.level || 1, anonGam.level || 1),
      badges: [...new Set([...(authGam.badges || []), ...(anonGam.badges || [])])],
    };

    // Update authenticated user with merged data
    await pool.query(
      `UPDATE users 
       SET preferences = $1, gamification = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [JSON.stringify(mergedPrefs), JSON.stringify(mergedGam), userId]
    );

    // Transfer swipes
    await pool.query(
      'UPDATE swipes SET user_id = $1 WHERE user_id = $2',
      [userId, anonymousUserId]
    );

    // Transfer achievements
    await pool.query(
      'UPDATE achievements SET user_id = $1 WHERE user_id = $2',
      [userId, anonymousUserId]
    );

    // Delete anonymous user
    await pool.query('DELETE FROM users WHERE id = $1', [anonymousUserId]);

    res.json({ success: true, message: 'Anonymous data linked successfully' });
  } catch (error) {
    console.error('Error linking anonymous data:', error);
    res.status(500).json({ error: 'Failed to link anonymous data' });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    if (!decoded || decoded.type !== 'refresh') {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    // Verify token exists in database and is not expired
    const session = await pool.query(
      'SELECT * FROM sessions WHERE refresh_token = $1 AND expires_at > CURRENT_TIMESTAMP',
      [refreshToken]
    );

    if (session.rows.length === 0) {
      return res.status(403).json({ error: 'Refresh token expired or invalid' });
    }

    // Generate new access token
    const accessToken = generateAccessToken(decoded.userId);

    res.json({ accessToken });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

/**
 * POST /api/auth/logout
 * Logout (invalidate refresh token)
 */
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await pool.query('DELETE FROM sessions WHERE refresh_token = $1', [refreshToken]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

export default router;

