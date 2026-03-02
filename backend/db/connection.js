import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

// Support DATABASE_URL (production: Render, Railway, etc.) or individual vars (local)
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  : (() => {
      const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER'];
      const missingVars = requiredEnvVars.filter(
        (varName) =>
          process.env[varName] === undefined ||
          process.env[varName] === null ||
          String(process.env[varName]).trim() === ''
      );
      if (missingVars.length > 0) {
        logger.error('Missing required environment variables:', missingVars.join(', '));
        logger.error('Please set DATABASE_URL or DB_HOST, DB_NAME, DB_USER in your .env file');
        process.exit(1);
      }
      return {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD || undefined,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      };
    })();

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;