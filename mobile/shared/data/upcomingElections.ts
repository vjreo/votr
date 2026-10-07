/**
 * MVP Target: 2026 NC General Election (Mecklenburg County midterms)
 * This is the dogfood target for VOTR.
 */
export const MVP_TARGET = {
  state: 'NC' as const,
  electionId: 'nc-general-2026',
  date: '2026-11-03',
  label: '2026 NC Midterms',
};

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

/**
 * NC Elections — focused on 2026 midterms for Mecklenburg County dogfood.
 * The primary is in March; the general is in November.
 */
const NC_ELECTIONS: UpcomingElection[] = [
  {
    id: 'nc-primary-2026',
    name: '2026 NC Primary',
    date: '2026-03-03',
    type: 'primary',
    icon: '🗳️',
    description: 'Party primaries for U.S. Senate, U.S. House, and NC General Assembly',
    state: 'NC',
    deadlines: [
      { name: 'Voter Registration', date: '2026-02-06', icon: '📝', critical: true },
      { name: 'Early Voting Begins', date: '2026-02-12', icon: '📅', critical: false },
      { name: 'Primary Day', date: '2026-03-03', icon: '🗳️', critical: true },
    ],
    offices: ['U.S. Senate', 'U.S. House', 'NC State Senate', 'NC House'],
  },
  {
    id: 'nc-general-2026',
    name: '2026 NC General Election',
    date: MVP_TARGET.date,
    type: 'general',
    icon: '🏛️',
    description:
      'U.S. Senate (Tillis seat), U.S. House, all 170 NC legislators, Mecklenburg County Commissioners',
    state: 'NC',
    deadlines: [
      { name: 'Voter Registration', date: '2026-10-09', icon: '📝', critical: true },
      { name: 'Early Voting Begins', date: '2026-10-15', icon: '📅', critical: false },
      { name: 'Election Day', date: '2026-11-03', icon: '🗳️', critical: true },
    ],
    offices: [
      'U.S. Senate',
      'U.S. House (NC-12)',
      'NC State Senate',
      'NC House',
      'Mecklenburg County Commissioners',
    ],
  },
];

export function getDaysUntil(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getElectionsForState(stateCode: string): UpcomingElection[] {
  if (stateCode.toUpperCase() !== 'NC') return [];
  return [...NC_ELECTIONS].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export function getUpcomingElectionsForState(stateCode: string): UpcomingElection[] {
  return getElectionsForState(stateCode).filter((e) => getDaysUntil(e.date) >= 0);
}

export function getNextElection(stateCode: string): UpcomingElection | null {
  const upcoming = getUpcomingElectionsForState(stateCode);
  return upcoming[0] || null;
}

export function getMvpTargetElection(stateCode: string): UpcomingElection | null {
  if (stateCode.toUpperCase() !== MVP_TARGET.state) return null;
  return NC_ELECTIONS.find((e) => e.id === MVP_TARGET.electionId) || null;
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
