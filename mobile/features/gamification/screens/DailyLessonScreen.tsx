import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, Button } from '../../../shared/components/ui';
import { StreakDisplay } from '../components/AchievementBadge';
import { useGamification } from '../context/GamificationContext';
import {
  getTodaysLesson,
  getUpcomingLessons,
  LESSON_CATEGORIES,
  CivicLesson,
  CIVIC_LESSONS,
} from '../../../shared/data/civicLessons';
import { colors, shadows, borderRadius } from '../../../shared/theme/colors';

const COMPLETED_LESSONS_KEY = 'completed_lessons';

const DailyLessonScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { addXP, updateStreak, streak, unlockAchievement } = useGamification();

  // Check if specific lesson was passed via route
  const routeLesson = (route.params as any)?.lesson;

  const [currentLesson, setCurrentLesson] = useState<CivicLesson>(routeLesson || getTodaysLesson());
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationAnim = useState(new Animated.Value(0))[0];

  const upcomingLessons = getUpcomingLessons(3);
  const todaysLesson = getTodaysLesson();
  const isViewingTodaysLesson = currentLesson.id === todaysLesson.id;
  const alreadyCompletedToday = completedLessons.has(todaysLesson.id);

  useEffect(() => {
    loadCompletedLessons();
  }, []);

  useEffect(() => {
    // Check if this lesson is already completed
    setLessonCompleted(completedLessons.has(currentLesson.id));
    setShowQuiz(false);
    setSelectedAnswer(null);
    setQuizSubmitted(false);
  }, [currentLesson, completedLessons]);

  const loadCompletedLessons = async () => {
    try {
      const stored = await AsyncStorage.getItem(COMPLETED_LESSONS_KEY);
      if (stored) {
        setCompletedLessons(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error('Error loading completed lessons:', error);
    }
  };

  const saveCompletedLesson = async (lessonId: string) => {
    const newCompleted = new Set(completedLessons);
    newCompleted.add(lessonId);
    setCompletedLessons(newCompleted);
    await AsyncStorage.setItem(COMPLETED_LESSONS_KEY, JSON.stringify([...newCompleted]));
  };

  const handleCompleteLesson = async () => {
    if (lessonCompleted) return;

    // Award XP
    addXP(currentLesson.xpReward);
    updateStreak();

    // Save completion
    await saveCompletedLesson(currentLesson.id);
    setLessonCompleted(true);

    // Check for achievements
    const completedCount = completedLessons.size + 1;
    if (completedCount >= 5) {
      unlockAchievement('issue_expert');
    }

    // Show celebration
    setShowCelebration(true);
    Animated.sequence([
      Animated.timing(celebrationAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(celebrationAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setShowCelebration(false));
  };

  const handleQuizSubmit = () => {
    if (selectedAnswer === null) return;
    setQuizSubmitted(true);

    // If correct, complete the lesson
    if (selectedAnswer === currentLesson.quiz?.correctIndex) {
      handleCompleteLesson();
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `📚 Today I learned: "${currentLesson.title}"\n\n${currentLesson.keyPoints[0]}\n\nLearning civics with VOTER! 🗳️`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSelectLesson = (lesson: CivicLesson) => {
    setCurrentLesson(lesson);
  };

  const getCategoryInfo = (categoryKey: string) => {
    return LESSON_CATEGORIES.find((c) => c.key === categoryKey);
  };

  const categoryInfo = getCategoryInfo(currentLesson.category);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Daily Lesson</Text>
          <StreakDisplay streak={streak} size="small" />
        </View>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Today's Lesson Indicator */}
        {isViewingTodaysLesson && (
          <View style={styles.todayBadge}>
            <Ionicons name="today" size={16} color={colors.primary} />
            <Text style={styles.todayText}>Today's Lesson</Text>
          </View>
        )}

        {/* Lesson Card */}
        <Card variant="elevated" style={styles.lessonCard}>
          {/* Category & Duration */}
          <View style={styles.lessonMeta}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryInfo?.color + '20' }]}>
              <Text style={styles.categoryIcon}>{currentLesson.icon}</Text>
              <Text style={[styles.categoryLabel, { color: categoryInfo?.color }]}>
                {categoryInfo?.label}
              </Text>
            </View>
            <View style={styles.durationBadge}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.durationText}>{currentLesson.duration}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.lessonTitle}>{currentLesson.title}</Text>

          {/* Content */}
          <Text style={styles.lessonContent}>{currentLesson.content}</Text>

          {/* Key Points */}
          <View style={styles.keyPointsContainer}>
            <Text style={styles.keyPointsTitle}>Key Takeaways</Text>
            {currentLesson.keyPoints.map((point, index) => (
              <View key={index} style={styles.keyPoint}>
                <View style={styles.keyPointBullet}>
                  <Text style={styles.keyPointNumber}>{index + 1}</Text>
                </View>
                <Text style={styles.keyPointText}>{point}</Text>
              </View>
            ))}
          </View>

          {/* Fun Fact */}
          {currentLesson.funFact && (
            <View style={styles.funFactContainer}>
              <Text style={styles.funFactLabel}>💡 Fun Fact</Text>
              <Text style={styles.funFactText}>{currentLesson.funFact}</Text>
            </View>
          )}

          {/* XP Reward */}
          <View style={styles.xpContainer}>
            <Ionicons name="star" size={20} color={colors.primary} />
            <Text style={styles.xpText}>+{currentLesson.xpReward} XP for completing</Text>
          </View>
        </Card>

        {/* Quiz Section */}
        {currentLesson.quiz && !lessonCompleted && (
          <Card variant="outlined" style={styles.quizCard}>
            {!showQuiz ? (
              <View style={styles.quizPrompt}>
                <Text style={styles.quizPromptIcon}>🧠</Text>
                <Text style={styles.quizPromptTitle}>Test Your Knowledge!</Text>
                <Text style={styles.quizPromptText}>
                  Answer a quick question to complete this lesson and earn XP
                </Text>
                <Button
                  title="Take Quiz"
                  onPress={() => setShowQuiz(true)}
                  fullWidth
                  icon={<Ionicons name="school-outline" size={18} color={colors.white} />}
                />
              </View>
            ) : (
              <View style={styles.quizContent}>
                <Text style={styles.quizQuestion}>{currentLesson.quiz.question}</Text>

                <View style={styles.quizOptions}>
                  {currentLesson.quiz.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = index === currentLesson.quiz?.correctIndex;
                    const showResult = quizSubmitted;

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.quizOption,
                          isSelected && styles.quizOptionSelected,
                          showResult && isCorrect && styles.quizOptionCorrect,
                          showResult && isSelected && !isCorrect && styles.quizOptionIncorrect,
                        ]}
                        onPress={() => !quizSubmitted && setSelectedAnswer(index)}
                        disabled={quizSubmitted}
                      >
                        <Text
                          style={[
                            styles.quizOptionText,
                            isSelected && styles.quizOptionTextSelected,
                            showResult && isCorrect && styles.quizOptionTextCorrect,
                          ]}
                        >
                          {option}
                        </Text>
                        {showResult && isCorrect && (
                          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                        )}
                        {showResult && isSelected && !isCorrect && (
                          <Ionicons name="close-circle" size={20} color={colors.error} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {quizSubmitted && (
                  <View style={styles.quizExplanation}>
                    <Text style={styles.quizExplanationText}>
                      {currentLesson.quiz.explanation}
                    </Text>
                  </View>
                )}

                {!quizSubmitted && (
                  <Button
                    title="Submit Answer"
                    onPress={handleQuizSubmit}
                    disabled={selectedAnswer === null}
                    fullWidth
                  />
                )}

                {quizSubmitted && selectedAnswer !== currentLesson.quiz?.correctIndex && (
                  <Button
                    title="Try Again"
                    onPress={() => {
                      setQuizSubmitted(false);
                      setSelectedAnswer(null);
                    }}
                    variant="outline"
                    fullWidth
                  />
                )}
              </View>
            )}
          </Card>
        )}

        {/* Completed State */}
        {lessonCompleted && (
          <Card variant="outlined" style={styles.completedCard}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text style={styles.completedTitle}>Lesson Complete!</Text>
            <Text style={styles.completedText}>
              You earned +{currentLesson.xpReward} XP
            </Text>
          </Card>
        )}

        {/* Upcoming Lessons */}
        <View style={styles.upcomingSection}>
          <Text style={styles.sectionTitle}>Coming Up</Text>
          {upcomingLessons.map((lesson, index) => {
            const lessonCategory = getCategoryInfo(lesson.category);
            const isComplete = completedLessons.has(lesson.id);

            return (
              <TouchableOpacity
                key={lesson.id}
                style={styles.upcomingLesson}
                onPress={() => handleSelectLesson(lesson)}
              >
                <View style={[styles.upcomingIcon, { backgroundColor: lessonCategory?.color + '20' }]}>
                  <Text style={styles.upcomingIconText}>{lesson.icon}</Text>
                </View>
                <View style={styles.upcomingInfo}>
                  <Text style={styles.upcomingTitle}>{lesson.title}</Text>
                  <Text style={styles.upcomingCategory}>{lessonCategory?.label}</Text>
                </View>
                <View style={styles.upcomingRight}>
                  {isComplete ? (
                    <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                  ) : (
                    <Text style={styles.upcomingDay}>+{index + 1}d</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Browse All */}
        <Button
          title="Browse All Lessons"
          variant="outline"
          onPress={() => navigation.navigate('LessonLibrary' as never)}
          fullWidth
          icon={<Ionicons name="library-outline" size={18} color={colors.primary} />}
        />
      </ScrollView>

      {/* Celebration Overlay */}
      {showCelebration && (
        <Animated.View
          style={[
            styles.celebration,
            {
              opacity: celebrationAnim,
              transform: [
                {
                  scale: celebrationAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.celebrationContent}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.celebrationTitle}>Awesome!</Text>
            <Text style={styles.celebrationText}>+{currentLesson.xpReward} XP earned</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    ...shadows.small,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  shareButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    marginBottom: 12,
  },
  todayText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  lessonCard: {
    marginBottom: 16,
  },
  lessonMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  lessonTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
    lineHeight: 30,
  },
  lessonContent: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 26,
    marginBottom: 20,
  },
  keyPointsContainer: {
    backgroundColor: colors.chipBackground,
    padding: 16,
    borderRadius: borderRadius.lg,
    marginBottom: 16,
  },
  keyPointsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  keyPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  keyPointBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyPointNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  keyPointText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  funFactContainer: {
    backgroundColor: 'rgba(245,166,35,0.15)',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    padding: 14,
    borderRadius: borderRadius.md,
    marginBottom: 16,
  },
  funFactLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 6,
  },
  funFactText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  xpText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  quizCard: {
    marginBottom: 16,
  },
  quizPrompt: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  quizPromptIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  quizPromptTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  quizPromptText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  quizContent: {},
  quizQuestion: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
    lineHeight: 24,
  },
  quizOptions: {
    gap: 10,
    marginBottom: 16,
  },
  quizOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: colors.chipBackground,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  quizOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  quizOptionCorrect: {
    borderColor: colors.success,
    backgroundColor: colors.success + '10',
  },
  quizOptionIncorrect: {
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
  },
  quizOptionText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  quizOptionTextSelected: {
    fontWeight: '600',
  },
  quizOptionTextCorrect: {
    color: colors.success,
    fontWeight: '600',
  },
  quizExplanation: {
    backgroundColor: colors.success + '10',
    padding: 14,
    borderRadius: borderRadius.md,
    marginBottom: 16,
  },
  quizExplanationText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  completedCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
    backgroundColor: colors.success + '10',
    borderColor: colors.success + '30',
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.success,
    marginTop: 12,
  },
  completedText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  upcomingSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  upcomingLesson: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: borderRadius.lg,
    marginBottom: 10,
    ...shadows.small,
  },
  upcomingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  upcomingIconText: {
    fontSize: 20,
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  upcomingCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  upcomingRight: {
    alignItems: 'center',
  },
  upcomingDay: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  celebration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationContent: {
    backgroundColor: colors.card,
    padding: 32,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.large,
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  celebrationText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 8,
  },
});

export default DailyLessonScreen;
