export interface User {
  id: string;
  preferences: IssuePreference[];
  location?: UserLocation;
  gamification: GamificationStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface IssuePreference {
  issueId: string;
  issueName: string;
  importance: number; // 1-5 scale
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
  district?: string;
  state: string;
  zipCode?: string;
}

export interface GamificationStats {
  points: number;
  streak: number;
  lastActiveDate: string;
  level: number;
  badges: Badge[];
}

export interface Badge {
  id: string;
  type: BadgeType;
  unlockedAt: Date;
  name: string;
  description: string;
}

export type BadgeType = 'informed_voter' | 'local_expert' | 'civic_champion' | 'researcher' | 'streak_master';

export interface Candidate {
  id: string;
  name: string;
  office: string;
  officeLevel: OfficeLevel;
  party?: string;
  photo?: string;
  positions: CandidatePosition[];
  sources: CandidateSource[];
  district?: string;
  state: string;
  bio?: string;
  apiSource: string;
  createdAt: Date;
  updatedAt: Date;
  /** Present when API called with includeMatch (0–100). Omitted when there is no overlapping issue data. */
  matchScore?: number;
}

export type OfficeLevel = 'federal' | 'state' | 'local';

export interface CandidatePosition {
  issueId: string;
  issueName: string;
  stance: string;
  source?: string;
  confidence: number; // 0-1, how confident we are in this position
}

export interface CandidateSource {
  id: string;
  candidateId: string;
  url: string;
  sourceType: SourceType;
  biasScore: number; // 0-100, lower is less biased
  biasTier: BiasTier;
  lastAnalyzed: Date;
  title?: string;
}

export type SourceType = 'social_media' | 'news_article' | 'official_website' | 'voting_resource' | 'other';

export type BiasTier = 'most_reliable' | 'reliable' | 'use_caution' | 'highly_biased';

export interface Swipe {
  id: string;
  userId: string;
  candidateId: string;
  direction: SwipeDirection;
  matchScore: number;
  timestamp: Date;
}

export type SwipeDirection = 'left' | 'right' | 'up';

export interface MatchScore {
  candidateId: string;
  score: number; // 0-100 percentage
  breakdown: MatchBreakdown[];
}

export interface MatchBreakdown {
  issueId: string;
  issueName: string;
  alignment: number; // -1 to 1, how aligned
  userImportance: number;
  candidateStance?: string;
}

export interface Election {
  id: string;
  name: string;
  date: Date;
  type: ElectionType;
  offices: string[];
  district?: string;
  state: string;
  earlyVotingStart?: Date;
  earlyVotingEnd?: Date;
}

export type ElectionType = 'primary' | 'general' | 'special' | 'runoff';

export interface SourceFeedback {
  id: string;
  sourceId: string;
  userId: string;
  feedbackType: FeedbackType;
  rating?: number;
  comment?: string;
  createdAt: Date;
}

export type FeedbackType = 'bias_incorrect' | 'source_broken' | 'helpful' | 'not_helpful';

export interface BiasAnalysis {
  urlHash: string;
  biasScore: number;
  biasTier: BiasTier;
  analysisData: {
    mlScore?: number;
    databaseScore?: number;
    userFeedbackScore?: number;
    confidence: number;
  };
  updatedAt: Date;
}

export interface NotificationPreferences {
  userId: string;
  electionReminders: boolean;
  newCandidateAlerts: boolean;
  earlyVotingAlerts: boolean;
  daysBeforeElection: number[]; // e.g., [7, 1]
}

