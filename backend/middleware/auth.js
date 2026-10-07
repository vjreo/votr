import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import pool from '../db/connection.js';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Please set it in your .env file.');
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(userId) {
  // jwt iat is second-resolution. Without a unique jti, two sessions for the
  // same user in the same second produce identical tokens and collide on
  // sessions.refresh_token UNIQUE (seen as sessions_refresh_token_key in CI).
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '7d', jwtid: randomUUID() }
  );
}

/**
 * Verify JWT token — returns decoded payload or null on any error
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Authentication middleware — requires a valid access token.
 * Forwards database errors to the global error handler instead of
 * silently leaving the request hanging.
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const decoded = verifyToken(token);
  if (!decoded || decoded.type === 'refresh') {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  try {
    const result = await pool.query('SELECT id, is_anonymous FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'User not found' });
    }
    req.userId = decoded.userId;
    req.user = result.rows[0];
    next();
  } catch (err) {
    logger.error('authenticateToken: DB error', err.message);
    next(err);
  }
}

/**
 * Optional authentication middleware — attaches user if a valid token is
 * present, continues without auth otherwise. DB errors are logged but do
 * not block the request (fail-open is intentional here: public endpoints
 * should still work when the DB lookup fails).
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return next();

  const decoded = verifyToken(token);
  if (!decoded || decoded.type === 'refresh') return next();

  try {
    const result = await pool.query('SELECT id, is_anonymous FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length > 0) {
      req.userId = decoded.userId;
      req.user = result.rows[0];
    }
  } catch (err) {
    // Log but don't block — this is an optional auth path
    logger.warn('optionalAuth: DB lookup failed, continuing unauthenticated', err.message);
  }

  next();
}
