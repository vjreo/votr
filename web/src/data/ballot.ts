/**
 * Mecklenburg County / Charlotte NC — Nov 3, 2026 General Election
 * Static data bundled for web app - no backend required
 *
 * OFFICIAL SOURCES:
 * - Candidates: https://www.ncsbe.gov/results-data/candidate-lists
 *   and https://dl.ncsbe.gov/Elections/2026/Candidate%20Filing/2026_general_candidate_list_by_contest_federal_and_state.pdf
 * - Mecklenburg filings: https://apps.meckboe.org/Candidates_new.aspx
 * - Judicial statements: https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election
 * - Referendums: https://s3.amazonaws.com/dl.ncsbe.gov/Elections/2026/Candidate%20Filing/statewide_referendums_20261103.pdf
 * - County referendums: https://s3.amazonaws.com/dl.ncsbe.gov/Elections/2026/Candidate%20Filing/referendums_20261103.pdf
 * - Positions: official campaign sites, NCSBE judicial guide, Ballotpedia Candidate Connection surveys
 *
 * Last verified: October 24, 2026
 * Coverage rule: two sourced positions per candidate when primary sources exist;
 * same topics within a race when candidates addressed them. Candidates with no
 * findable primary-source positions use NO_PUBLIC_POSITIONS_NOTE.
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
  hours?: string;
  critical: boolean;
}

export const ELECTION = {
  id: 'nc-general-2026',
  name: '2026 General Election',
  date: '2026-11-03',
  description: 'U.S. Senate, U.S. House, state courts, state legislature, county offices, and ballot measures',
};

export const DEADLINES: ElectionDeadline[] = [
  { name: 'Voter Registration', date: '2026-10-09', hours: '5 p.m.', critical: true },
  { name: 'Early Voting Begins', date: '2026-10-15', critical: false },
  { name: 'Absentee Request Deadline', date: '2026-10-20', hours: '5 p.m.', critical: true },
  { name: 'Early Voting Ends', date: '2026-10-31', hours: '3 p.m.', critical: false },
  { name: 'Election Day', date: '2026-11-03', hours: '6:30 a.m. to 7:30 p.m.', critical: true },
];

export const NC_VOTER_SEARCH_URL = 'https://vt.ncsbe.gov/reglkup/';

// Official source URLs for data verification
export const OFFICIAL_SOURCES = {
  ncVoterSearch: 'https://vt.ncsbe.gov/reglkup/',
  ncsbeSite: 'https://www.ncsbe.gov/',
  ncsbeCandidateLists: 'https://www.ncsbe.gov/results-data/candidate-lists',
  ncsbeGeneralList:
    'https://dl.ncsbe.gov/Elections/2026/Candidate%20Filing/2026_general_candidate_list_by_contest_federal_and_state.pdf',
  ncsbeJudicialGuide:
    'https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election',
  meckCandidates: 'https://apps.meckboe.org/Candidates_new.aspx',
  stateReferendums: 'https://s3.amazonaws.com/dl.ncsbe.gov/Elections/2026/Candidate%20Filing/statewide_referendums_20261103.pdf',
  countyReferendums: 'https://s3.amazonaws.com/dl.ncsbe.gov/Elections/2026/Candidate%20Filing/referendums_20261103.pdf',
  meckBoe: 'https://www.mecknc.gov/boe',
};

/** Same wording for every candidate with no findable primary-source positions. */
export const NO_PUBLIC_POSITIONS_NOTE =
  "No public issue positions from this candidate's official campaign materials or questionnaires were available as of October 24, 2026.";

export const POSITIONS_PER_CANDIDATE = 2;

// Data provenance - for transparency
export const DATA_PROVENANCE = {
  lastVerified: '2026-10-24',
  lastVerifiedLabel: 'October 24, 2026',
  sources: [
    'NC State Board of Elections candidate lists and Judicial Voter Guide',
    'Mecklenburg County Board of Elections candidate list',
    'Official campaign websites',
    'Ballotpedia Candidate Connection surveys (where the candidate responded)',
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
        issueName: 'Economy',
        issueId: 'economy',
        stance:
          'He says he would end tariffs that raise grocery costs, block grocery and food-processing mergers that reduce competition, and ban grocery-pricing algorithms that raise prices for specific customers.',
        source: 'https://roycooper.com/costless/groceries/',
      },
      {
        issueName: 'Public Safety',
        issueId: 'criminal_justice',
        stance:
          'Campaign materials say that as attorney general he prosecuted drug dealers, rapists, and murderers, and as governor he changed bail laws, targeted fentanyl trafficking, and opposed defunding the police.',
        source: 'https://roycooper.com/new-tv-ad-roy-cooper-releases-new-tv-ad-highlighting-his-work-to-keep-north-carolinians-safe/',
      },
    ],
    sources: [
      { url: 'https://roycooper.com/costless/groceries/', source_type: 'official_website', title: 'Campaign: groceries' },
      { url: 'https://roycooper.com/new-tv-ad-roy-cooper-releases-new-tv-ad-highlighting-his-work-to-keep-north-carolinians-safe/', source_type: 'official_website', title: 'Campaign: public safety ad' },
    ],
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
        issueName: 'Economy',
        issueId: 'economy',
        stance:
          'He says U.S. economic strength depends on reliable, affordable energy and reining in Washington spending, and that fiscal responsibility plus expanded American energy production will create jobs.',
        source: 'https://michaelwhatley.com/issues/',
      },
      {
        issueName: 'Public Safety',
        issueId: 'criminal_justice',
        stance:
          'He says he would work with President Trump to restore law and order, roll back cashless bail and other policies he calls lenient, and support law enforcement.',
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
      {
        issueName: 'Economy',
        issueId: 'economy',
        stance:
          'He says Washington spends too much and taxes too much, and he supports simplifying the tax code, ending corporate handouts and special-interest loopholes, and capping federal spending.',
        source: 'https://www.shannonbray.us/_issues_economy',
      },
      {
        issueName: 'Public Safety',
        issueId: 'criminal_justice',
        stance:
          'He says justice should be fair, proportional, and constitutional, and he supports ending civil asset forfeiture without a conviction, reducing mandatory minimums for nonviolent offenses, and emphasizing rehabilitation and accountability.',
        source: 'https://www.shannonbray.us/_issues_criminal-justice',
      },
    ],
    sources: [
      { url: 'https://www.shannonbray.us/_issues_economy', source_type: 'official_website', title: 'Campaign: economy' },
      { url: 'https://www.shannonbray.us/_issues_criminal-justice', source_type: 'official_website', title: 'Campaign: criminal justice' },
    ],
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
    positions: [
      {
        issueName: 'Economy',
        issueId: 'economy',
        stance:
          'He says he supports taxing the wealthy, a $25 hourly federal minimum wage adjusted for living costs, a 32-hour work week with no loss of pay, a $4,000 monthly guaranteed income for specified groups, and price controls on everyday goods.',
        source: 'https://www.dublinforcongress.com/platform',
      },
      {
        issueName: 'Public Safety',
        issueId: 'criminal_justice',
        stance:
          'He says he supports ending what he calls the institutional racism of the criminal justice system and the War on Drugs, investing in rehabilitation and living-wage jobs rather than prisons, abolishing the death penalty, and putting police departments under elected civilian boards.',
        source: 'https://www.dublinforcongress.com/platform',
      },
    ],
    sources: [{ url: 'https://www.dublinforcongress.com/platform', source_type: 'official_website', title: 'Campaign Platform' }],
    dataStatus: 'complete',
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
      {
        issueName: 'Economy',
        issueId: 'economy',
        stance:
          'She says small businesses need tax cuts and easier access to capital, and she supports more tax cuts for the middle class and raising the minimum wage indexed to inflation.',
        source: 'https://almaadamsforcongress.com/issues/',
      },
      {
        issueName: 'Healthcare',
        issueId: 'healthcare',
        stance:
          'She says health insurance should be affordable and available, and she supports the Affordable Care Act, bans on preexisting-condition denials, income-based insurance discounts, closing the Medicaid coverage gap, and a $35 monthly insulin cap.',
        source: 'https://almaadamsforcongress.com/issues/',
      },
    ],
    sources: [{ url: 'https://almaadamsforcongress.com/issues/', source_type: 'official_website', title: 'Campaign Issues' }],
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
      {
        issueName: 'Economy',
        issueId: 'economy',
        stance:
          'He says he would abolish the Federal Reserve and return currency oversight to the Treasury with gold- and silver-backed money, phase out federal welfare programs including Social Security, and replace income and property taxes with consumption taxes and tariffs.',
        source: 'https://ihatepolitics.com/pages/platform',
      },
      {
        issueName: 'Healthcare',
        issueId: 'healthcare',
        stance:
          'He says healthcare costs rose because of administrative rules, and he supports price transparency, competition, ending job-tied insurance, and phasing out government healthcare programs.',
        source: 'https://ihatepolitics.com/pages/platform',
      },
    ],
    sources: [{ url: 'https://ihatepolitics.com/pages/platform', source_type: 'official_website', title: 'Campaign Platform' }],
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
      {
        issueName: 'Economy',
        issueId: 'economy',
        stance:
          'He says he stands for fiscal responsibility and lower taxes, citing House Budget Committee work and a state record of balancing budgets and cutting personal income taxes.',
        source: 'https://www.timmoore.com/',
      },
      {
        issueName: 'Government',
        issueId: 'government',
        stance:
          'An official House statement says he voted for a budget resolution that he described as cutting federal spending, securing the border, and lowering energy costs without cutting Social Security, Medicare, or Medicaid.',
        source: 'https://timmoore.house.gov/media/press-releases/congressman-tim-moore-votes-pass-house-budget-resolution-rein-federal-spending',
      },
    ],
    sources: [
      { url: 'https://www.timmoore.com/', source_type: 'official_website', title: 'Campaign Site' },
      { url: 'https://timmoore.house.gov/media/press-releases/congressman-tim-moore-votes-pass-house-budget-resolution-rein-federal-spending', source_type: 'official_record', title: 'House budget vote statement' },
    ],
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
      {
        issueName: 'Economy',
        issueId: 'economy',
        stance:
          'She says she would support raising the federal minimum wage, tax policies aimed at working- and middle-class households, worker protections, and more capital access for small businesses through CDFIs and federal procurement.',
        source: 'https://www.womack4nc14.com/issues',
      },
      {
        issueName: 'Government',
        issueId: 'government',
        stance:
          'She says she would demand oversight of federal spending, prioritize investments with measurable community outcomes, oppose what she calls wasteful spending and politically motivated budget cuts, and help rebuild federal agencies so services are accessible.',
        source: 'https://www.womack4nc14.com/issues',
      },
    ],
    sources: [{ url: 'https://www.womack4nc14.com/issues', source_type: 'official_website', title: 'Campaign Issues' }],
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
    positions: [
      {
        issueName: 'Economy',
        issueId: 'economy',
        stance:
          'He says he is working to cut the kind of government spending he links to inflation and to increase take-home pay for people in NC-08.',
        source: 'https://www.markharrisforcongress.org/issues',
      },
      {
        issueName: 'Immigration',
        issueId: 'immigration',
        stance:
          'He says he is committed to fortifying borders, supporting advanced technology, and rigorously enforcing immigration laws.',
        source: 'https://www.markharrisforcongress.org/issues',
      },
    ],
    sources: [{ url: 'https://www.markharrisforcongress.org/issues', source_type: 'official_website', title: 'Campaign Issues' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-house-8-watson-2026',
    name: 'Colby Watson',
    party: 'Democratic',
    office: 'U.S. House NC-8',
    officeLevel: 'federal',
    district: 'NC-8',
    bio: 'Democratic challenger.',
    positions: [
      {
        issueName: 'Economy',
        issueId: 'economy',
        stance:
          'He says he would cut red tape on small businesses and skilled trades, support American manufacturing, fund apprenticeships and trade schools, and reward skilled work with wages people can live on.',
        source: 'https://www.colbyforcongress.com/issues',
      },
      {
        issueName: 'Immigration',
        issueId: 'immigration',
        stance:
          'He says he would secure the southern border with technology, infrastructure, and staffing; target drug and human trafficking; speed legal immigration and asylum processing; focus enforcement on violent crime; and hold employers accountable for exploiting undocumented labor.',
        source: 'https://www.colbyforcongress.com/issues',
      },
    ],
    sources: [{ url: 'https://www.colbyforcongress.com/issues', source_type: 'official_website', title: 'Campaign Issues' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-house-8-whitehead-2026',
    name: 'Bo Whitehead',
    party: 'Green',
    office: 'U.S. House NC-8',
    officeLevel: 'federal',
    district: 'NC-8',
    bio: 'Green Party candidate.',
    positions: [
      {
        issueName: 'Economy',
        issueId: 'economy',
        stance:
          'He says he supports a $25 minimum wage, mandatory maternity leave, vacation, and holiday leave, full-time hours for workers who want them, and ending right-to-work and at-will rules that he says make unionizing difficult.',
        source: 'https://whiteheadforcongressnc.carrd.co/',
      },
      {
        issueName: 'Immigration',
        issueId: 'immigration',
        stance:
          'He says he supports ending ICE, overhauling the immigration system toward assistance rather than detention, and closing immigration detention centers, while saying people sought for violent crimes should still be pursued.',
        source: 'https://whiteheadforcongressnc.carrd.co/',
      },
    ],
    sources: [{ url: 'https://whiteheadforcongressnc.carrd.co/', source_type: 'official_website', title: 'Campaign Site' }],
    dataStatus: 'complete',
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
    positions: [
      {
        issueName: 'Judicial philosophy',
        issueId: 'judiciary',
        stance:
          'In the NCSBE Judicial Voter Guide she says an independent court is necessary to the balance of powers and that North Carolinians should have a fair court that protects personal freedoms regardless of race, gender, or wealth.',
        source: 'https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election',
      },
      {
        issueName: 'Experience',
        issueId: 'government',
        stance:
          'In the same guide she says she is a sitting justice and the only candidate in the race with judicial experience and with experience arguing cases before the Supreme Court as an attorney.',
        source: 'https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election',
      },
    ],
    sources: [{ url: 'https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election', source_type: 'official_questionnaire', title: 'NCSBE Judicial Voter Guide 2026' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-supreme-01-stevens-2026',
    name: 'Sarah Stevens',
    party: 'Republican',
    office: 'NC Supreme Court Seat 01',
    officeLevel: 'state',
    district: null,
    positions: [
      {
        issueName: 'Judicial philosophy',
        issueId: 'judiciary',
        stance:
          'In the NCSBE Judicial Voter Guide she says she believes in following the law as written, a strict following of the constitution, and the neutral application of the law.',
        source: 'https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election',
      },
      {
        issueName: 'Experience',
        issueId: 'government',
        stance:
          'In the same guide she says she has been Speaker Pro Tempore of the House, chaired judiciary committees that review the constitutionality of proposed legislation, and has 40 years of law practice.',
        source: 'https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election',
      },
    ],
    sources: [{ url: 'https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election', source_type: 'official_questionnaire', title: 'NCSBE Judicial Voter Guide 2026' }],
    dataStatus: 'complete',
  },
];

export const NC_COURT_OF_APPEALS: Candidate[] = [
  {
    id: 'nc-appeals-01-arrowood-2026',
    name: 'John S. Arrowood',
    party: 'Democratic',
    office: 'NC Court of Appeals Seat 01',
    officeLevel: 'state',
    district: null,
    positions: [
      {
        issueName: 'Judicial philosophy',
        issueId: 'judiciary',
        stance:
          'In the NCSBE Judicial Voter Guide he says he is committed to an independent judiciary that upholds the rule of law and pledges equal justice and protection of constitutional rights.',
        source: 'https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election',
      },
      {
        issueName: 'Experience',
        issueId: 'government',
        stance:
          'In the same guide he says he has served almost 11 years on the Court of Appeals and has written hundreds of decisions, after work as a law clerk, staff attorney, and staff director there and more than 25 years in private civil and commercial practice.',
        source: 'https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election',
      },
    ],
    sources: [{ url: 'https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election', source_type: 'official_questionnaire', title: 'NCSBE Judicial Voter Guide 2026' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-appeals-01-byrne-2026',
    name: 'Michael C. Byrne',
    party: 'Republican',
    office: 'NC Court of Appeals Seat 01',
    officeLevel: 'state',
    district: null,
    positions: [
      {
        issueName: 'Judicial philosophy',
        issueId: 'judiciary',
        stance:
          'In the NCSBE Judicial Voter Guide he states his philosophy as “A Fair Judge. For Everyone” and getting the law right.',
        source: 'https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election',
      },
      {
        issueName: 'Experience',
        issueId: 'government',
        stance:
          'In the same guide he says he has six years as a judge with 400+ decisions, ten decisions affirmed by the Court of Appeals and none reversed, plus 20+ appellate cases as an attorney.',
        source: 'https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election',
      },
    ],
    sources: [{ url: 'https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election', source_type: 'official_questionnaire', title: 'NCSBE Judicial Voter Guide 2026' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-appeals-02-hampson-2026',
    name: 'Tobias (Toby) Hampson',
    party: 'Democratic',
    office: 'NC Court of Appeals Seat 02',
    officeLevel: 'state',
    district: null,
    positions: [
      {
        issueName: 'Judicial philosophy',
        issueId: 'judiciary',
        stance:
          'In the NCSBE Judicial Voter Guide he says he is committed to defending the rule of law, upholding rights, and making sure the judicial system works for the people rather than partisan agendas.',
        source: 'https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election',
      },
      {
        issueName: 'Experience',
        issueId: 'government',
        stance:
          'In the same guide he says he has served on the Court of Appeals since 2019, authored hundreds of majority decisions, and is certified as an appellate practice specialist by the N.C. State Bar.',
        source: 'https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election',
      },
    ],
    sources: [{ url: 'https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election', source_type: 'official_questionnaire', title: 'NCSBE Judicial Voter Guide 2026' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-appeals-02-bell-2026',
    name: 'George Cooper Bell',
    party: 'Republican',
    office: 'NC Court of Appeals Seat 02',
    officeLevel: 'state',
    district: null,
    positions: [
      {
        issueName: 'Judicial philosophy',
        issueId: 'judiciary',
        stance:
          'In the NCSBE Judicial Voter Guide he says he follows the rule of law and administers justice impartially, without prejudice or bias, and that people need to be held accountable for their actions.',
        source: 'https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election',
      },
      {
        issueName: 'Experience',
        issueId: 'government',
        stance:
          'In the same guide he says he was elected to the Superior Court bench in Charlotte in 2018 and has presided over 100 felony jury trials, including first-degree murder, violent crimes, and habitual-felon cases.',
        source: 'https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election',
      },
    ],
    sources: [{ url: 'https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election', source_type: 'official_questionnaire', title: 'NCSBE Judicial Voter Guide 2026' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-appeals-03-walczyk-2026',
    name: 'Christine Marie Walczyk',
    party: 'Democratic',
    office: 'NC Court of Appeals Seat 03',
    officeLevel: 'state',
    district: null,
    positions: [
      {
        issueName: 'Judicial philosophy',
        issueId: 'judiciary',
        stance:
          'In the NCSBE Judicial Voter Guide she says she has a record of safeguarding due process and the rule of law and is focused on protecting constitutional liberties, equal access to justice, and a stronger independent judiciary.',
        source: 'https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election',
      },
      {
        issueName: 'Experience',
        issueId: 'government',
        stance:
          'In the same guide she says she has served as a District Court judge since 2007, including as lead family-court judge and lead general-civil-court judge, after more than a decade in private practice.',
        source: 'https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election',
      },
    ],
    sources: [{ url: 'https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election', source_type: 'official_questionnaire', title: 'NCSBE Judicial Voter Guide 2026' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-appeals-03-collins-2026',
    name: 'Craig Collins',
    party: 'Republican',
    office: 'NC Court of Appeals Seat 03',
    officeLevel: 'state',
    district: null,
    positions: [
      {
        issueName: 'Judicial philosophy',
        issueId: 'judiciary',
        stance:
          'In the NCSBE Judicial Voter Guide he says North Carolina needs judges who will follow the Constitution and not legislate from the bench, and who understand the trial division where cases are heard before they reach the Court of Appeals.',
        source: 'https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election',
      },
      {
        issueName: 'Experience',
        issueId: 'government',
        stance:
          'In the same guide he says he served 9 years as an assistant district attorney, 9 years in private practice, 9 years as a District Court judge, and is now a Superior Court judge, and that he is the only candidate in the race with both District and Superior Court judicial experience.',
        source: 'https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election',
      },
    ],
    sources: [{ url: 'https://www.ncsbe.gov/voting/upcoming-election/judicial-voter-guide-2026-general-election', source_type: 'official_questionnaire', title: 'NCSBE Judicial Voter Guide 2026' }],
    dataStatus: 'complete',
  },
];

export const STATE_LEGISLATURE: Candidate[] = [
  {
    id: 'nc-sen-37-angel-2026',
    name: 'Raygan J. Angel',
    party: 'Democratic',
    office: 'NC Senate District 37',
    officeLevel: 'state_legislature',
    district: '37',
    positions: [
      {
        issueName: 'Education',
        issueId: 'education',
        stance: 'He says public schools should be funded as an ongoing priority, with supported teachers and safe classrooms.',
        source: 'https://www.rayganfornc.com/issues',
      },
      {
        issueName: 'Healthcare',
        issueId: 'healthcare',
        stance: 'He says healthcare costs too much and that people should not have to choose between rent and seeing a doctor.',
        source: 'https://www.rayganfornc.com/issues',
      },
    ],
    sources: [{ url: 'https://www.rayganfornc.com/issues', source_type: 'official_website', title: 'Campaign Issues' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-sen-37-sawyer-2026',
    name: 'Vickie Sawyer',
    party: 'Republican',
    office: 'NC Senate District 37',
    officeLevel: 'state_legislature',
    district: '37',
    positions: [
      {
        issueName: 'Education',
        issueId: 'education',
        stance: 'Her campaign biography identifies her as a former PTO president and says education is a focus.',
        source: 'https://www.sawyernc.com/',
      },
      {
        issueName: 'Government',
        issueId: 'government',
        stance: 'Her campaign site states she serves as Co-Chair of the Senate Committee on Transportation.',
        source: 'https://www.sawyernc.com/',
      },
    ],
    sources: [{ url: 'https://www.sawyernc.com/', source_type: 'official_website', title: 'Campaign Site' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-sen-38-mohammed-2026',
    name: 'Mujtaba A. Mohammed',
    party: 'Democratic',
    office: 'NC Senate District 38',
    officeLevel: 'state_legislature',
    district: '38',
    positions: [
      {
        issueName: 'Education',
        issueId: 'education',
        stance: 'He says he is dedicated to ensuring that every child in North Carolina has access to quality education and the resources they need to succeed.',
        source: 'https://mohammednc.com/issues/',
      },
      {
        issueName: 'Economy',
        issueId: 'economy',
        stance: 'He says his economic vision expands opportunities, fosters local innovation, and strengthens communities.',
        source: 'https://mohammednc.com/issues/',
      },
    ],
    sources: [{ url: 'https://mohammednc.com/issues/', source_type: 'official_website', title: 'Campaign Issues' }],
    dataStatus: 'complete',
    unopposed: true,
  },
  {
    id: 'nc-sen-39-salvador-2026',
    name: 'DeAndrea Salvador',
    party: 'Democratic',
    office: 'NC Senate District 39',
    officeLevel: 'state_legislature',
    district: '39',
    positions: [
      {
        issueName: 'Healthcare',
        issueId: 'healthcare',
        stance: 'Her campaign lists affordable healthcare as a priority and says healthcare should be affordable and accessible.',
        source: 'https://www.salvadorfornc.com/',
      },
      {
        issueName: 'Education',
        issueId: 'education',
        stance: 'Her campaign lists educational opportunity as a priority and says attention should refocus on academic excellence and barriers to college and careers.',
        source: 'https://www.salvadorfornc.com/',
      },
    ],
    sources: [{ url: 'https://www.salvadorfornc.com/', source_type: 'official_website', title: 'Campaign Site' }],
    dataStatus: 'complete',
    unopposed: true,
  },
  {
    id: 'nc-sen-40-waddell-2026',
    name: 'Joyce Waddell',
    party: 'Democratic',
    office: 'NC Senate District 40',
    officeLevel: 'state_legislature',
    district: '40',
    positions: [
      {
        issueName: 'Education',
        issueId: 'education',
        stance: 'Official records list her as first primary sponsor of SB 194 (2025–26), school-calendar flexibility for Charlotte-Mecklenburg and community colleges.',
        source: 'https://www.ncleg.gov/Members/IntroducedBills/S/393',
      },
      {
        issueName: 'Healthcare',
        issueId: 'healthcare',
        stance: 'Official records list her as first primary sponsor of SB 139 (2025–26), Restore State Emp/Teacher Retiree Med Benefit.',
        source: 'https://www.ncleg.gov/Members/IntroducedBills/S/393',
      },
    ],
    sources: [{ url: 'https://www.ncleg.gov/Members/IntroducedBills/S/393', source_type: 'official_record', title: 'NCGA bills introduced' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-sen-40-shields-2026',
    name: 'Bobbie Shields',
    party: 'Republican',
    office: 'NC Senate District 40',
    officeLevel: 'state_legislature',
    district: '40',
    positions: [],
    sources: [{ url: 'https://www.votebobbieshields.com/', source_type: 'official_website', title: 'Campaign Site' }],
    dataStatus: 'incomplete',
    dataStatusNote: NO_PUBLIC_POSITIONS_NOTE,
  },
  {
    id: 'nc-sen-41-theodros-2026',
    name: 'Caleb Theodros',
    party: 'Democratic',
    office: 'NC Senate District 41',
    officeLevel: 'state_legislature',
    district: '41',
    positions: [
      {
        issueName: 'Education',
        issueId: 'education',
        stance: 'His campaign says SB 550 (Coaches Care) would require middle and high school coaches to keep current mental-health training.',
        source: 'https://calebnc.com/',
      },
      {
        issueName: 'Economy',
        issueId: 'economy',
        stance: 'His campaign says SB 988 would require notice and retraining if a company takes state incentives and then replaces workers with automation.',
        source: 'https://calebnc.com/',
      },
    ],
    sources: [{ url: 'https://calebnc.com/', source_type: 'official_website', title: 'Campaign Site' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-sen-41-gray-2026',
    name: 'Kevin Gray',
    party: 'Republican',
    office: 'NC Senate District 41',
    officeLevel: 'state_legislature',
    district: '41',
    positions: [
      {
        issueName: 'Public Safety',
        issueId: 'criminal_justice',
        stance: 'He says he supports a specialized CATS police force to keep rail, buses, and riders safe.',
        source: 'https://kevingray.carrd.co/',
      },
      {
        issueName: 'Government',
        issueId: 'government',
        stance: 'He says he supports judicial accountability and that judges should answer to voters.',
        source: 'https://kevingray.carrd.co/',
      },
    ],
    sources: [{ url: 'https://kevingray.carrd.co/', source_type: 'official_website', title: 'Campaign Site' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-sen-42-bradley-2026',
    name: 'Mrs. Woodson Bradley',
    party: 'Democratic',
    office: 'NC Senate District 42',
    officeLevel: 'state_legislature',
    district: '42',
    positions: [
      {
        issueName: 'Education',
        issueId: 'education',
        stance: 'She says she would protect public schools so students gain workforce skills and strengthen the local economy.',
        source: 'https://www.woodsonbradley.com/legistlation',
      },
      {
        issueName: 'Economy',
        issueId: 'economy',
        stance: 'She says she would lower costs for families by lowering childcare costs, expanding paid family and medical leave, and making everyday necessities more affordable.',
        source: 'https://www.woodsonbradley.com/legistlation',
      },
    ],
    sources: [{ url: 'https://www.woodsonbradley.com/legistlation', source_type: 'official_website', title: 'Campaign legislation page' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-sen-42-mcginn-2026',
    name: 'Stacie McGinn',
    party: 'Republican',
    office: 'NC Senate District 42',
    officeLevel: 'state_legislature',
    district: '42',
    positions: [
      {
        issueName: 'Education',
        issueId: 'education',
        stance: 'She says she would continue to support parental rights in their children’s education while improving student proficiency in reading and math, with an emphasis on early education.',
        source: 'https://www.staciemcginnfornc.com/',
      },
      {
        issueName: 'Economy',
        issueId: 'economy',
        stance: 'She says she would support policies that include low personal income and property taxes and reasonable regulations that attract jobs and make it easier to start businesses.',
        source: 'https://www.staciemcginnfornc.com/',
      },
    ],
    sources: [{ url: 'https://www.staciemcginnfornc.com/', source_type: 'official_website', title: 'Campaign Site' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-house-88-belk-2026',
    name: 'Mary Belk',
    party: 'Democratic',
    office: 'NC House District 88',
    officeLevel: 'state_legislature',
    district: '88',
    positions: [
      {
        issueName: 'Education',
        issueId: 'education',
        stance: 'She says she was part of the coalition that passed HB13 to delay lower K–3 class-size mandates so science, art, and PE programs would not be cut.',
        source: 'https://www.marybelk.com/',
      },
      {
        issueName: 'Economy',
        issueId: 'economy',
        stance: 'She says she introduced a small-business reform bill that passed the House with bipartisan co-sponsors.',
        source: 'https://www.marybelk.com/',
      },
    ],
    sources: [{ url: 'https://www.marybelk.com/', source_type: 'official_website', title: 'Campaign Site' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-house-88-craig-2026',
    name: 'Ray Craig',
    party: 'Republican',
    office: 'NC House District 88',
    officeLevel: 'state_legislature',
    district: '88',
    positions: [],
    sources: [{ url: 'https://www.craigforcharlotte.org/', source_type: 'official_website', title: 'Campaign Site' }],
    dataStatus: 'incomplete',
    dataStatusNote: NO_PUBLIC_POSITIONS_NOTE,
  },
  {
    id: 'nc-house-98-helfrich-2026',
    name: 'Beth Helfrich',
    party: 'Democratic',
    office: 'NC House District 98',
    officeLevel: 'state_legislature',
    district: '98',
    positions: [
      {
        issueName: 'Healthcare',
        issueId: 'healthcare',
        stance: 'She says she authored a bill that would ensure the right to IVF.',
        source: 'https://www.bethhelfrichnc.com/',
      },
      {
        issueName: 'Government',
        issueId: 'government',
        stance: 'She says she authored a bill that would protect local zoning control.',
        source: 'https://www.bethhelfrichnc.com/',
      },
    ],
    sources: [{ url: 'https://www.bethhelfrichnc.com/', source_type: 'official_website', title: 'Campaign Site' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-house-98-rhodes-2026',
    name: 'John Rhodes',
    party: 'Republican',
    office: 'NC House District 98',
    officeLevel: 'state_legislature',
    district: '98',
    positions: [
      {
        issueName: 'Public Safety',
        issueId: 'criminal_justice',
        stance: 'He says he supports law enforcement to keep communities safe and to stop people he describes as illegal invaders.',
        source: 'https://electjohnrhodes.com/',
      },
      {
        issueName: 'Education',
        issueId: 'education',
        stance: 'He says he would pursue more responsive, manageable public education for North Mecklenburg parents and students.',
        source: 'https://electjohnrhodes.com/',
      },
    ],
    sources: [{ url: 'https://electjohnrhodes.com/', source_type: 'official_website', title: 'Campaign Site' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-house-104-lofton-2026',
    name: 'Brandon Lofton',
    party: 'Democratic',
    office: 'NC House District 104',
    officeLevel: 'state_legislature',
    district: '104',
    positions: [
      {
        issueName: 'Education',
        issueId: 'education',
        stance: 'He says he would invest in children by fully funding public schools, including higher teacher pay and more counselors, nurses, and psychologists.',
        source: 'https://www.loftonfornc.com/issues',
      },
      {
        issueName: 'Economy',
        issueId: 'economy',
        stance: 'He says he would promote the economy by supporting innovation and access to affordable healthcare and childcare.',
        source: 'https://www.loftonfornc.com/issues',
      },
    ],
    sources: [{ url: 'https://www.loftonfornc.com/issues', source_type: 'official_website', title: 'Campaign Issues' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-house-104-boyd-2026',
    name: 'Trina Boyd',
    party: 'Republican',
    office: 'NC House District 104',
    officeLevel: 'state_legislature',
    district: '104',
    positions: [
      {
        issueName: 'Education',
        issueId: 'education',
        stance: 'She says every family deserves access to safe, affordable childcare and that she would work to remove licensing barriers so more providers can open.',
        source: 'https://boyd4nchouse.com/',
      },
      {
        issueName: 'Economy',
        issueId: 'economy',
        stance: 'She says she would work for increased access to state funding, grants, and resources that help entrepreneurs start, grow, and sustain their businesses.',
        source: 'https://boyd4nchouse.com/',
      },
    ],
    sources: [{ url: 'https://boyd4nchouse.com/', source_type: 'official_website', title: 'Campaign Site' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-house-105-mccool-2026',
    name: 'Ken McCool',
    party: 'Democratic',
    office: 'NC House District 105',
    officeLevel: 'state_legislature',
    district: '105',
    positions: [
      {
        issueName: 'Education',
        issueId: 'education',
        stance: 'He says he supports fully funding public schools and opposes unregulated private-school vouchers that he says leave public schools and rural communities behind.',
        source: 'https://www.kenmccool.com/priorities',
      },
      {
        issueName: 'Public Safety',
        issueId: 'criminal_justice',
        stance: 'He says public safety is a top priority and cites support for a first-responder training facility at CPCC Levine and Matthews Fire Station 3.',
        source: 'https://www.kenmccool.com/priorities',
      },
    ],
    sources: [{ url: 'https://www.kenmccool.com/priorities', source_type: 'official_website', title: 'Campaign Priorities' }],
    dataStatus: 'complete',
  },
  {
    id: 'nc-house-105-cotham-2026',
    name: 'Tricia Ann Cotham',
    party: 'Republican',
    office: 'NC House District 105',
    officeLevel: 'state_legislature',
    district: '105',
    positions: [
      {
        issueName: 'Education',
        issueId: 'education',
        stance: 'She says she voted to raise teacher pay, increase classroom funding, and expand Opportunity Scholarships.',
        source: 'https://www.triciacotham.net/leadership',
      },
      {
        issueName: 'Public Safety',
        issueId: 'criminal_justice',
        stance: 'She says she sponsored legislation to make it harder for repeat offenders charged with violent crimes to be released, and voted to require sheriffs to cooperate with immigration officials when detaining people charged with violent crimes.',
        source: 'https://www.triciacotham.net/leadership',
      },
    ],
    sources: [{ url: 'https://www.triciacotham.net/leadership', source_type: 'official_website', title: 'Campaign leadership page' }],
    dataStatus: 'complete',
  },
];

export const LOCAL_RACES: Candidate[] = [
  {
    id: 'meck-commission-atlarge-altman-2026',
    name: 'Leigh Altman',
    party: 'Democratic',
    office: 'Mecklenburg Commissioners At-Large',
    officeLevel: 'local',
    district: 'At-Large',
    positions: [
      {
        issueName: 'Education',
        issueId: 'education',
        stance: 'She says every young adult who graduates from the county’s schools should have one-on-one career counseling and a plan for training or employment.',
        source: 'https://www.leighaltman.com/issues.html',
      },
      {
        issueName: 'Healthcare',
        issueId: 'healthcare',
        stance: 'She says she supports public health programs that address food deserts, chronic disease, vaccinations, and access for women’s reproductive health.',
        source: 'https://www.leighaltman.com/issues.html',
      },
    ],
    sources: [{ url: 'https://www.leighaltman.com/issues.html', source_type: 'official_website', title: 'Campaign Issues' }],
    dataStatus: 'complete',
  },
  {
    id: 'meck-commission-atlarge-townsend-2026',
    name: 'Yvette Townsend-Ingram',
    party: 'Democratic',
    office: 'Mecklenburg Commissioners At-Large',
    officeLevel: 'local',
    district: 'At-Large',
    positions: [
      {
        issueName: 'Healthcare',
        issueId: 'healthcare',
        stance: 'Her official county biography lists first-term priorities that include diminishing food insecurity and improving wrap-around services, especially mental wellness.',
        source: 'https://bocc.mecknc.gov/yvette-townsend-ingram',
      },
      {
        issueName: 'Economy',
        issueId: 'economy',
        stance: 'Her official county biography lists first-term priorities that include acceleration of the county’s MWSBE program.',
        source: 'https://bocc.mecknc.gov/yvette-townsend-ingram',
      },
    ],
    sources: [{ url: 'https://bocc.mecknc.gov/yvette-townsend-ingram', source_type: 'official_record', title: 'County commissioner biography' }],
    dataStatus: 'complete',
  },
  {
    id: 'meck-commission-atlarge-griffin-2026',
    name: 'Arthur Griffin, Jr.',
    party: 'Democratic',
    office: 'Mecklenburg Commissioners At-Large',
    officeLevel: 'local',
    district: 'At-Large',
    positions: [
      {
        issueName: 'Housing',
        issueId: 'housing',
        stance: 'He says housing is affordable when a family spends no more than 30% of income on shelter, and that if you work here you should be able to live here.',
        source: 'https://www.griffin4mecklenburgcounty.com/',
      },
      {
        issueName: 'Education',
        issueId: 'education',
        stance: 'He says he supports workforce-preparation skills through public institutions, private employers, and community partners to close the skills gap.',
        source: 'https://www.griffin4mecklenburgcounty.com/',
      },
    ],
    sources: [{ url: 'https://www.griffin4mecklenburgcounty.com/', source_type: 'official_website', title: 'Campaign Site' }],
    dataStatus: 'complete',
  },
  {
    id: 'meck-commission-d2-drayton-2026',
    name: 'Monifa (Mo) Drayton',
    party: 'Democratic',
    office: 'Mecklenburg Commission District 2',
    officeLevel: 'local',
    district: '2',
    positions: [
      {
        issueName: 'Housing',
        issueId: 'housing',
        stance: 'She says she supports anti-displacement policies, property-tax stabilization for long-time homeowners, and more affordable housing options in District 2.',
        source: 'https://www.modraytonforcountycommission.com/',
      },
      {
        issueName: 'Healthcare',
        issueId: 'healthcare',
        stance: 'She says she would increase clinics and maternal health services and strengthen behavioral health resources and pathways to care.',
        source: 'https://www.modraytonforcountycommission.com/',
      },
    ],
    sources: [{ url: 'https://www.modraytonforcountycommission.com/', source_type: 'official_website', title: 'Campaign Site' }],
    dataStatus: 'complete',
  },
  {
    id: 'meck-commission-d2-edwards-2026',
    name: 'Angela White Edwards',
    party: 'Republican',
    office: 'Mecklenburg Commission District 2',
    officeLevel: 'local',
    district: '2',
    positions: [],
    sources: [],
    dataStatus: 'incomplete',
    dataStatusNote: NO_PUBLIC_POSITIONS_NOTE,
  },
  {
    id: 'meck-sheriff-mcfadden-2026',
    name: 'Garry L. McFadden',
    party: 'Democratic',
    office: 'Mecklenburg Sheriff',
    officeLevel: 'local',
    district: null,
    positions: [
      {
        issueName: 'Public Safety',
        issueId: 'criminal_justice',
        stance: 'His official office page lists ending solitary confinement for youthful offenders, detention career fairs to reduce recidivism, and a behavioral-health unit.',
        source: 'https://www.mecksheriff.com/index.php/sheriffs-message/',
      },
      {
        issueName: 'Immigration',
        issueId: 'immigration',
        stance: 'His official office page lists ending participation in the 287(g) program.',
        source: 'https://www.mecksheriff.com/index.php/sheriffs-message/',
      },
    ],
    sources: [{ url: 'https://www.mecksheriff.com/index.php/sheriffs-message/', source_type: 'official_record', title: 'Sheriff’s message' }],
    dataStatus: 'complete',
    unopposed: true,
  },
  {
    id: 'meck-da-merriweather-2026',
    name: 'Spencer Merriweather',
    party: 'Democratic',
    office: 'District Attorney (District 26)',
    officeLevel: 'local',
    district: '26',
    positions: [
      {
        issueName: 'Public Safety',
        issueId: 'criminal_justice',
        stance: 'His official biography says he expanded a Violent Crimes Team and created a Special Victims Team for domestic violence, child abuse, sexual assault, and human trafficking.',
        source: 'https://charmeckda.com/about-the-da/',
      },
      {
        issueName: 'Courts',
        issueId: 'government',
        stance: 'His official biography says he removed financial barriers that prevented some defendants from participating in deferred prosecution and broadened referrals to treatment court programs.',
        source: 'https://charmeckda.com/about-the-da/',
      },
    ],
    sources: [{ url: 'https://charmeckda.com/about-the-da/', source_type: 'official_record', title: 'About the DA' }],
    dataStatus: 'complete',
    unopposed: true,
  },
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

/** Filter races to the voter's districts when we know them. */
export function getCandidatesForLocation(location: {
  district: 'NC-8' | 'NC-12' | 'NC-14';
  isCharlotte?: boolean;
  ncSenate?: string;
  ncHouse?: string;
  commission?: string;
}): Candidate[] {
  const all: Candidate[] = [
    ...US_SENATE,
    ...NC_SUPREME_COURT,
    ...NC_COURT_OF_APPEALS,
  ];

  if (location.district === 'NC-8') all.push(...US_HOUSE_NC8);
  else if (location.district === 'NC-12') all.push(...US_HOUSE_NC12);
  else all.push(...US_HOUSE_NC14);

  const senate = location.ncSenate;
  const house = location.ncHouse;
  if (senate || house) {
    for (const c of STATE_LEGISLATURE) {
      if (c.office.startsWith('NC Senate') && senate) {
        if (c.district === senate) all.push(c);
      } else if (c.office.startsWith('NC House') && house) {
        if (c.district === house) all.push(c);
      } else if (!c.office.startsWith('NC Senate') && !c.office.startsWith('NC House')) {
        all.push(c);
      }
    }
  } else {
    all.push(...STATE_LEGISLATURE);
  }

  for (const c of LOCAL_RACES) {
    if (c.office.includes('Commission District') && location.commission) {
      if (c.district === location.commission) all.push(c);
    } else {
      all.push(c);
    }
  }

  return all;
}

/**
 * Sort candidates alphabetically by last name.
 * Used to ensure neutral display order (no party advantage).
 */
export function sortCandidatesAlphabetically(candidates: Candidate[]): Candidate[] {
  return [...candidates].sort((a, b) => {
    const lastNameA = a.name.split(' ').pop() || a.name;
    const lastNameB = b.name.split(' ').pop() || b.name;
    return lastNameA.localeCompare(lastNameB);
  });
}

function localDay(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getDaysUntil(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = localDay(dateString);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Deadline banner: "Last day", "1 day left", "12 days left". */
export function formatDaysLeft(days: number): string {
  if (days <= 0) return 'Last day';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

/** Dates list: "Today", "1 day", "12 days". */
export function formatDaysShort(days: number): string {
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

export function formatDate(dateString: string): string {
  return localDay(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(dateString: string): string {
  return localDay(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatMoney(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${Math.round(amount / 1_000_000)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${amount}`;
}

export function allCandidates(): Candidate[] {
  return [
    ...US_SENATE,
    ...US_HOUSE_NC8,
    ...US_HOUSE_NC12,
    ...US_HOUSE_NC14,
    ...NC_SUPREME_COURT,
    ...NC_COURT_OF_APPEALS,
    ...STATE_LEGISLATURE,
    ...LOCAL_RACES,
  ];
}

/** Unique office titles on the bundled 2026 ballot. */
export function allBallotOffices(): string[] {
  return [...new Set(allCandidates().map((c) => c.office))].sort();
}

export function allMeasureIds(): string[] {
  return [...AMENDMENTS, ...CHARLOTTE_BONDS].map((m) => m.id);
}

export function getNextCriticalDeadline(): ElectionDeadline | null {
  for (const d of DEADLINES) {
    if (d.critical && getDaysUntil(d.date) >= 0) {
      return d;
    }
  }
  return null;
}
