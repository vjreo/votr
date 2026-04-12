/**
 * Root jest.config.js — routes the IDE's Jest extension to the mobile workspace.
 * Backend tests use Vitest (ESM-native): `npm run test --workspace=backend`
 */
module.exports = {
  projects: ['<rootDir>/mobile/jest.config.js'],
};
