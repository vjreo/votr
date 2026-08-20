/**
 * Match scoring: alignment between user issue picks and candidate positions.
 * No overlapping issues → score is null (not 0). 0 is reserved for real disagreement.
 */

function norm(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, ' ');
}

function indexPositions(positions) {
  const map = new Map();
  for (const pos of positions) {
    const id = norm(pos.issueId || pos.issue_id);
    const name = norm(pos.issueName || pos.issue_name);
    if (id) map.set(id, pos);
    if (name) map.set(name, pos);
  }
  return map;
}

export function calculateMatchScore(userPreferences, candidatePositions) {
  if (!userPreferences || userPreferences.length === 0) {
    return { score: null, overlapCount: 0, breakdown: [] };
  }

  const positions = Array.isArray(candidatePositions) ? candidatePositions : [];
  const positionIndex = indexPositions(positions);
  const breakdown = [];
  let totalWeight = 0;
  let weightedScore = 0;
  let overlapCount = 0;

  for (const pref of userPreferences) {
    const candidatePos =
      positionIndex.get(norm(pref.issueId)) || positionIndex.get(norm(pref.issueName));
    if (!candidatePos) continue;

    overlapCount += 1;
    const importance = pref.importance || 1;
    const alignment = typeof candidatePos.confidence === 'number' ? candidatePos.confidence : 0.5;

    totalWeight += importance;
    weightedScore += alignment * importance;
    breakdown.push({
      issueId: pref.issueId,
      issueName: pref.issueName || pref.issueId,
      alignment,
      userImportance: importance,
      candidateStance: candidatePos.stance || null,
    });
  }

  if (overlapCount === 0 || totalWeight === 0) {
    return { score: null, overlapCount: 0, breakdown: [] };
  }

  const score = Math.round((weightedScore / totalWeight) * 100);
  return {
    score: Math.max(0, Math.min(100, score)),
    overlapCount,
    breakdown,
  };
}
