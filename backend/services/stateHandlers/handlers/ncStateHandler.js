/**
 * North Carolina State Handler
 * NC-specific election rules and data handling
 */

import { BaseStateHandler } from '../baseStateHandler.js';

export class NCStateHandler extends BaseStateHandler {
  constructor(stateCode = 'NC') {
    super(stateCode);
    // Ensure it's always NC
    if (this.stateCode !== 'NC') {
      console.warn(`NCStateHandler initialized with state ${this.stateCode}, but will use NC-specific logic`);
    }
  }

  /**
   * NC-specific election rules
   * NC has 17 days of early voting, 25-day registration deadline
   */
  getElectionRules() {
    return {
      earlyVotingDays: 17,
      registrationDeadlineDays: 25,
      mailInBallotDeadlineDays: null, // NC uses absentee ballots, not universal mail-in
      sameDayRegistration: false,
      earlyVotingStartDays: 17, // Starts 17 days before election
    };
  }

  /**
   * NC data sources
   */
  getDataSources() {
    return {
      primary: 'google_civic_api',
      fallback: null, // Could add NC Board of Elections API if available
    };
  }

  /**
   * NC office structure
   */
  getOfficeStructure() {
    return {
      federal: ['president', 'senate', 'house'],
      state: [
        'governor',
        'lieutenant_governor',
        'attorney_general',
        'secretary_of_state',
        'treasurer',
        'auditor',
        'commissioner_of_agriculture',
        'commissioner_of_insurance',
        'superintendent_of_public_instruction',
        'labor_commissioner',
        'state_senate',
        'state_house'
      ],
      local: ['mayor', 'city_council', 'school_board', 'county_commissioner', 'sheriff'],
    };
  }

  /**
   * NC voting methods
   */
  getVotingMethods() {
    return {
      inPerson: true,
      earlyVoting: true,
      mailIn: false, // NC uses "absentee" ballots, not universal mail-in
      dropBox: true,
    };
  }
}
