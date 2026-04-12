/**
 * North Carolina Candidate Data
 * Real candidates for NC elections - 2024 cycle
 *
 * NOTE: Position stances are summarized from public statements and campaign materials.
 * Always verify with official campaign sources.
 */

export const NC_CANDIDATES = {
  // Federal - Governor Race
  governor: [
    {
      id: 'nc-gov-stein',
      name: 'Josh Stein',
      party: 'Democratic Party',
      office: 'Governor of North Carolina',
      officeLevel: 'state',
      currentPosition: 'NC Attorney General',
      photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Josh_Stein_official_photo.jpg/440px-Josh_Stein_official_photo.jpg',
      religion: 'Jewish',
      previousProfession: 'Attorney',
      website: 'https://joshstein.org',
      bio: 'Josh Stein has served as North Carolina\'s Attorney General since 2017. Before that, he served in the NC State Senate from 2009 to 2016, representing Wake County. He has focused on consumer protection, fighting the opioid epidemic, and criminal justice reform.',
      topInitiatives: [
        'Expand Medicaid to cover 600,000 more North Carolinians',
        'Protect public education and increase teacher pay',
        'Defend reproductive rights',
        'Combat the opioid crisis',
      ],
      positions: [
        { issueName: 'Healthcare', issueId: 'healthcare', stance: 'Supports Medicaid expansion, protecting coverage for pre-existing conditions, and lowering prescription drug costs' },
        { issueName: 'Education', issueId: 'education', stance: 'Advocates for increased public school funding, higher teacher pay, and opposing private school vouchers' },
        { issueName: 'Environment', issueId: 'environment', stance: 'Supports clean energy transition, offshore wind development, and environmental protections' },
        { issueName: 'Economy', issueId: 'economy', stance: 'Focus on workforce development, supporting small businesses, and bringing clean energy jobs to NC' },
        { issueName: 'Criminal Justice', issueId: 'criminal_justice', stance: 'Supports criminal justice reform, addressing root causes of crime, and smart-on-crime policies' },
        { issueName: 'Reproductive Rights', issueId: 'civil_rights', stance: 'Opposes abortion bans, supports protecting reproductive healthcare access' },
      ],
      career: [
        { title: 'NC Attorney General', period: '2017 - Present', description: 'Elected as the state\'s top law enforcement officer' },
        { title: 'NC State Senator', period: '2009 - 2016', description: 'Represented District 16 (Wake County)' },
        { title: 'Senior Deputy Attorney General', period: '2001 - 2008', description: 'Consumer Protection Division' },
      ],
      endorsements: ['Governor Roy Cooper', 'NC Association of Educators', 'Sierra Club'],
    },
    {
      id: 'nc-gov-robinson',
      name: 'Mark Robinson',
      party: 'Republican Party',
      office: 'Governor of North Carolina',
      officeLevel: 'state',
      currentPosition: 'NC Lieutenant Governor',
      photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Mark_Robinson_official_photo_%28cropped%29.jpg/440px-Mark_Robinson_official_photo_%28cropped%29.jpg',
      religion: 'Christian',
      previousProfession: 'Business Owner, Factory Worker',
      website: 'https://markrobinson.com',
      bio: 'Mark Robinson became North Carolina\'s first Black Lieutenant Governor in 2021. Before entering politics, he worked in furniture manufacturing and owned a business. He gained national attention in 2018 after a speech at a Greensboro City Council meeting about gun rights went viral.',
      topInitiatives: [
        'Support law enforcement and public safety',
        'Promote school choice and parental rights in education',
        'Lower taxes and reduce government regulations',
        'Protect Second Amendment rights',
      ],
      positions: [
        { issueName: 'Healthcare', issueId: 'healthcare', stance: 'Supports market-based healthcare solutions, opposes government-run healthcare' },
        { issueName: 'Education', issueId: 'education', stance: 'Strong advocate for school choice, parental rights, and opposing "woke" curriculum' },
        { issueName: 'Environment', issueId: 'environment', stance: 'Supports balanced approach between environment and economic development, skeptical of climate regulations' },
        { issueName: 'Economy', issueId: 'economy', stance: 'Supports tax cuts, reducing regulations, and pro-business policies' },
        { issueName: 'Criminal Justice', issueId: 'criminal_justice', stance: 'Strong support for law enforcement, tough-on-crime policies' },
        { issueName: 'Second Amendment', issueId: 'civil_rights', stance: 'Strong defender of gun rights, opposes gun control measures' },
      ],
      career: [
        { title: 'NC Lieutenant Governor', period: '2021 - Present', description: 'First Black Lt. Governor in NC history' },
        { title: 'Political Activist', period: '2018 - 2020', description: 'Rose to prominence after viral gun rights speech' },
        { title: 'Business Owner', period: '2000s - 2018', description: 'Various business ventures' },
      ],
      endorsements: ['Donald Trump', 'NC Republican Party', 'NRA'],
    },
  ],

  // Federal - US Senate
  senate: [
    {
      id: 'nc-sen-tillis',
      name: 'Thom Tillis',
      party: 'Republican Party',
      office: 'U.S. Senate',
      officeLevel: 'federal',
      currentPosition: 'U.S. Senator',
      photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Thom_Tillis_official_photo.jpg/440px-Thom_Tillis_official_photo.jpg',
      religion: 'Catholic',
      previousProfession: 'Business Executive',
      website: 'https://tillis.senate.gov',
      bio: 'Thom Tillis has served as U.S. Senator from North Carolina since 2015. He previously served as Speaker of the NC House of Representatives from 2011-2014. He focuses on economic issues, national security, and veterans affairs.',
      positions: [
        { issueName: 'Healthcare', issueId: 'healthcare', stance: 'Opposes ACA, supports market-based solutions and state flexibility' },
        { issueName: 'Economy', issueId: 'economy', stance: 'Supports tax cuts, deregulation, and free market policies' },
        { issueName: 'Immigration', issueId: 'immigration', stance: 'Supports border security, has worked on bipartisan immigration reform' },
        { issueName: 'Environment', issueId: 'environment', stance: 'Supports innovation over regulation for environmental issues' },
      ],
      career: [
        { title: 'U.S. Senator', period: '2015 - Present', description: 'Senior Senator from North Carolina' },
        { title: 'NC House Speaker', period: '2011 - 2014', description: 'Led Republican majority in state house' },
      ],
    },
    {
      id: 'nc-sen-budd',
      name: 'Ted Budd',
      party: 'Republican Party',
      office: 'U.S. Senate',
      officeLevel: 'federal',
      currentPosition: 'U.S. Senator',
      photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Ted_Budd_117th_Congress_portrait.jpg/440px-Ted_Budd_117th_Congress_portrait.jpg',
      religion: 'Christian',
      previousProfession: 'Business Owner (Gun Store)',
      website: 'https://budd.senate.gov',
      bio: 'Ted Budd was elected to the U.S. Senate in 2022 after serving in the U.S. House representing North Carolina\'s 13th district from 2017-2023. He owns a gun store and shooting range and is known for conservative positions.',
      positions: [
        { issueName: 'Healthcare', issueId: 'healthcare', stance: 'Opposes government healthcare expansion, supports free market solutions' },
        { issueName: 'Economy', issueId: 'economy', stance: 'Strong supporter of tax cuts and reducing government spending' },
        { issueName: 'Second Amendment', issueId: 'civil_rights', stance: 'Gun store owner, strong defender of Second Amendment rights' },
        { issueName: 'Immigration', issueId: 'immigration', stance: 'Supports strict border security and enforcement' },
      ],
      career: [
        { title: 'U.S. Senator', period: '2023 - Present', description: 'Junior Senator from North Carolina' },
        { title: 'U.S. Representative', period: '2017 - 2023', description: 'NC-13 Congressional District' },
      ],
    },
  ],

  // State Legislature - populated from Open States or DB when available
  stateLegislature: [],

  // Local - Charlotte/Mecklenburg (real candidates only)
  local: [
    {
      id: 'nc-clt-mayor',
      name: 'Vi Lyles',
      party: 'Democratic Party',
      office: 'Mayor of Charlotte',
      officeLevel: 'local',
      currentPosition: 'Mayor of Charlotte',
      photo: null,
      bio: 'Vi Lyles has served as Mayor of Charlotte since 2017 and was re-elected in 2019 and 2022. She is the first African American woman to serve as Charlotte\'s mayor. Before politics, she had a long career in city government.',
      topInitiatives: [
        'Affordable housing initiatives',
        'Economic mobility and opportunity',
        'Public safety improvements',
        'Infrastructure investment',
      ],
      positions: [
        { issueName: 'Housing', issueId: 'housing', stance: 'Champion of affordable housing, led $50M housing trust fund' },
        { issueName: 'Economy', issueId: 'economy', stance: 'Focus on economic mobility and reducing inequality' },
        { issueName: 'Transportation', issueId: 'economy', stance: 'Supports CATS light rail expansion and transit investment' },
      ],
      career: [
        { title: 'Mayor of Charlotte', period: '2017 - Present', description: 'First Black female mayor of Charlotte' },
        { title: 'Charlotte City Council', period: '2011 - 2015', description: 'At-Large representative' },
        { title: 'Assistant City Manager', period: '2004 - 2011', description: 'City of Charlotte' },
      ],
    },
  ],

  // School Board - populated from Open States or DB when available
  schoolBoard: [],
};

// Election dates and info for NC
export const NC_ELECTIONS = {
  general2024: {
    id: 'nc-general-2024',
    name: '2024 General Election',
    date: '2024-11-05',
    type: 'general',
    state: 'NC',
    registrationDeadline: '2024-10-11',
    earlyVotingStart: '2024-10-17',
    earlyVotingEnd: '2024-11-02',
    offices: [
      'President of the United States',
      'Governor of North Carolina',
      'Lieutenant Governor',
      'U.S. Senate (if applicable)',
      'U.S. House of Representatives',
      'NC Supreme Court',
      'NC Court of Appeals',
      'NC State Senate',
      'NC House of Representatives',
      'Local offices',
    ],
  },
  primary2024: {
    id: 'nc-primary-2024',
    name: '2024 Primary Election',
    date: '2024-03-05',
    type: 'primary',
    state: 'NC',
    registrationDeadline: '2024-02-09',
    completed: true,
  },
  municipal2025: {
    id: 'nc-municipal-2025',
    name: '2025 Municipal Elections',
    date: '2025-11-04',
    type: 'municipal',
    state: 'NC',
    offices: [
      'Charlotte Mayor',
      'Charlotte City Council',
      'Town Councils',
      'School Boards',
    ],
  },
};

// Helper to get all NC candidates as flat array
export const getAllNCCandidates = () => {
  return [
    ...NC_CANDIDATES.governor,
    ...NC_CANDIDATES.senate,
    ...NC_CANDIDATES.stateLegislature,
    ...NC_CANDIDATES.local,
    ...NC_CANDIDATES.schoolBoard,
  ];
};

// Helper to get candidates by office level
export const getNCCandidatesByLevel = (level) => {
  switch (level) {
    case 'federal':
      return NC_CANDIDATES.senate;
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

export default NC_CANDIDATES;
