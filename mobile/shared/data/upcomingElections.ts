/**
 * Upcoming elections by state - used for Feed "what's happening near me"
 * Can be extended or replaced with API data
 */
export interface ElectionDeadline {
  name: string;
  date: string;
  icon: string;
  critical: boolean;
}

export interface UpcomingElection {
  id: string;
  name: string;
  date: string;
  type: string;
  icon: string;
  description: string;
  state: string;
  deadlines: ElectionDeadline[];
  offices: string[];
}

const NC_ELECTIONS: UpcomingElection[] = [
  {
    id: 'nc-municipal-2025',
    name: '2025 Municipal Elections',
    date: '2025-11-04',
    type: 'municipal',
    icon: '🏛️',
    description: 'City councils, mayors, and local offices',
    state: 'NC',
    deadlines: [
      { name: 'Voter Registration', date: '2025-10-10', icon: '📝', critical: true },
      { name: 'Election Day', date: '2025-11-04', icon: '🗳️', critical: true },
    ],
    offices: ['Charlotte Mayor', 'City Council', 'Town Councils', 'School Boards'],
  },
  {
    id: 'nc-primary-2026',
    name: '2026 Primary Elections',
    date: '2026-03-03',
    type: 'primary',
    icon: '🗳️',
    description: 'Party primaries for US Senate, House, and state offices',
    state: 'NC',
    deadlines: [
      { name: 'Voter Registration', date: '2026-02-06', icon: '📝', critical: true },
      { name: 'Primary Day', date: '2026-03-03', icon: '🗳️', critical: true },
    ],
    offices: ['U.S. Senate', 'U.S. House', 'State Legislature'],
  },
];

const getDaysUntil = (dateString: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export function getUpcomingElectionsForState(stateCode: string): UpcomingElection[] {
  const state = stateCode.toUpperCase();
  if (state === 'NC') {
    return NC_ELECTIONS.filter((e) => getDaysUntil(e.date) >= 0);
  }
  return [];
}

export function getNextElection(stateCode: string): UpcomingElection | null {
  const upcoming = getUpcomingElectionsForState(stateCode);
  return upcoming[0] || null;
}

export function getUpcomingDeadlines(stateCode: string, limit = 3) {
  const elections = getUpcomingElectionsForState(stateCode);
  const all: Array<{ deadline: ElectionDeadline; election: UpcomingElection }> = [];
  elections.forEach((election) => {
    election.deadlines.forEach((deadline) => {
      const days = getDaysUntil(deadline.date);
      if (days >= 0 && days <= 90) {
        all.push({ deadline, election });
      }
    });
  });
  return all
    .sort((a, b) => new Date(a.deadline.date).getTime() - new Date(b.deadline.date).getTime())
    .slice(0, limit);
}
