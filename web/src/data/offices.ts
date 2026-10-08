/**
 * Plain-language explainers for offices and measures on the Mecklenburg 2026 ballot.
 * Powers and structure only — no candidate outcomes, no endorsements.
 *
 * Last checked: October 8, 2026
 */

export interface CivicSource {
  title: string;
  url: string;
}

export interface OfficeExplainer {
  id: string;
  name: string;
  oneLiner: string;
  controls: string;
  term: string;
  seats: string;
  /** Two or three concrete, local examples of what this body can decide. */
  localImpact: string[];
  currentHolder?: string;
  currentByDistrict?: Record<string, string>;
  source: CivicSource;
  lastChecked: string;
  jargon?: { term: string; meaning: string }[];
}

export interface MeasureExplainer {
  id: string;
  oneLiner: string;
  yesMeans: string;
  noMeans: string;
  localImpact: string[];
  projectListUrl?: string;
  source: CivicSource;
  lastChecked: string;
}

export const OFFICES_LAST_CHECKED = '2026-10-08';

export const OFFICES: Record<string, OfficeExplainer> = {
  'us-senate': {
    id: 'us-senate',
    name: 'U.S. Senate',
    oneLiner: 'Writes federal laws, confirms judges, and votes on the federal budget and treaties.',
    controls:
      'Each state elects two senators. They vote on federal statutes, spending, tax policy, treaties, and confirmation of federal judges and executive officers.',
    term: '6 years',
    seats: '100 (2 per state)',
    localImpact: [
      'Votes on federal highway, transit, and housing money that can reach Mecklenburg.',
      'Votes on federal taxes and programs such as Medicare and Social Security.',
      'Confirms federal judges who sit in North Carolina courts.',
    ],
    currentHolder: 'Open seat. Current senator in this class: Thom Tillis (term ends January 2027).',
    source: {
      title: 'U.S. Senate — about senators',
      url: 'https://www.senate.gov/senators/about.htm',
    },
    lastChecked: OFFICES_LAST_CHECKED,
  },
  'us-house': {
    id: 'us-house',
    name: 'U.S. House',
    oneLiner: 'Writes federal laws and the federal budget, including money for roads, health care, and taxes.',
    controls:
      'Members represent a congressional district. The House originates federal tax bills and shares lawmaking and spending power with the Senate.',
    term: '2 years',
    seats: '435 voting members',
    localImpact: [
      'Votes on federal funds that can pay for local roads, transit, and housing.',
      'Votes on federal tax and health-care rules that apply in your ZIP.',
      'Helps set disaster and military spending that can affect this region.',
    ],
    currentByDistrict: {
      'NC-8': 'Mark Harris',
      'NC-12': 'Alma S. Adams',
      'NC-14': 'Tim Moore',
    },
    source: {
      title: 'U.S. House — the House explained',
      url: 'https://www.house.gov/the-house-explained',
    },
    lastChecked: OFFICES_LAST_CHECKED,
    jargon: [{ term: 'incumbent', meaning: 'currently holds this seat' }],
  },
  'nc-senate': {
    id: 'nc-senate',
    name: 'NC Senate',
    oneLiner: 'Writes state laws and the state budget, including road and school funding.',
    controls:
      'The Senate is one house of the North Carolina General Assembly. It passes statutes and the state budget with the NC House.',
    term: '2 years',
    seats: '50 (one per Senate district)',
    localImpact: [
      'Helps set how much state money goes to roads in this area.',
      'Helps set the school-funding formula that pays for CMS classrooms.',
      'Votes on state rules for Medicaid, elections, and local government power.',
    ],
    source: {
      title: 'N.C. Constitution, Article II',
      url: 'https://ncleg.gov/Laws/Constitution/Article2',
    },
    lastChecked: OFFICES_LAST_CHECKED,
  },
  'nc-house': {
    id: 'nc-house',
    name: 'NC House',
    oneLiner: 'Writes state laws and the state budget, including road and school funding.',
    controls:
      'The House of Representatives is the other house of the General Assembly. It passes statutes and the state budget with the NC Senate.',
    term: '2 years',
    seats: '120 (one per House district)',
    localImpact: [
      'Helps set how much state money goes to roads in this area.',
      'Helps set the school-funding formula that pays for CMS classrooms.',
      'Votes on state tax and local-government rules that show up on your county bill.',
    ],
    source: {
      title: 'N.C. General Assembly structure',
      url: 'https://www.ncleg.gov/Help/Topic/232',
    },
    lastChecked: OFFICES_LAST_CHECKED,
  },
  'nc-supreme': {
    id: 'nc-supreme',
    name: 'NC Supreme Court',
    oneLiner: 'The state’s highest court. It decides questions of North Carolina law; there is no further appeal on those questions.',
    controls:
      'Reviews whether a trial or the Court of Appeals applied the law correctly. It does not retry facts or sit with a jury. The Chief Justice also heads the Judicial Branch.',
    term: '8 years',
    seats: '7 (Chief Justice and 6 associate justices), elected statewide',
    localImpact: [
      'Has the last word on North Carolina statutes and the state constitution.',
      'Its rulings bind every trial court in Mecklenburg.',
      'Does not write the budget or set your tax rate.',
    ],
    currentHolder: 'Seat 01: Associate Justice Anita Earls',
    source: {
      title: 'North Carolina Supreme Court',
      url: 'https://www.nccourts.gov/courts/supreme-court',
    },
    lastChecked: OFFICES_LAST_CHECKED,
  },
  'nc-appeals': {
    id: 'nc-appeals',
    name: 'NC Court of Appeals',
    oneLiner: 'The state’s middle appeals court. It checks whether a trial court applied the law correctly.',
    controls:
      'Reviews trial-court proceedings for legal error. It decides questions of law, not facts. Cases are usually heard by a panel of three judges.',
    term: '8 years',
    seats: '15 judges, elected statewide',
    localImpact: [
      'Hears most appeals from Mecklenburg trial courts before the Supreme Court can.',
      'Its published opinions guide how local cases are tried.',
      'Does not set taxes, school budgets, or road plans.',
    ],
    source: {
      title: 'North Carolina Court of Appeals',
      url: 'https://www.nccourts.gov/courts/court-of-appeals',
    },
    lastChecked: OFFICES_LAST_CHECKED,
  },
  'meck-commission-atlarge': {
    id: 'meck-commission-atlarge',
    name: 'County Commission (at-large)',
    oneLiner: 'Sets the county property tax rate and the county budget, including money for schools, parks, and libraries.',
    controls:
      'Three at-large commissioners sit on the nine-member Board of County Commissioners with six district members. The board adopts the annual county budget, sets the property tax rate, and sets priorities for health, education, welfare, mental health, and the environment.',
    term: '2 years',
    seats: '3 at-large (countywide), plus 6 district seats',
    localImpact: [
      'Sets the county property tax rate on your bill.',
      'Funds Charlotte-Mecklenburg Schools. It does not run the elected school board.',
      'Funds parks, libraries, public health, and social services.',
    ],
    currentHolder: 'Leigh Altman, Yvette Townsend-Ingram, and Arthur Griffin, Jr.',
    source: {
      title: 'UNC School of Government — County and Municipal Government in North Carolina',
      url: 'https://www.sog.unc.edu/publications/books/county-and-municipal-government-north-carolina-2025-edition',
    },
    lastChecked: OFFICES_LAST_CHECKED,
    jargon: [{ term: 'at-large', meaning: 'elected by the whole county' }],
  },
  'meck-commission-district': {
    id: 'meck-commission-district',
    name: 'County Commission (district)',
    oneLiner: 'Your district seat on the county board that sets the tax rate and funds schools, parks, and libraries.',
    controls:
      'Six district commissioners sit on the nine-member board with three at-large members. The whole board, not one district, adopts the budget and tax rate.',
    term: '2 years',
    seats: '6 district seats (one per commission district)',
    localImpact: [
      'Votes on the county property tax rate and the county budget.',
      'Votes on county money for CMS, parks, libraries, and public health.',
      'Represents your commission district in those countywide votes.',
    ],
    currentByDistrict: {
      '1': 'Elaine Powell',
      '2': 'Vilma D. Leake',
      '3': 'George Dunlap',
      '4': 'Mark Jerrell',
      '5': 'Laura Meier',
      '6': 'Susan Rodriguez-McDowell',
    },
    source: {
      title: 'Mecklenburg Board of County Commissioners',
      url: 'https://bocc.mecknc.gov/',
    },
    lastChecked: OFFICES_LAST_CHECKED,
  },
  'meck-sheriff': {
    id: 'meck-sheriff',
    name: 'Sheriff',
    oneLiner: 'Runs the county jail, courthouse security, and civil papers, and patrols where the county (not a town) is the police.',
    controls:
      'The sheriff is the county’s elected law-enforcement officer. Typical duties include the jail, court security, serving civil process, and patrol in unincorporated areas.',
    term: '4 years',
    seats: '1 per county',
    localImpact: [
      'Operates the Mecklenburg County jail.',
      'Provides security at the courthouse and serves court papers.',
      'Patrols parts of the county that are not inside a city police department.',
    ],
    currentHolder: 'Garry L. McFadden',
    source: {
      title: 'Mecklenburg County Board of Elections — 2026 offices',
      url: 'https://vote.mecknc.gov/2026-offices-ballot-and-filing-fees',
    },
    lastChecked: OFFICES_LAST_CHECKED,
  },
  'meck-clerk': {
    id: 'meck-clerk',
    name: 'Clerk of Superior Court',
    oneLiner: 'Keeps court records and handles estates, guardianships, and some court hearings in this county.',
    controls:
      'One clerk is elected in each county. The clerk keeps superior- and district-court records and acts as judge of probate, with duties over estates, guardianships, some foreclosures, and related matters.',
    term: '4 years',
    seats: '1 per county (100 statewide)',
    localImpact: [
      'Files and keeps Mecklenburg civil, criminal, and estate records.',
      'Handles probate of wills and many guardianship cases.',
      'Can issue some warrants and hold initial criminal appearances.',
    ],
    source: {
      title: 'N.C. Judicial Branch — court officials',
      url: 'https://www.nccourts.gov/learn/court-officials',
    },
    lastChecked: OFFICES_LAST_CHECKED,
  },
  'meck-da': {
    id: 'meck-da',
    name: 'District Attorney',
    oneLiner: 'Prosecutes criminal cases for the state in Mecklenburg courts and sets the criminal trial calendar.',
    controls:
      'The district attorney represents the state in criminal cases in district and superior court, prepares the criminal docket, and advises local law enforcement. Prosecutorial District 26 is Mecklenburg County.',
    term: '4 years',
    seats: '1 per prosecutorial district',
    localImpact: [
      'Decides charging and prosecution of criminal cases filed here.',
      'Sets the criminal trial docket in Mecklenburg courts.',
      'Does not decide civil lawsuits or write county tax policy.',
    ],
    currentHolder: 'Spencer Merriweather (Prosecutorial District 26)',
    source: {
      title: 'N.C. Judicial Branch — court officials',
      url: 'https://www.nccourts.gov/learn/court-officials',
    },
    lastChecked: OFFICES_LAST_CHECKED,
  },
};

export const MEASURES: Record<string, MeasureExplainer> = {
  'nc-amend-photo-id-2026': {
    id: 'nc-amend-photo-id-2026',
    oneLiner: 'Would put a photo-ID rule for all voting, including by mail, into the state constitution.',
    yesMeans:
      'A “for” vote would amend the constitution so that all voters, not only those who vote in person, would have to show photo ID.',
    noMeans:
      'An “against” vote would leave the constitution as it is. In-person photo ID would stay a statute, not this constitutional rule for every method of voting.',
    localImpact: [
      'Would apply to every Mecklenburg voter, including those who vote by mail.',
      'The General Assembly and NCSBE would still write the details of which IDs count.',
    ],
    source: {
      title: 'NCSBE statewide referendums, Nov. 3, 2026',
      url: 'https://s3.amazonaws.com/dl.ncsbe.gov/Elections/2026/Candidate%20Filing/statewide_referendums_20261103.pdf',
    },
    lastChecked: OFFICES_LAST_CHECKED,
  },
  'nc-amend-income-tax-2026': {
    id: 'nc-amend-income-tax-2026',
    oneLiner: 'Would lower the constitution’s maximum state income-tax rate from 7% to 3.5%.',
    yesMeans:
      'A “for” vote would cap the constitutional maximum at 3.5%. The current statutory rate is 3.5%; today’s constitutional ceiling is 7%.',
    noMeans:
      'An “against” vote would leave the constitutional maximum at 7%. The General Assembly could still set the actual rate by statute, up to that cap.',
    localImpact: [
      'Limits how high the statewide personal income-tax rate could go without another amendment.',
      'Does not itself change the county property tax.',
    ],
    source: {
      title: 'NCSBE statewide referendums, Nov. 3, 2026',
      url: 'https://s3.amazonaws.com/dl.ncsbe.gov/Elections/2026/Candidate%20Filing/statewide_referendums_20261103.pdf',
    },
    lastChecked: OFFICES_LAST_CHECKED,
  },
  'nc-amend-property-tax-2026': {
    id: 'nc-amend-property-tax-2026',
    oneLiner: 'Would require the General Assembly to pass laws that limit local property-tax increases.',
    yesMeans:
      'A “for” vote would add a constitutional duty for the legislature to enact limits on how much local governments can raise property taxes.',
    noMeans:
      'An “against” vote would leave local property-tax limits as they are under current statutes.',
    localImpact: [
      'Could change how Mecklenburg County and towns raise the tax on your home or business.',
      'The amendment itself does not set a new rate; the General Assembly would write the limit.',
    ],
    source: {
      title: 'NCSBE statewide referendums, Nov. 3, 2026',
      url: 'https://s3.amazonaws.com/dl.ncsbe.gov/Elections/2026/Candidate%20Filing/statewide_referendums_20261103.pdf',
    },
    lastChecked: OFFICES_LAST_CHECKED,
  },
  'clt-bonds-transportation-2026': {
    id: 'clt-bonds-transportation-2026',
    oneLiner: 'Would let Charlotte borrow up to $280 million for streets, sidewalks, bridges, bike paths, and signals.',
    yesMeans:
      'A “yes” vote authorizes the city to issue up to $280 million in general-obligation bonds for the transportation work listed in the bond order. The city may levy property taxes to repay principal and interest. The city’s filed estimate of added tax per $100,000 of value to service this bond is $0.00 per year.',
    noMeans: 'A “no” vote means the city would not issue these transportation bonds.',
    localImpact: [
      'Funds constructing, widening, paving, and improving streets, roads, and intersections.',
      'Funds sidewalks, bike paths, bridges, drainage, lighting, and traffic signals.',
      'Applies to property in the City of Charlotte, not the rest of the county.',
    ],
    projectListUrl: 'https://www.charlottenc.gov/Growth-and-Development/Charlotte-Future/CIP/Bonds',
    source: {
      title: 'City of Charlotte bond orders (Aug. 10, 2026)',
      url: 'https://charlottenc.legistar.com/LegislationDetail.aspx?GUID=9786730E-5540-4770-9F23-BA2E577D349C&ID=8149745',
    },
    lastChecked: OFFICES_LAST_CHECKED,
  },
  'clt-bonds-housing-2026': {
    id: 'clt-bonds-housing-2026',
    oneLiner: 'Would let Charlotte borrow up to $125 million for housing for low- and moderate-income residents.',
    yesMeans:
      'A “yes” vote authorizes up to $125 million in general-obligation housing bonds, including related infrastructure and land. The city may levy property taxes to repay them. The city’s filed estimate of added tax per $100,000 of value to service this bond is $0.00 per year.',
    noMeans: 'A “no” vote means the city would not issue these housing bonds.',
    localImpact: [
      'Pays capital costs of housing projects for low- or moderate-income residents.',
      'May include related infrastructure and land.',
      'Applies to property in the City of Charlotte.',
    ],
    projectListUrl: 'https://www.charlottenc.gov/Growth-and-Development/Charlotte-Future/CIP/Bonds',
    source: {
      title: 'City of Charlotte bond orders (Aug. 10, 2026)',
      url: 'https://charlottenc.legistar.com/LegislationDetail.aspx?GUID=9786730E-5540-4770-9F23-BA2E577D349C&ID=8149745',
    },
    lastChecked: OFFICES_LAST_CHECKED,
  },
  'clt-bonds-neighborhood-2026': {
    id: 'clt-bonds-neighborhood-2026',
    oneLiner: 'Would let Charlotte borrow up to $20 million for neighborhood curbs, gutters, drainage, and sidewalks.',
    yesMeans:
      'A “yes” vote authorizes up to $20 million in neighborhood-improvement bonds. The city may levy property taxes to repay them. The city’s filed estimate of added tax per $100,000 of value to service this bond is $0.00 per year.',
    noMeans: 'A “no” vote means the city would not issue these neighborhood bonds.',
    localImpact: [
      'Funds curbs, gutters, storm drainage, sidewalks, and paths in city neighborhoods.',
      'May include street paving, lighting, open space, and related land.',
      'Applies to property in the City of Charlotte.',
    ],
    projectListUrl: 'https://www.charlottenc.gov/Growth-and-Development/Charlotte-Future/CIP/Bonds',
    source: {
      title: 'City of Charlotte CIP / city bonds',
      url: 'https://www.charlottenc.gov/Growth-and-Development/Charlotte-Future/CIP/Bonds',
    },
    lastChecked: OFFICES_LAST_CHECKED,
  },
};

const PREFIX_TO_ID: { prefix: string; id: string }[] = [
  { prefix: 'U.S. Senate', id: 'us-senate' },
  { prefix: 'U.S. House', id: 'us-house' },
  { prefix: 'NC Senate', id: 'nc-senate' },
  { prefix: 'NC House', id: 'nc-house' },
  { prefix: 'NC Supreme Court', id: 'nc-supreme' },
  { prefix: 'NC Court of Appeals', id: 'nc-appeals' },
  { prefix: 'Mecklenburg Commissioners At-Large', id: 'meck-commission-atlarge' },
  { prefix: 'Mecklenburg Commission District', id: 'meck-commission-district' },
  { prefix: 'Mecklenburg Sheriff', id: 'meck-sheriff' },
  { prefix: 'Clerk of Superior Court', id: 'meck-clerk' },
  { prefix: 'District Attorney', id: 'meck-da' },
];

export function officeIdFromBallotOffice(office: string): string | null {
  for (const row of PREFIX_TO_ID) {
    if (office === row.prefix || office.startsWith(`${row.prefix} `) || office.startsWith(`${row.prefix}(`)) {
      return row.id;
    }
  }
  return null;
}

export function explainerForOffice(office: string): OfficeExplainer | null {
  const id = officeIdFromBallotOffice(office);
  return id ? OFFICES[id] ?? null : null;
}

export function explainerForMeasure(id: string): MeasureExplainer | null {
  return MEASURES[id] ?? null;
}

export function currentHolderFor(
  explainer: OfficeExplainer,
  district?: string | null
): string | undefined {
  if (district && explainer.currentByDistrict?.[district]) {
    return explainer.currentByDistrict[district];
  }
  return explainer.currentHolder;
}

