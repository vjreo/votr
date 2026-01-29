// Navigation types for the app
export type RootStackParamList = {
  MainTabs: undefined;
  AddressEntry: undefined;
  Onboarding: undefined;
  Login: undefined;
  CandidateDetail: { candidateId: string };
  SourceInfo: undefined;
  PolicyQuiz: undefined;
  Profile: undefined;
  QuizResults: undefined;
  Compare: { candidateIds: string[] };
  ElectionCalendar: undefined;
  DailyLesson: undefined;
  PollingPlaceFinder: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
