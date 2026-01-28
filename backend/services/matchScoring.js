/**
 * Match Scoring Algorithm
 * Calculates alignment between user preferences and candidate positions
 */

/**
 * Calculate match score between user preferences and candidate positions
 * @param {Array} userPreferences - Array of {issueId, importance}
 * @param {Array} candidatePositions - Array of {issueId, stance, confidence}
 * @returns {Object} {score: number, breakdown: Array}
 */
export function calculateMatchScore(userPreferences, candidatePositions) {
  if (!userPreferences || userPreferences.length === 0) {
    return { score: 0, breakdown: [] };
  }

  const breakdown = [];
  let totalWeight = 0;
  let weightedScore = 0;

  // Create a map of candidate positions by issueId
  const positionMap = new Map();
  candidatePositions.forEach(pos => {
    positionMap.set(pos.issueId, pos);
  });

  // Calculate alignment for each user preference
  userPreferences.forEach(pref => {
    const candidatePos = positionMap.get(pref.issueId);
    const importance = pref.importance || 1;
    
    let alignment = 0;
    let candidateStance = null;

    if (candidatePos) {
      // For now, we'll use a simple scoring mechanism
      // In the future, this could use NLP to analyze stance text
      alignment = candidatePos.confidence || 0.5;
      candidateStance = candidatePos.stance;
    } else {
      // No position found - neutral alignment
      alignment = 0;
    }

    // Weight by importance (1-5 scale)
    const weight = importance;
    totalWeight += weight;
    weightedScore += alignment * weight;

    breakdown.push({
      issueId: pref.issueId,
      issueName: pref.issueName || pref.issueId,
      alignment,
      userImportance: importance,
      candidateStance,
    });
  });

  // Calculate final score (0-100)
  const score = totalWeight > 0 
    ? Math.round((weightedScore / totalWeight) * 100)
    : 0;

  return {
    score: Math.max(0, Math.min(100, score)), // Clamp between 0-100
    breakdown,
  };
}

/**
 * Get match explanation text
 * @param {number} score - Match score (0-100)
 * @returns {string} Explanation text
 */
export function getMatchExplanation(score) {
  if (score >= 80) {
    return 'Excellent match! This candidate aligns strongly with your priorities.';
  } else if (score >= 60) {
    return 'Good match. This candidate aligns well with many of your priorities.';
  } else if (score >= 40) {
    return 'Moderate match. Some alignment with your priorities.';
  } else if (score >= 20) {
    return 'Limited match. Few areas of alignment.';
  } else {
    return 'Low match. Limited alignment with your priorities.';
  }
}

