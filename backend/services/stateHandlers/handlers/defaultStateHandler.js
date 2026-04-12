/**
 * Default State Handler
 * Fallback handler for states without specific implementations
 * Uses generic logic and db_only adapter
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
   * Default data sources - db_only (elections from seed)
   */
  getDataSources() {
    return {
      primary: 'db_only',
      fallback: null,
    };
  }
}
