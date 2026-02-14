import pool from './connection.js';
import logger from '../utils/logger.js';

/**
 * Verify database setup - check all required tables exist
 */
async function verifyDatabase() {
  console.log('🔍 Verifying database setup...\n');
  
  const requiredTables = [
    'users',
    'sessions',
    'candidates',
    'candidate_sources',
    'elections',
    'swipes',
    'issues',
    'user_preferences',
    'achievements',
    'source_feedback',
    'bias_analysis_cache',
    'user_locations',
    'state_config',
    'state_data_sources'
  ];

  try {
    // Check if tables exist
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const existingTables = result.rows.map(r => r.table_name);
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    const extraTables = existingTables.filter(t => !requiredTables.includes(t));

    console.log(`📊 Found ${existingTables.length} tables in database\n`);

    // Check required tables
    if (missingTables.length === 0) {
      console.log('✅ All required tables exist!');
      requiredTables.forEach(table => {
        console.log(`   ✓ ${table}`);
      });
    } else {
      console.log('⚠️  Missing tables:');
      missingTables.forEach(table => {
        console.log(`   ❌ ${table}`);
      });
      console.log('\n💡 Run migrations to create missing tables:');
      console.log('   npm run db:migrate');
    }

    // Show extra tables if any
    if (extraTables.length > 0) {
      console.log('\n📋 Additional tables found:');
      extraTables.forEach(table => {
        console.log(`   ℹ️  ${table}`);
      });
    }

    // Check for UUID extension
    const extensionResult = await pool.query(`
      SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';
    `);
    
    if (extensionResult.rows.length > 0) {
      console.log('\n✅ UUID extension is installed');
    } else {
      console.log('\n⚠️  UUID extension not found - some features may not work');
    }

    // Check table row counts
    console.log('\n📈 Table row counts:');
    for (const table of requiredTables) {
      if (existingTables.includes(table)) {
        try {
          const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
          const count = countResult.rows[0].count;
          console.log(`   ${table}: ${count} rows`);
        } catch (err) {
          console.log(`   ${table}: Error counting rows`);
        }
      }
    }

    // Check foreign key constraints
    console.log('\n🔗 Checking foreign key relationships...');
    const fkResult = await pool.query(`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name;
    `);

    if (fkResult.rows.length > 0) {
      console.log(`   ✅ Found ${fkResult.rows.length} foreign key constraints`);
    } else {
      console.log('   ⚠️  No foreign key constraints found');
    }

    console.log('\n✅ Database verification complete!');
    
    if (missingTables.length === 0) {
      console.log('🎉 Database is ready to use!\n');
      return true;
    } else {
      console.log('⚠️  Please run migrations before proceeding.\n');
      return false;
    }

  } catch (error) {
    logger.error('Database verification failed:', error);
    console.error('\n❌ Error verifying database:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

verifyDatabase().then(success => {
  process.exit(success ? 0 : 1);
});
