// Navigation types for the app
export type RootStackParamList = {
  MainTabs: undefined;
  DiscoverList: undefined;
  AddressEntry: undefined;
  Onboarding: undefined;
  PreferencesEdit: undefined;
  Login: undefined;
  CandidateDetail: { candidateId: string };
  SourceInfo: undefined;
  PolicyQuiz: undefined;
  Profile: undefined;
  QuizResults: undefined;
  Compare: { candidateIds: string[] };
  ElectionCalendar: undefined;
  DailyLesson: { lesson?: import('../data/civicLessons').CivicLesson };
  LessonLibrary: undefined;
  PollingPlaceFinder: undefined;
  SampleBallot: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
