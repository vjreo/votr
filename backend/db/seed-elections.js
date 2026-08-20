/**
 * Seed/update NC elections for the current cycle plus the 2028 primary MVP target.
 * Run: node backend/db/seed-elections.js
 * Safe to run repeatedly — skips existing elections.
 */

import pool from './connection.js';
import logger from '../utils/logger.js';

const NC_ELECTIONS = [
  {
    name: '2026 General Election',
    date: '2026-11-03',
    type: 'general',
    state: 'NC',
    offices: ['U.S. Senate', 'U.S. House', 'State Legislature'],
    early_voting_start: '2026-10-15',
    early_voting_end: '2026-10-31',
  },
  {
    name: '2028 Primary Election',
    date: '2028-03-07',
    type: 'primary',
    state: 'NC',
    offices: ['President', 'Governor', 'U.S. Senate', 'U.S. House', 'State Legislature'],
    early_voting_start: '2028-02-19',
    early_voting_end: '2028-03-04',
  },
];

async function seedElections() {
  console.log('🗳️  Seeding NC elections...\n');

  try {
    for (const e of NC_ELECTIONS) {
      const existing = await pool.query(
        'SELECT id FROM elections WHERE name = $1 AND state = $2 AND date = $3',
        [e.name, e.state, e.date]
      );
      if (existing.rows.length > 0) {
        console.log(`   ✓ ${e.name} (already exists)`);
        continue;
      }
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
      console.log(`   ✓ ${e.name} (${e.date})`);
    }

    console.log('\n✅ NC elections ready.\n');
  } catch (error) {
    logger.error('Seed elections failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedElections().catch(() => process.exit(1));
