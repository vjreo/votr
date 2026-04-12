/**
 * Seed real NC candidates from ncCandidates.js
 * Run: node backend/db/seed-nc-candidates.js
 * Use --force to replace existing NC candidates
 * Requires issues to exist (run db:seed first if needed)
 */

import pool from './connection.js';
import { getAllNCCandidates } from '../data/ncCandidates.js';
import candidateRepository from '../repositories/candidateRepository.js';
import logger from '../utils/logger.js';

// Map ncCandidates issue names to seed issue names for matching
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

async function seedNCCandidates(force = false) {
  console.log('🌱 Seeding real NC candidates...\n');

  try {
    // Get issue IDs for position mapping
    const issuesResult = await pool.query('SELECT id, name FROM issues');
    const issueNameToId = {};
    issuesResult.rows.forEach((r) => {
      issueNameToId[r.name.toLowerCase()] = r.id;
    });

    if (!force) {
      const check = await pool.query(
        "SELECT COUNT(*) as count FROM candidates WHERE state = 'NC'"
      );
      if (parseInt(check.rows[0].count, 10) > 0) {
        console.log('⚠️  NC candidates already exist. Use --force to replace.\n');
        await pool.end();
        return;
      }
    }

    if (force) {
      await pool.query("DELETE FROM candidate_sources WHERE candidate_id IN (SELECT id FROM candidates WHERE state = 'NC')");
      await pool.query("DELETE FROM candidates WHERE state = 'NC'");
      console.log('   Cleared existing NC candidates\n');
    }

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
      console.log(`   ✓ ${c.name} (${c.office})`);
    }

    console.log(`\n✅ Seeded ${toUpsert.length} NC candidates.\n`);
  } catch (error) {
    logger.error('Seed NC candidates failed:', error);
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

const force = process.argv.includes('--force');
seedNCCandidates(force).catch(() => process.exit(1));
