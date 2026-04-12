import app from './app.js';
import logger from './utils/logger.js';
import { ensureNCData } from './db/bootstrapNCData.js';
import dotenv from 'dotenv';

dotenv.config();

// Production safety: ensure JWT_SECRET is set and strong
if (process.env.NODE_ENV === 'production') {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    console.error('FATAL: JWT_SECRET must be set and at least 32 characters in production.');
    process.exit(1);
  }
}

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  // Auto-populate NC curated candidates and 2026 elections if missing
  try {
    await ensureNCData();
  } catch (err) {
    logger.warn('Startup data bootstrap failed (non-fatal):', err.message);
  }

  app.listen(PORT, HOST, () => {
    logger.info(`VOTR API server running on http://${HOST}:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

start();
