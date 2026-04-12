/**
 * Bias Analysis API Routes
 */

import express from 'express';
import { analyzeSourceBias, quickBiasCheck, batchAnalyze } from '../services/biasDetection.js';
import { optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

/** Basic URL validation — must be http/https, max 2048 chars */
function isValidUrl(str) {
  if (!str || typeof str !== 'string' || str.length > 2048) return false;
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * POST /api/bias/analyze
 * Full hybrid bias analysis (DB + optional ML/AI).
 * Body: { url: string, content?: string, sourceType?: string }
 */
router.post(
  '/analyze',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { url, content, sourceType = 'news_article' } = req.body;

    if (!isValidUrl(url)) {
      return res.status(400).json({ error: 'A valid http/https URL is required' });
    }

    const validSourceTypes = ['social_media', 'news_article', 'official_website', 'voting_resource', 'other'];
    if (!validSourceTypes.includes(sourceType)) {
      return res.status(400).json({ error: `sourceType must be one of: ${validSourceTypes.join(', ')}` });
    }

    if (content !== undefined && (typeof content !== 'string' || content.length > 50_000)) {
      return res.status(400).json({ error: 'content must be a string under 50,000 characters' });
    }

    const result = await analyzeSourceBias(url, sourceType, content || null);
    res.json({ success: true, url, ...result });
  })
);

/**
 * GET /api/bias/quick
 * Fast local-DB-only bias lookup.
 * Query: url
 */
router.get(
  '/quick',
  asyncHandler(async (req, res) => {
    const { url } = req.query;

    if (!isValidUrl(url)) {
      return res.status(400).json({ error: 'A valid http/https URL is required' });
    }

    const result = await quickBiasCheck(url);
    if (!result) {
      return res.status(404).json({
        error: 'Source not found in database',
        url,
        suggestion: 'Use POST /api/bias/analyze for full analysis',
      });
    }

    res.json({ success: true, url, ...result });
  })
);

/**
 * POST /api/bias/batch
 * Analyze up to 10 sources.
 * Body: { sources: Array<{ url: string, content?: string }> }
 */
router.post(
  '/batch',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { sources } = req.body;

    if (!Array.isArray(sources) || sources.length === 0) {
      return res.status(400).json({ error: 'sources must be a non-empty array' });
    }
    if (sources.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 sources per batch' });
    }

    // Validate each source URL
    const invalid = sources.find((s) => !isValidUrl(s?.url));
    if (invalid) {
      return res.status(400).json({ error: 'All sources must have a valid http/https URL' });
    }

    const results = await batchAnalyze(sources);
    res.json({ success: true, count: results.length, results });
  })
);

/**
 * GET /api/bias/tiers
 * Static tier definitions — no auth required.
 */
router.get('/tiers', (req, res) => {
  res.json({
    tiers: [
      { tier: 'most_reliable',  scoreRange: '0–25',   description: 'Highly factual, minimal bias detected',      color: '#22c55e' },
      { tier: 'reliable',       scoreRange: '26–50',  description: 'Generally reliable with some bias',           color: '#84cc16' },
      { tier: 'use_caution',    scoreRange: '51–75',  description: 'Mixed reliability, noticeable bias',          color: '#f59e0b' },
      { tier: 'highly_biased',  scoreRange: '76–100', description: 'Low reliability, significant bias',           color: '#ef4444' },
    ],
  });
});

export default router;
