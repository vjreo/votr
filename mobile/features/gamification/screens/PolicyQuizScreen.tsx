import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '../../../shared/components/ui';
import {
  useGamification,
  POLICY_QUESTIONS,
  POLICY_CATEGORIES,
} from '../context/GamificationContext';
import { colors, shadows, borderRadius } from '../../../shared/theme/colors';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;
const SWIPE_OUT_DURATION = 250;

interface QuizCardProps {
  question: typeof POLICY_QUESTIONS[0];
  category: typeof POLICY_CATEGORIES[0];
  onSwipe: (value: number) => void;
  isTop: boolean;
}

const QuizCard: React.FC<QuizCardProps> = ({ question, category, onSwipe, isTop }) => {
  const position = useRef(new Animated.ValueXY()).current;
  const rotation = position.x.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  const leftOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const rightOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTop,
      onMoveShouldSetPanResponder: () => isTop,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          // Swiped right - agree
          swipeOut('right', 1);
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          // Swiped left - disagree
          swipeOut('left', -1);
        } else {
          // Reset position
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 5,
          }).start();
        }
      },
    })
  ).current;

  const swipeOut = (direction: 'left' | 'right', value: number) => {
    const x = direction === 'right' ? width + 100 : -width - 100;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => {
      onSwipe(value);
    });
  };

  const handleButtonPress = (value: number) => {
    const direction = value > 0 ? 'right' : 'left';
    swipeOut(direction, value);
  };

  if (!isTop) {
    return (
      <View style={[styles.card, styles.cardBack]}>
        <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <Text style={[styles.categoryText, { color: category.color }]}>{category.title}</Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.card,
        {
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { rotate: rotation },
          ],
        },
      ]}
    >
      {/* Swipe indicators */}
      <Animated.View style={[styles.swipeIndicator, styles.disagreeIndicator, { opacity: leftOpacity }]}>
        <Ionicons name="close" size={40} color={colors.error} />
        <Text style={[styles.swipeLabel, { color: colors.error }]}>DISAGREE</Text>
      </Animated.View>

      <Animated.View style={[styles.swipeIndicator, styles.agreeIndicator, { opacity: rightOpacity }]}>
        <Ionicons name="checkmark" size={40} color={colors.success} />
        <Text style={[styles.swipeLabel, { color: colors.success }]}>AGREE</Text>
      </Animated.View>

      {/* Card content */}
      <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
        <Text style={styles.categoryIcon}>{category.icon}</Text>
        <Text style={[styles.categoryText, { color: category.color }]}>{category.title}</Text>
      </View>

      <Text style={styles.questionText}>{question.question}</Text>

      <View style={styles.swipeHint}>
        <View style={styles.hintItem}>
          <Ionicons name="arrow-back" size={20} color={colors.error} />
          <Text style={styles.hintText}>{question.leftLabel}</Text>
        </View>
        <View style={styles.hintItem}>
          <Text style={styles.hintText}>{question.rightLabel}</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.success} />
        </View>
      </View>

      {/* Quick action buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.disagreeButton]}
          onPress={() => handleButtonPress(-1)}
        >
          <Ionicons name="close" size={28} color={colors.error} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.skipButton]}
          onPress={() => handleButtonPress(0)}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.agreeButton]}
          onPress={() => handleButtonPress(1)}
        >
          <Ionicons name="checkmark" size={28} color={colors.success} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const PolicyQuizScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { recordPolicyResponse, completeQuiz, policyResponses } = useGamification();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = POLICY_QUESTIONS[currentIndex];
  const nextQuestion = POLICY_QUESTIONS[currentIndex + 1];
  const currentCategory = POLICY_CATEGORIES.find((c) => c.id === currentQuestion?.category);
  const nextCategory = nextQuestion
    ? POLICY_CATEGORIES.find((c) => c.id === nextQuestion.category)
    : null;

  const progress = (currentIndex / POLICY_QUESTIONS.length) * 100;

  const handleSwipe = useCallback(
    (value: number) => {
      if (currentQuestion) {
        recordPolicyResponse({
          questionId: currentQuestion.id,
          category: currentQuestion.category,
          value,
        });
      }

      if (currentIndex >= POLICY_QUESTIONS.length - 1) {
        completeQuiz();
        setShowResults(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    },
    [currentIndex, currentQuestion, recordPolicyResponse, completeQuiz]
  );

  const handleSkip = () => {
    navigation.goBack();
  };

  const handleViewResults = () => {
    navigation.navigate('QuizResults' as never);
  };

  const handleGoToFeed = () => {
    navigation.navigate('MainTabs' as never);
  };

  if (showResults) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.resultsContainer}>
          <View style={styles.resultsIcon}>
            <Text style={styles.resultsEmoji}>🎉</Text>
          </View>
          <Text style={styles.resultsTitle}>Values Discovered!</Text>
          <Text style={styles.resultsSubtitle}>
            You've completed the policy quiz. We'll now show you candidates that align with your
            values.
          </Text>

          <View style={styles.resultsBadge}>
            <Ionicons name="ribbon" size={24} color={colors.primary} />
            <Text style={styles.badgeText}>+50 XP Earned</Text>
          </View>

          <View style={styles.resultsActions}>
            <Button
              title="View My Profile"
              onPress={handleViewResults}
              fullWidth
              style={styles.resultsButton}
            />
            <Button
              title="Browse Candidates"
              onPress={handleGoToFeed}
              variant="outline"
              fullWidth
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Discover Your Values</Text>
          <Text style={styles.headerProgress}>
            {currentIndex + 1} of {POLICY_QUESTIONS.length}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Card stack */}
      <View style={styles.cardContainer}>
        {nextQuestion && nextCategory && (
          <QuizCard
            key={nextQuestion.id}
            question={nextQuestion}
            category={nextCategory}
            onSwipe={() => {}}
            isTop={false}
          />
        )}
        {currentQuestion && currentCategory && (
          <QuizCard
            key={currentQuestion.id}
            question={currentQuestion}
            category={currentCategory}
            onSwipe={handleSwipe}
            isTop={true}
          />
        )}
      </View>

      {/* Instructions */}
      <View style={[styles.instructions, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.instructionsText}>
          Swipe right if you agree, left if you disagree
        </Text>
      </View>
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
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerProgress: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    width: 44,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    position: 'absolute',
    width: width - 40,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: 24,
    ...shadows.large,
    minHeight: 400,
    justifyContent: 'space-between',
  },
  cardBack: {
    transform: [{ scale: 0.95 }],
    opacity: 0.7,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    gap: 6,
  },
  categoryIcon: {
    fontSize: 18,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
    marginVertical: 24,
  },
  swipeHint: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  hintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  swipeIndicator: {
    position: 'absolute',
    top: 30,
    padding: 8,
    borderRadius: borderRadius.md,
    borderWidth: 3,
    alignItems: 'center',
    zIndex: 10,
  },
  disagreeIndicator: {
    right: 20,
    borderColor: colors.error,
  },
  agreeIndicator: {
    left: 20,
    borderColor: colors.success,
  },
  swipeLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  disagreeButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.error,
  },
  agreeButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.success,
  },
  skipButton: {
    backgroundColor: colors.chipBackground,
    width: 70,
    borderRadius: borderRadius.full,
  },
  skipText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  instructions: {
    alignItems: 'center',
    padding: 20,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  resultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  resultsIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resultsEmoji: {
    fontSize: 48,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  resultsSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  resultsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    marginBottom: 32,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  resultsActions: {
    width: '100%',
    gap: 12,
  },
  resultsButton: {
    marginBottom: 0,
  },
});

export default PolicyQuizScreen;
