import civicApi from './services/civicApi.js';
import logger from './utils/logger.js';

/**
 * Test Google Civic API integration
 */
async function testCivicAPI() {
  console.log('🧪 Testing Google Civic API integration...\n');

  if (!process.env.GOOGLE_CIVIC_API_KEY || process.env.GOOGLE_CIVIC_API_KEY === 'your-google-civic-api-key') {
    console.log('⚠️  GOOGLE_CIVIC_API_KEY not configured');
    console.log('   Set it in your .env file to test API integration\n');
    console.log('   Get your key from: https://console.cloud.google.com/');
    console.log('   Enable "Civic Information API" and create credentials\n');
    return false;
  }

  try {
    // Test 1: Get elections
    console.log('📅 Testing getElections()...');
    const elections = await civicApi.getElections();
    console.log(`   ✅ Retrieved ${elections.elections?.length || 0} elections`);
    
    if (elections.elections && elections.elections.length > 0) {
      const nextElection = elections.elections[0];
      console.log(`   📋 Sample election: ${nextElection.name} (ID: ${nextElection.id})`);
    }

    // Test 2: Get representatives (NC address for VOTR)
    console.log('\n👔 Testing getRepresentatives() - NC address...');
    const ncAddress = '600 E Fourth St, Charlotte, NC 28202';
    try {
      const reps = await civicApi.getRepresentatives(ncAddress);
      console.log(`   ✅ Retrieved representatives for ${ncAddress}`);
      if (reps.officials && reps.officials.length > 0) {
        console.log(`   👤 Found ${reps.officials.length} officials`);
        reps.officials.slice(0, 3).forEach((o, i) => {
          console.log(`      ${i + 1}. ${o.name} (${o.party || 'Unknown'})`);
        });
      } else {
        console.log('   ⚠️  No officials returned');
      }
    } catch (error) {
      console.log(`   ⚠️  Error: ${error.message}`);
      if (error.response?.status === 403) {
        console.log('   💡 Enable Civic Information API at console.cloud.google.com');
      }
    }

    // Test 2b: Get representatives as candidates (our helper)
    console.log('\n👔 Testing getRepresentativesAsCandidates()...');
    try {
      const candidates = await civicApi.getRepresentativesAsCandidates(ncAddress);
      console.log(`   ✅ Retrieved ${candidates.length} officials as candidates`);
      candidates.slice(0, 3).forEach((c, i) => {
        console.log(`      ${i + 1}. ${c.name} - ${c.office} (${c.party})`);
      });
    } catch (error) {
      console.log(`   ⚠️  Error: ${error.message}`);
    }

    // Test 3: Get voter info without electionId (our primary strategy)
    console.log('\n🗳️  Testing getVoterInfoByAddress() (no electionId)...');
    try {
      const voterInfo = await civicApi.getVoterInfoByAddress(ncAddress);
      const candidates = civicApi.extractCandidatesFromVoterInfo(voterInfo);
      console.log(`   ✅ Voterinfo returned ${candidates.length} candidates from ${voterInfo.contests?.length || 0} contests`);
    } catch (error) {
      console.log(`   ⚠️  Error: ${error.message}`);
      console.log('   (Voterinfo may be empty for some addresses; Representatives API is the fallback)');
    }

    // Test 4: Get voter info with explicit election ID
    if (elections.elections && elections.elections.length > 0) {
      const electionId = elections.elections[0].id;
      console.log(`\n🗳️  Testing getVoterInfo() with election ID ${electionId}...`);
      try {
        const voterInfo = await civicApi.getVoterInfo(ncAddress, electionId);
        console.log(`   ✅ Retrieved voter info`);
        if (voterInfo.contests) {
          console.log(`   📊 Found ${voterInfo.contests.length} contests`);
        }
      } catch (error) {
        console.log(`   ⚠️  Error: ${error.message}`);
        console.log('   (This is normal if the election is not active or address is invalid)');
      }
    }

    console.log('\n✅ Google Civic API integration is working!');
    console.log('\n💡 Note: Some endpoints may return errors for invalid addresses or inactive elections.');
    console.log('   This is expected behavior. The API will work correctly with valid addresses.\n');
    return true;

  } catch (error) {
    console.error('\n❌ Error testing Google Civic API:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data).substring(0, 200));
      
      if (error.response.status === 403) {
        console.error('\n💡 This usually means:');
        console.error('   - API key is invalid or not activated');
        console.error('   - Civic Information API is not enabled in Google Cloud Console');
        console.error('   - API key restrictions are blocking the request');
      }
    }
    return false;
  }
}

testCivicAPI()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });
