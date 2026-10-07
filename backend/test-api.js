import axios from 'axios';
import logger from './utils/logger.js';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '') || 'http://localhost:3000';

/**
 * Test API endpoints
 */
async function testAPI() {
  console.log('🧪 Testing VOTR API endpoints...\n');
  console.log(`📍 Base URL: ${API_BASE_URL}\n`);

  const tests = [];
  let accessToken = null;
  let userId = null;

  // Test 1: Health check
  tests.push({
    name: 'Health Check',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/health`);
      return response.status === 200 && response.data.status === 'ok';
    },
  });

  // Test 2: Create anonymous user
  tests.push({
    name: 'Create Anonymous User',
    test: async () => {
      const response = await axios.post(`${API_BASE_URL}/auth/anonymous`);
      if (response.status === 201 && response.data.accessToken) {
        accessToken = response.data.accessToken;
        userId = response.data.user.id;
        return true;
      }
      return false;
    },
  });

  // Test 3: Get user profile
  tests.push({
    name: 'Get User Profile',
    test: async () => {
      if (!accessToken) return false;
      const response = await axios.get(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.status === 200 && response.data.id === userId;
    },
  });

  // Test 4: Get candidates
  tests.push({
    name: 'Get Candidates',
    test: async () => {
      const response = await axios.get(`${API_BASE_URL}/candidates?state=NC`);
      return response.status === 200 && Array.isArray(response.data);
    },
  });

  // Test 4b: includeMatch requires authentication
  tests.push({
    name: 'Get Candidates includeMatch requires auth',
    test: async () => {
      try {
        await axios.get(`${API_BASE_URL}/candidates?state=NC&includeMatch=true`);
        return false;
      } catch (error) {
        return error.response?.status === 401;
      }
    },
  });

  // Test 5: Get elections
  tests.push({
    name: 'Get Elections',
    test: async () => {
      const response = await axios.get(`${API_BASE_URL}/elections?state=NC`);
      return response.status === 200 && Array.isArray(response.data);
    },
  });

  // Test 5b: Sample ballot
  tests.push({
    name: 'Sample Ballot',
    test: async () => {
      const response = await axios.get(`${API_BASE_URL}/sample-ballot?state=NC`);
      return response.status === 200 && response.data.success === true && Array.isArray(response.data.contests);
    },
  });

  // Test 5c: Ballot measures (empty array is OK if table exists)
  tests.push({
    name: 'Ballot Measures',
    test: async () => {
      const response = await axios.get(`${API_BASE_URL}/ballot-measures?state=NC`);
      return response.status === 200 && response.data.success === true && Array.isArray(response.data.measures);
    },
  });

  // Test 6: Update user preferences
  tests.push({
    name: 'Update User Preferences',
    test: async () => {
      if (!accessToken || !userId) return false;
      const response = await axios.post(
        `${API_BASE_URL}/users/${userId}/preferences`,
        {
          preferences: [
            { issueId: 'test-issue-id', issueName: 'Healthcare', importance: 5 },
          ],
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.status === 200 && response.data.success === true;
    },
  });

  // Test 7: Register user
  tests.push({
    name: 'Register User',
    test: async () => {
      const email = `test${Date.now()}@votr.app`;
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email,
        password: 'testpassword123',
      });
      return response.status === 201 && response.data.accessToken;
    },
  });

  // Test 8: Login user
  tests.push({
    name: 'Login User',
    test: async () => {
      const email = `login${Date.now()}@votr.app`;
      await axios.post(`${API_BASE_URL}/auth/register`, {
        email,
        password: 'testpassword123',
      });
      await new Promise((r) => setTimeout(r, 300));
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password: 'testpassword123',
      });
      return response.status === 200 && response.data.accessToken;
    },
  });

  // Run tests
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.test();
      if (result) {
        console.log(`✅ ${test.name}`);
        passed++;
      } else {
        console.log(`❌ ${test.name} - Test returned false`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data).substring(0, 100)}`);
      }
      failed++;
    }
  }

  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${Math.round((passed / tests.length) * 100)}%\n`);

  if (failed === 0) {
    console.log('🎉 All tests passed!\n');
    return true;
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.\n');
    return false;
  }
}

// Run tests
testAPI()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
