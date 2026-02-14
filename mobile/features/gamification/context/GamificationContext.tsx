import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Achievement definitions
export const ACHIEVEMENTS = {
  // Research achievements
  FIRST_CANDIDATE: {
    id: 'first_candidate',
    title: 'First Look',
    description: 'Viewed your first candidate',
    icon: '👀',
    xp: 10,
  },
  CANDIDATE_RESEARCHER: {
    id: 'candidate_researcher',
    title: 'Candidate Researcher',
    description: 'Researched 5 candidates',
    icon: '🔍',
    xp: 50,
  },
  DEEP_DIVER: {
    id: 'deep_diver',
    title: 'Deep Diver',
    description: 'Viewed all tabs on a candidate profile',
    icon: '🤿',
    xp: 25,
  },
  LOCAL_LEGEND: {
    id: 'local_legend',
    title: 'Local Legend',
    description: 'Researched all local candidates',
    icon: '🏘️',
    xp: 100,
  },

  // Comparison achievements
  FIRST_COMPARE: {
    id: 'first_compare',
    title: 'Side by Side',
    description: 'Compared two candidates',
    icon: '⚖️',
    xp: 20,
  },
  COMPARISON_PRO: {
    id: 'comparison_pro',
    title: 'Comparison Pro',
    description: 'Compared candidates on 3+ issues',
    icon: '📊',
    xp: 50,
  },

  // Roster achievements
  FIRST_ROSTER: {
    id: 'first_roster',
    title: 'Making Choices',
    description: 'Added first candidate to roster',
    icon: '✅',
    xp: 15,
  },
  BALLOT_BUILDER: {
    id: 'ballot_builder',
    title: 'Ballot Builder',
    description: 'Added 5 candidates to roster',
    icon: '📋',
    xp: 75,
  },
  FULL_BALLOT: {
    id: 'full_ballot',
    title: 'Full Ballot',
    description: 'Completed your entire ballot roster',
    icon: '🗳️',
    xp: 200,
  },

  // Quiz achievements
  VALUES_DISCOVERED: {
    id: 'values_discovered',
    title: 'Values Discovered',
    description: 'Completed the policy quiz',
    icon: '💡',
    xp: 50,
  },
  ISSUE_EXPERT: {
    id: 'issue_expert',
    title: 'Issue Expert',
    description: 'Explored all policy categories',
    icon: '🎓',
    xp: 100,
  },

  // Streak achievements
  THREE_DAY_STREAK: {
    id: 'three_day_streak',
    title: 'Getting Started',
    description: '3-day research streak',
    icon: '🔥',
    xp: 30,
  },
  SEVEN_DAY_STREAK: {
    id: 'seven_day_streak',
    title: 'Week Warrior',
    description: '7-day research streak',
    icon: '⚡',
    xp: 70,
  },
  THIRTY_DAY_STREAK: {
    id: 'thirty_day_streak',
    title: 'Civic Champion',
    description: '30-day research streak',
    icon: '👑',
    xp: 300,
  },

  // Bias detection achievements
  BIAS_DETECTIVE: {
    id: 'bias_detective',
    title: 'Bias Detective',
    description: 'Checked 10 sources for bias',
    icon: '🕵️',
    xp: 50,
  },
  FACT_CHECKER: {
    id: 'fact_checker',
    title: 'Fact Checker',
    description: 'Reviewed sources on 5 candidates',
    icon: '✓',
    xp: 75,
  },

  // Social achievements
  SHARE_JOURNEY: {
    id: 'share_journey',
    title: 'Spreading Democracy',
    description: 'Shared your voting journey',
    icon: '📢',
    xp: 25,
  },
  DEMOCRACY_HERO: {
    id: 'democracy_hero',
    title: 'Democracy Hero',
    description: 'Completed full ballot research and voted',
    icon: '🦸',
    xp: 500,
  },
};

// Level definitions
export const LEVELS = [
  { level: 1, title: 'Ballot Explorer', minXP: 0, icon: '🗺️' },
  { level: 2, title: 'Issue Learner', minXP: 100, icon: '📚' },
  { level: 3, title: 'Candidate Researcher', minXP: 250, icon: '🔬' },
  { level: 4, title: 'Informed Voter', minXP: 500, icon: '🎯' },
  { level: 5, title: 'Civic Champion', minXP: 1000, icon: '🏆' },
  { level: 6, title: 'Democracy Hero', minXP: 2000, icon: '🦸' },
];

// Policy categories for the quiz
export const POLICY_CATEGORIES = [
  {
    id: 'economy',
    title: 'Economy & Jobs',
    icon: '💼',
    color: '#3498DB',
  },
  {
    id: 'healthcare',
    title: 'Healthcare',
    icon: '🏥',
    color: '#E74C3C',
  },
  {
    id: 'education',
    title: 'Education',
    icon: '📚',
    color: '#9B59B6',
  },
  {
    id: 'environment',
    title: 'Environment & Climate',
    icon: '🌱',
    color: '#27AE60',
  },
  {
    id: 'immigration',
    title: 'Immigration',
    icon: '🌎',
    color: '#F39C12',
  },
  {
    id: 'criminal_justice',
    title: 'Criminal Justice',
    icon: '⚖️',
    color: '#34495E',
  },
  {
    id: 'housing',
    title: 'Housing & Development',
    icon: '🏠',
    color: '#1ABC9C',
  },
  {
    id: 'civil_rights',
    title: 'Civil Rights',
    icon: '✊',
    color: '#E67E22',
  },
];

// Policy questions for the swipe quiz
export const POLICY_QUESTIONS = [
  // Economy
  {
    id: 'min_wage',
    category: 'economy',
    question: 'The minimum wage should be increased to $15/hour or more',
    leftLabel: 'Disagree',
    rightLabel: 'Agree',
  },
  {
    id: 'corporate_tax',
    category: 'economy',
    question: 'Corporations should pay higher taxes to fund public services',
    leftLabel: 'Disagree',
    rightLabel: 'Agree',
  },
  {
    id: 'small_business',
    category: 'economy',
    question: 'Government should provide more support for small businesses',
    leftLabel: 'Disagree',
    rightLabel: 'Agree',
  },

  // Healthcare
  {
    id: 'universal_healthcare',
    category: 'healthcare',
    question: 'Healthcare should be guaranteed for all citizens',
    leftLabel: 'Disagree',
    rightLabel: 'Agree',
  },
  {
    id: 'drug_prices',
    category: 'healthcare',
    question: 'Government should negotiate prescription drug prices',
    leftLabel: 'Disagree',
    rightLabel: 'Agree',
  },
  {
    id: 'mental_health',
    category: 'healthcare',
    question: 'More funding is needed for mental health services',
    leftLabel: 'Disagree',
    rightLabel: 'Agree',
  },

  // Education
  {
    id: 'public_education',
    category: 'education',
    question: 'Public school funding should be increased',
    leftLabel: 'Disagree',
    rightLabel: 'Agree',
  },
  {
    id: 'student_debt',
    category: 'education',
    question: 'Student loan debt should be reduced or forgiven',
    leftLabel: 'Disagree',
    rightLabel: 'Agree',
  },
  {
    id: 'school_choice',
    category: 'education',
    question: 'Parents should have more choice in where their children attend school',
    leftLabel: 'Disagree',
    rightLabel: 'Agree',
  },

  // Environment
  {
    id: 'renewable_energy',
    category: 'environment',
    question: 'Government should invest heavily in renewable energy',
    leftLabel: 'Disagree',
    rightLabel: 'Agree',
  },
  {
    id: 'climate_regulations',
    category: 'environment',
    question: 'Stricter environmental regulations are needed for businesses',
    leftLabel: 'Disagree',
    rightLabel: 'Agree',
  },
  {
    id: 'ev_incentives',
    category: 'environment',
    question: 'Government should incentivize electric vehicle adoption',
    leftLabel: 'Disagree',
    rightLabel: 'Agree',
  },

  // Immigration
  {
    id: 'pathway_citizenship',
    category: 'immigration',
    question: 'There should be a pathway to citizenship for undocumented immigrants',
    leftLabel: 'Disagree',
    rightLabel: 'Agree',
  },
  {
    id: 'border_security',
    category: 'immigration',
    question: 'Border security should be strengthened',
    leftLabel: 'Disagree',
    rightLabel: 'Agree',
  },

  // Criminal Justice
  {
    id: 'police_reform',
    category: 'criminal_justice',
    question: 'Police departments need reform and oversight',
    leftLabel: 'Disagree',
    rightLabel: 'Agree',
  },
  {
    id: 'sentencing_reform',
    category: 'criminal_justice',
    question: 'Non-violent offenders should receive shorter sentences',
    leftLabel: 'Disagree',
    rightLabel: 'Agree',
  },

  // Housing
  {
    id: 'affordable_housing',
    category: 'housing',
    question: 'Government should build more affordable housing',
    leftLabel: 'Disagree',
    rightLabel: 'Agree',
  },
  {
    id: 'rent_control',
    category: 'housing',
    question: 'Rent control policies help protect tenants',
    leftLabel: 'Disagree',
    rightLabel: 'Agree',
  },

  // Civil Rights
  {
    id: 'voting_access',
    category: 'civil_rights',
    question: 'Voting should be made easier and more accessible',
    leftLabel: 'Disagree',
    rightLabel: 'Agree',
  },
  {
    id: 'equality_protections',
    category: 'civil_rights',
    question: 'Anti-discrimination laws should be expanded',
    leftLabel: 'Disagree',
    rightLabel: 'Agree',
  },
];

interface PolicyResponse {
  questionId: string;
  category: string;
  value: number; // -1 to 1 scale (-1 = left/disagree, 1 = right/agree)
}

interface GamificationState {
  xp: number;
  level: number;
  achievements: string[]; // Array of achievement IDs
  streak: number;
  lastActiveDate: string | null;
  candidatesViewed: string[];
  candidatesCompared: string[];
  sourcesChecked: number;
  policyResponses: PolicyResponse[];
  quizCompleted: boolean;
  journeyStartDate: string | null;
}

interface GamificationContextType extends GamificationState {
  // Computed values
  currentLevel: typeof LEVELS[0];
  nextLevel: typeof LEVELS[0] | null;
  xpToNextLevel: number;
  xpProgress: number; // 0-1 percentage to next level
  unlockedAchievements: typeof ACHIEVEMENTS[keyof typeof ACHIEVEMENTS][];

  // Actions
  addXP: (amount: number) => void;
  unlockAchievement: (achievementId: string) => Promise<boolean>; // returns true if newly unlocked
  recordCandidateView: (candidateId: string) => void;
  recordComparison: (candidateIds: string[]) => void;
  recordSourceCheck: () => void;
  recordPolicyResponse: (response: PolicyResponse) => void;
  completeQuiz: () => void;
  updateStreak: () => void;
  resetProgress: () => Promise<void>;

  // Policy matching
  getPolicyProfile: () => Record<string, number>; // category -> average score
}

const STORAGE_KEY = 'gamification_state';

const initialState: GamificationState = {
  xp: 0,
  level: 1,
  achievements: [],
  streak: 0,
  lastActiveDate: null,
  candidatesViewed: [],
  candidatesCompared: [],
  sourcesChecked: 0,
  policyResponses: [],
  quizCompleted: false,
  journeyStartDate: null,
};

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GamificationState>(initialState);

  // Load state on mount
  useEffect(() => {
    loadState();
  }, []);

  // Update streak on mount and when app becomes active
  useEffect(() => {
    if (state.journeyStartDate) {
      updateStreak();
    }
  }, []);

  const loadState = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Record<string, unknown>;
      const n = (key: keyof GamificationState, def: number) =>
        typeof parsed[key] === 'number' ? parsed[key] as number : def;
      setState({
        ...initialState,
        ...parsed,
        xp: n('xp', 0),
        level: n('level', 1),
        streak: n('streak', 0),
        sourcesChecked: n('sourcesChecked', 0),
        quizCompleted: parsed.quizCompleted === true || parsed.quizCompleted === 'true',
      });
    } catch (e) {
      console.error('Error loading gamification state:', e);
    }
  };

  const saveState = async (newState: GamificationState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error('Error saving gamification state:', error);
    }
  };

  // Computed values
  const currentLevel = LEVELS.find((l, i) => {
    const nextLevel = LEVELS[i + 1];
    return !nextLevel || state.xp < nextLevel.minXP;
  }) || LEVELS[0];

  const nextLevel = LEVELS.find((l) => l.minXP > state.xp) || null;

  const xpToNextLevel = nextLevel ? nextLevel.minXP - state.xp : 0;

  const xpProgress = nextLevel
    ? (state.xp - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)
    : 1;

  const unlockedAchievements = state.achievements
    .map((id) => Object.values(ACHIEVEMENTS).find((a) => a.id === id))
    .filter(Boolean) as typeof ACHIEVEMENTS[keyof typeof ACHIEVEMENTS][];

  // Actions
  const addXP = useCallback((amount: number) => {
    setState((prev) => {
      const newXP = prev.xp + amount;
      const newLevel = LEVELS.filter((l) => newXP >= l.minXP).pop()?.level || 1;
      const newState = { ...prev, xp: newXP, level: newLevel };
      saveState(newState);
      return newState;
    });
  }, []);

  const unlockAchievement = useCallback(async (achievementId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setState((prev) => {
        if (prev.achievements.includes(achievementId)) {
          resolve(false);
          return prev;
        }

        const achievement = Object.values(ACHIEVEMENTS).find((a) => a.id === achievementId);
        if (!achievement) {
          resolve(false);
          return prev;
        }

        const newAchievements = [...prev.achievements, achievementId];
        const newXP = prev.xp + achievement.xp;
        const newLevel = LEVELS.filter((l) => newXP >= l.minXP).pop()?.level || 1;

        const newState = {
          ...prev,
          achievements: newAchievements,
          xp: newXP,
          level: newLevel,
        };
        saveState(newState);
        resolve(true);
        return newState;
      });
    });
  }, []);

  const recordCandidateView = useCallback((candidateId: string) => {
    setState((prev) => {
      if (prev.candidatesViewed.includes(candidateId)) {
        return prev;
      }

      const newViewed = [...prev.candidatesViewed, candidateId];
      const newState = {
        ...prev,
        candidatesViewed: newViewed,
        journeyStartDate: prev.journeyStartDate || new Date().toISOString(),
      };
      saveState(newState);

      // Check for achievements
      if (newViewed.length === 1) {
        unlockAchievement('first_candidate');
      }
      if (newViewed.length >= 5) {
        unlockAchievement('candidate_researcher');
      }

      return newState;
    });
  }, [unlockAchievement]);

  const recordComparison = useCallback((candidateIds: string[]) => {
    setState((prev) => {
      const newCompared = [...new Set([...prev.candidatesCompared, ...candidateIds])];
      const newState = { ...prev, candidatesCompared: newCompared };
      saveState(newState);

      // Check for achievements
      if (prev.candidatesCompared.length === 0) {
        unlockAchievement('first_compare');
      }

      return newState;
    });
  }, [unlockAchievement]);

  const recordSourceCheck = useCallback(() => {
    setState((prev) => {
      const newCount = prev.sourcesChecked + 1;
      const newState = { ...prev, sourcesChecked: newCount };
      saveState(newState);

      // Check for achievements
      if (newCount >= 10) {
        unlockAchievement('bias_detective');
      }

      return newState;
    });
  }, [unlockAchievement]);

  const recordPolicyResponse = useCallback((response: PolicyResponse) => {
    setState((prev) => {
      // Replace existing response for same question or add new
      const existingIndex = prev.policyResponses.findIndex(
        (r) => r.questionId === response.questionId
      );

      let newResponses: PolicyResponse[];
      if (existingIndex >= 0) {
        newResponses = [...prev.policyResponses];
        newResponses[existingIndex] = response;
      } else {
        newResponses = [...prev.policyResponses, response];
      }

      const newState = { ...prev, policyResponses: newResponses };
      saveState(newState);
      return newState;
    });
  }, []);

  const completeQuiz = useCallback(() => {
    setState((prev) => {
      const newState = { ...prev, quizCompleted: true };
      saveState(newState);
      unlockAchievement('values_discovered');
      return newState;
    });
  }, [unlockAchievement]);

  const updateStreak = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];

    setState((prev) => {
      if (prev.lastActiveDate === today) {
        return prev; // Already active today
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = prev.streak;
      if (prev.lastActiveDate === yesterdayStr) {
        newStreak = prev.streak + 1;
      } else if (prev.lastActiveDate !== today) {
        newStreak = 1; // Reset streak
      }

      const newState = {
        ...prev,
        streak: newStreak,
        lastActiveDate: today,
      };
      saveState(newState);

      // Check for streak achievements
      if (newStreak >= 3) unlockAchievement('three_day_streak');
      if (newStreak >= 7) unlockAchievement('seven_day_streak');
      if (newStreak >= 30) unlockAchievement('thirty_day_streak');

      return newState;
    });
  }, [unlockAchievement]);

  const resetProgress = useCallback(async () => {
    setState(initialState);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const getPolicyProfile = useCallback((): Record<string, number> => {
    const profile: Record<string, { sum: number; count: number }> = {};

    state.policyResponses.forEach((response) => {
      if (!profile[response.category]) {
        profile[response.category] = { sum: 0, count: 0 };
      }
      profile[response.category].sum += response.value;
      profile[response.category].count += 1;
    });

    const result: Record<string, number> = {};
    Object.entries(profile).forEach(([category, { sum, count }]) => {
      result[category] = count > 0 ? sum / count : 0;
    });

    return result;
  }, [state.policyResponses]);

  return (
    <GamificationContext.Provider
      value={{
        ...state,
        currentLevel,
        nextLevel,
        xpToNextLevel,
        xpProgress,
        unlockedAchievements,
        addXP,
        unlockAchievement,
        recordCandidateView,
        recordComparison,
        recordSourceCheck,
        recordPolicyResponse,
        completeQuiz,
        updateStreak,
        resetProgress,
        getPolicyProfile,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};
