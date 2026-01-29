/**
 * Default State Handler
 * Fallback handler for states without specific implementations
 * Uses generic logic and Google Civic API
 */

import { BaseStateHandler } from '../baseStateHandler.js';

export class DefaultStateHandler extends BaseStateHandler {
  constructor(stateCode) {
    super(stateCode);
  }

  /**
   * Default election rules - can be overridden by config
   */
  getElectionRules() {
    return {
      earlyVotingDays: null, // Check per-election
      registrationDeadlineDays: 30,
      mailInBallotDeadlineDays: null,
      sameDayRegistration: false,
    };
  }

  /**
   * Default data sources - Google Civic API
   */
  getDataSources() {
    return {
      primary: 'google_civic_api',
      fallback: null,
    };
  }
}
