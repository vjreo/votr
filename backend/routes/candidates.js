import express from 'express';
import pool from '../db/connection.js';
import { calculateMatchScore } from '../services/matchScoring.js';
import { rankSources } from '../services/sourceRanking.js';
import { DEFAULTS } from '../constants.js';
import { getStateHandler } from '../services/stateHandlers/stateRegistry.js';
import candidateRepository from '../repositories/candidateRepository.js';
import candidateCache from '../services/cache/candidateCache.js';
import openStatesApi from '../services/openStatesApi.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Prevent client caching — results are address-specific
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  next();
});

/**
 * Merge and deduplicate candidates by (name, office, state).
 * Candidates in list `a` take precedence over those in `b`.
 */
function mergeCandidates(a, b) {
  const seen = new Set();
  const out = [];
  for (const c of [...a, ...b]) {
    const key = `${(c.name || '').toLowerCase()}|${(c.office || '').toLowerCase()}|${(c.state || '').toUpperCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

async function loadUserPreferencesForMatch(userId) {
  const result = await pool.query(
    `SELECT up.importance, i.id AS issue_id, i.name AS issue_name
     FROM user_preferences up JOIN issues i ON up.issue_id = i.id
     WHERE up.user_id = $1`,
    [userId]
  );
  return result.rows.map((row) => ({
    issueId: row.issue_id,
    issueName: row.issue_name,
    importance: row.importance,
  }));
}

/**
 * Attach matchScore (0–100) per candidate; optional sort by score descending.
 */
function enrichCandidatesWithMatch(candidates, userPreferences, sortMatch) {
  let out = candidates.map((c) => {
    const positions = Array.isArray(c.positions) ? c.positions : [];
    const { score } = calculateMatchScore(userPreferences, positions);
    return { ...c, matchScore: score };
  });
  if (sortMatch && userPreferences.length > 0) {
    out = [...out].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
  }
  return out;
}

/**
 * GET /api/candidates
 * Returns candidates for a state, optionally filtered by office or geo coords.
 * Query params: state, office, location, lat, lng
 */
router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { office, location, state = DEFAULTS.STATE, lat, lng } = req.query;
    const includeMatch = req.query.includeMatch === '1' || req.query.includeMatch === 'true';
    const sortMatch = req.query.sortMatch === '1' || req.query.sortMatch === 'true';

    if (includeMatch && !req.userId) {
      return res.status(401).json({ error: 'Authentication required when includeMatch is set' });
    }

    if (typeof state !== 'string' || state.length !== 2) {
      return res.status(400).json({ error: 'state must be a 2-letter code' });
    }

    const stateCode = state.toUpperCase();
    const cacheKey = office || 'all';
    const hasLocation = Boolean(location);
    const hasGeo =
      lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));

    const maybeEnrich = async (rows) => {
      if (!includeMatch || !req.userId) return rows;
      const userPreferences = await loadUserPreferencesForMatch(req.userId);
      return enrichCandidatesWithMatch(rows, userPreferences, sortMatch);
    };

    // Cache is only used for stateless (no address) requests without per-user match scores
    if (!hasLocation && !hasGeo && !includeMatch) {
      const cached = candidateCache.get(stateCode, cacheKey);
      if (cached) return res.json(cached);
    }

    const stateHandler = getStateHandler(stateCode);

    // NC: pre-fetch state legislators into DB so they're available in the merge below
    if (stateCode === 'NC') {
      try {
        const legislators = await openStatesApi.getNCLegislators(
          hasGeo ? { lat: Number(lat), lng: Number(lng) } : {}
        );
        if (legislators.length > 0) {
          await candidateRepository.bulkUpsert(legislators);
          logger.debug(`Open States: upserted ${legislators.length} NC legislators`);
        }
      } catch (e) {
        logger.debug('Open States prefetch failed:', e.message);
      }
    }

    // ── No address/geo: return the full state DB ───────────────────────────────
    if (!hasLocation && !hasGeo) {
      const dbCandidates = await candidateRepository.findByStateWithSources(stateCode, { office });
      if (dbCandidates.length > 0 && !includeMatch) {
        candidateCache.set(stateCode, dbCandidates, cacheKey);
      }
      return res.json(await maybeEnrich(dbCandidates));
    }

    // ── Geo or location provided: address-specific results ────────────────────
    let fetchedCandidates = [];

    if (stateCode === 'NC' && hasGeo) {
      try {
        const geoLegislators = await openStatesApi.getNCLegislators({ lat: Number(lat), lng: Number(lng) });
        if (geoLegislators.length > 0) {
          const upserted = await candidateRepository.bulkUpsert(geoLegislators);
          fetchedCandidates = upserted.map((c) => ({
            ...c,
            officeLevel: c.office_level || 'state_legislature',
            photoUrl: c.photo_url,
            apiSource: 'open_states',
          }));
        }
      } catch (e) {
        logger.debug('Open States geo fetch failed:', e.message);
      }
    }

    // Merge Open States legislators with curated DB records (governor, senate, local)
    if (stateCode === 'NC' && fetchedCandidates.length > 0) {
      const dbCurated = await candidateRepository.findByStateWithSources(stateCode, {});
      fetchedCandidates = mergeCandidates(fetchedCandidates, dbCurated);
    }

    if (fetchedCandidates.length > 0) {
      const normalizedCandidates = fetchedCandidates.map((c) => ({
        name: c.name,
        office: c.office,
        officeLevel: c.office_level || c.officeLevel || stateHandler.determineOfficeLevel(c.office),
        party: c.party || 'Unknown',
        photoUrl: c.photo_url || c.photoUrl,
        bio: c.bio || null,
        district: c.district || stateHandler.normalizeDistrict(c.district),
        state: stateCode,
        positions: Array.isArray(c.positions) ? c.positions : [],
        career: Array.isArray(c.career) ? c.career : [],
        apiSource: c.api_source || c.apiSource || 'open_states',
      }));

      const upserted = await candidateRepository.bulkUpsert(normalizedCandidates);
      // Fetch with sources via the JOIN-based method
      const ids = upserted.map((c) => c.id);
      const withSources = await pool.query(
        `SELECT c.*,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', cs.id, 'url', cs.url, 'source_type', cs.source_type,
                 'title', cs.title, 'bias_score', cs.bias_score, 'bias_tier', cs.bias_tier
               ) ORDER BY cs.bias_score ASC NULLS LAST
             ) FILTER (WHERE cs.id IS NOT NULL), '[]'
           ) AS sources
         FROM candidates c
         LEFT JOIN candidate_sources cs ON cs.candidate_id = c.id
         WHERE c.id = ANY($1)
         GROUP BY c.id`,
        [ids]
      );
      return res.json(await maybeEnrich(withSources.rows));
    }

    logger.debug(`No candidates found for ${location || `${lat},${lng}`}`);

    // Fallback: return whatever is in DB for this state
    const dbFallback = await candidateRepository.findByStateWithSources(stateCode, { office });
    res.json(await maybeEnrich(dbFallback));
  })
);

/**
 * GET /api/candidates/:id
 * Public — no auth required (candidate info is public).
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const candidate = await candidateRepository.findByIdWithSources(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const rankedSources = await rankSources(candidate.sources || []);
    res.json({ ...candidate, sources: rankedSources });
  })
);

/**
 * GET /api/candidates/:id/match-score
 * Returns match score for the authenticated user against a candidate.
 * Requires: authentication
 */
router.get(
  '/:id/match-score',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const [userPrefsResult, candidateResult] = await Promise.all([
      pool.query(
        `SELECT up.importance, i.id as issue_id, i.name as issue_name
         FROM user_preferences up JOIN issues i ON up.issue_id = i.id
         WHERE up.user_id = $1`,
        [req.userId]
      ),
      pool.query('SELECT positions FROM candidates WHERE id = $1', [id]),
    ]);

    if (candidateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const userPreferences = userPrefsResult.rows.map((row) => ({
      issueId: row.issue_id,
      issueName: row.issue_name,
      importance: row.importance,
    }));

    const candidatePositions = candidateResult.rows[0].positions || [];
    const matchScore = calculateMatchScore(userPreferences, candidatePositions);

    res.json({ candidateId: id, ...matchScore });
  })
);

/**
 * POST /api/candidates/:id/sources
 * Add a bias-analyzed source to a candidate.
 * Requires: authentication
 */
router.post(
  '/:id/sources',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { url, sourceType, title } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'url is required' });
    }
    try { new URL(url); } catch {
      return res.status(400).json({ error: 'url must be a valid URL' });
    }

    const validSourceTypes = ['social_media', 'news_article', 'official_website', 'voting_resource', 'other'];
    if (!sourceType || !validSourceTypes.includes(sourceType)) {
      return res.status(400).json({ error: `sourceType must be one of: ${validSourceTypes.join(', ')}` });
    }

    // Verify candidate exists
    const candidateCheck = await pool.query('SELECT id FROM candidates WHERE id = $1', [id]);
    if (candidateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const { analyzeSourceBias } = await import('../services/biasDetection.js');
    const biasAnalysis = await analyzeSourceBias(url, sourceType);

    const result = await pool.query(
      `INSERT INTO candidate_sources (candidate_id, url, source_type, title, bias_score, bias_tier, last_analyzed)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, url, sourceType, title || null, biasAnalysis.biasScore, biasAnalysis.biasTier]
    );

    res.json(result.rows[0]);
  })
);

export default router;
