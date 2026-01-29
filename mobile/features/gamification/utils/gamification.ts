import { BadgeType } from '../../../../shared/types';

export interface GamificationConfig {
  pointsPerSwipe: number;
  pointsPerRightSwipe: number;
  pointsPerUpSwipe: number;
  pointsPerLevel: number;
  badges: BadgeConfig[];
}

export interface BadgeConfig {
  type: BadgeType;
  name: string;
  description: string;
  condition: (stats: any) => boolean;
}

export const gamificationConfig: GamificationConfig = {
  pointsPerSwipe: 1,
  pointsPerRightSwipe: 10,
  pointsPerUpSwipe: 5,
  pointsPerLevel: 100,
  badges: [
    {
      type: 'informed_voter',
      name: 'Informed Voter',
      description: 'Reviewed 10+ candidates',
      condition: (stats) => stats.swipeCount >= 10,
    },
    {
      type: 'local_expert',
      name: 'Local Expert',
      description: 'Completed all local races',
      condition: (stats) => stats.localRacesCompleted >= 5,
    },
    {
      type: 'civic_champion',
      name: 'Civic Champion',
      description: 'Maintained a 7-day streak',
      condition: (stats) => stats.streak >= 7,
    },
    {
      type: 'researcher',
      name: 'Researcher',
      description: 'Viewed 20+ candidate details',
      condition: (stats) => stats.upSwipes >= 20,
    },
    {
      type: 'streak_master',
      name: 'Streak Master',
      description: 'Maintained a 30-day streak',
      condition: (stats) => stats.streak >= 30,
    },
  ],
};

export function calculateLevel(points: number): number {
  return Math.floor(points / gamificationConfig.pointsPerLevel) + 1;
}

export function getPointsForNextLevel(points: number): number {
  const currentLevel = calculateLevel(points);
  const pointsForNextLevel = currentLevel * gamificationConfig.pointsPerLevel;
  return pointsForNextLevel - points;
}

export function checkBadgeUnlocks(stats: any, existingBadges: any[]): BadgeType[] {
  const unlocked: BadgeType[] = [];
  
  gamificationConfig.badges.forEach((badge) => {
    if (!existingBadges.find((b) => b.type === badge.type)) {
      if (badge.condition(stats)) {
        unlocked.push(badge.type);
      }
    }
  });
  
  return unlocked;
}

