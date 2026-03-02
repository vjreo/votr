/**
 * Bias Detection Service
 * Hybrid approach: ML analysis + known bias databases + user feedback
 *
 * Combines:
 * - Hugging Face models for political bias/sentiment/toxicity
 * - OpenAI for deep content analysis
 * - Pre-compiled media bias database
 * - User feedback scores
 */

import crypto from 'crypto';
import pool from '../db/connection.js';
import logger from '../utils/logger.js';
import { analyzeText } from '../integrations/huggingfaceApi.js';
import { analyzeContentBias } from '../integrations/openaiApi.js';
import { getMediaBiasRating } from '../integrations/mediaBiasApi.js';
import { lookupSourceBias, getBiasTierFromReliability, extractDomain } from '../data/mediaBiasDatabase.js';

/**
 * Calculate bias tier from score
 * @param {number} score - Bias score (0-100, lower is more reliable)
 * @returns {string} Bias tier
 */
export function getBiasTier(score) {
  if (score <= 25) return 'most_reliable';
  if (score <= 50) return 'reliable';
  if (score <= 75) return 'use_caution';
  return 'highly_biased';
}

/**
 * Hash URL for caching
 * @param {string} url - Source URL
 * @returns {string} URL hash
 */
function hashUrl(url) {
  return crypto.createHash('sha256').update(url).digest('hex');
}

/**
 * Analyze source bias using hybrid approach
 * @param {string} url - Source URL
 * @param {string} sourceType - Type of source
 * @param {string} content - Optional content text for ML analysis
 * @returns {Promise<Object>} Bias analysis result
 */
export async function analyzeSourceBias(url, sourceType, content = null) {
  const urlHash = hashUrl(url);

  // Check cache first
  const cached = await getCachedBiasAnalysis(urlHash);
  if (cached && isCacheValid(cached)) {
    return {
      biasScore: cached.bias_score,
      biasTier: cached.bias_tier,
      fromCache: true,
      analysisData: cached.analysis_data,
    };
  }

  // Run hybrid analysis
  const [databaseScore, mlScore, openaiScore, userFeedbackScore] = await Promise.all([
    checkBiasDatabases(url, sourceType),
    content ? analyzeWithML(content, url) : Promise.resolve(null),
    content ? analyzeWithOpenAI(content, url) : Promise.resolve(null),
    getUserFeedbackScore(urlHash),
  ]);

  // Weighted combination based on what data we have
  const weights = calculateWeights(databaseScore, mlScore, openaiScore, userFeedbackScore);

  let finalScore = 50; // Default neutral
  let totalWeight = 0;

  if (databaseScore !== null) {
    // Database reliability score - invert for bias score (high reliability = low bias)
    const dbBiasScore = 100 - databaseScore.reliabilityScore;
    finalScore += (dbBiasScore - 50) * weights.database;
    totalWeight += weights.database;
  }

  if (mlScore !== null) {
    finalScore += (mlScore.combinedBiasScore - 50) * weights.ml;
    totalWeight += weights.ml;
  }

  if (openaiScore !== null) {
    // OpenAI gives reliability score - invert for bias
    const oaiBiasScore = 100 - openaiScore.reliabilityScore;
    finalScore += (oaiBiasScore - 50) * weights.openai;
    totalWeight += weights.openai;
  }

  if (userFeedbackScore !== null) {
    finalScore += (userFeedbackScore - 50) * weights.userFeedback;
    totalWeight += weights.userFeedback;
  }

  // Normalize if we have data
  if (totalWeight > 0) {
    finalScore = 50 + (finalScore - 50) / totalWeight;
  }

  finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));
  const biasTier = getBiasTier(finalScore);

  // Build analysis data for caching
  const analysisData = {
    databaseScore: databaseScore ? {
      name: databaseScore.name,
      biasScore: databaseScore.biasScore,
      reliabilityScore: databaseScore.reliabilityScore,
      factualReporting: databaseScore.factualReporting,
      category: databaseScore.category,
    } : null,
    mlScore: mlScore ? {
      combinedBiasScore: mlScore.combinedBiasScore,
      politicalBias: mlScore.politicalBias,
      sentiment: mlScore.sentiment,
    } : null,
    openaiScore: openaiScore ? {
      reliabilityScore: openaiScore.reliabilityScore,
      politicalLeaning: openaiScore.politicalLeaning,
      factualityScore: openaiScore.factualityScore,
      indicators: openaiScore.indicators,
    } : null,
    userFeedbackScore,
    confidence: calculateConfidence(databaseScore, mlScore, openaiScore, userFeedbackScore),
    weights,
  };

  // Cache the result
  await cacheBiasAnalysis(urlHash, finalScore, biasTier, analysisData);

  return {
    biasScore: finalScore,
    biasTier,
    fromCache: false,
    analysisData,
  };
}

/**
 * Calculate dynamic weights based on available data
 * @private
 */
function calculateWeights(databaseScore, mlScore, openaiScore, userFeedbackScore) {
  const weights = {
    database: 0,
    ml: 0,
    openai: 0,
    userFeedback: 0,
  };

  // Database is most reliable if we have a match
  if (databaseScore && databaseScore.matched) {
    weights.database = 0.45;
  } else if (databaseScore) {
    weights.database = 0.25;
  }

  // ML analysis
  if (mlScore && mlScore.analyzed) {
    weights.ml = 0.25;
  }

  // OpenAI analysis
  if (openaiScore && openaiScore.analyzed) {
    weights.openai = 0.20;
  }

  // User feedback (lower weight, can be gamed)
  if (userFeedbackScore !== null) {
    weights.userFeedback = 0.10;
  }

  // Normalize weights to sum to 1
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  if (total > 0) {
    for (const key of Object.keys(weights)) {
      weights[key] = weights[key] / total;
    }
  }

  return weights;
}

/**
 * Analyze content with Hugging Face ML models
 * @private
 */
async function analyzeWithML(content, url) {
  try {
    const result = await analyzeText(content);
    return result;
  } catch (error) {
    return null;
  }
}

/**
 * Analyze content with OpenAI
 * @private
 */
async function analyzeWithOpenAI(content, url) {
  try {
    const domain = extractDomain(url);
    const result = await analyzeContentBias(content, '', domain);
    return result;
  } catch (error) {
    return null;
  }
}

/**
 * Check known bias databases
 * @private
 */
async function checkBiasDatabases(url, sourceType) {
  try {
    // First try our local database
    const localResult = lookupSourceBias(url);
    if (localResult) {
      return localResult;
    }

    // Fall back to API lookup
    const apiResult = await getMediaBiasRating(url);
    return apiResult;
  } catch (error) {
    logger.error('Database lookup error:', error.message);
    return null;
  }
}

/**
 * Get average user feedback score
 * @private
 */
async function getUserFeedbackScore(urlHash) {
  try {
    const result = await pool.query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as count
       FROM source_feedback sf
       JOIN candidate_sources cs ON sf.source_id = cs.id
       WHERE encode(digest(cs.url, 'sha256'), 'hex') = $1 AND sf.rating IS NOT NULL`,
      [urlHash]
    );

    if (result.rows[0]?.count > 0) {
      // Convert 1-5 scale to 0-100 (inverted: 5 stars = 0 bias, 1 star = 100 bias)
      return (5 - result.rows[0].avg_rating) * 25;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get cached bias analysis
 * @private
 */
async function getCachedBiasAnalysis(urlHash) {
  try {
    const result = await pool.query(
      'SELECT * FROM bias_analysis_cache WHERE url_hash = $1',
      [urlHash]
    );
    return result.rows[0] || null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if cache is still valid (30 days)
 * @private
 */
function isCacheValid(cached) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return new Date(cached.updated_at) > thirtyDaysAgo;
}

/**
 * Cache bias analysis result
 * @private
 */
async function cacheBiasAnalysis(urlHash, biasScore, biasTier, analysisData) {
  try {
    await pool.query(
      `INSERT INTO bias_analysis_cache (url_hash, bias_score, bias_tier, analysis_data, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (url_hash)
       DO UPDATE SET bias_score = $2, bias_tier = $3, analysis_data = $4, updated_at = CURRENT_TIMESTAMP`,
      [urlHash, biasScore, biasTier, JSON.stringify(analysisData)]
    );
  } catch (error) {
    // Silently fail caching - non-critical
  }
}

/**
 * Calculate confidence in bias analysis
 * @private
 */
function calculateConfidence(databaseScore, mlScore, openaiScore, userFeedbackScore) {
  let confidence = 0;
  let sources = 0;

  if (databaseScore?.matched) {
    confidence += 0.4;
    sources++;
  } else if (databaseScore) {
    confidence += 0.2;
    sources++;
  }

  if (mlScore?.analyzed) {
    confidence += 0.25;
    sources++;
  }

  if (openaiScore?.analyzed) {
    confidence += 0.25;
    sources++;
  }

  if (userFeedbackScore !== null) {
    confidence += 0.1;
    sources++;
  }

  return {
    score: Math.round(confidence * 100),
    sources,
    level: confidence >= 0.7 ? 'high' : confidence >= 0.4 ? 'medium' : 'low',
  };
}

/**
 * Quick bias check using only the database (no ML/AI)
 * Use this for fast lookups when you don't have content
 * @param {string} url - Source URL
 * @returns {Promise<Object|null>} Quick bias result
 */
export async function quickBiasCheck(url) {
  const dbResult = lookupSourceBias(url);

  if (dbResult) {
    return {
      biasScore: 100 - dbResult.reliabilityScore, // Convert reliability to bias
      biasTier: getBiasTierFromReliability(dbResult.reliabilityScore),
      sourceName: dbResult.name,
      politicalBias: dbResult.biasScore,
      factualReporting: dbResult.factualReporting,
      category: dbResult.category,
      confidence: 'high',
    };
  }

  return null;
}

/**
 * Analyze multiple sources in batch
 * @param {Array<{url: string, content?: string}>} sources - Array of sources
 * @returns {Promise<Array>} Array of bias results
 */
export async function batchAnalyze(sources) {
  const results = await Promise.all(
    sources.map(async (source) => {
      const result = await analyzeSourceBias(source.url, 'news_article', source.content);
      return {
        url: source.url,
        ...result,
      };
    })
  );

  return results;
}
