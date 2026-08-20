import pool from './connection.js';
import logger from '../utils/logger.js';
import bcrypt from 'bcryptjs';

/**
 * Seed database with test data
 */
async function seedDatabase() {
  console.log('🌱 Seeding database with test data...\n');

  try {
    // Check if data already exists
    const userCheck = await pool.query('SELECT COUNT(*) as count FROM users');
    const candidateCheck = await pool.query('SELECT COUNT(*) as count FROM candidates');
    
    if (userCheck.rows[0].count > 0 || candidateCheck.rows[0].count > 0) {
      console.log('⚠️  Database already contains data.');
      console.log('   Users:', userCheck.rows[0].count);
      console.log('   Candidates:', candidateCheck.rows[0].count);
      console.log('\n💡 To reseed, clear existing data first.\n');
      await pool.end();
      return;
    }

    // Seed issues
    console.log('📋 Seeding issues...');
    const issues = [
      { name: 'Healthcare', description: 'Healthcare policy and access', category: 'social' },
      { name: 'Education', description: 'Education policy and funding', category: 'social' },
      { name: 'Climate Change', description: 'Environmental policy and climate action', category: 'environment' },
      { name: 'Economy', description: 'Economic policy and jobs', category: 'economic' },
      { name: 'Immigration', description: 'Immigration policy and reform', category: 'social' },
      { name: 'Criminal Justice', description: 'Criminal justice reform', category: 'social' },
      { name: 'Gun Control', description: 'Gun control and Second Amendment', category: 'social' },
      { name: 'Taxes', description: 'Tax policy and reform', category: 'economic' },
    ];

    const issueIds = {};
    for (const issue of issues) {
      const result = await pool.query(
        'INSERT INTO issues (name, description, category) VALUES ($1, $2, $3) RETURNING id',
        [issue.name, issue.description, issue.category]
      );
      issueIds[issue.name] = result.rows[0].id;
      console.log(`   ✓ ${issue.name}`);
    }

    // Seed test users
    console.log('\n👤 Seeding test users...');
    const testUsers = [
      {
        email: 'test@votr.app',
        password: 'testpassword123',
        auth_provider: 'email',
        is_anonymous: false,
      },
      {
        email: 'demo@votr.app',
        password: 'demopassword123',
        auth_provider: 'email',
        is_anonymous: false,
      },
    ];

    const userIds = [];
    for (const userData of testUsers) {
      const passwordHash = await bcrypt.hash(userData.password, 10);
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, auth_provider, is_anonymous, is_email_verified)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email`,
        [userData.email, passwordHash, userData.auth_provider, userData.is_anonymous, true]
      );
      userIds.push(result.rows[0].id);
      console.log(`   ✓ ${userData.email} (password: ${userData.password})`);
    }

    // Seed anonymous user
    const anonResult = await pool.query(
      `INSERT INTO users (auth_provider, is_anonymous)
       VALUES ($1, $2)
       RETURNING id`,
      ['anonymous', true]
    );
    const anonUserId = anonResult.rows[0].id;
    userIds.push(anonUserId);
    console.log(`   ✓ Anonymous user`);

    // Seed user preferences
    console.log('\n🎯 Seeding user preferences...');
    const preferences = [
      { userId: userIds[0], issue: 'Healthcare', importance: 5 },
      { userId: userIds[0], issue: 'Education', importance: 4 },
      { userId: userIds[0], issue: 'Climate Change', importance: 5 },
      { userId: userIds[1], issue: 'Economy', importance: 5 },
      { userId: userIds[1], issue: 'Taxes', importance: 4 },
      { userId: userIds[1], issue: 'Immigration', importance: 3 },
    ];

    for (const pref of preferences) {
      await pool.query(
        'INSERT INTO user_preferences (user_id, issue_id, importance) VALUES ($1, $2, $3)',
        [pref.userId, issueIds[pref.issue], pref.importance]
      );
    }
    console.log(`   ✓ ${preferences.length} preferences added`);

    console.log('\n🗳️  Seeding elections...');
    const elections = [
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
      {
        name: '2024 General Election',
        date: '2024-11-05',
        type: 'general',
        state: 'NC',
        offices: ['President', 'Senator', 'Governor'],
        early_voting_start: '2024-10-17',
        early_voting_end: '2024-11-02',
      },
    ];

    const electionIds = [];
    for (const election of elections) {
      const result = await pool.query(
        `INSERT INTO elections (name, date, type, state, offices, early_voting_start, early_voting_end)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          election.name,
          election.date,
          election.type,
          election.state,
          JSON.stringify(election.offices),
          election.early_voting_start || null,
          election.early_voting_end || null,
        ]
      );
      electionIds.push(result.rows[0].id);
      console.log(`   ✓ ${election.name} (${election.state})`);
    }

    // Seed candidates
    console.log('\n👔 Seeding candidates...');
    const candidates = [
      {
        name: 'John Smith',
        office: 'Senator',
        office_level: 'federal',
        party: 'Democratic',
        state: 'NC',
        bio: 'Experienced public servant focused on healthcare and education reform.',
        positions: [
          { issue: 'Healthcare', stance: 'Supports universal healthcare access' },
          { issue: 'Education', stance: 'Advocates for increased education funding' },
        ],
      },
      {
        name: 'Jane Doe',
        office: 'Senator',
        office_level: 'federal',
        party: 'Republican',
        state: 'NC',
        bio: 'Business leader committed to economic growth and fiscal responsibility.',
        positions: [
          { issue: 'Economy', stance: 'Focuses on job creation and tax cuts' },
          { issue: 'Taxes', stance: 'Supports tax reform and reduction' },
        ],
      },
      {
        name: 'Alex Johnson',
        office: 'Governor',
        office_level: 'state',
        party: 'Independent',
        state: 'NC',
        bio: 'Environmental advocate with a focus on climate action.',
        positions: [
          { issue: 'Climate Change', stance: 'Strong supporter of renewable energy' },
          { issue: 'Education', stance: 'Champion of public education' },
        ],
      },
    ];

    const candidateIds = [];
    for (const candidate of candidates) {
      const result = await pool.query(
        `INSERT INTO candidates (name, office, office_level, party, state, bio, positions)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          candidate.name,
          candidate.office,
          candidate.office_level,
          candidate.party,
          candidate.state,
          candidate.bio,
          JSON.stringify(candidate.positions),
        ]
      );
      candidateIds.push(result.rows[0].id);
      console.log(`   ✓ ${candidate.name} (${candidate.office})`);
    }

    // Seed candidate sources
    console.log('\n📰 Seeding candidate sources...');
    const sources = [
      {
        candidate_id: candidateIds[0],
        url: 'https://example.com/john-smith-website',
        source_type: 'official_website',
        title: 'Official Campaign Website',
        bias_score: 50,
        bias_tier: 'reliable',
      },
      {
        candidate_id: candidateIds[0],
        url: 'https://example.com/john-smith-news',
        source_type: 'news_article',
        title: 'John Smith Campaign Announcement',
        bias_score: 60,
        bias_tier: 'reliable',
      },
      {
        candidate_id: candidateIds[1],
        url: 'https://example.com/jane-doe-website',
        source_type: 'official_website',
        title: 'Official Campaign Website',
        bias_score: 50,
        bias_tier: 'reliable',
      },
    ];

    for (const source of sources) {
      await pool.query(
        `INSERT INTO candidate_sources (candidate_id, url, source_type, title, bias_score, bias_tier)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          source.candidate_id,
          source.url,
          source.source_type,
          source.title,
          source.bias_score,
          source.bias_tier,
        ]
      );
    }
    console.log(`   ✓ ${sources.length} sources added`);

    // Seed some swipes
    console.log('\n👆 Seeding swipes...');
    const swipes = [
      { user_id: userIds[0], candidate_id: candidateIds[0], direction: 'right', match_score: 85.5 },
      { user_id: userIds[0], candidate_id: candidateIds[1], direction: 'left', match_score: 45.2 },
      { user_id: userIds[1], candidate_id: candidateIds[1], direction: 'right', match_score: 78.3 },
    ];

    for (const swipe of swipes) {
      await pool.query(
        `INSERT INTO swipes (user_id, candidate_id, direction, match_score)
         VALUES ($1, $2, $3, $4)`,
        [swipe.user_id, swipe.candidate_id, swipe.direction, swipe.match_score]
      );
    }
    console.log(`   ✓ ${swipes.length} swipes added`);

    console.log('\n✅ Database seeding complete!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${userIds.length}`);
    console.log(`   Issues: ${issues.length}`);
    console.log(`   Elections: ${elections.length}`);
    console.log(`   Candidates: ${candidates.length}`);
    console.log(`   Sources: ${sources.length}`);
    console.log(`   Swipes: ${swipes.length}`);
    console.log('\n💡 Test credentials:');
    console.log('   Email: test@votr.app');
    console.log('   Password: testpassword123');
    console.log('   Email: demo@votr.app');
    console.log('   Password: demopassword123\n');

  } catch (error) {
    logger.error('Seeding failed:', error);
    console.error('\n❌ Error seeding database:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

seedDatabase().catch(error => {
  process.exit(1);
});
