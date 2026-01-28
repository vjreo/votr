/**
 * Media Bias Fact Check API Integration
 * Uses our pre-compiled database + OpenAI for unknown sources
 */

import { lookupSourceBias, extractDomain, getBiasTierFromReliability } from '../data/mediaBiasDatabase.js';
import { analyzeSourceCredibility } from './openaiApi.js';

/**
 * Get media bias rating for a URL
 * @param {string} url - Source URL
 * @returns {Promise<Object|null>} Bias rating
 */
export async function getMediaBiasRating(url) {
  // First, check our database
  const dbResult = lookupSourceBias(url);

  if (dbResult) {
    return {
      source: 'database',
      ...dbResult,
      biasTier: getBiasTierFromReliability(dbResult.reliabilityScore),
    };
  }

  // If not in database, try OpenAI analysis
  const domain = extractDomain(url);
  if (domain) {
    const aiAnalysis = await analyzeSourceCredibility(domain, domain);
    if (aiAnalysis) {
      return {
        source: 'openai',
        name: domain,
        domain,
        biasScore: aiAnalysis.biasScore,
        reliabilityScore: aiAnalysis.credibilityScore,
        factualReporting: aiAnalysis.factCheckRecord,
        category: aiAnalysis.sourceType,
        biasTier: getBiasTierFromReliability(aiAnalysis.credibilityScore),
        notes: aiAnalysis.notes,
        matched: false,
      };
    }
  }

  return null;
}

/**
 * Get source bias score by name
 * @param {string} sourceName - Name of the source
 * @returns {Promise<Object|null>} Bias data
 */
export async function getSourceBiasScore(sourceName) {
  // Try OpenAI analysis for named sources
  const aiAnalysis = await analyzeSourceCredibility(sourceName, '');

  if (aiAnalysis) {
    return {
      source: 'openai',
      name: sourceName,
      biasScore: aiAnalysis.biasScore,
      reliabilityScore: aiAnalysis.credibilityScore,
      factualReporting: aiAnalysis.factCheckRecord,
      category: aiAnalysis.sourceType,
      biasTier: getBiasTierFromReliability(aiAnalysis.credibilityScore),
      notes: aiAnalysis.notes,
    };
  }

  return null;
}
