/**
 * Google Civic API Adapter
 * Adapter for Google Civic Information API
 * Normalizes API responses to consistent format
 */

import civicApi from '../../services/civicApi.js';

export class GoogleCivicAdapter {
  /**
   * Get elections
   * @returns {Promise<Array>} Array of normalized elections
   */
  async getElections() {
    try {
      const response = await civicApi.getElections();
      const elections = response.elections || [];
      
      return elections.map(election => this._normalizeElection(election));
    } catch (error) {
      console.error('Error fetching elections from Google Civic API:', error);
      throw error;
    }
  }

  /**
   * Get candidates for an election
   * @param {string} address - Voter's address
   * @param {string|number} electionId - Election ID
   * @returns {Promise<Array>} Array of normalized candidates
   */
  async getCandidatesForElection(address, electionId) {
    try {
      const candidates = await civicApi.getCandidatesForElection(address, electionId);
      return candidates.map(candidate => this._normalizeCandidate(candidate));
    } catch (error) {
      console.error('Error fetching candidates from Google Civic API:', error);
      throw error;
    }
  }

  /**
   * Get voter info for an election
   * @param {string} address - Voter's address
   * @param {string|number} electionId - Election ID
   * @returns {Promise<Object>} Normalized voter info
   */
  async getVoterInfo(address, electionId) {
    try {
      const voterInfo = await civicApi.getVoterInfo(address, electionId);
      return this._normalizeVoterInfo(voterInfo);
    } catch (error) {
      console.error('Error fetching voter info from Google Civic API:', error);
      throw error;
    }
  }

  /**
   * Normalize election data
   * @private
   */
  _normalizeElection(election) {
    return {
      id: election.id,
      name: election.name,
      electionDay: election.electionDay,
      ocdDivisionId: election.ocdDivisionId,
      // Extract state from OCD division ID
      state: this._extractStateFromOcdId(election.ocdDivisionId),
    };
  }

  /**
   * Normalize candidate data
   * @private
   */
  _normalizeCandidate(candidate) {
    return {
      name: candidate.name,
      party: candidate.party,
      photoUrl: candidate.photoUrl,
      email: candidate.email,
      phone: candidate.phone,
      website: candidate.website || candidate.candidateUrl,
      office: candidate.office,
      district: candidate.district,
      level: candidate.level,
    };
  }

  /**
   * Normalize voter info
   * @private
   */
  _normalizeVoterInfo(voterInfo) {
    return {
      election: voterInfo.election,
      contests: voterInfo.contests || [],
      pollingLocations: voterInfo.pollingLocations || [],
      earlyVoteSites: voterInfo.earlyVoteSites || [],
      dropOffLocations: voterInfo.dropOffLocations || [],
    };
  }

  /**
   * Extract state code from OCD division ID
   * @private
   */
  _extractStateFromOcdId(ocdId) {
    if (!ocdId) return null;
    
    // OCD IDs format: ocd-division/country:us/state:nc
    const match = ocdId.match(/state:([a-z]{2})/i);
    return match ? match[1].toUpperCase() : null;
  }

  /**
   * Get source type identifier
   */
  getSourceType() {
    return 'google_civic_api';
  }
}
