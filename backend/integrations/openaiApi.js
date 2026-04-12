/**
 * OpenAI API Integration
 * Uses GPT for deep content analysis and bias detection
 */

import logger from '../utils/logger.js';

let openaiClient = null;
let OpenAI = null;

/**
 * Get or create OpenAI client
 * Uses dynamic import to avoid requiring openai package if not installed
 */
async function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  if (!openaiClient) {
    try {
      // Dynamic import - only load if needed
      if (!OpenAI) {
        const openaiModule = await import('openai');
        OpenAI = openaiModule.default;
      }
      openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } catch (error) {
      logger.warn('OpenAI package not installed. Install with: npm install openai');
      return null;
    }
  }
  return openaiClient;
}

/**
 * Analyze article content for bias using GPT
 * @param {string} content - Article text content
 * @param {string} headline - Article headline (optional)
 * @param {string} sourceName - Name of the source (optional)
 * @returns {Promise<Object|null>} Bias analysis result
 */
export async function analyzeContentBias(content, headline = '', sourceName = '') {
  const client = await getClient();
  if (!client) {
    logger.warn('OPENAI_API_KEY not set or OpenAI package not installed, skipping OpenAI analysis');
    return null;
  }

  if (!content || content.length < 50) {
    return null;
  }

  // Truncate content to manage token usage
  const truncatedContent = content.slice(0, 3000);

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective model for this task
      messages: [
        {
          role: 'system',
          content: `You are a media bias analyst. Analyze the provided news content for political bias, factual accuracy indicators, and journalistic quality.

Respond ONLY with valid JSON in this exact format:
{
  "politicalLeaning": "left" | "center-left" | "center" | "center-right" | "right",
  "biasScore": <number 0-100, where 0=far left, 50=center, 100=far right>,
  "factualityScore": <number 0-100, where 100=highly factual>,
  "emotionalLanguageScore": <number 0-100, where 0=neutral, 100=highly emotional>,
  "clickbaitScore": <number 0-100, where 0=not clickbait, 100=extreme clickbait>,
  "indicators": [<list of 2-4 specific bias indicators found>],
  "summary": "<1-2 sentence summary of the bias analysis>"
}`
        },
        {
          role: 'user',
          content: `Analyze this news content for bias:

${headline ? `HEADLINE: ${headline}\n\n` : ''}${sourceName ? `SOURCE: ${sourceName}\n\n` : ''}CONTENT:
${truncatedContent}`
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 500,
    });

    const responseText = response.choices[0]?.message?.content;
    if (!responseText) {
      return null;
    }

    // Parse the JSON response
    const analysis = JSON.parse(responseText);

    // Calculate overall reliability score
    // Weight: factuality (40%), emotional language (30%), clickbait (30%)
    const reliabilityScore =
      (analysis.factualityScore * 0.4) +
      ((100 - analysis.emotionalLanguageScore) * 0.3) +
      ((100 - analysis.clickbaitScore) * 0.3);

    return {
      ...analysis,
      reliabilityScore: Math.round(reliabilityScore),
      model: 'gpt-4o-mini',
      analyzed: true,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Analyze a source/domain for credibility
 * @param {string} sourceName - Name of the news source
 * @param {string} domain - Domain URL
 * @returns {Promise<Object|null>} Source credibility analysis
 */
export async function analyzeSourceCredibility(sourceName, domain) {
  const client = await getClient();
  if (!client) {
    return null;
  }

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a media credibility expert. Based on your knowledge of news sources, provide a credibility assessment.

Respond ONLY with valid JSON in this exact format:
{
  "credibilityScore": <number 0-100, where 100=most credible>,
  "politicalLeaning": "left" | "center-left" | "center" | "center-right" | "right",
  "biasScore": <number 0-100, where 0=far left, 50=center, 100=far right>,
  "sourceType": "mainstream" | "partisan" | "satire" | "tabloid" | "academic" | "government" | "unknown",
  "factCheckRecord": "excellent" | "good" | "mixed" | "poor" | "unknown",
  "notes": "<brief notes about this source>"
}

If you don't have reliable information about the source, set credibilityScore to 50 and factCheckRecord to "unknown".`
        },
        {
          role: 'user',
          content: `Analyze the credibility of this news source:
Source Name: ${sourceName}
Domain: ${domain}`
        }
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const responseText = response.choices[0]?.message?.content;
    if (!responseText) {
      return null;
    }

    return JSON.parse(responseText);
  } catch (error) {
    return null;
  }
}
