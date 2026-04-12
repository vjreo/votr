/**
 * Bootstrap NC data on server startup.
 * Auto-populates curated candidates and 2026 elections if missing.
 * Does NOT close the pool — safe to call from server startup.
 */

import pool from './connection.js';
import { getAllNCCandidates } from '../data/ncCandidates.js';
import candidateRepository from '../repositories/candidateRepository.js';
import logger from '../utils/logger.js';

const ISSUE_NAME_MAP = {
  healthcare: 'Healthcare',
  education: 'Education',
  economy: 'Economy',
  environment: 'Climate Change',
  civil_rights: 'Gun Control',
  criminal_justice: 'Criminal Justice',
  housing: 'Economy',
  immigration: 'Immigration',
  taxes: 'Taxes',
};

const ISSUES = [
  { name: 'Healthcare', description: 'Healthcare policy and access', category: 'social' },
  { name: 'Education', description: 'Education policy and funding', category: 'social' },
  { name: 'Climate Change', description: 'Environmental policy and climate action', category: 'environment' },
  { name: 'Economy', description: 'Economic policy and jobs', category: 'economic' },
  { name: 'Immigration', description: 'Immigration policy and reform', category: 'social' },
  { name: 'Criminal Justice', description: 'Criminal justice reform', category: 'social' },
  { name: 'Gun Control', description: 'Gun control and Second Amendment', category: 'social' },
  { name: 'Taxes', description: 'Tax policy and reform', category: 'economic' },
];

const NC_ELECTIONS = [
  {
    name: '2026 General Election',
    date: '2026-11-03',
    type: 'general',
    state: 'NC',
    offices: ['Governor', 'U.S. Senate', 'U.S. House', 'State Legislature'],
    early_voting_start: '2026-10-15',
    early_voting_end: '2026-10-31',
  },
  {
    name: '2026 Primary Election',
    date: '2026-03-03',
    type: 'primary',
    state: 'NC',
    offices: ['Governor', 'U.S. Senate', 'U.S. House', 'State Legislature'],
    early_voting_start: null,
    early_voting_end: null,
  },
];

/**
 * Ensure issues exist (required for candidate positions).
 */
async function ensureIssues() {
  try {
    const check = await pool.query('SELECT COUNT(*) as count FROM issues');
    if (parseInt(check.rows[0].count, 10) > 0) return;
    for (const i of ISSUES) {
      await pool.query(
        'INSERT INTO issues (name, description, category) VALUES ($1, $2, $3)',
        [i.name, i.description, i.category]
      );
    }
    logger.info(`Bootstrap: seeded ${ISSUES.length} issues`);
  } catch (error) {
    logger.warn('Bootstrap issues failed:', error.message);
  }
}

/**
 * Seed curated NC candidates (Governor, US Senate, local) if none exist.
 */
async function ensureNCCandidates() {
  try {
    const check = await pool.query(
      "SELECT COUNT(*) as count FROM candidates WHERE state = 'NC' AND api_source = 'nc_curated'"
    );
    const count = parseInt(check.rows[0].count, 10);
    if (count > 0) {
      logger.debug('NC curated candidates already exist, skipping bootstrap');
      return { seeded: 0 };
    }

    const issuesResult = await pool.query('SELECT id, name FROM issues');
    if (issuesResult.rows.length === 0) {
      logger.warn('Bootstrap: issues empty after ensureIssues; skipping NC candidates');
      return { seeded: 0 };
    }
    const issueNameToId = {};
    issuesResult.rows.forEach((r) => {
      issueNameToId[r.name.toLowerCase()] = r.id;
    });

    const ncCandidates = getAllNCCandidates();
    const toUpsert = ncCandidates.map((c) => {
      const positions = (c.positions || []).map((p) => {
        const issueKey = (p.issueId || p.issueName || '').toLowerCase().replace(/\s+/g, '_');
        const mappedName = ISSUE_NAME_MAP[issueKey] || p.issueName || p.issue;
        const issueId = issueNameToId[(mappedName || '').toLowerCase()] || issueNameToId.healthcare;
        return {
          issueId,
          issueName: p.issueName || p.issue || mappedName,
          stance: p.stance,
          confidence: 0.6,
        };
      });
      return {
        name: c.name,
        office: c.office,
        officeLevel: c.officeLevel || 'local',
        party: c.party || 'Unknown',
        photoUrl: c.photo || c.photoUrl || null,
        bio: c.bio || null,
        district: null,
        state: 'NC',
        positions,
        career: c.career || [],
        apiSource: 'nc_curated',
      };
    });

    for (const c of toUpsert) {
      await candidateRepository.upsert(c);
    }
    logger.info(`Bootstrap: seeded ${toUpsert.length} NC curated candidates`);
    return { seeded: toUpsert.length };
  } catch (error) {
    logger.warn('Bootstrap NC candidates failed:', error.message);
    return { seeded: 0, error: error.message };
  }
}

/**
 * Seed 2026 NC elections if missing.
 */
async function ensureElections() {
  try {
    let added = 0;
    for (const e of NC_ELECTIONS) {
      const existing = await pool.query(
        'SELECT id FROM elections WHERE name = $1 AND state = $2 AND date = $3',
        [e.name, e.state, e.date]
      );
      if (existing.rows.length > 0) continue;

      await pool.query(
        `INSERT INTO elections (name, date, type, state, offices, early_voting_start, early_voting_end)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          e.name,
          e.date,
          e.type,
          e.state,
          JSON.stringify(e.offices),
          e.early_voting_start || null,
          e.early_voting_end || null,
        ]
      );
      added++;
    }
    if (added > 0) {
      logger.info(`Bootstrap: added ${added} NC elections`);
    }
    return { added };
  } catch (error) {
    logger.warn('Bootstrap elections failed:', error.message);
    return { added: 0, error: error.message };
  }
}

/**
 * Ensure NC data is populated. Call on server startup.
 * Seeds: issues (if empty), curated candidates, 2026 elections.
 * Open States legislators are fetched on first /api/candidates request.
 */
export async function ensureNCData() {
  await ensureIssues();
  const [candidates, elections] = await Promise.all([
    ensureNCCandidates(),
    ensureElections(),
  ]);
  return { candidates, elections };
}
