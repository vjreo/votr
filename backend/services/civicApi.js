import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_CIVIC_API_KEY = process.env.GOOGLE_CIVIC_API_KEY;
const BASE_URL = 'https://www.googleapis.com/civicinfo/v2';

/**
 * Google Civic Information API client
 * Documentation: https://developers.google.com/civic-information
 */
class CivicApiService {
  constructor() {
    this.apiKey = GOOGLE_CIVIC_API_KEY;
    if (!this.apiKey) {
      console.warn('Warning: GOOGLE_CIVIC_API_KEY not set');
    }
  }

  /**
   * Get representatives by address
   * @param {string} address - Full address or just city, state
   * @param {string[]} roles - Optional array of office roles to filter
   * @returns {Promise<Object>}
   */
  async getRepresentatives(address, roles = []) {
    try {
      const params = new URLSearchParams({
        address,
        key: this.apiKey,
      });

      if (roles.length > 0) {
        params.append('roles', roles.join(','));
      }

      const response = await axios.get(`${BASE_URL}/representatives?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching representatives:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get elections
   * @returns {Promise<Object>}
   */
  async getElections() {
    try {
      const response = await axios.get(`${BASE_URL}/elections?key=${this.apiKey}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching elections:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get voter info for an election
   * @param {string} address - Voter's address
   * @param {number} electionId - Election ID from getElections()
   * @returns {Promise<Object>}
   */
  async getVoterInfo(address, electionId) {
    try {
      const params = new URLSearchParams({
        address,
        electionId: electionId.toString(),
        key: this.apiKey,
      });

      const response = await axios.get(`${BASE_URL}/voterinfo?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching voter info:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get candidates for a specific election
   * @param {string} address - Voter's address
   * @param {number} electionId - Election ID
   * @returns {Promise<Array>} Array of candidates
   */
  async getCandidatesForElection(address, electionId) {
    try {
      const voterInfo = await this.getVoterInfo(address, electionId);
      const candidates = [];

      if (voterInfo.contests) {
        for (const contest of voterInfo.contests) {
          if (contest.candidates) {
            for (const candidate of contest.candidates) {
              candidates.push({
                name: candidate.name,
                party: candidate.party,
                photoUrl: candidate.photoUrl,
                email: candidate.email,
                phone: candidate.phone,
                website: candidate.candidateUrl,
                office: contest.office,
                district: contest.district?.name,
                level: this._determineOfficeLevel(contest.office),
              });
            }
          }
        }
      }

      return candidates;
    } catch (error) {
      console.error('Error fetching candidates:', error);
      throw error;
    }
  }

  /**
   * Determine office level from office name
   * @private
   */
  _determineOfficeLevel(office) {
    const officeLower = office.toLowerCase();
    if (officeLower.includes('president') || 
        officeLower.includes('senate') || 
        officeLower.includes('representative') ||
        officeLower.includes('congress')) {
      return 'federal';
    }
    if (officeLower.includes('governor') || 
        officeLower.includes('state') ||
        officeLower.includes('legislature')) {
      return 'state';
    }
    return 'local';
  }

  /**
   * Normalize address for API calls
   * @param {string} address - Raw address
   * @returns {string} Normalized address
   */
  normalizeAddress(address) {
    // Basic normalization - can be enhanced
    return address.trim();
  }
}

export default new CivicApiService();

