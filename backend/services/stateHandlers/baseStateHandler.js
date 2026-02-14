/**
 * Base State Handler
 * Abstract base class for state-specific handlers
 * Provides common functionality and defines interface
 */

import civicApi from '../civicApi.js';

export class BaseStateHandler {
  constructor(stateCode) {
    this.stateCode = stateCode.toUpperCase();
    this.stateName = this._getStateName(stateCode);
  }

  /**
   * Get state-specific election rules
   * @returns {Object} Election rules (early voting days, registration deadlines, etc.)
   */
  getElectionRules() {
    return {
      earlyVotingDays: null, // null means not available
      registrationDeadlineDays: 30, // Default 30 days before election
      mailInBallotDeadlineDays: null,
      sameDayRegistration: false,
      // Override in state-specific handlers
    };
  }

  /**
   * Get preferred data sources for this state
   * @returns {Object} Data source configuration
   */
  getDataSources() {
    return {
      primary: 'google_civic_api',
      fallback: null,
      // Override in state-specific handlers
    };
  }

  /**
   * Get office structure/hierarchy for this state
   * @returns {Object} Office structure configuration
   */
  getOfficeStructure() {
    return {
      federal: ['president', 'senate', 'house'],
      state: ['governor', 'lieutenant_governor', 'attorney_general', 'state_legislature'],
      local: ['mayor', 'city_council', 'school_board', 'county_commissioner'],
      // Override in state-specific handlers
    };
  }

  /**
   * Normalize district name/number for this state
   * @param {string} district - Raw district string
   * @returns {string} Normalized district
   */
  normalizeDistrict(district) {
    // Default: return as-is, override for state-specific normalization
    return district?.trim() || null;
  }

  /**
   * Determine office level from office name
   * @param {string} office - Office name
   * @returns {string} Office level ('federal', 'state', 'local')
   */
  determineOfficeLevel(office) {
    const officeLower = office.toLowerCase();
    
    // Federal offices
    if (officeLower.includes('president') || 
        officeLower.includes('senate') || 
        officeLower.includes('representative') ||
        officeLower.includes('congress')) {
      return 'federal';
    }
    
    // State offices
    if (officeLower.includes('governor') || 
        officeLower.includes('state') ||
        officeLower.includes('legislature')) {
      return 'state';
    }
    
    // Default to local
    return 'local';
  }

  /**
   * Get available voting methods for this state
   * @returns {Object} Voting methods configuration
   */
  getVotingMethods() {
    return {
      inPerson: true,
      earlyVoting: null, // null means check election rules
      mailIn: null,
      dropBox: null,
      // Override in state-specific handlers
    };
  }

  /**
   * Filter elections for this state (state-specific + federal)
   * @param {Array} elections - Elections from API
   * @returns {Array} Filtered elections
   */
  filterElections(elections) {
    if (!elections || !Array.isArray(elections)) return [];
    const stateLower = this.stateCode.toLowerCase();
    return elections.filter((e) => {
      if (!e.ocdDivisionId) return false;
      const ocd = e.ocdDivisionId.toLowerCase();
      return (
        ocd.includes(`state:${stateLower}`) ||
        ocd === 'ocd-division/country:us'
      );
    });
  }

  /**
   * Get state name from code
   * @private
   */
  _getStateName(code) {
    const stateNames = {
      'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
      'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
      'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
      'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
      'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
      'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
      'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
      'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
      'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
      'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
      'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
      'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
      'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
    };
    return stateNames[code.toUpperCase()] || code;
  }

  /**
   * Get civic API instance (shared across handlers)
   */
  getCivicApi() {
    return civicApi;
  }
}
