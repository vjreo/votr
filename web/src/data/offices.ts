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
  /** Hide term / seats / current holder (place rows, not an elected seat). */
  hideMeta?: boolean;
}

export interface SourcedClaim {
  text: string;
  source: CivicSource;
}

export interface MeasureExplainer {
  id: string;
  oneLiner: string;
  yesMeans: string;
  noMeans: string;
  localImpact: string[];
  /**
   * Draft paired arguments. Shown only when both sides have text,
   * so a one-sided brief cannot appear alone.
   */
  caseFor?: SourcedClaim[];
  caseAgainst?: SourcedClaim[];
  argumentsDraft?: boolean;
  projectListUrl?: string;
  source: CivicSource;
  lastChecked: string;
}

function keptClaims(claims: SourcedClaim[] | undefined): SourcedClaim[] {
  return (claims ?? [])
    .map((claim) => ({ ...claim, text: claim.text.trim() }))
    .filter((claim) => claim.text);
}

/** Both sides, or nothing. A single side would be an endorsement by omission. */
export function pairedArguments(
  explainer: MeasureExplainer | null | undefined
): { for: SourcedClaim[]; against: SourcedClaim[]; draft: boolean } | null {
  if (!explainer) return null;
  const forSide = keptClaims(explainer.caseFor);
  const againstSide = keptClaims(explainer.caseAgainst);
  if (!forSide.length || !againstSide.length) return null;
  return { for: forSide, against: againstSide, draft: explainer.argumentsDraft === true };
}

export const OFFICES_LAST_CHECKED = '2026-10-08';

export const OFFICES: Record<string, OfficeExplainer> = {
  'meck-county': {
    id: 'meck-county',
    name: 'Mecklenburg County',
    oneLiner: 'County government funds schools, parks, libraries, and public health, and it sets the county property tax.',
    controls:
      'North Carolina counties provide services such as health, social services, and a share of school funding. The elected Board of County Commissioners adopts the budget and tax rate. Other county offices (sheriff, clerk, district attorney) are elected separately.',
    term: '',
    seats: '',
    hideMeta: true,
    localImpact: [
      'Funds Charlotte-Mecklenburg Schools. It does not run the elected school board.',
      'Runs parks, libraries, public health, and social services.',
      'Sheriff, clerk, and district attorney are separate elected offices.',
    ],
    source: {
      title: 'UNC School of Government — County and Municipal Government in North Carolina',
      url: 'https://www.sog.unc.edu/publications/books/county-and-municipal-government-north-carolina-2025-edition',
    },
    lastChecked: OFFICES_LAST_CHECKED,
  },
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
    seats: '9 members (3 at-large, 6 district)',
    localImpact: [
      'Represents your commission district in countywide budget and tax votes.',
      'The whole board, not one district, adopts the budget and tax rate.',
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
      'An “against” vote would leave the constitution as it is. Photo identification for in-person voting would remain in the constitution. Rules for other methods of voting would stay in statute.',
    localImpact: [
      'Would apply to every Mecklenburg voter, including those who vote by mail.',
      'The General Assembly would still write the laws that say which IDs count, and those laws may include exceptions.',
    ],
    caseFor: [
      {
        text: 'Session Law 2024-58 would change the constitution so voters present photographic identification before voting, not only when voting in person. The General Assembly would still set which identification counts, and those laws may include exceptions. The question on the ballot is: Constitutional amendment to require all voters, not just those presenting to vote in person, to present photo identification before voting.',
        source: {
          title: 'Session Law 2024-58 (NCGA)',
          url: 'https://www.ncleg.gov/EnactedLegislation/SessionLaws/HTML/2023-2024/SL2024-58.html',
        },
      },
      {
        text: 'Sen. Warren Daniel, a sponsor, said the requirement needs to apply equally to all voters and that the constitution should say so.',
        source: {
          title: 'Wilmington StarNews, Dec. 11, 2024, quoting Sen. Warren Daniel',
          url: 'https://www.starnewsonline.com/story/news/politics/2024/12/11/what-is-the-photo-id-related-constitutional-amendment/76890603007/',
        },
      },
    ],
    caseAgainst: [
      {
        text: 'A nonpartisan staff summary of Senate Bill 921 says state law already requires a voter who returns an absentee ballot to include a copy of a photo ID or an exception affidavit. The summary lists in-person exceptions for a religious objection, a reasonable impediment, and a natural disaster.',
        source: {
          title: 'NCGA staff summary of Senate Bill 921',
          url: 'https://dashboard.ncleg.gov/api/Services/BillSummary/2023/S921-SMCH-55(e1)-v-2',
        },
      },
      {
        text: 'The North Carolina Democratic Party, which opposes the amendment, said it would place the photo-identification requirement in the constitution without writing those existing safeguards into the constitution. The party said it is concerned this could add difficulty for military, student, rural, and older voters.',
        source: {
          title: 'North Carolina Democratic Party, Sept. 11, 2026',
          url: 'https://www.ncdp.org/content/090926/',
        },
      },
    ],
    argumentsDraft: true,
    source: {
      title: 'NCSBE statewide referendums, Nov. 3, 2026',
      url: 'https://s3.amazonaws.com/dl.ncsbe.gov/Elections/2026/Candidate%20Filing/statewide_referendums_20261103.pdf',
    },
    lastChecked: '2026-11-15',
  },
  'nc-amend-income-tax-2026': {
    id: 'nc-amend-income-tax-2026',
    oneLiner: 'Would lower the constitution’s maximum state income-tax rate from 7% to 3.5%.',
    yesMeans:
      'A “for” vote would lower the constitutional maximum rate on income from 7% to 3.5%, beginning with tax years that start on or after January 1, 2027. It does not itself set the statutory rate.',
    noMeans:
      'An “against” vote would leave the constitutional maximum at 7%. The General Assembly could still set the actual rate by statute, up to that cap.',
    localImpact: [
      'Lowers the constitutional ceiling on personal and corporate income taxes from 7% to 3.5% starting January 1, 2027. A rate above 3.5% would need another amendment.',
      'The Fiscal Research Division note of May 19, 2026 says the personal rate is 3.99% in 2026. Its May 2026 forecast expected 3.49% in 2027 if a revenue trigger is met. If that trigger is missed, the note says the new ceiling would require the personal rate to come down.',
      'The same note says the statutory corporate rate is already below 3.5% (2% in 2026 and 2027).',
      'Does not itself change the county property tax.',
    ],
    caseFor: [
      {
        text: 'Session Law 2026-4 would lower the constitutional maximum rate on income from 7% to 3.5% for tax years beginning on or after January 1, 2027. The nonpartisan Legislative Services Office summary uses the same description. That summary was adopted on August 20, 2026, for county boards of elections and the press.',
        source: {
          title: 'Legislative Services Office summary, Aug. 20, 2026',
          url: 'https://gofcsonc.com/elections/assets/documents/Summary_Explanation_of_2026_Constitutional_Amendments.pdf',
        },
      },
      {
        text: 'The General Assembly Fiscal Research Division says an approved amendment would keep the maximum rate on personal and corporate income at 3.5% from that date. A higher rate would require another constitutional amendment.',
        source: {
          title: 'NCGA Fiscal Research Division note on Senate Bill 1080, May 19, 2026',
          url: 'https://www.ncleg.gov/Sessions/2025/FiscalNotes/Senate/PDF/SFN1080v1.pdf',
        },
      },
    ],
    caseAgainst: [
      {
        text: 'The same Fiscal Research Division note estimates no change to forecasted revenue, because the personal income-tax rate is 3.99% in 2026 and a May 2026 forecast expected 3.49% in 2027 if a revenue trigger is met. The note says the corporate rate is already below 3.5%.',
        source: {
          title: 'NCGA Fiscal Research Division note on Senate Bill 1080, May 19, 2026',
          url: 'https://www.ncleg.gov/Sessions/2025/FiscalNotes/Senate/PDF/SFN1080v1.pdf',
        },
      },
      {
        text: 'A no vote would leave the constitutional maximum at 7%. The note also says that if the revenue trigger is missed, the personal rate would otherwise stay 3.99%, and a 3.5% ceiling would then require that rate to come down.',
        source: {
          title: 'NCGA Fiscal Research Division note on Senate Bill 1080, May 19, 2026',
          url: 'https://www.ncleg.gov/Sessions/2025/FiscalNotes/Senate/PDF/SFN1080v1.pdf',
        },
      },
    ],
    argumentsDraft: true,
    source: {
      title: 'NCSBE statewide referendums, Nov. 3, 2026',
      url: 'https://s3.amazonaws.com/dl.ncsbe.gov/Elections/2026/Candidate%20Filing/statewide_referendums_20261103.pdf',
    },
    lastChecked: '2026-11-15',
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
      'The amendment itself does not set a percentage or a date. The General Assembly would write the limit, and the law may include exceptions.',
    ],
    caseFor: [
      {
        text: 'Session Law 2026-5 would require the General Assembly to pass general laws that limit how much a local property-tax levy may increase. Those laws may include exceptions.',
        source: {
          title: 'Session Law 2026-5 (NCGA)',
          url: 'https://www.ncleg.gov/EnactedLegislation/SessionLaws/PDF/2025-2026/SL2026-5.pdf',
        },
      },
      {
        text: 'The official ballot question is: “Constitutional amendment requiring limits on property tax increases by local governments.” The nonpartisan Legislative Services Office summary, adopted August 20, 2026, says the amendment would require the General Assembly to set those limits.',
        source: {
          title: 'Legislative Services Office summary, Aug. 20, 2026',
          url: 'https://gofcsonc.com/elections/assets/documents/Summary_Explanation_of_2026_Constitutional_Amendments.pdf',
        },
      },
    ],
    caseAgainst: [
      {
        text: 'The session law sets no percentage and no deadline. It says the laws the General Assembly passes may include exceptions, so the size of any limit is not on the ballot.',
        source: {
          title: 'Session Law 2026-5 (NCGA)',
          url: 'https://www.ncleg.gov/EnactedLegislation/SessionLaws/PDF/2025-2026/SL2026-5.pdf',
        },
      },
      {
        text: 'A no vote would leave that section of the constitution unchanged. Session Law 2026-5 says the new sentence has no effect if a majority of votes on the question are against it.',
        source: {
          title: 'Session Law 2026-5 (NCGA)',
          url: 'https://www.ncleg.gov/EnactedLegislation/SessionLaws/PDF/2025-2026/SL2026-5.pdf',
        },
      },
    ],
    argumentsDraft: true,
    source: {
      title: 'NCSBE statewide referendums, Nov. 3, 2026',
      url: 'https://s3.amazonaws.com/dl.ncsbe.gov/Elections/2026/Candidate%20Filing/statewide_referendums_20261103.pdf',
    },
    lastChecked: '2026-11-15',
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
    caseFor: [
      {
        text: 'The bond question asks Charlotte voters to authorize $280,000,000, plus interest, for streets, sidewalks, bicycle paths, bridges, and related work. It states the city’s estimate of the property-tax increase to repay that debt is $0.00 a year for each $100,000 of property value.',
        source: {
          title: 'Charlotte transportation bond question, quoted by Ballotpedia',
          url: 'https://ballotpedia.org/Charlotte,_North_Carolina,_Transportation_Bond_Measure_(November_2026)',
        },
      },
    ],
    caseAgainst: [
      {
        text: 'The same question says additional property taxes may be levied in an amount sufficient to pay the principal and the interest. It also states an estimated cost over the life of the bonds, using the highest interest rate charged for similar debt over the previous 20 years. A no vote would not authorize this borrowing.',
        source: {
          title: 'Charlotte transportation bond question, quoted by Ballotpedia',
          url: 'https://ballotpedia.org/Charlotte,_North_Carolina,_Transportation_Bond_Measure_(November_2026)',
        },
      },
    ],
    argumentsDraft: true,
    projectListUrl: 'https://www.charlottenc.gov/Growth-and-Development/Charlotte-Future/CIP/Bonds',
    source: {
      title: 'City of Charlotte bond orders (Aug. 10, 2026)',
      url: 'https://charlottenc.legistar.com/LegislationDetail.aspx?GUID=9786730E-5540-4770-9F23-BA2E577D349C&ID=8149745',
    },
    lastChecked: '2026-11-15',
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
    caseFor: [
      {
        text: 'The bond question asks Charlotte voters to authorize $125,000,000, plus interest, for housing projects for people of low or moderate income, including related infrastructure and land. It states the city’s estimate of the property-tax increase to repay that debt is $0.00 a year for each $100,000 of property value.',
        source: {
          title: 'Charlotte housing bond question, quoted by Ballotpedia',
          url: 'https://ballotpedia.org/Charlotte,_North_Carolina,_Housing_Bond_Measure_(November_2026)',
        },
      },
    ],
    caseAgainst: [
      {
        text: 'The same question says additional property taxes may be levied in an amount sufficient to pay the principal and the interest. It also states an estimated cost over the life of the bonds, using the highest interest rate charged for similar debt over the previous 20 years. A no vote would not authorize this borrowing.',
        source: {
          title: 'Charlotte housing bond question, quoted by Ballotpedia',
          url: 'https://ballotpedia.org/Charlotte,_North_Carolina,_Housing_Bond_Measure_(November_2026)',
        },
      },
    ],
    argumentsDraft: true,
    projectListUrl: 'https://www.charlottenc.gov/Growth-and-Development/Charlotte-Future/CIP/Bonds',
    source: {
      title: 'City of Charlotte bond orders (Aug. 10, 2026)',
      url: 'https://charlottenc.legistar.com/LegislationDetail.aspx?GUID=9786730E-5540-4770-9F23-BA2E577D349C&ID=8149745',
    },
    lastChecked: '2026-11-15',
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
    caseFor: [
      {
        text: 'The bond question asks Charlotte voters to authorize $20,000,000, plus interest, for neighborhood infrastructure, including curbs, gutters, drainage, sidewalks, paths, and related street work. It states the city’s estimate of the property-tax increase to repay that debt is $0.00 a year for each $100,000 of property value.',
        source: {
          title: 'Charlotte neighborhood bond question, quoted by Ballotpedia',
          url: 'https://ballotpedia.org/Charlotte,_North_Carolina,_Neighborhood_Improvements_Bond_Measure_(November_2026)',
        },
      },
    ],
    caseAgainst: [
      {
        text: 'The same question says additional property taxes may be levied in an amount sufficient to pay the principal and the interest. It also states an estimated cost over the life of the bonds, using the highest interest rate charged for similar debt over the previous 20 years. A no vote would not authorize this borrowing.',
        source: {
          title: 'Charlotte neighborhood bond question, quoted by Ballotpedia',
          url: 'https://ballotpedia.org/Charlotte,_North_Carolina,_Neighborhood_Improvements_Bond_Measure_(November_2026)',
        },
      },
    ],
    argumentsDraft: true,
    projectListUrl: 'https://www.charlottenc.gov/Growth-and-Development/Charlotte-Future/CIP/Bonds',
    source: {
      title: 'City of Charlotte CIP / city bonds',
      url: 'https://www.charlottenc.gov/Growth-and-Development/Charlotte-Future/CIP/Bonds',
    },
    lastChecked: '2026-11-15',
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

