import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import candidatesRoutes from './routes/candidates.js';
import usersRoutes from './routes/users.js';
import electionsRoutes from './routes/elections.js';
import sampleBallotRoutes from './routes/sampleBallot.js';
import authRoutes from './routes/auth.js';
import biasRoutes from './routes/bias.js';
import rosterRoutes from './routes/roster.js';
import logger from './utils/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Disable ETag to prevent 304 Not Modified (client would use cached empty response)
app.set('etag', false);

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// Health check (basic - for load balancers)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Readiness check (includes DB connectivity - for production)
app.get('/health/ready', async (req, res) => {
  try {
    const pool = (await import('./db/connection.js')).default;
    await pool.query('SELECT 1');
    res.json({ status: 'ready', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({
      status: 'not ready',
      database: 'disconnected',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      timestamp: new Date().toISOString(),
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidatesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/elections', electionsRoutes);
app.use('/api/sample-ballot', sampleBallotRoutes);
app.use('/api/bias', biasRoutes);
app.use('/api/roster', rosterRoutes);

// Error handling middleware - catches all unhandled errors
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  // Determine status code
  const statusCode = err.statusCode || err.status || 500;
  
  // Send error response
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server (0.0.0.0 so devices on your network can reach it)
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  logger.info(`VOTR API server running on http://${HOST}:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

