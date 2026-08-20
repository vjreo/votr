import assert from 'assert';
import { calculateMatchScore } from './matchScoring.js';

const prefs = [
  { issueId: 'education', issueName: 'Education', importance: 2 },
  { issueId: 'healthcare', issueName: 'Healthcare', importance: 1 },
];

const none = calculateMatchScore(prefs, []);
assert.strictEqual(none.score, null);
assert.strictEqual(none.overlapCount, 0);

const named = calculateMatchScore(prefs, [
  { issueName: 'Education', stance: 'Supports public schools', confidence: 0.8 },
]);
assert.strictEqual(named.overlapCount, 1);
assert.strictEqual(named.score, 80);

const disagree = calculateMatchScore(prefs, [
  { issueId: 'education', confidence: 0 },
  { issueId: 'healthcare', confidence: 0 },
]);
assert.strictEqual(disagree.overlapCount, 2);
assert.strictEqual(disagree.score, 0);

console.log('matchScoring tests passed');
