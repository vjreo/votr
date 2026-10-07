/**
 * North Carolina / Mecklenburg County Candidate Data
 * Curated candidates for 2026 NC General Election (Nov 3, 2026)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * UNBIASED PRINCIPLE: This file contains factual candidate data only.
 * - NO endorsements or recommendations
 * - Positions described using candidates' own framing where possible
 * - Neutral language — avoid loaded terms like "extreme," "radical," "best"
 * - Primary sources preferred (official websites, government records)
 * - When adding new candidates, cite where the data came from
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * SCOPE: Mecklenburg County / Charlotte area voters
 * - U.S. Senate (Tillis seat up in 2026)
 * - U.S. House (NC-12 Mecklenburg-area seat)
 * - NC State Legislature (state senate/house — populated via Open States)
 * - Local: Mecklenburg County Commissioners (2026 ballot)
 *
 * NOTE: Position stances are summarized from public statements and campaign materials.
 * Always verify with official campaign sources. This is seed data for dogfooding.
 *
 * TODO (agent-layer seam): Replace curated seed with automated candidate ingest
 * once a reliable Mecklenburg ballot data source is wired up.
 */

export const NC_CANDIDATES = {
  /**
   * 2026 U.S. Senate Race (Class 2 — Tillis seat)
   * Thom Tillis is up for re-election in 2026.
   * Challengers TBD as of this seed; add candidates as they file.
   */
  senate: [
    {
      id: 'nc-sen-tillis-2026',
      name: 'Thom Tillis',
      party: 'Republican Party',
      office: 'U.S. Senate',
      officeLevel: 'federal',
      currentPosition: 'U.S. Senator (incumbent)',
      photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Thom_Tillis_official_photo.jpg/440px-Thom_Tillis_official_photo.jpg',
      religion: 'Catholic',
      previousProfession: 'Business Executive',
      website: 'https://tillis.senate.gov',
      bio: 'Thom Tillis has served as U.S. Senator from North Carolina since 2015. He previously served as Speaker of the NC House of Representatives from 2011-2014. First elected in 2014 and re-elected in 2020, his seat is up again in 2026.',
      positions: [
        { issueName: 'Healthcare', issueId: 'healthcare', stance: 'Favors market-based healthcare reform; has voted against ACA provisions while supporting state flexibility measures', sourceUrl: 'https://tillis.senate.gov' },
        { issueName: 'Economy', issueId: 'economy', stance: 'Advocates for lower taxes and reduced federal regulation; supported 2017 Tax Cuts and Jobs Act', sourceUrl: 'https://tillis.senate.gov' },
        { issueName: 'Immigration', issueId: 'immigration', stance: 'Supports increased border security funding; co-sponsored bipartisan immigration legislation', sourceUrl: 'https://tillis.senate.gov' },
        { issueName: 'Environment', issueId: 'environment', stance: 'Favors technology and innovation approaches to environmental issues over regulatory mandates', sourceUrl: 'https://tillis.senate.gov' },
      ],
      career: [
        { title: 'U.S. Senator', period: '2015 - Present', description: 'Senior Senator from North Carolina' },
        { title: 'NC House Speaker', period: '2011 - 2014', description: 'Led Republican majority in state house' },
      ],
    },
    // Placeholder for Democratic challenger — update when candidate files
    {
      id: 'nc-sen-dem-tbd-2026',
      name: 'Democratic Challenger (TBD)',
      party: 'Democratic Party',
      office: 'U.S. Senate',
      officeLevel: 'federal',
      currentPosition: 'Candidate',
      photo: null,
      bio: 'Democratic candidate for U.S. Senate has not yet been determined. Update this entry once the primary concludes or a frontrunner emerges.',
      positions: [],
      career: [],
    },
  ],

  /**
   * 2026 U.S. House — NC-12 (Mecklenburg County area)
   * Alma Adams represents NC-12 (as of 2023 redistricting).
   * Add challengers as they file.
   */
  house: [
    {
      id: 'nc-house-adams-2026',
      name: 'Alma Adams',
      party: 'Democratic Party',
      office: 'U.S. House of Representatives (NC-12)',
      officeLevel: 'federal',
      currentPosition: 'U.S. Representative (incumbent)',
      photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Alma_Adams_116th_Congress.jpg/440px-Alma_Adams_116th_Congress.jpg',
      website: 'https://adams.house.gov',
      bio: 'Alma Adams has represented the Charlotte-centered NC-12 district since 2014. She is known for her advocacy on education, housing, and minority business issues. A former NC House member and college professor.',
      positions: [
        { issueName: 'Education', issueId: 'education', stance: 'Advocates for increased HBCU funding, public school investment, and student debt relief programs', sourceUrl: 'https://adams.house.gov' },
        { issueName: 'Healthcare', issueId: 'healthcare', stance: 'Supports expanding ACA coverage and legislation to lower prescription drug prices', sourceUrl: 'https://adams.house.gov' },
        { issueName: 'Housing', issueId: 'housing', stance: 'Sponsors affordable housing legislation and policies to prevent displacement in gentrifying areas', sourceUrl: 'https://adams.house.gov' },
        { issueName: 'Economy', issueId: 'economy', stance: 'Focuses on support for minority-owned businesses and workforce development programs', sourceUrl: 'https://adams.house.gov' },
      ],
      career: [
        { title: 'U.S. Representative (NC-12)', period: '2014 - Present', description: 'Elected via special election; re-elected multiple times' },
        { title: 'NC House of Representatives', period: '1994 - 2014', description: 'Represented Guilford County' },
      ],
    },
  ],

  /**
   * NC Governor — Josh Stein elected in 2024, not up until 2028
   * Included for reference / voter context only.
   */
  governor: [
    {
      id: 'nc-gov-stein-incumbent',
      name: 'Josh Stein',
      party: 'Democratic Party',
      office: 'Governor of North Carolina',
      officeLevel: 'state',
      currentPosition: 'Governor (incumbent, not on 2026 ballot)',
      photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Josh_Stein_official_photo.jpg/440px-Josh_Stein_official_photo.jpg',
      website: 'https://governor.nc.gov',
      bio: 'Josh Stein was elected Governor of North Carolina in 2024 after serving as Attorney General. His term runs through 2028. Not on the 2026 ballot.',
      positions: [
        { issueName: 'Healthcare', issueId: 'healthcare', stance: 'Expanded Medicaid as Governor; advocates for lowering prescription drug costs', sourceUrl: 'https://governor.nc.gov' },
        { issueName: 'Education', issueId: 'education', stance: 'Proposes increased public school funding and teacher compensation', sourceUrl: 'https://governor.nc.gov' },
        { issueName: 'Environment', issueId: 'environment', stance: 'Supports clean energy investment and offshore wind development for NC coast', sourceUrl: 'https://governor.nc.gov' },
      ],
      career: [
        { title: 'Governor of North Carolina', period: '2025 - Present', description: 'Elected in 2024' },
        { title: 'NC Attorney General', period: '2017 - 2024', description: 'State\'s top law enforcement officer' },
      ],
    },
  ],

  /**
   * State Legislature — NC Senate & House
   * Populated dynamically from Open States API based on user address.
   * All 170 seats are up in 2026 (50 Senate, 120 House).
   */
  stateLegislature: [],

  /**
   * Local — Charlotte / Mecklenburg
   * Charlotte municipal elections are ODD years (2025, 2027), so not on 2026 ballot.
   * Mecklenburg County Commissioners ARE on 2026 ballot (even years).
   * TODO: Add Mecklenburg County Commissioner candidates when they file.
   */
  local: [
    {
      id: 'nc-meck-commissioner-placeholder',
      name: 'Mecklenburg County Board of Commissioners',
      party: 'Multiple',
      office: 'Mecklenburg County Board of Commissioners',
      officeLevel: 'local',
      currentPosition: 'Seats up for election in 2026',
      photo: null,
      bio: 'Mecklenburg County is governed by a 9-member Board of Commissioners elected in partisan races. Several seats are up in 2026. Add specific candidates once filing period closes.',
      positions: [],
      career: [],
    },
  ],

  /**
   * School Board — Charlotte-Mecklenburg Schools (CMS)
   * CMS Board elections are nonpartisan and held in ODD years, so not on 2026 ballot.
   */
  schoolBoard: [],
};

/**
 * Election dates and info for NC — 2026 Midterms Focus
 * Mecklenburg County / Charlotte area voters
 */
export const NC_ELECTIONS = {
  general2026: {
    id: 'nc-general-2026',
    name: '2026 NC General Election',
    date: '2026-11-03',
    type: 'general',
    state: 'NC',
    registrationDeadline: '2026-10-09',
    earlyVotingStart: '2026-10-15',
    earlyVotingEnd: '2026-10-31',
    offices: [
      'U.S. Senate (Tillis seat)',
      'U.S. House of Representatives',
      'NC State Senate (all 50 seats)',
      'NC House of Representatives (all 120 seats)',
      'NC Supreme Court',
      'NC Court of Appeals',
      'Mecklenburg County Commissioners',
    ],
  },
  primary2026: {
    id: 'nc-primary-2026',
    name: '2026 NC Primary Election',
    date: '2026-03-03',
    type: 'primary',
    state: 'NC',
    registrationDeadline: '2026-02-06',
    earlyVotingStart: '2026-02-12',
    earlyVotingEnd: '2026-02-28',
    offices: [
      'U.S. Senate',
      'U.S. House of Representatives',
      'NC State Senate',
      'NC House of Representatives',
      'Judicial races',
    ],
  },
};

// Helper to get all NC candidates as flat array
export const getAllNCCandidates = () => {
  return [
    ...NC_CANDIDATES.senate,
    ...(NC_CANDIDATES.house || []),
    ...NC_CANDIDATES.governor,
    ...NC_CANDIDATES.stateLegislature,
    ...NC_CANDIDATES.local,
    ...NC_CANDIDATES.schoolBoard,
  ];
};

// Helper to get candidates by office level
export const getNCCandidatesByLevel = (level) => {
  switch (level) {
    case 'federal':
      return [...NC_CANDIDATES.senate, ...(NC_CANDIDATES.house || [])];
    case 'state':
      return NC_CANDIDATES.governor;
    case 'state_legislature':
      return NC_CANDIDATES.stateLegislature;
    case 'local':
      return [...NC_CANDIDATES.local, ...NC_CANDIDATES.schoolBoard];
    default:
      return getAllNCCandidates();
  }
};

// Helper to find candidate by ID
export const findNCCandidateById = (id) => {
  return getAllNCCandidates().find((c) => c.id === id);
};

// Helper to get the target election for dogfooding
export const getTargetElection = () => NC_ELECTIONS.general2026;

export default NC_CANDIDATES;
