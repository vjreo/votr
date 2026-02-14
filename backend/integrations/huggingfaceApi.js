/**
 * Hugging Face Inference API Integration
 * Uses pre-trained models for political bias and sentiment detection
 */

import logger from '../utils/logger.js';

const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models';
const API_KEY = process.env.HUGGINGFACE_API_KEY;

// Models we'll use for bias detection
const MODELS = {
  // Political bias classifier
  politicalBias: 'bucketresearch/politicalBiasBERT',
  // Sentiment analysis as a proxy for tone
  sentiment: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
  // Toxicity detection
  toxicity: 'unitary/toxic-bert',
};

/**
 * Make a request to Hugging Face Inference API
 * @param {string} model - Model identifier
 * @param {string} text - Text to analyze
 * @returns {Promise<Array>} Model predictions
 */
async function queryModel(model, text) {
  if (!API_KEY) {
    logger.warn('HUGGINGFACE_API_KEY not set, skipping ML analysis');
    return null;
  }

  try {
    const response = await fetch(`${HUGGINGFACE_API_URL}/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
    });

    if (!response.ok) {
      // Model might be loading (503) - this is common with free tier
      if (response.status === 503) {
        const data = await response.json();
        logger.info(`Model ${model} is loading, estimated time: ${data.estimated_time}s`);
        return null;
      }
      throw new Error(`HuggingFace API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return null;
  }
}

/**
 * Analyze political bias of text content
 * @param {string} text - Text to analyze (article content, headline, etc.)
 * @returns {Promise<Object|null>} Bias analysis result
 */
export async function analyzePoliticalBias(text) {
  if (!text || text.length < 20) {
    return null;
  }

  // Truncate to model's max length (512 tokens ≈ 2000 chars for safety)
  const truncatedText = text.slice(0, 2000);

  const result = await queryModel(MODELS.politicalBias, truncatedText);

  if (!result || !Array.isArray(result) || !result[0]) {
    return null;
  }

  // Parse the political bias result
  // Model returns labels like "LEFT", "CENTER", "RIGHT"
  const predictions = result[0];

  // Find the highest scoring label
  let maxScore = 0;
  let topLabel = 'CENTER';

  for (const pred of predictions) {
    if (pred.score > maxScore) {
      maxScore = pred.score;
      topLabel = pred.label;
    }
  }

  // Convert to our bias score (0-100, where 50 is center)
  // LEFT = 0-33, CENTER = 34-66, RIGHT = 67-100
  let biasScore;
  switch (topLabel.toUpperCase()) {
    case 'LEFT':
    case 'LEFT-CENTER':
      biasScore = 25 - (maxScore * 25); // Strong left = lower score
      break;
    case 'CENTER':
    case 'NEUTRAL':
      biasScore = 50;
      break;
    case 'RIGHT':
    case 'RIGHT-CENTER':
      biasScore = 75 + (maxScore * 25); // Strong right = higher score
      break;
    default:
      biasScore = 50;
  }

  return {
    label: topLabel,
    confidence: maxScore,
    biasScore: Math.round(biasScore),
    raw: predictions,
  };
}

/**
 * Analyze sentiment of text
 * @param {string} text - Text to analyze
 * @returns {Promise<Object|null>} Sentiment analysis result
 */
export async function analyzeSentiment(text) {
  if (!text || text.length < 10) {
    return null;
  }

  const truncatedText = text.slice(0, 500);
  const result = await queryModel(MODELS.sentiment, truncatedText);

  if (!result || !Array.isArray(result) || !result[0]) {
    return null;
  }

  const predictions = result[0];

  // Find sentiment distribution
  const sentimentMap = {};
  for (const pred of predictions) {
    sentimentMap[pred.label.toLowerCase()] = pred.score;
  }

  // Calculate emotional intensity (deviation from neutral)
  const neutral = sentimentMap.neutral || 0;
  const positive = sentimentMap.positive || 0;
  const negative = sentimentMap.negative || 0;

  const emotionalIntensity = Math.abs(positive - negative);

  return {
    positive,
    negative,
    neutral,
    emotionalIntensity,
    dominantSentiment: positive > negative ? 'positive' : negative > positive ? 'negative' : 'neutral',
  };
}

/**
 * Check for toxic/inflammatory language
 * @param {string} text - Text to analyze
 * @returns {Promise<Object|null>} Toxicity analysis result
 */
export async function analyzeToxicity(text) {
  if (!text || text.length < 10) {
    return null;
  }

  const truncatedText = text.slice(0, 500);
  const result = await queryModel(MODELS.toxicity, truncatedText);

  if (!result || !Array.isArray(result) || !result[0]) {
    return null;
  }

  const predictions = result[0];

  // Find toxicity score
  let toxicityScore = 0;
  for (const pred of predictions) {
    if (pred.label.toLowerCase() === 'toxic') {
      toxicityScore = pred.score;
      break;
    }
  }

  return {
    toxicityScore,
    isToxic: toxicityScore > 0.5,
    raw: predictions,
  };
}

/**
 * Comprehensive text analysis combining all models
 * @param {string} text - Text to analyze
 * @returns {Promise<Object>} Combined analysis result
 */
export async function analyzeText(text) {
  // Run all analyses in parallel
  const [politicalBias, sentiment, toxicity] = await Promise.all([
    analyzePoliticalBias(text),
    analyzeSentiment(text),
    analyzeToxicity(text),
  ]);

  // Calculate overall reliability score based on all factors
  // Lower is more reliable (less biased, less emotional, less toxic)
  let reliabilityPenalty = 0;

  if (politicalBias) {
    // Penalize strong political bias (distance from center)
    reliabilityPenalty += Math.abs(politicalBias.biasScore - 50) * 0.5;
  }

  if (sentiment) {
    // Penalize high emotional intensity
    reliabilityPenalty += sentiment.emotionalIntensity * 20;
  }

  if (toxicity) {
    // Heavily penalize toxic content
    reliabilityPenalty += toxicity.toxicityScore * 40;
  }

  // Convert penalty to 0-100 bias score
  const combinedBiasScore = Math.min(100, Math.max(0, 30 + reliabilityPenalty));

  return {
    politicalBias,
    sentiment,
    toxicity,
    combinedBiasScore: Math.round(combinedBiasScore),
    analyzed: true,
  };
}
