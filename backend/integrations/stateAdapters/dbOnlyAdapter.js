/**
 * DB-Only Adapter
 * Returns empty elections - elections come from DB seed only.
 * Replaces deprecated Google Civic API.
 */

export class DbOnlyAdapter {
  async getElections() {
    return [];
  }

  async getCandidatesForElection() {
    return [];
  }

  async getVoterInfo() {
    return { contests: [], pollingLocations: [], earlyVoteSites: [] };
  }

  getSourceType() {
    return 'db_only';
  }
}
