/**
 * app.js — Express application factory
 *
 * Separated from server.js so the configured app can be imported by tests
 * (via supertest) without starting a live HTTP listener.
 */
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import candidatesRoutes from './routes/candidates.js';
import usersRoutes from './routes/users.js';
import electionsRoutes from './routes/elections.js';
import sampleBallotRoutes from './routes/sampleBallot.js';
import authRoutes from './routes/auth.js';
import biasRoutes from './routes/bias.js';
import rosterRoutes from './routes/roster.js';
import logger from './utils/logger.js';

dotenv.config();

const isDev = process.env.NODE_ENV !== 'production';

const app = express();

// Security headers
app.use(helmet());
app.set('etag', false);

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:19006'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || isDev) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(morgan(isDev ? 'dev' : 'combined'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ── Rate Limiting ──────────────────────────────────────────────────────────────

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: () => process.env.NODE_ENV !== 'production',
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: () => process.env.NODE_ENV !== 'production',
});

const biasLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many bias analysis requests, please try again later.' },
  skip: () => process.env.NODE_ENV !== 'production',
});

// ── Health Checks ──────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (req, res) => {
  try {
    const pool = (await import('./db/connection.js')).default;
    await pool.query('SELECT 1');
    res.json({ status: 'ready', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({
      status: 'not ready',
      database: 'disconnected',
      error: isDev ? err.message : undefined,
      timestamp: new Date().toISOString(),
    });
  }
});

// ── API Routes ─────────────────────────────────────────────────────────────────

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/candidates', apiLimiter, candidatesRoutes);
app.use('/api/users', apiLimiter, usersRoutes);
app.use('/api/elections', apiLimiter, electionsRoutes);
app.use('/api/sample-ballot', apiLimiter, sampleBallotRoutes);
app.use('/api/bias', biasLimiter, biasRoutes);
app.use('/api/roster', apiLimiter, rosterRoutes);

// ── Global Error Handler ───────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error(`[${req.method} ${req.path}] Unhandled error:`, err.message);
  if (isDev) logger.error(err.stack);

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: isDev ? err.message : statusCode < 500 ? err.message : 'Internal server error',
  });
});

export default app;
