/**
 * Mecklenburg County / Charlotte NC — Nov 3, 2026 General Election
 * Static data bundled for web app - no backend required
 *
 * OFFICIAL SOURCES:
 * - Candidates: https://vt.ncsbe.gov/reglkup/ (NCSBE Voter Search)
 * - Referendums: https://s3.amazonaws.com/dl.ncsbe.gov/Elections/2026/Candidate%20Filing/statewide_referendums_20261103.pdf
 * - County referendums: https://s3.amazonaws.com/dl.ncsbe.gov/Elections/2026/Candidate%20Filing/referendums_20261103.pdf
 * - Campaign positions: WFAE (https://www.wfae.org/elections), official campaign websites
 *
 * Last verified: October 7, 2026
 * Data status: Production-ready for Nov 3, 2026 General Election
 */

export interface Position {
  issueName: string;
  issueId: string;
  stance: string;
  source?: string;
}

export interface Source {
  url: string;
  source_type: string;
  title: string;
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  office: string;
  officeLevel: 'federal' | 'state' | 'state_legislature' | 'local';
  district: string | null;
  bio?: string;
  positions: Position[];
  sources: Source[];
  dataStatus: 'complete' | 'incomplete';
  dataStatusNote?: string;
  unopposed?: boolean;
}

export interface BallotMeasure {
  id: string;
  type: 'amendment' | 'bond';
  title: string;
  shortTitle: string;
  ballotQuestion: string;
  explanation?: string;
  principal?: number;
  estimatedTaxImpact?: string;
  choices: string[];
  city?: string;
  sources: Source[];
}

export interface ElectionDeadline {
  name: string;
  date: string;
  critical: boolean;
}

export const ELECTION = {
  id: 'nc-general-2026',
  name: '2026 General Election',
  date: '2026-11-03',
  description: 'U.S. Senate, U.S. House, state courts, state legislature, county offices, and ballot measures',
};

export const DEADLINES: ElectionDeadline[] = [
  { name: 'Voter Registration', date: '2026-10-09', critical: true },
  { name: 'Early Voting Begins', date: '2026-10-15', critical: false },
  { name: 'Absentee Request Deadline', date: '2026-10-20', critical: true },
  { name: 'Early Voting Ends', date: '2026-10-31', critical: false },
  { name: 'Election Day', date: '2026-11-03', critical: true },
];

export const NC_VOTER_SEARCH_URL = 'https://vt.ncsbe.gov/reglkup/';

// Official source URLs for data verification
export const OFFICIAL_SOURCES = {
  ncVoterSearch: 'https://vt.ncsbe.gov/reglkup/',
  ncsbeSite: 'https://www.ncsbe.gov/',
  stateReferendums: 'https://s3.amazonaws.com/dl.ncsbe.gov/Elections/2026/Candidate%20Filing/statewide_referendums_20261103.pdf',
  countyReferendums: 'https://s3.amazonaws.com/dl.ncsbe.gov/Elections/2026/Candidate%20Filing/referendums_20261103.pdf',
  meckBoe: 'https://www.mecknc.gov/boe',
};

// Data provenance - for transparency
export const DATA_PROVENANCE = {
  lastVerified: '2026-10-07',
  sources: [
    'NC State Board of Elections (NCSBE)',
    'Mecklenburg County Board of Elections',
    'WFAE candidate interviews',
    'Official campaign websites',
  ],
};

// === CANDIDATES ===

export const US_SENATE: Candidate[] = [
  {
    id: 'nc-sen-cooper-2026',
    name: 'Roy Cooper',
    party: 'Democratic',
    office: 'U.S. Senate',
    officeLevel: 'federal',
    district: null,
    bio: 'Former NC Governor (2017-2025). Won Democratic primary with ~92% of the vote.',
    positions: [
      {
        issueName: 'Cost of Living',
        issueId: 'economy',
        stance: 'Campaign theme "Make Stuff Cost Less": lower costs for groceries, healthcare, energy, childcare, and housing.',
        source: 'https://roycooper.com/make-stuff-cost-less/',
      },
      {
        issueName: 'Healthcare',
        issueId: 'healthcare',
        stance: 'Cites Medicaid expansion as governor; supports lowering healthcare costs.',
        source: 'https://roycooper.com/make-stuff-cost-less/',
      },
    ],
    sources: [{ url: 'https://roycooper.com/make-stuff-cost-less/', source_type: 'official_website', title: 'Campaign Issues' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-sen-whatley-2026',
    name: 'Michael Whatley',
    party: 'Republican',
    office: 'U.S. Senate',
    officeLevel: 'federal',
    district: null,
    bio: 'Former RNC chair and NC GOP chair. Won Republican primary with ~65% of the vote.',
    positions: [
      {
        issueName: 'Public Safety',
        issueId: 'criminal_justice',
        stance: '"Make North Carolina Safe Again" — criticizes Cooper on crime/pretrial policy.',
        source: 'https://michaelwhatley.com/issues/',
      },
      {
        issueName: 'Immigration',
        issueId: 'immigration',
        stance: 'Fight illegal immigration, support ICE cooperation.',
        source: 'https://michaelwhatley.com/issues/',
      },
      {
        issueName: 'Economy',
        issueId: 'economy',
        stance: 'America First economy & energy policy.',
        source: 'https://michaelwhatley.com/issues/',
      },
    ],
    sources: [{ url: 'https://michaelwhatley.com/issues/', source_type: 'official_website', title: 'Campaign Issues' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-sen-bray-2026',
    name: 'Shannon W. Bray',
    party: 'Libertarian',
    office: 'U.S. Senate',
    officeLevel: 'federal',
    district: null,
    bio: 'Navy veteran with cybersecurity background.',
    positions: [
      { issueName: 'Government', issueId: 'government', stance: 'Limited enumerated federal powers; privacy/cybersecurity focus.' },
      { issueName: 'Fiscal Policy', issueId: 'economy', stance: 'Fiscal restraint & debt reduction.' },
    ],
    sources: [{ url: 'https://www.shannonbray.us/', source_type: 'official_website', title: 'Campaign Site' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-sen-dublin-2026',
    name: 'Michael Dublin',
    party: 'Green',
    office: 'U.S. Senate',
    officeLevel: 'federal',
    district: null,
    bio: 'Green Party candidate. Filed June 2026.',
    positions: [],
    sources: [],
    dataStatus: 'incomplete',
    dataStatusNote: 'Campaign positions not available from verified source.',
  },
];

export const US_HOUSE_NC12: Candidate[] = [
  {
    id: 'nc-house-12-adams-2026',
    name: 'Alma S. Adams',
    party: 'Democratic',
    office: 'U.S. House NC-12',
    officeLevel: 'federal',
    district: 'NC-12',
    bio: 'Incumbent U.S. Representative since 2014. Former NC House member, teacher.',
    positions: [
      { issueName: 'Housing', issueId: 'housing', stance: 'Champion of affordable housing, part of "4Hs" platform.' },
      { issueName: 'Healthcare', issueId: 'healthcare', stance: 'Focus on Black maternal health as part of "4Hs" platform.' },
      { issueName: 'Hunger', issueId: 'economy', stance: 'Fighting hunger and food insecurity.' },
      { issueName: 'Higher Education', issueId: 'education', stance: 'Supporting HBCUs and higher education access.' },
    ],
    sources: [{ url: 'https://www.wfae.org/2026-09-22/u-s-house-of-representatives-nc-12-candidates', source_type: 'news_article', title: 'WFAE NC-12 Candidates' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-house-12-codiga-2026',
    name: 'Jack Codiga',
    party: 'Republican',
    office: 'U.S. House NC-12',
    officeLevel: 'federal',
    district: 'NC-12',
    bio: 'Challenger, age ~28, finance/mortgage industry background. Moved to Charlotte 2021.',
    positions: [
      { issueName: 'Housing', issueId: 'housing', stance: 'Addresses housing affordability.' },
      { issueName: 'Economy', issueId: 'economy', stance: 'Free markets; end welfare including Social Security reform; sound money advocacy.' },
    ],
    sources: [{ url: 'https://www.wfae.org/2026-09-22/u-s-house-of-representatives-nc-12-candidates', source_type: 'news_article', title: 'WFAE NC-12 Candidates' }],
    dataStatus: 'complete',
  },
];

export const US_HOUSE_NC14: Candidate[] = [
  {
    id: 'nc-house-14-moore-2026',
    name: 'Tim Moore',
    party: 'Republican',
    office: 'U.S. House NC-14',
    officeLevel: 'federal',
    district: 'NC-14',
    bio: 'Incumbent U.S. Representative, former NC House Speaker. From Kings Mountain.',
    positions: [
      { issueName: 'Immigration', issueId: 'immigration', stance: 'Opposed sanctuary cities.' },
      { issueName: 'Elections', issueId: 'civil_rights', stance: 'Supports voter ID.' },
      { issueName: 'Economy', issueId: 'economy', stance: 'Tax cuts; serves on Financial Services & Budget committees.' },
    ],
    sources: [{ url: 'https://www.wfae.org/text/2026-09-22/u-s-house-of-representatives-nc-14-candidates', source_type: 'news_article', title: 'WFAE NC-14 Candidates' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-house-14-womack-2026',
    name: 'Lakesha Womack',
    party: 'Democratic',
    office: 'U.S. House NC-14',
    officeLevel: 'federal',
    district: 'NC-14',
    bio: 'Challenger, CDFI strategy officer with Vanderbilt degrees.',
    positions: [
      { issueName: 'Healthcare', issueId: 'healthcare', stance: 'Affordable healthcare access.' },
      { issueName: 'Economy', issueId: 'economy', stance: 'Economic mobility — childcare, workforce, small business support. Corporate tax share.' },
      { issueName: 'Education', issueId: 'education', stance: 'Public schools and affordable higher education.' },
      { issueName: 'Housing', issueId: 'housing', stance: 'Limits on corporations buying affordable housing.' },
    ],
    sources: [{ url: 'https://www.wfae.org/text/2026-09-22/u-s-house-of-representatives-nc-14-candidates', source_type: 'news_article', title: 'WFAE NC-14 Candidates' }],
    dataStatus: 'complete',
  },
];

export const US_HOUSE_NC8: Candidate[] = [
  {
    id: 'nc-house-8-harris-2026',
    name: 'Mark Harris',
    party: 'Republican',
    office: 'U.S. House NC-8',
    officeLevel: 'federal',
    district: 'NC-8',
    bio: 'Incumbent U.S. Representative.',
    positions: [],
    sources: [{ url: 'https://www.wfae.org/2026-09-22/u-s-house-of-representatives-nc-8-candidates', source_type: 'news_article', title: 'WFAE NC-8 Candidates' }],
    dataStatus: 'incomplete',
    dataStatusNote: 'Positions not fully extracted from source.',
  },
  {
    id: 'nc-house-8-watson-2026',
    name: 'Colby Watson',
    party: 'Democratic',
    office: 'U.S. House NC-8',
    officeLevel: 'federal',
    district: 'NC-8',
    bio: 'Democratic challenger.',
    positions: [],
    sources: [{ url: 'https://www.wfae.org/2026-09-22/u-s-house-of-representatives-nc-8-candidates', source_type: 'news_article', title: 'WFAE NC-8 Candidates' }],
    dataStatus: 'incomplete',
  },
  {
    id: 'nc-house-8-whitehead-2026',
    name: 'Bo Whitehead',
    party: 'Green',
    office: 'U.S. House NC-8',
    officeLevel: 'federal',
    district: 'NC-8',
    bio: 'Green Party candidate.',
    positions: [],
    sources: [],
    dataStatus: 'incomplete',
  },
];

export const NC_SUPREME_COURT: Candidate[] = [
  {
    id: 'nc-supreme-01-earls-2026',
    name: 'Anita Earls',
    party: 'Democratic',
    office: 'NC Supreme Court Seat 01',
    officeLevel: 'state',
    district: null,
    positions: [],
    sources: [],
    dataStatus: 'incomplete',
  },
  {
    id: 'nc-supreme-01-stevens-2026',
    name: 'Sarah Stevens',
    party: 'Republican',
    office: 'NC Supreme Court Seat 01',
    officeLevel: 'state',
    district: null,
    positions: [],
    sources: [],
    dataStatus: 'incomplete',
  },
];

export const NC_COURT_OF_APPEALS: Candidate[] = [
  { id: 'nc-appeals-01-arrowood-2026', name: 'John S. Arrowood', party: 'Democratic', office: 'NC Court of Appeals Seat 01', officeLevel: 'state', district: null, positions: [], sources: [], dataStatus: 'incomplete' },
  { id: 'nc-appeals-01-byrne-2026', name: 'Michael C. Byrne', party: 'Republican', office: 'NC Court of Appeals Seat 01', officeLevel: 'state', district: null, positions: [], sources: [], dataStatus: 'incomplete' },
  { id: 'nc-appeals-02-hampson-2026', name: 'Tobias Hampson', party: 'Democratic', office: 'NC Court of Appeals Seat 02', officeLevel: 'state', district: null, positions: [], sources: [], dataStatus: 'incomplete' },
  { id: 'nc-appeals-02-bell-2026', name: 'George Cooper Bell', party: 'Republican', office: 'NC Court of Appeals Seat 02', officeLevel: 'state', district: null, positions: [], sources: [], dataStatus: 'incomplete' },
  { id: 'nc-appeals-03-walczyk-2026', name: 'Christine Marie Walczyk', party: 'Democratic', office: 'NC Court of Appeals Seat 03', officeLevel: 'state', district: null, positions: [], sources: [], dataStatus: 'incomplete' },
  { id: 'nc-appeals-03-collins-2026', name: 'Craig Collins', party: 'Republican', office: 'NC Court of Appeals Seat 03', officeLevel: 'state', district: null, positions: [], sources: [], dataStatus: 'incomplete' },
];

export const STATE_LEGISLATURE: Candidate[] = [
  // State Senate
  { id: 'nc-sen-37-angel-2026', name: 'Raygan J. Angel', party: 'Democratic', office: 'NC Senate District 37', officeLevel: 'state_legislature', district: '37', positions: [], sources: [], dataStatus: 'incomplete' },
  { id: 'nc-sen-37-sawyer-2026', name: 'Vickie Sawyer', party: 'Republican', office: 'NC Senate District 37', officeLevel: 'state_legislature', district: '37', positions: [], sources: [], dataStatus: 'incomplete' },
  { id: 'nc-sen-38-mohammed-2026', name: 'Mujtaba A. Mohammed', party: 'Democratic', office: 'NC Senate District 38', officeLevel: 'state_legislature', district: '38', positions: [], sources: [], dataStatus: 'incomplete', unopposed: true },
  { id: 'nc-sen-39-salvador-2026', name: 'DeAndrea Salvador', party: 'Democratic', office: 'NC Senate District 39', officeLevel: 'state_legislature', district: '39', positions: [], sources: [], dataStatus: 'incomplete', unopposed: true },
  { id: 'nc-sen-40-waddell-2026', name: 'Joyce Waddell', party: 'Democratic', office: 'NC Senate District 40', officeLevel: 'state_legislature', district: '40', positions: [], sources: [], dataStatus: 'incomplete' },
  { id: 'nc-sen-40-shields-2026', name: 'Bobbie Shields', party: 'Republican', office: 'NC Senate District 40', officeLevel: 'state_legislature', district: '40', positions: [], sources: [], dataStatus: 'incomplete' },
  { id: 'nc-sen-41-theodros-2026', name: 'Caleb Theodros', party: 'Democratic', office: 'NC Senate District 41', officeLevel: 'state_legislature', district: '41', positions: [], sources: [], dataStatus: 'incomplete' },
  { id: 'nc-sen-41-gray-2026', name: 'Kevin Gray', party: 'Republican', office: 'NC Senate District 41', officeLevel: 'state_legislature', district: '41', positions: [], sources: [], dataStatus: 'incomplete' },
  { id: 'nc-sen-42-bradley-2026', name: 'Mrs. Woodson Bradley', party: 'Democratic', office: 'NC Senate District 42', officeLevel: 'state_legislature', district: '42', positions: [], sources: [], dataStatus: 'incomplete' },
  { id: 'nc-sen-42-mcginn-2026', name: 'Stacie McGinn', party: 'Republican', office: 'NC Senate District 42', officeLevel: 'state_legislature', district: '42', positions: [], sources: [], dataStatus: 'incomplete' },
  // State House
  { id: 'nc-house-88-belk-2026', name: 'Mary Belk', party: 'Democratic', office: 'NC House District 88', officeLevel: 'state_legislature', district: '88', positions: [], sources: [], dataStatus: 'incomplete' },
  { id: 'nc-house-88-craig-2026', name: 'Ray Craig', party: 'Republican', office: 'NC House District 88', officeLevel: 'state_legislature', district: '88', positions: [], sources: [], dataStatus: 'incomplete' },
  { id: 'nc-house-98-helfrich-2026', name: 'Beth Helfrich', party: 'Democratic', office: 'NC House District 98', officeLevel: 'state_legislature', district: '98', positions: [], sources: [], dataStatus: 'incomplete' },
  { id: 'nc-house-98-rhodes-2026', name: 'John Rhodes', party: 'Republican', office: 'NC House District 98', officeLevel: 'state_legislature', district: '98', positions: [], sources: [], dataStatus: 'incomplete' },
  { id: 'nc-house-104-lofton-2026', name: 'Brandon Lofton', party: 'Democratic', office: 'NC House District 104', officeLevel: 'state_legislature', district: '104', positions: [], sources: [], dataStatus: 'incomplete' },
  { id: 'nc-house-104-boyd-2026', name: 'Trina Boyd', party: 'Republican', office: 'NC House District 104', officeLevel: 'state_legislature', district: '104', positions: [], sources: [], dataStatus: 'incomplete' },
  { id: 'nc-house-105-mccool-2026', name: 'Ken McCool', party: 'Democratic', office: 'NC House District 105', officeLevel: 'state_legislature', district: '105', positions: [], sources: [], dataStatus: 'incomplete' },
  { id: 'nc-house-105-cotham-2026', name: 'Tricia Ann Cotham', party: 'Republican', office: 'NC House District 105', officeLevel: 'state_legislature', district: '105', positions: [], sources: [], dataStatus: 'incomplete' },
];

export const LOCAL_RACES: Candidate[] = [
  { id: 'meck-commission-atlarge-altman-2026', name: 'Leigh Altman', party: 'Democratic', office: 'Mecklenburg Commissioners At-Large', officeLevel: 'local', district: 'At-Large', positions: [], sources: [], dataStatus: 'incomplete' },
  { id: 'meck-commission-atlarge-townsend-2026', name: 'Yvette Townsend-Ingram', party: 'Democratic', office: 'Mecklenburg Commissioners At-Large', officeLevel: 'local', district: 'At-Large', positions: [], sources: [], dataStatus: 'incomplete' },
  { id: 'meck-commission-atlarge-griffin-2026', name: 'Arthur Griffin, Jr.', party: 'Democratic', office: 'Mecklenburg Commissioners At-Large', officeLevel: 'local', district: 'At-Large', positions: [], sources: [], dataStatus: 'incomplete' },
  { id: 'meck-commission-d2-drayton-2026', name: 'Monifa (Mo) Drayton', party: 'Democratic', office: 'Mecklenburg Commission District 2', officeLevel: 'local', district: '2', positions: [], sources: [], dataStatus: 'incomplete' },
  { id: 'meck-commission-d2-edwards-2026', name: 'Angela White Edwards', party: 'Republican', office: 'Mecklenburg Commission District 2', officeLevel: 'local', district: '2', positions: [], sources: [], dataStatus: 'incomplete' },
  { id: 'meck-sheriff-mcfadden-2026', name: 'Garry L. McFadden', party: 'Democratic', office: 'Mecklenburg Sheriff', officeLevel: 'local', district: null, positions: [], sources: [], dataStatus: 'incomplete', unopposed: true },
  { id: 'meck-da-merriweather-2026', name: 'Spencer Merriweather', party: 'Democratic', office: 'District Attorney (District 26)', officeLevel: 'local', district: '26', positions: [], sources: [], dataStatus: 'incomplete', unopposed: true },
];

// === BALLOT MEASURES ===

export const AMENDMENTS: BallotMeasure[] = [
  {
    id: 'nc-amend-photo-id-2026',
    type: 'amendment',
    title: 'Require Photo ID for Voting',
    shortTitle: 'Photo ID for All Voting',
    ballotQuestion: 'For/Against: Constitutional amendment to require all voters, not just those presenting in person, to present photo ID before voting.',
    explanation: 'Currently, photo ID is required for in-person voting. This amendment would extend that requirement to all forms of voting, including absentee ballots.',
    choices: ['For', 'Against'],
    sources: [{ url: 'https://s3.amazonaws.com/dl.ncsbe.gov/Elections/2026/Candidate%20Filing/statewide_referendums_20261103.pdf', source_type: 'voting_resource', title: 'NCSBE Statewide Referendums' }],
  },
  {
    id: 'nc-amend-income-tax-2026',
    type: 'amendment',
    title: 'Maximum Income Tax Rate of 3.5%',
    shortTitle: 'Cap Income Tax at 3.5%',
    ballotQuestion: 'For/Against: Constitutional amendment to keep State income tax rate from being raised higher than 3.5%.',
    explanation: 'The NC Constitution currently allows income tax rates up to 7%. This amendment would lower that cap to 3.5%, matching the current actual rate.',
    choices: ['For', 'Against'],
    sources: [{ url: 'https://s3.amazonaws.com/dl.ncsbe.gov/Elections/2026/Candidate%20Filing/statewide_referendums_20261103.pdf', source_type: 'voting_resource', title: 'NCSBE Statewide Referendums' }],
  },
  {
    id: 'nc-amend-property-tax-2026',
    type: 'amendment',
    title: 'Property Tax Levy Limit',
    shortTitle: 'Limit Property Tax Increases',
    ballotQuestion: 'For/Against: Constitutional amendment requiring limits on property tax increases by local governments.',
    explanation: 'This amendment would require the state legislature to pass laws limiting how much local governments can raise property taxes.',
    choices: ['For', 'Against'],
    sources: [{ url: 'https://s3.amazonaws.com/dl.ncsbe.gov/Elections/2026/Candidate%20Filing/statewide_referendums_20261103.pdf', source_type: 'voting_resource', title: 'NCSBE Statewide Referendums' }],
  },
];

export const CHARLOTTE_BONDS: BallotMeasure[] = [
  {
    id: 'clt-bonds-transportation-2026',
    type: 'bond',
    title: 'Transportation Bonds',
    shortTitle: 'Transportation ($280M)',
    principal: 280_000_000,
    ballotQuestion: 'Shall the City of Charlotte issue $280,000,000 in bonds for transportation improvements including streets, roads, sidewalks, bridges, bike paths, signals, and related infrastructure?',
    explanation: 'This bond would fund various transportation projects across Charlotte. The city estimates no property tax increase to service this debt.',
    estimatedTaxImpact: '$0.00 per $100,000 assessed value',
    choices: ['Yes', 'No'],
    city: 'Charlotte',
    sources: [{ url: 'https://s3.amazonaws.com/dl.ncsbe.gov/Elections/2026/Candidate%20Filing/referendums_20261103.pdf', source_type: 'voting_resource', title: 'NCSBE County Referendums' }],
  },
  {
    id: 'clt-bonds-housing-2026',
    type: 'bond',
    title: 'Housing Bonds',
    shortTitle: 'Affordable Housing ($125M)',
    principal: 125_000_000,
    ballotQuestion: 'Shall the City of Charlotte issue $125,000,000 in bonds for housing projects for low and/or moderate income residents and related infrastructure?',
    explanation: 'This bond would fund affordable housing development. The city estimates no property tax increase to service this debt.',
    estimatedTaxImpact: '$0.00 per $100,000 assessed value',
    choices: ['Yes', 'No'],
    city: 'Charlotte',
    sources: [{ url: 'https://s3.amazonaws.com/dl.ncsbe.gov/Elections/2026/Candidate%20Filing/referendums_20261103.pdf', source_type: 'voting_resource', title: 'NCSBE County Referendums' }],
  },
  {
    id: 'clt-bonds-neighborhood-2026',
    type: 'bond',
    title: 'Neighborhood Improvement Bonds',
    shortTitle: 'Neighborhood Improvements ($20M)',
    principal: 20_000_000,
    ballotQuestion: 'Shall the City of Charlotte issue $20,000,000 in bonds for neighborhood infrastructure improvements including curbs, gutters, drainage, sidewalks, and related improvements?',
    explanation: 'This bond would fund neighborhood-level infrastructure improvements. The city estimates no property tax increase to service this debt.',
    estimatedTaxImpact: '$0.00 per $100,000 assessed value',
    choices: ['Yes', 'No'],
    city: 'Charlotte',
    sources: [{ url: 'https://s3.amazonaws.com/dl.ncsbe.gov/Elections/2026/Candidate%20Filing/referendums_20261103.pdf', source_type: 'voting_resource', title: 'NCSBE County Referendums' }],
  },
];

// === HELPERS ===

export function getAllCandidates(): Candidate[] {
  return [
    ...US_SENATE,
    ...US_HOUSE_NC12,
    ...US_HOUSE_NC14,
    ...US_HOUSE_NC8,
    ...NC_SUPREME_COURT,
    ...NC_COURT_OF_APPEALS,
    ...STATE_LEGISLATURE,
    ...LOCAL_RACES,
  ];
}

export function getCandidatesForDistrict(district: 'NC-8' | 'NC-12' | 'NC-14'): Candidate[] {
  const all: Candidate[] = [
    ...US_SENATE,
    ...NC_SUPREME_COURT,
    ...NC_COURT_OF_APPEALS,
    ...STATE_LEGISLATURE,
    ...LOCAL_RACES,
  ];

  if (district === 'NC-8') {
    all.push(...US_HOUSE_NC8);
  } else if (district === 'NC-12') {
    all.push(...US_HOUSE_NC12);
  } else if (district === 'NC-14') {
    all.push(...US_HOUSE_NC14);
  }

  return all;
}

export function groupCandidatesByOffice(candidates: Candidate[]): Map<string, Candidate[]> {
  const map = new Map<string, Candidate[]>();
  for (const c of candidates) {
    const list = map.get(c.office) || [];
    list.push(c);
    map.set(c.office, list);
  }
  return map;
}

export function getDaysUntil(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatMoney(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${Math.round(amount / 1_000_000)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${amount}`;
}

export function getNextCriticalDeadline(): ElectionDeadline | null {
  for (const d of DEADLINES) {
    if (d.critical && getDaysUntil(d.date) >= 0) {
      return d;
    }
  }
  return null;
}
