/**
 * Seed Mecklenburg County Nov 2026 Election Data
 *
 * Usage: node db/seed-meck-2026.js [--force]
 *
 * Seeds candidates and ballot measures from the Mecklenburg 2026 brief.
 * Use --force to overwrite existing records.
 */

import dotenv from 'dotenv';
dotenv.config();

import pool from './connection.js';
import candidateRepository from '../repositories/candidateRepository.js';
import ballotMeasureRepository from '../repositories/ballotMeasureRepository.js';
import {
  getAllMeck2026Candidates,
  NC_AMENDMENTS_2026,
  CHARLOTTE_BONDS_2026,
  MECK_2026_ELECTION,
} from '../data/meckNov2026.js';
import logger from '../utils/logger.js';

const forceOverwrite = process.argv.includes('--force');

async function runMigration007() {
  const migrationSQL = `
    CREATE TABLE IF NOT EXISTS ballot_measures (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        measure_id VARCHAR(100) NOT NULL UNIQUE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('amendment', 'bond', 'referendum', 'initiative')),
        title VARCHAR(500) NOT NULL,
        short_title VARCHAR(200),
        ballot_question TEXT NOT NULL,
        official_summary TEXT,
        explanation TEXT,
        source_law VARCHAR(255),
        choices JSONB DEFAULT '["Yes", "No"]'::jsonb,
        state VARCHAR(2) NOT NULL,
        county VARCHAR(100),
        city VARCHAR(100),
        election_date DATE NOT NULL,
        principal DECIMAL(15, 2),
        estimated_cost DECIMAL(15, 2),
        estimated_tax_impact VARCHAR(255),
        sources JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_ballot_measures_state ON ballot_measures(state);
    CREATE INDEX IF NOT EXISTS idx_ballot_measures_election_date ON ballot_measures(election_date);
    CREATE INDEX IF NOT EXISTS idx_ballot_measures_county ON ballot_measures(county);
    CREATE INDEX IF NOT EXISTS idx_ballot_measures_type ON ballot_measures(type);
  `;

  try {
    await pool.query(migrationSQL);
    logger.info('ballot_measures table ready');
  } catch (error) {
    logger.error('Migration 007 failed:', error.message);
    throw error;
  }
}

async function seedCandidates() {
  const candidates = getAllMeck2026Candidates();
  logger.info(`Seeding ${candidates.length} Meck 2026 candidates...`);

  const toUpsert = candidates.map((c) => ({
    name: c.name,
    office: c.office,
    office_level: c.officeLevel,
    party: c.party,
    photo_url: c.photo_url || null,
    bio: c.bio || null,
    career: c.career || [],
    district: c.district || null,
    state: c.state || 'NC',
    positions: c.positions || [],
    api_source: 'meck_2026_seed',
  }));

  const results = await candidateRepository.bulkUpsert(toUpsert);
  logger.info(`Upserted ${results.length} candidates`);

  // Add sources for candidates that have them
  for (const c of candidates) {
    if (c.sources && c.sources.length > 0) {
      const dbCandidate = results.find(
        (r) => r.name.toLowerCase() === c.name.toLowerCase() && r.office === c.office
      );
      if (dbCandidate) {
        for (const source of c.sources) {
          try {
            await pool.query(
              `INSERT INTO candidate_sources (candidate_id, url, source_type, title)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT DO NOTHING`,
              [dbCandidate.id, source.url, source.source_type, source.title]
            );
          } catch (e) {
            logger.debug(`Source insert skipped: ${source.url}`);
          }
        }
      }
    }
  }

  return results;
}

async function seedBallotMeasures() {
  const electionDate = MECK_2026_ELECTION.date;

  // Statewide amendments
  const amendments = NC_AMENDMENTS_2026.map((m) => ({
    ...m,
    electionDate,
  }));

  // Charlotte city bonds
  const bonds = CHARLOTTE_BONDS_2026.map((m) => ({
    ...m,
    electionDate,
  }));

  const allMeasures = [...amendments, ...bonds];
  logger.info(`Seeding ${allMeasures.length} ballot measures (${amendments.length} amendments, ${bonds.length} bonds)...`);

  const results = await ballotMeasureRepository.bulkUpsert(allMeasures);
  logger.info(`Upserted ${results.length} ballot measures`);

  return results;
}

async function main() {
  try {
    logger.info('Starting Meck 2026 seed...');

    // Ensure ballot_measures table exists
    await runMigration007();

    // Seed candidates
    await seedCandidates();

    // Seed ballot measures
    await seedBallotMeasures();

    logger.info('Meck 2026 seed complete!');
    process.exit(0);
  } catch (error) {
    logger.error('Seed failed:', error.message);
    logger.error(error.stack);
    process.exit(1);
  }
}

main();
