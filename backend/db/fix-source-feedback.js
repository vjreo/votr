import pool from './connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create the missing source_feedback table
 */
async function fixSourceFeedback() {
  console.log('🔧 Creating missing source_feedback table...\n');

  try {
    const migrationPath = path.join(__dirname, 'migrations', '003_create_source_feedback.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ source_feedback table created successfully!\n');

    // Verify it was created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'source_feedback';
    `);

    if (result.rows.length > 0) {
      console.log('✅ Verification: source_feedback table exists\n');
    } else {
      console.log('⚠️  Warning: Table may not have been created\n');
    }

  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️  source_feedback table already exists\n');
    } else {
      console.error('❌ Error creating table:', error.message);
      throw error;
    }
  } finally {
    await pool.end();
  }
}

fixSourceFeedback()
  .then(() => {
    console.log('✅ Done!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
