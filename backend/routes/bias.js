/**
 * Bias Analysis API Routes
 */

import express from 'express';
import { analyzeSourceBias, quickBiasCheck, batchAnalyze, getBiasTier } from '../services/biasDetection.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/bias/analyze
 * Analyze a source for bias
 * Body: { url: string, content?: string, sourceType?: string }
 */
router.post('/analyze', optionalAuth, async (req, res) => {
  const { url, content, sourceType = 'news_article' } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const result = await analyzeSourceBias(url, sourceType, content);

  res.json({
    success: true,
    url,
    ...result,
  });
});

/**
 * GET /api/bias/quick
 * Quick bias check using only database (no ML)
 * Query: url
 */
router.get('/quick', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const result = await quickBiasCheck(url);

  if (!result) {
    return res.status(404).json({
      error: 'Source not found in database',
      url,
      suggestion: 'Use POST /api/bias/analyze for full analysis',
    });
  }

  res.json({
    success: true,
    url,
    ...result,
  });
});

/**
 * POST /api/bias/batch
 * Analyze multiple sources at once
 * Body: { sources: Array<{ url: string, content?: string }> }
 */
router.post('/batch', optionalAuth, async (req, res) => {
  const { sources } = req.body;

  if (!sources || !Array.isArray(sources) || sources.length === 0) {
    return res.status(400).json({ error: 'Sources array is required' });
  }

  if (sources.length > 10) {
    return res.status(400).json({ error: 'Maximum 10 sources per batch' });
  }

  const results = await batchAnalyze(sources);

  res.json({
    success: true,
    count: results.length,
    results,
  });
});

/**
 * GET /api/bias/tiers
 * Get bias tier definitions
 */
router.get('/tiers', (req, res) => {
  res.json({
    tiers: [
      {
        tier: 'most_reliable',
        scoreRange: '0-25',
        description: 'Highly factual, minimal bias detected',
        color: '#22c55e', // green
      },
      {
        tier: 'reliable',
        scoreRange: '26-50',
        description: 'Generally reliable with some bias',
        color: '#84cc16', // lime
      },
      {
        tier: 'use_caution',
        scoreRange: '51-75',
        description: 'Mixed reliability, noticeable bias',
        color: '#f59e0b', // amber
      },
      {
        tier: 'highly_biased',
        scoreRange: '76-100',
        description: 'Low reliability, significant bias',
        color: '#ef4444', // red
      },
    ],
  });
});

export default router;
