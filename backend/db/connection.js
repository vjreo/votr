import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

// Validate required environment variables
// Note: DB_PASSWORD can be empty (no password required), so it's not in the required list
const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER'];
const missingVars = requiredEnvVars.filter(varName => process.env[varName] === undefined || process.env[varName] === null || String(process.env[varName]).trim() === '');

if (missingVars.length > 0) {
  logger.error('Missing required environment variables:', missingVars.join(', '));
  logger.error('Please set these in your .env file');
  logger.error('Note: DB_PASSWORD can be left empty if PostgreSQL doesn\'t require a password');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || undefined, // Allow empty password (undefined means no password)
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;