import pool from './connection.js';

async function createMissingTables() {
  console.log('Creating missing tables...\n');
  
  // Individual CREATE TABLE statements - single line format to avoid parsing issues
  const statements = [
    // Candidates table
    `CREATE TABLE IF NOT EXISTS candidates (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name VARCHAR(255) NOT NULL, office VARCHAR(255) NOT NULL, office_level VARCHAR(50) CHECK (office_level IN ('federal', 'state', 'local')), party VARCHAR(100), photo_url TEXT, bio TEXT, district VARCHAR(100), state VARCHAR(2) NOT NULL, positions JSONB DEFAULT '[]'::jsonb, api_source VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(name, office, state, COALESCE(district, '')))`,
    
    // Candidate sources table
    `CREATE TABLE IF NOT EXISTS candidate_sources (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE, url TEXT NOT NULL, source_type VARCHAR(50) CHECK (source_type IN ('social_media', 'news_article', 'official_website', 'voting_resource', 'other')), title VARCHAR(500), bias_score INTEGER CHECK (bias_score >= 0 AND bias_score <= 100), bias_tier VARCHAR(50) CHECK (bias_tier IN ('most_reliable', 'reliable', 'use_caution', 'highly_biased')), last_analyzed TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
    
    // Swipes table
    `CREATE TABLE IF NOT EXISTS swipes (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE, direction VARCHAR(10) CHECK (direction IN ('left', 'right', 'up')), match_score DECIMAL(5,2), timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, candidate_id, timestamp))`,
    
    // Elections table
    `CREATE TABLE IF NOT EXISTS elections (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name VARCHAR(255) NOT NULL, date DATE NOT NULL, type VARCHAR(50) CHECK (type IN ('primary', 'general', 'special', 'runoff')), offices JSONB DEFAULT '[]'::jsonb, district VARCHAR(100), state VARCHAR(2) NOT NULL, early_voting_start DATE, early_voting_end DATE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(name, date, state, COALESCE(district, '')))`,
    
    // Indexes for candidates
    `CREATE INDEX IF NOT EXISTS idx_candidates_state ON candidates(state)`,
    `CREATE INDEX IF NOT EXISTS idx_candidates_office ON candidates(office)`,
    `CREATE INDEX IF NOT EXISTS idx_candidates_state_office_level ON candidates(state, office_level)`,
    `CREATE INDEX IF NOT EXISTS idx_candidates_state_office ON candidates(state, office)`,
    
    // Indexes for candidate_sources
    `CREATE INDEX IF NOT EXISTS idx_candidate_sources_candidate_id ON candidate_sources(candidate_id)`,
    `CREATE INDEX IF NOT EXISTS idx_candidate_sources_bias_score ON candidate_sources(bias_score)`,
    
    // Indexes for swipes
    `CREATE INDEX IF NOT EXISTS idx_swipes_user_id ON swipes(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_swipes_candidate_id ON swipes(candidate_id)`,
    `CREATE INDEX IF NOT EXISTS idx_swipes_timestamp ON swipes(timestamp)`,
    
    // Indexes for elections
    `CREATE INDEX IF NOT EXISTS idx_elections_date ON elections(date)`,
    `CREATE INDEX IF NOT EXISTS idx_elections_state ON elections(state)`,
    `CREATE INDEX IF NOT EXISTS idx_elections_state_date ON elections(state, date)`,
    `CREATE INDEX IF NOT EXISTS idx_elections_state_district ON elections(state, district) WHERE district IS NOT NULL`,
  ];
  
  console.log(`Executing ${statements.length} statements...\n`);
  
  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const isTable = statement.toUpperCase().includes('CREATE TABLE');
    const isIndex = statement.toUpperCase().includes('CREATE INDEX');
    
    try {
      await pool.query(statement);
      successCount++;
      
      if (isTable) {
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
        if (isTable) {
          const tableMatch = statement.match(/CREATE TABLE.*?(\w+)/i);
          const tableName = tableMatch ? tableMatch[1] : 'table';
          console.log(`   ⊙ Table already exists: ${tableName}`);
        }
        continue;
      }
      
      // Ignore "does not exist" for indexes if table doesn't exist yet
      if (isIndex && errorMsg.includes('does not exist')) {
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
  
  console.log(`\n✅ Completed!`);
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

createMissingTables();
