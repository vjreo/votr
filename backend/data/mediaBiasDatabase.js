/**
 * Media Bias Database
 * Pre-compiled ratings for known news sources
 * Based on aggregated data from Ad Fontes Media, MBFC, and AllSides
 *
 * biasScore: 0 = far left, 50 = center, 100 = far right
 * reliabilityScore: 0 = unreliable, 100 = highly reliable
 * factualReporting: 'very_high' | 'high' | 'mostly_factual' | 'mixed' | 'low' | 'very_low'
 */

export const MEDIA_BIAS_DATABASE = {
  // === HIGHLY RELIABLE, CENTER ===
  'apnews.com': {
    name: 'Associated Press',
    biasScore: 48,
    reliabilityScore: 92,
    factualReporting: 'very_high',
    category: 'wire_service',
  },
  'reuters.com': {
    name: 'Reuters',
    biasScore: 50,
    reliabilityScore: 94,
    factualReporting: 'very_high',
    category: 'wire_service',
  },
  'c-span.org': {
    name: 'C-SPAN',
    biasScore: 50,
    reliabilityScore: 95,
    factualReporting: 'very_high',
    category: 'public_affairs',
  },

  // === HIGHLY RELIABLE, LEAN LEFT ===
  'npr.org': {
    name: 'NPR',
    biasScore: 40,
    reliabilityScore: 88,
    factualReporting: 'very_high',
    category: 'public_media',
  },
  'bbc.com': {
    name: 'BBC',
    biasScore: 42,
    reliabilityScore: 90,
    factualReporting: 'very_high',
    category: 'international',
  },
  'bbc.co.uk': {
    name: 'BBC',
    biasScore: 42,
    reliabilityScore: 90,
    factualReporting: 'very_high',
    category: 'international',
  },
  'pbs.org': {
    name: 'PBS',
    biasScore: 40,
    reliabilityScore: 88,
    factualReporting: 'very_high',
    category: 'public_media',
  },

  // === RELIABLE, LEAN LEFT ===
  'nytimes.com': {
    name: 'The New York Times',
    biasScore: 35,
    reliabilityScore: 82,
    factualReporting: 'high',
    category: 'newspaper',
  },
  'washingtonpost.com': {
    name: 'The Washington Post',
    biasScore: 35,
    reliabilityScore: 80,
    factualReporting: 'high',
    category: 'newspaper',
  },
  'theguardian.com': {
    name: 'The Guardian',
    biasScore: 32,
    reliabilityScore: 78,
    factualReporting: 'high',
    category: 'newspaper',
  },
  'politico.com': {
    name: 'Politico',
    biasScore: 38,
    reliabilityScore: 80,
    factualReporting: 'high',
    category: 'political_news',
  },
  'theatlantic.com': {
    name: 'The Atlantic',
    biasScore: 35,
    reliabilityScore: 78,
    factualReporting: 'high',
    category: 'magazine',
  },
  'bloomberg.com': {
    name: 'Bloomberg',
    biasScore: 42,
    reliabilityScore: 85,
    factualReporting: 'high',
    category: 'financial',
  },

  // === RELIABLE, LEAN RIGHT ===
  'wsj.com': {
    name: 'The Wall Street Journal',
    biasScore: 60,
    reliabilityScore: 82,
    factualReporting: 'high',
    category: 'newspaper',
  },
  'economist.com': {
    name: 'The Economist',
    biasScore: 55,
    reliabilityScore: 85,
    factualReporting: 'high',
    category: 'magazine',
  },
  'forbes.com': {
    name: 'Forbes',
    biasScore: 58,
    reliabilityScore: 75,
    factualReporting: 'mostly_factual',
    category: 'business',
  },

  // === LEFT-LEANING ===
  'cnn.com': {
    name: 'CNN',
    biasScore: 30,
    reliabilityScore: 68,
    factualReporting: 'mostly_factual',
    category: 'cable_news',
  },
  'msnbc.com': {
    name: 'MSNBC',
    biasScore: 22,
    reliabilityScore: 60,
    factualReporting: 'mixed',
    category: 'cable_news',
  },
  'huffpost.com': {
    name: 'HuffPost',
    biasScore: 25,
    reliabilityScore: 55,
    factualReporting: 'mixed',
    category: 'online_news',
  },
  'vox.com': {
    name: 'Vox',
    biasScore: 28,
    reliabilityScore: 65,
    factualReporting: 'mostly_factual',
    category: 'online_news',
  },
  'slate.com': {
    name: 'Slate',
    biasScore: 28,
    reliabilityScore: 62,
    factualReporting: 'mostly_factual',
    category: 'online_news',
  },
  'thedailybeast.com': {
    name: 'The Daily Beast',
    biasScore: 25,
    reliabilityScore: 58,
    factualReporting: 'mixed',
    category: 'online_news',
  },

  // === RIGHT-LEANING ===
  'foxnews.com': {
    name: 'Fox News',
    biasScore: 72,
    reliabilityScore: 55,
    factualReporting: 'mixed',
    category: 'cable_news',
  },
  'nypost.com': {
    name: 'New York Post',
    biasScore: 68,
    reliabilityScore: 52,
    factualReporting: 'mixed',
    category: 'tabloid',
  },
  'washingtontimes.com': {
    name: 'The Washington Times',
    biasScore: 70,
    reliabilityScore: 55,
    factualReporting: 'mixed',
    category: 'newspaper',
  },
  'nationalreview.com': {
    name: 'National Review',
    biasScore: 72,
    reliabilityScore: 60,
    factualReporting: 'mostly_factual',
    category: 'magazine',
  },
  'dailywire.com': {
    name: 'The Daily Wire',
    biasScore: 78,
    reliabilityScore: 50,
    factualReporting: 'mixed',
    category: 'online_news',
  },

  // === FAR LEFT ===
  'jacobin.com': {
    name: 'Jacobin',
    biasScore: 15,
    reliabilityScore: 55,
    factualReporting: 'mostly_factual',
    category: 'magazine',
  },
  'motherjones.com': {
    name: 'Mother Jones',
    biasScore: 20,
    reliabilityScore: 60,
    factualReporting: 'mostly_factual',
    category: 'magazine',
  },
  'democracynow.org': {
    name: 'Democracy Now',
    biasScore: 18,
    reliabilityScore: 58,
    factualReporting: 'mostly_factual',
    category: 'independent',
  },

  // === FAR RIGHT ===
  'breitbart.com': {
    name: 'Breitbart',
    biasScore: 85,
    reliabilityScore: 35,
    factualReporting: 'mixed',
    category: 'online_news',
  },
  'dailycaller.com': {
    name: 'The Daily Caller',
    biasScore: 80,
    reliabilityScore: 45,
    factualReporting: 'mixed',
    category: 'online_news',
  },
  'thefederalist.com': {
    name: 'The Federalist',
    biasScore: 82,
    reliabilityScore: 45,
    factualReporting: 'mixed',
    category: 'online_news',
  },
  'newsmax.com': {
    name: 'Newsmax',
    biasScore: 82,
    reliabilityScore: 40,
    factualReporting: 'mixed',
    category: 'cable_news',
  },
  'oann.com': {
    name: 'OANN',
    biasScore: 88,
    reliabilityScore: 30,
    factualReporting: 'low',
    category: 'cable_news',
  },

  // === FACT CHECKERS (high reliability) ===
  'factcheck.org': {
    name: 'FactCheck.org',
    biasScore: 48,
    reliabilityScore: 95,
    factualReporting: 'very_high',
    category: 'fact_checker',
  },
  'snopes.com': {
    name: 'Snopes',
    biasScore: 45,
    reliabilityScore: 90,
    factualReporting: 'very_high',
    category: 'fact_checker',
  },
  'politifact.com': {
    name: 'PolitiFact',
    biasScore: 45,
    reliabilityScore: 90,
    factualReporting: 'very_high',
    category: 'fact_checker',
  },

  // === GOVERNMENT / OFFICIAL ===
  'congress.gov': {
    name: 'Congress.gov',
    biasScore: 50,
    reliabilityScore: 98,
    factualReporting: 'very_high',
    category: 'government',
  },
  'whitehouse.gov': {
    name: 'White House',
    biasScore: 50, // Note: Will lean toward current administration
    reliabilityScore: 85,
    factualReporting: 'high',
    category: 'government',
  },
  'ballotpedia.org': {
    name: 'Ballotpedia',
    biasScore: 50,
    reliabilityScore: 92,
    factualReporting: 'very_high',
    category: 'reference',
  },
  'votesmart.org': {
    name: 'Vote Smart',
    biasScore: 50,
    reliabilityScore: 95,
    factualReporting: 'very_high',
    category: 'reference',
  },
  'opensecrets.org': {
    name: 'OpenSecrets',
    biasScore: 50,
    reliabilityScore: 92,
    factualReporting: 'very_high',
    category: 'research',
  },

  // === SOCIAL MEDIA (generally lower reliability) ===
  'twitter.com': {
    name: 'Twitter/X',
    biasScore: 50,
    reliabilityScore: 30,
    factualReporting: 'mixed',
    category: 'social_media',
  },
  'x.com': {
    name: 'Twitter/X',
    biasScore: 50,
    reliabilityScore: 30,
    factualReporting: 'mixed',
    category: 'social_media',
  },
  'facebook.com': {
    name: 'Facebook',
    biasScore: 50,
    reliabilityScore: 25,
    factualReporting: 'mixed',
    category: 'social_media',
  },
  'youtube.com': {
    name: 'YouTube',
    biasScore: 50,
    reliabilityScore: 35,
    factualReporting: 'mixed',
    category: 'social_media',
  },
  'tiktok.com': {
    name: 'TikTok',
    biasScore: 50,
    reliabilityScore: 20,
    factualReporting: 'low',
    category: 'social_media',
  },

  // === LOCAL NEWS (generally more reliable) ===
  'local': {
    name: 'Local News',
    biasScore: 50,
    reliabilityScore: 70,
    factualReporting: 'mostly_factual',
    category: 'local_news',
  },
};

/**
 * Extract domain from URL
 * @param {string} url - Full URL
 * @returns {string} Domain without www.
 */
export function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Look up source bias from database
 * @param {string} url - Source URL
 * @returns {Object|null} Bias data or null if not found
 */
export function lookupSourceBias(url) {
  const domain = extractDomain(url);
  if (!domain) {
    return null;
  }

  // Direct match
  if (MEDIA_BIAS_DATABASE[domain]) {
    return {
      ...MEDIA_BIAS_DATABASE[domain],
      domain,
      matched: true,
    };
  }

  // Check for subdomain matches (e.g., news.google.com -> google.com)
  const parts = domain.split('.');
  if (parts.length > 2) {
    const baseDomain = parts.slice(-2).join('.');
    if (MEDIA_BIAS_DATABASE[baseDomain]) {
      return {
        ...MEDIA_BIAS_DATABASE[baseDomain],
        domain: baseDomain,
        matched: true,
        subdomain: domain,
      };
    }
  }

  return null;
}

/**
 * Get bias tier from score
 * @param {number} reliabilityScore - Reliability score (0-100)
 * @returns {string} Bias tier
 */
export function getBiasTierFromReliability(reliabilityScore) {
  if (reliabilityScore >= 80) return 'most_reliable';
  if (reliabilityScore >= 60) return 'reliable';
  if (reliabilityScore >= 40) return 'use_caution';
  return 'highly_biased';
}

/**
 * Get political leaning label from bias score
 * @param {number} biasScore - Bias score (0-100, 50=center)
 * @returns {string} Political leaning
 */
export function getPoliticalLeaning(biasScore) {
  if (biasScore <= 20) return 'far_left';
  if (biasScore <= 35) return 'left';
  if (biasScore <= 45) return 'center_left';
  if (biasScore <= 55) return 'center';
  if (biasScore <= 65) return 'center_right';
  if (biasScore <= 80) return 'right';
  return 'far_right';
}
