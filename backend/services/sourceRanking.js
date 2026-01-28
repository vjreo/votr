/**
 * Source Ranking Service
 * Ranks candidate sources by bias score (most reliable first)
 */

import { analyzeSourceBias } from './biasDetection.js';

/**
 * Rank sources for a candidate by reliability (lowest bias score first)
 * @param {Array} sources - Array of candidate sources
 * @returns {Promise<Array>} Ranked sources
 */
export async function rankSources(sources) {
  if (!sources || sources.length === 0) {
    return [];
  }

  // Analyze sources if not already analyzed
  const sourcesWithBias = await Promise.all(
    sources.map(async (source) => {
      if (source.biasScore === undefined || source.biasScore === null) {
        const analysis = await analyzeSourceBias(
          source.url,
          source.sourceType,
          source.content
        );
        return {
          ...source,
          biasScore: analysis.biasScore,
          biasTier: analysis.biasTier,
        };
      }
      return source;
    })
  );

  // Sort by bias score (ascending - lower is better)
  return sourcesWithBias.sort((a, b) => {
    const scoreA = a.biasScore || 100;
    const scoreB = b.biasScore || 100;
    return scoreA - scoreB;
  });
}

/**
 * Get top N most reliable sources
 * @param {Array} sources - Array of sources
 * @param {number} limit - Number of top sources to return
 * @returns {Promise<Array>} Top N sources
 */
export async function getTopReliableSources(sources, limit = 5) {
  const ranked = await rankSources(sources);
  return ranked.slice(0, limit);
}

