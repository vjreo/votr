/**
 * AllSides API Integration
 * Uses our pre-compiled database with AllSides-style ratings
 */

import { lookupSourceBias, extractDomain, getPoliticalLeaning } from '../data/mediaBiasDatabase.js';

/**
 * Convert our bias score to AllSides-style rating
 * AllSides uses: Left, Lean Left, Center, Lean Right, Right
 * @param {number} biasScore - Bias score (0-100)
 * @returns {string} AllSides-style rating
 */
function toAllSidesRating(biasScore) {
  if (biasScore <= 25) return 'Left';
  if (biasScore <= 42) return 'Lean Left';
  if (biasScore <= 58) return 'Center';
  if (biasScore <= 75) return 'Lean Right';
  return 'Right';
}

/**
 * Get AllSides-style rating for a URL
 * @param {string} url - Source URL
 * @returns {Promise<Object|null>} AllSides-style rating
 */
export async function getAllSidesRating(url) {
  const dbResult = lookupSourceBias(url);

  if (!dbResult) {
    return null;
  }

  return {
    source: dbResult.name,
    domain: dbResult.domain,
    rating: toAllSidesRating(dbResult.biasScore),
    biasScore: dbResult.biasScore,
    politicalLeaning: getPoliticalLeaning(dbResult.biasScore),
    confidence: dbResult.matched ? 'high' : 'medium',
  };
}

/**
 * Get source bias rating by name
 * @param {string} sourceName - Name of the source
 * @returns {Promise<Object|null>} AllSides-style rating
 */
export async function getSourceBiasRating(sourceName) {
  // Search our database for matching source name
  const { MEDIA_BIAS_DATABASE } = await import('../data/mediaBiasDatabase.js');

  for (const [domain, data] of Object.entries(MEDIA_BIAS_DATABASE)) {
    if (data.name.toLowerCase().includes(sourceName.toLowerCase())) {
      return {
        source: data.name,
        domain,
        rating: toAllSidesRating(data.biasScore),
        biasScore: data.biasScore,
        politicalLeaning: getPoliticalLeaning(data.biasScore),
        confidence: 'high',
      };
    }
  }

  return null;
}
