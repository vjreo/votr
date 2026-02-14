import jwt from 'jsonwebtoken';
import pool from '../db/connection.js';

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
  return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const decoded = verifyToken(token);
  if (!decoded || decoded.type === 'refresh') {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  // Verify user still exists
  const result = await pool.query('SELECT id, is_anonymous FROM users WHERE id = $1', [decoded.userId]);
  if (result.rows.length === 0) {
    return res.status(403).json({ error: 'User not found' });
  }

  req.userId = decoded.userId;
  req.user = result.rows[0];
  next();
}

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't require it
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = verifyToken(token);
    if (decoded && decoded.type !== 'refresh') {
      try {
        const result = await pool.query('SELECT id, is_anonymous FROM users WHERE id = $1', [decoded.userId]);
        if (result.rows.length > 0) {
          req.userId = decoded.userId;
          req.user = result.rows[0];
        }
      } catch (error) {
        // Ignore errors, continue without auth
      }
    }
  }
  next();
}

