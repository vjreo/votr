/**
 * Daily Civic Lessons
 * Short, engaging lessons about government, civics, and NC-specific topics
 * Inspired by Duolingo/Heroic daily content model
 */

export interface CivicLesson {
  id: string;
  title: string;
  category: 'basics' | 'nc_specific' | 'federal' | 'local' | 'history' | 'voting';
  duration: string; // e.g., "2 min"
  icon: string;
  content: string;
  keyPoints: string[];
  funFact?: string;
  quiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  xpReward: number;
}

export const LESSON_CATEGORIES = [
  { key: 'basics', label: 'Government Basics', icon: '🏛️', color: '#3498DB' },
  { key: 'nc_specific', label: 'North Carolina', icon: '🌲', color: '#27AE60' },
  { key: 'federal', label: 'Federal Government', icon: '🦅', color: '#9B59B6' },
  { key: 'local', label: 'Local Government', icon: '🏘️', color: '#E67E22' },
  { key: 'history', label: 'Civic History', icon: '📜', color: '#C0392B' },
  { key: 'voting', label: 'Voting & Elections', icon: '🗳️', color: '#1ABC9C' },
];

export const CIVIC_LESSONS: CivicLesson[] = [
  // === GOVERNMENT BASICS ===
  {
    id: 'basics-1',
    title: 'Three Branches of Government',
    category: 'basics',
    duration: '2 min',
    icon: '🏛️',
    content: `The U.S. government is divided into three branches, each with distinct powers. This "separation of powers" prevents any one group from having too much control.

**Legislative Branch (Congress)**
Makes the laws. Consists of the Senate (100 members, 2 per state) and House of Representatives (435 members, based on population).

**Executive Branch (President)**
Enforces the laws. The President leads the executive branch, which includes the Cabinet and federal agencies.

**Judicial Branch (Courts)**
Interprets the laws. The Supreme Court is the highest court, with 9 justices who serve for life.`,
    keyPoints: [
      'Legislative Branch makes laws (Congress)',
      'Executive Branch enforces laws (President)',
      'Judicial Branch interprets laws (Courts)',
      'Each branch can "check" the others',
    ],
    funFact: 'The Founding Fathers got this idea from French philosopher Montesquieu, who wrote about it in 1748!',
    quiz: {
      question: 'Which branch of government makes the laws?',
      options: ['Executive', 'Legislative', 'Judicial', 'Presidential'],
      correctIndex: 1,
      explanation: 'The Legislative Branch (Congress) is responsible for making laws. The Executive Branch enforces them, and the Judicial Branch interprets them.',
    },
    xpReward: 15,
  },
  {
    id: 'basics-2',
    title: 'What Does Your Governor Actually Do?',
    category: 'basics',
    duration: '2 min',
    icon: '👔',
    content: `Your Governor is like a mini-President for your state. They're the chief executive of state government and have significant power over your daily life.

**Key Responsibilities:**

• **Signs or vetoes state laws** - Bills passed by the state legislature need the Governor's signature to become law

• **Creates the state budget** - Proposes how billions of dollars are spent on schools, roads, healthcare

• **Appoints officials** - Judges, agency heads, board members

• **Commands the National Guard** - Can deploy in emergencies

• **Grants pardons** - Can forgive state crimes

In NC, the Governor serves 4-year terms and can serve a maximum of 2 consecutive terms.`,
    keyPoints: [
      'Signs or vetoes state legislation',
      'Proposes the state budget',
      'Appoints judges and officials',
      'Can declare state emergencies',
    ],
    funFact: 'North Carolina\'s Governor is one of the weakest in the nation by design - the NC Constitution limits their appointment powers more than most states.',
    quiz: {
      question: 'What happens when a Governor vetoes a bill?',
      options: [
        'The bill is permanently killed',
        'The legislature can override with enough votes',
        'It goes to the Supreme Court',
        'The bill becomes a suggestion',
      ],
      correctIndex: 1,
      explanation: 'A Governor\'s veto can be overridden if the legislature has enough votes (usually 2/3 majority). This is part of the checks and balances system.',
    },
    xpReward: 15,
  },
  {
    id: 'basics-3',
    title: 'How a Bill Becomes a Law',
    category: 'basics',
    duration: '3 min',
    icon: '📝',
    content: `Ever wonder how an idea becomes an actual law? Here's the journey:

**1. Introduction**
A legislator (Senator or Representative) introduces the bill. Anyone can suggest an idea, but only elected officials can formally introduce it.

**2. Committee Review**
The bill goes to a committee of experts in that topic. Most bills die here - committees decide if they're worth considering.

**3. Floor Debate**
If the committee approves, the full chamber debates and may amend the bill.

**4. Vote**
If it passes one chamber (House or Senate), it goes to the other chamber and repeats the process.

**5. Conference Committee**
If the two chambers pass different versions, they negotiate a compromise.

**6. Presidential/Governor Action**
The executive can sign it (becomes law), veto it (sent back), or do nothing (becomes law after 10 days, or "pocket veto" if Congress adjourns).`,
    keyPoints: [
      'Bills start in either chamber of the legislature',
      'Committees filter out most bills',
      'Both chambers must pass identical versions',
      'The executive can sign, veto, or let it become law',
    ],
    funFact: 'Only about 4% of bills introduced in Congress actually become law. Most never even get a committee vote!',
    quiz: {
      question: 'Where do most bills "die" in the legislative process?',
      options: ['On the floor vote', 'In committee', 'After a veto', 'At introduction'],
      correctIndex: 1,
      explanation: 'Most bills never make it out of committee. Committees act as gatekeepers, deciding which bills are worth the full legislature\'s time.',
    },
    xpReward: 20,
  },

  // === NC SPECIFIC ===
  {
    id: 'nc-1',
    title: 'Understanding North Carolina Government',
    category: 'nc_specific',
    duration: '2 min',
    icon: '🌲',
    content: `North Carolina has its own three-branch system that mirrors the federal government.

**Executive Branch**
Led by the Governor, but NC has a unique "Council of State" - 10 executives elected independently:
• Governor
• Lieutenant Governor
• Attorney General
• Secretary of State
• State Auditor
• State Treasurer
• Superintendent of Public Instruction
• Commissioner of Agriculture
• Commissioner of Insurance
• Commissioner of Labor

**Legislative Branch**
Called the "General Assembly":
• NC Senate: 50 members, 2-year terms
• NC House: 120 members, 2-year terms

**Judicial Branch**
• NC Supreme Court (7 justices)
• NC Court of Appeals (15 judges)
• Superior & District Courts`,
    keyPoints: [
      'NC has 10 independently elected executives',
      'General Assembly has 170 total legislators',
      'All state legislators serve 2-year terms',
      'NC Supreme Court has 7 justices',
    ],
    funFact: 'NC is one of only 12 states that still elect judges in partisan elections - meaning judicial candidates run as Democrats or Republicans.',
    quiz: {
      question: 'How many members are in the NC House of Representatives?',
      options: ['50', '100', '120', '170'],
      correctIndex: 2,
      explanation: 'The NC House has 120 members, while the NC Senate has 50 members. Together they form the General Assembly with 170 total legislators.',
    },
    xpReward: 15,
  },
  {
    id: 'nc-2',
    title: 'NC Lieutenant Governor: More Than a Backup',
    category: 'nc_specific',
    duration: '2 min',
    icon: '🎖️',
    content: `Unlike the U.S. Vice President, North Carolina's Lieutenant Governor has real constitutional duties beyond just waiting for something to happen to the Governor.

**Key Responsibilities:**

• **Presides over the NC Senate** - Like the VP does for the U.S. Senate, can break tie votes

• **Chairs 7 state boards and commissions** - Including the State Board of Community Colleges and State Board of Education

• **Serves as Governor** - When the Governor is out of state or incapacitated

**Important:** NC's Lt. Governor is elected separately from the Governor - they don't run as a ticket! This means a Democrat Governor and Republican Lt. Governor can serve at the same time.

The Lt. Governor is paid about $175,000/year and serves a 4-year term.`,
    keyPoints: [
      'Presides over the NC Senate',
      'Chairs important state boards',
      'Elected separately from the Governor',
      'Can be from a different party than the Governor',
    ],
    funFact: 'In 2020, Mark Robinson became the first Black person elected as NC Lieutenant Governor in state history.',
    quiz: {
      question: 'In NC, the Governor and Lt. Governor must be from the same party.',
      options: ['True', 'False'],
      correctIndex: 1,
      explanation: 'False! Unlike the President/VP, NC\'s Governor and Lt. Governor run in separate races. They can be from different parties.',
    },
    xpReward: 15,
  },
  {
    id: 'nc-3',
    title: 'How Charlotte Local Government Works',
    category: 'nc_specific',
    duration: '2 min',
    icon: '🏙️',
    content: `Charlotte is NC's largest city with over 900,000 people. Here's how it's governed:

**City Council**
• 11 members total: Mayor + 4 at-large + 6 district representatives
• Meets twice monthly
• Sets city policies, approves budget, passes ordinances

**Mayor**
• Elected citywide to 2-year term
• Presides over council meetings
• Can vote on all matters (tie-breaker role)
• Represents Charlotte externally

**City Manager**
• Appointed by City Council (not elected)
• Actually runs day-to-day city operations
• Hires/fires department heads
• Proposes the budget

Charlotte uses a "council-manager" form of government, meaning the City Manager has more administrative power than the Mayor.

**Mecklenburg County**
Separate from the city! The County Commission handles things like health department, courts, and parks.`,
    keyPoints: [
      '11-member City Council (Mayor + 10)',
      'City Manager runs daily operations',
      'Mayor presides but doesn\'t manage',
      'Mecklenburg County is separate from Charlotte',
    ],
    funFact: 'Charlotte\'s city limits have grown over 350% since 1960 through annexation, absorbing many surrounding communities.',
    quiz: {
      question: 'Who handles day-to-day operations in Charlotte?',
      options: ['The Mayor', 'The City Manager', 'The County Commission', 'The Governor'],
      correctIndex: 1,
      explanation: 'Charlotte uses a council-manager system where the appointed City Manager, not the elected Mayor, handles daily operations.',
    },
    xpReward: 15,
  },

  // === VOTING ===
  {
    id: 'voting-1',
    title: 'Early Voting in North Carolina',
    category: 'voting',
    duration: '2 min',
    icon: '🗳️',
    content: `North Carolina offers some of the most accessible early voting options in the country!

**Early Voting Period**
NC has 17 days of early voting before Election Day, including two Saturdays and one Sunday.

**Key Benefits:**

• **Vote at ANY location** - During early voting, you can vote at any early voting site in your county, not just your assigned precinct

• **Same-day registration** - You can register AND vote at the same time during early voting (not available on Election Day!)

• **Shorter lines** - Typically less crowded than Election Day

• **Flexibility** - Sites often have extended hours

**2024 Early Voting:**
October 17 - November 2, 2024

Find early voting sites at ncsbe.gov`,
    keyPoints: [
      '17 days of early voting in NC',
      'Vote at any site in your county',
      'Same-day registration available',
      'Includes weekend voting options',
    ],
    funFact: 'In 2020, over 60% of NC voters used early voting or mail-in ballots rather than voting on Election Day!',
    quiz: {
      question: 'Can you register to vote AND cast your ballot on the same day in NC?',
      options: [
        'Yes, but only during early voting',
        'Yes, including on Election Day',
        'No, you must register 25 days before',
        'Only if you\'re a first-time voter',
      ],
      correctIndex: 0,
      explanation: 'NC offers same-day registration, but only during the early voting period. On Election Day itself, you must already be registered.',
    },
    xpReward: 15,
  },
  {
    id: 'voting-2',
    title: 'NC Voter ID Requirements',
    category: 'voting',
    duration: '2 min',
    icon: '🪪',
    content: `As of 2023, North Carolina requires photo ID to vote. Here's what you need to know:

**Accepted IDs:**
• NC Driver's License or ID
• US Passport
• NC Voter Photo ID Card (free from county board of elections)
• US Military ID
• Tribal ID
• Certain student IDs (UNC system, community colleges)

**Don't Have an ID?**
• Get a FREE Voter Photo ID card at your county board of elections
• Fill out a "reasonable impediment" declaration form

**Exceptions:**
If you have a "reasonable impediment" to getting ID, you can still vote by:
1. Filling out a form explaining why
2. Casting a provisional ballot

**Note:** The ID requirement is still being legally challenged and rules may change.`,
    keyPoints: [
      'Photo ID now required to vote in NC',
      'Free voter ID cards are available',
      'Many ID types accepted including student IDs',
      'Exceptions exist if getting ID is difficult',
    ],
    funFact: 'NC\'s voter ID law has been through multiple legal challenges since 2013. The current version went into effect in 2023.',
    quiz: {
      question: 'What should you do if you can\'t obtain a photo ID to vote in NC?',
      options: [
        'You cannot vote',
        'Fill out an impediment form and cast provisional ballot',
        'Vote by mail only',
        'Have someone vouch for you',
      ],
      correctIndex: 1,
      explanation: 'If you have a reasonable impediment to obtaining ID, you can fill out a form explaining why and still cast a provisional ballot.',
    },
    xpReward: 15,
  },
  {
    id: 'voting-3',
    title: 'What\'s on Your Ballot Besides Big Races?',
    category: 'voting',
    duration: '2 min',
    icon: '📋',
    content: `The President and Governor get all the attention, but your ballot has much more! These "down-ballot" races often affect your life more directly.

**State Judicial Races**
NC elects judges! Supreme Court and Court of Appeals judges make decisions on everything from voting rights to environmental regulations.

**State Legislature**
Your NC House and Senate representatives write state laws, set the budget for schools, and draw voting district maps.

**County Commissioners**
Control county budget, including funding for health departments, emergency services, and schools.

**School Board**
Oversee curriculum decisions, school budgets, and policies affecting students directly.

**Soil & Water Conservation**
Yes, really! They manage local environmental and agricultural policies.

**Constitutional Amendments**
Ballot measures that can change the state constitution.

**Pro tip:** Research all races before you vote. VOTER can help!`,
    keyPoints: [
      'NC elects judges at all levels',
      'School board affects curriculum and budgets',
      'County commissioners control local services',
      'Ballot measures can change the state constitution',
    ],
    funFact: 'School board elections in many NC counties have the lowest turnout of any race - sometimes under 10% - but make decisions affecting over 1.5 million students!',
    quiz: {
      question: 'Which office has the most direct impact on local K-12 education?',
      options: ['Governor', 'School Board', 'State Senator', 'County Commissioner'],
      correctIndex: 1,
      explanation: 'School board members make direct decisions about curriculum, school budgets, teacher hiring, and school policies - affecting students daily.',
    },
    xpReward: 15,
  },

  // === LOCAL GOVERNMENT ===
  {
    id: 'local-1',
    title: 'Why Local Elections Matter Most',
    category: 'local',
    duration: '2 min',
    icon: '🏘️',
    content: `Here's a secret: local government affects your daily life more than federal government. Yet local elections have the lowest turnout!

**What Local Government Controls:**

🚗 **Your Commute** - Road maintenance, traffic lights, public transit

🚔 **Your Safety** - Police and fire departments, emergency services

🏫 **Your Kids' Schools** - School funding, facilities, policies

💧 **Your Water** - Water quality, sewage, utilities

🏗️ **Your Neighborhood** - Zoning, new construction, noise ordinances

🗑️ **Your Trash** - Garbage collection, recycling programs

💰 **Your Property Taxes** - Set by county and municipal governments

**The Turnout Problem:**
• Presidential elections: ~60-70% turnout
• Midterm elections: ~40-50% turnout
• Local elections: Often under 20%!

Your vote counts SO much more in local races!`,
    keyPoints: [
      'Local government controls daily services',
      'Local elections have very low turnout',
      'Your vote has more impact in local races',
      'Property taxes are set locally',
    ],
    funFact: 'Some Charlotte City Council races have been decided by fewer than 100 votes. In local elections, every vote truly matters!',
    quiz: {
      question: 'Which level of government typically has the LOWEST voter turnout?',
      options: ['Presidential', 'Congressional', 'State', 'Local/Municipal'],
      correctIndex: 3,
      explanation: 'Local elections often have turnout under 20%, even though these officials make decisions that directly affect your daily life.',
    },
    xpReward: 15,
  },

  // === HISTORY ===
  {
    id: 'history-1',
    title: 'The Electoral College: Why We Vote This Way',
    category: 'history',
    duration: '3 min',
    icon: '📜',
    content: `Ever wonder why we have the Electoral College instead of a simple popular vote? It was a compromise - and a controversial one.

**The 1787 Debate:**
The Founders had three options:
1. Congress picks the President (too much power for Congress)
2. State legislatures pick (too much power for states)
3. Direct popular vote (many founders feared "mob rule")

**The Compromise:**
The Electoral College - a middle ground where:
• Each state gets electors equal to their Congressional delegation
• Electors (not voters) technically choose the President
• States decide how to allocate their electors

**How NC Works:**
NC has **16 electoral votes** (based on 14 Representatives + 2 Senators). Like most states, all 16 go to whoever wins the state popular vote ("winner-take-all").

**Why It's Controversial:**
• A candidate can win the popular vote but lose the election (happened in 2000 and 2016)
• Swing states get most of the attention
• Small states are slightly overrepresented`,
    keyPoints: [
      'Electoral College was a compromise among Founders',
      'NC has 16 electoral votes',
      'Most states use winner-take-all',
      'A popular vote winner can lose the election',
    ],
    funFact: 'NC has been a "swing state" in recent elections. In 2008, Obama won NC by just 14,177 votes out of 4.3 million cast!',
    quiz: {
      question: 'How many electoral votes does North Carolina have?',
      options: ['12', '14', '16', '18'],
      correctIndex: 2,
      explanation: 'NC has 16 electoral votes, calculated as 14 (House seats based on population) + 2 (Senate seats that every state gets).',
    },
    xpReward: 20,
  },
];

// Helper to get today's lesson (rotates through lessons)
export const getTodaysLesson = (): CivicLesson => {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const lessonIndex = dayOfYear % CIVIC_LESSONS.length;
  return CIVIC_LESSONS[lessonIndex];
};

// Helper to get lessons by category
export const getLessonsByCategory = (category: CivicLesson['category']): CivicLesson[] => {
  return CIVIC_LESSONS.filter((lesson) => lesson.category === category);
};

// Helper to get next N lessons after today
export const getUpcomingLessons = (count: number): CivicLesson[] => {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const lessons: CivicLesson[] = [];
  for (let i = 1; i <= count; i++) {
    const lessonIndex = (dayOfYear + i) % CIVIC_LESSONS.length;
    lessons.push(CIVIC_LESSONS[lessonIndex]);
  }
  return lessons;
};

export default CIVIC_LESSONS;
