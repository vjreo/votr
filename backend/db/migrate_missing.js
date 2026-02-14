import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateMissing() {
  console.log('Running migration for missing tables...\n');
  
  const migrationPath = path.join(__dirname, 'migrations', '002_create_missing_tables.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  // Remove comments
  let cleanedSql = sql.replace(/--.*$/gm, '');
  
  // Split by semicolon and execute each statement
  const statements = cleanedSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  console.log(`Executing ${statements.length} statements...\n`);
  
  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    try {
      await pool.query(statement);
      successCount++;
      
      // Show progress for table creation
      if (statement.toUpperCase().includes('CREATE TABLE')) {
        const tableMatch = statement.match(/CREATE TABLE.*?(\w+)/i);
        const tableName = tableMatch ? tableMatch[1] : 'table';
        console.log(`   ✓ Created table: ${tableName}`);
      }
    } catch (error) {
      const errorMsg = error.message.toLowerCase();
      
      // Ignore "already exists" errors
      if (errorMsg.includes('already exists') || 
          errorMsg.includes('duplicate')) {
        skippedCount++;
        continue;
      }
      
      // Ignore "does not exist" for indexes if table doesn't exist yet
      if (errorMsg.includes('does not exist') && statement.toUpperCase().includes('CREATE INDEX')) {
        skippedCount++;
        continue;
      }
      
      // Show other errors
      errorCount++;
      console.error(`   ❌ Error in statement ${i + 1}: ${error.message.substring(0, 150)}`);
      const preview = statement.replace(/\s+/g, ' ').substring(0, 100);
      console.error(`      ${preview}...`);
    }
  }
  
  console.log(`\n✅ Migration completed!`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Skipped (already exists): ${skippedCount}`);
  if (errorCount > 0) {
    console.log(`   Errors: ${errorCount}`);
  }
  
  // Verify tables
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name IN ('candidates', 'candidate_sources', 'elections', 'swipes')
      ORDER BY table_name;
    `);
    
    const tableNames = result.rows.map(r => r.table_name);
    
    console.log(`\n📊 Verification:`);
    if (tableNames.length === 4) {
      console.log('   ✅ All missing tables created:');
      tableNames.forEach(name => console.log(`      ✓ ${name}`));
    } else {
      console.log(`   Found ${tableNames.length} of 4 tables:`);
      tableNames.forEach(name => console.log(`      ✓ ${name}`));
      const missing = ['candidates', 'candidate_sources', 'elections', 'swipes']
        .filter(t => !tableNames.includes(t));
      if (missing.length > 0) {
        console.log(`\n   ⚠️  Still missing: ${missing.join(', ')}`);
      }
    }
  } catch (verifyError) {
    console.error(`\n⚠️  Could not verify: ${verifyError.message}`);
  }
  
  await pool.end();
  process.exit(errorCount > 0 ? 1 : 0);
}

migrateMissing();
