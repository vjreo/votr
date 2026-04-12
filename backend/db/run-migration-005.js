/**
 * Run migration 005: Add career column and state_legislature to office_level
 * Run: node backend/db/run-migration-005.js
 */

import pool from './connection.js';

async function run() {
  console.log('Running migration 005: career + office_level...\n');

  try {
    await pool.query(`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS career JSONB DEFAULT '[]'::jsonb`);
    console.log('  ✓ Added career column');

    await pool.query(`ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_office_level_check`);
    console.log('  ✓ Dropped old office_level constraint');

    await pool.query(`
      ALTER TABLE candidates ADD CONSTRAINT candidates_office_level_check
      CHECK (office_level IN ('federal', 'state', 'state_legislature', 'local'))
    `);
    console.log('  ✓ Added new office_level constraint (includes state_legislature)');

    console.log('\n✅ Migration 005 complete!\n');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

run().catch(() => process.exit(1));
