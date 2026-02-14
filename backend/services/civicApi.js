import axios from 'axios';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

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
      logger.warn('Warning: GOOGLE_CIVIC_API_KEY not set');
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
      logger.error('Error fetching representatives:', error.response?.data || error.message);
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
      throw error;
    }
  }

  /**
   * Get voter info without specifying election (returns ballot for primary/next election)
   * @param {string} address - Voter's address
   * @returns {Promise<Object>}
   */
  async getVoterInfoByAddress(address) {
    try {
      const params = new URLSearchParams({
        address,
        key: this.apiKey,
      });

      const response = await axios.get(`${BASE_URL}/voterinfo?${params}`);
      return response.data;
    } catch (error) {
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
   * Get current representatives/officials by address (no election needed)
   * Maps to candidate-like format for display
   * @param {string} address - Voter's address
   * @returns {Promise<Array>} Array of officials as candidates
   */
  async getRepresentativesAsCandidates(address) {
    try {
      const data = await this.getRepresentatives(address);
      const candidates = [];
      const offices = data.offices || [];
      const officials = data.officials || [];

      for (const office of offices) {
        const officeName = office.name;
        const level = this._determineOfficeLevel(officeName);

        for (const idx of office.officialIndices || []) {
          const official = officials[idx];
          if (!official) continue;

          candidates.push({
            name: official.name || 'Unknown',
            party: official.party || 'Unknown',
            photoUrl: official.photoUrl || null,
            email: official.emails?.[0],
            phone: official.phones?.[0],
            website: official.urls?.[0],
            office: officeName,
            district: office.divisionId?.match(/district:(.+)/)?.[1] || null,
            level,
          });
        }
      }

      return candidates;
    } catch (error) {
      logger.error('getRepresentativesAsCandidates failed:', error.message);
      throw error;
    }
  }

  /**
   * Extract candidates from voterinfo response (contests)
   * @param {Object} voterInfo - Response from getVoterInfo or getVoterInfoByAddress
   * @returns {Array}
   */
  extractCandidatesFromVoterInfo(voterInfo) {
    const candidates = [];
    if (!voterInfo?.contests) return candidates;

    for (const contest of voterInfo.contests) {
      if (contest.candidates) {
        for (const c of contest.candidates) {
          candidates.push({
            name: c.name,
            party: c.party || '',
            photoUrl: c.photoUrl,
            email: c.email,
            phone: c.phone,
            website: c.candidateUrl,
            office: contest.office,
            district: contest.district?.name,
            level: this._determineOfficeLevel(contest.office),
          });
        }
      }
    }
    return candidates;
  }

  /**
   * Normalize address for Civic API (improves match rate)
   * @param {string} address - Raw address
   * @returns {string} Normalized address
   */
  normalizeAddress(address) {
    if (!address) return '';
    return address
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\b(St|Dr|Ave|Blvd|Rd|Ln|Ct|Pl)\./gi, '$1'); // Remove periods from common abbreviations
  }
}

export default new CivicApiService();

