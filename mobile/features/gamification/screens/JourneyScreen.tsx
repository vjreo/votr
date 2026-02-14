import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '../../../shared/components/ui';
import {
  useGamification,
  LEVELS,
  ACHIEVEMENTS,
  POLICY_CATEGORIES,
} from '../context/GamificationContext';
import { useUser } from '../../../features/auth/context/UserContext';
import { colors, shadows, borderRadius } from '../../../shared/theme/colors';

const JourneyScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { roster } = useUser();
  const {
    xp,
    level,
    currentLevel,
    nextLevel,
    xpProgress,
    xpToNextLevel,
    streak,
    achievements,
    unlockedAchievements,
    candidatesViewed,
    quizCompleted,
    getPolicyProfile,
  } = useGamification();

  const policyProfile = getPolicyProfile();
  const allAchievements = Object.values(ACHIEVEMENTS);
  const lockedAchievements = allAchievements.filter(
    (a) => !achievements.includes(a.id)
  );

  const handleStartQuiz = () => {
    navigation.navigate('PolicyQuiz' as never);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I'm on my civic journey with VOTER! 🗳️\n\nLevel ${level}: ${currentLevel.title}\n${xp} XP earned\n${streak} day streak\n\nJoin me in becoming an informed voter!`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Journey</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Level Card */}
        <Card variant="elevated" style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View style={styles.levelIconContainer}>
              <Text style={styles.levelIcon}>{currentLevel.icon}</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelLabel}>Level {level}</Text>
              <Text style={styles.levelTitle}>{currentLevel.title}</Text>
            </View>
            <View style={styles.xpBadge}>
              <Text style={styles.xpText}>{xp} XP</Text>
            </View>
          </View>

          {nextLevel && (
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${xpProgress * 100}%` }]}
                />
              </View>
              <Text style={styles.progressText}>
                {xpToNextLevel} XP to {nextLevel.title}
              </Text>
            </View>
          )}

          {/* Level ladder preview */}
          <View style={styles.levelLadder}>
            {LEVELS.map((lvl, index) => (
              <View
                key={lvl.level}
                style={[
                  styles.ladderItem,
                  lvl.level <= level && styles.ladderItemUnlocked,
                  lvl.level === level && styles.ladderItemCurrent,
                ]}
              >
                <Text style={styles.ladderIcon}>{lvl.icon}</Text>
                <Text
                  style={[
                    styles.ladderLabel,
                    lvl.level <= level && styles.ladderLabelUnlocked,
                  ]}
                >
                  {lvl.level}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Card variant="outlined" style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="flame" size={24} color="#FF6B35" />
            </View>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </Card>

          <Card variant="outlined" style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="people" size={24} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{candidatesViewed.length}</Text>
            <Text style={styles.statLabel}>Researched</Text>
          </Card>

          <Card variant="outlined" style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="checkbox" size={24} color={colors.success} />
            </View>
            <Text style={styles.statValue}>{roster.length}</Text>
            <Text style={styles.statLabel}>On Roster</Text>
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Voter Tools</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('DailyLesson' as never)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="book" size={24} color="#D97706" />
              </View>
              <Text style={styles.quickActionTitle}>Daily Lesson</Text>
              <Text style={styles.quickActionSubtitle}>Learn civics</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('ElectionCalendar' as never)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="calendar" size={24} color="#16A34A" />
              </View>
              <Text style={styles.quickActionTitle}>Elections</Text>
              <Text style={styles.quickActionSubtitle}>Key dates</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('PollingPlaceFinder' as never)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="location" size={24} color="#6366F1" />
              </View>
              <Text style={styles.quickActionTitle}>Polling Place</Text>
              <Text style={styles.quickActionSubtitle}>Find yours</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Policy Quiz CTA */}
        {!quizCompleted && (
          <Card variant="elevated" style={styles.quizCard}>
            <View style={styles.quizContent}>
              <View style={styles.quizIconContainer}>
                <Text style={styles.quizIcon}>💡</Text>
              </View>
              <View style={styles.quizText}>
                <Text style={styles.quizTitle}>Discover Your Values</Text>
                <Text style={styles.quizSubtitle}>
                  Take a quick quiz to find candidates that match your priorities
                </Text>
              </View>
            </View>
            <Button
              title="Start Quiz"
              onPress={handleStartQuiz}
              fullWidth
              icon={<Ionicons name="arrow-forward" size={18} color={colors.white} />}
            />
          </Card>
        )}

        {/* Policy Profile (if quiz completed) */}
        {quizCompleted && Object.keys(policyProfile).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Policy Profile</Text>
            <Card variant="outlined" style={styles.profileCard}>
              {POLICY_CATEGORIES.map((category) => {
                const value = policyProfile[category.id] || 0;
                const percentage = ((value + 1) / 2) * 100; // Convert -1 to 1 to 0-100

                return (
                  <View key={category.id} style={styles.profileRow}>
                    <View style={styles.profileLabel}>
                      <Text style={styles.profileIcon}>{category.icon}</Text>
                      <Text style={styles.profileCategory}>{category.title}</Text>
                    </View>
                    <View style={styles.profileBarContainer}>
                      <View style={styles.profileBarTrack}>
                        <View
                          style={[
                            styles.profileBarFill,
                            {
                              width: `${percentage}%`,
                              backgroundColor: category.color,
                            },
                          ]}
                        />
                        <View style={styles.profileBarCenter} />
                      </View>
                    </View>
                  </View>
                );
              })}
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={handleStartQuiz}
              >
                <Text style={styles.retakeText}>Retake Quiz</Text>
                <Ionicons name="refresh" size={16} color={colors.primary} />
              </TouchableOpacity>
            </Card>
          </View>
        )}

        {/* Achievements Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Text style={styles.sectionCount}>
              {unlockedAchievements.length}/{allAchievements.length}
            </Text>
          </View>

          {/* Unlocked achievements */}
          {unlockedAchievements.length > 0 && (
            <View style={styles.achievementGrid}>
              {unlockedAchievements.map((achievement) => (
                <View key={achievement.id} style={styles.achievementCard}>
                  <View style={styles.achievementIconUnlocked}>
                    <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
                  </View>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementXP}>+{achievement.xp} XP</Text>
                </View>
              ))}
            </View>
          )}

          {/* Locked achievements */}
          {lockedAchievements.length > 0 && (
            <>
              <Text style={styles.lockedTitle}>Locked</Text>
              <View style={styles.achievementGrid}>
                {lockedAchievements.slice(0, 6).map((achievement) => (
                  <View key={achievement.id} style={styles.achievementCard}>
                    <View style={styles.achievementIconLocked}>
                      <Ionicons name="lock-closed" size={20} color={colors.textTertiary} />
                    </View>
                    <Text style={styles.achievementTitleLocked}>{achievement.title}</Text>
                    <Text style={styles.achievementDescription}>
                      {achievement.description}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Milestones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Milestones</Text>
          <Card variant="outlined" style={styles.milestonesCard}>
            <MilestoneItem
              icon="📍"
              title="Started Journey"
              completed={true}
              description="You've begun your path to informed voting"
            />
            <MilestoneItem
              icon="💡"
              title="Discovered Values"
              completed={quizCompleted}
              description="Complete the policy quiz"
            />
            <MilestoneItem
              icon="🔍"
              title="Research Candidates"
              completed={candidatesViewed.length >= 3}
              description="Research at least 3 candidates"
            />
            <MilestoneItem
              icon="📋"
              title="Build Your Roster"
              completed={roster.length >= 1}
              description="Add candidates to your voting roster"
            />
            <MilestoneItem
              icon="🗳️"
              title="Ready to Vote"
              completed={roster.length >= 3 && quizCompleted}
              description="Complete your ballot research"
            />
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

// Milestone item component
const MilestoneItem: React.FC<{
  icon: string;
  title: string;
  completed: boolean;
  description: string;
}> = ({ icon, title, completed, description }) => (
  <View style={styles.milestoneItem}>
    <View style={[styles.milestoneIcon, completed && styles.milestoneIconCompleted]}>
      {completed ? (
        <Text style={styles.milestoneEmoji}>{icon}</Text>
      ) : (
        <Ionicons name="ellipse-outline" size={20} color={colors.textTertiary} />
      )}
    </View>
    <View style={styles.milestoneContent}>
      <Text style={[styles.milestoneTitle, completed && styles.milestoneTitleCompleted]}>
        {title}
      </Text>
      <Text style={styles.milestoneDescription}>{description}</Text>
    </View>
    {completed && (
      <Ionicons name="checkmark-circle" size={24} color={colors.success} />
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    ...shadows.small,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
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
  levelCard: {
    marginBottom: 16,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelIcon: {
    fontSize: 32,
  },
  levelInfo: {
    flex: 1,
    marginLeft: 16,
  },
  levelLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  xpBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  levelLadder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  ladderItem: {
    alignItems: 'center',
    opacity: 0.4,
  },
  ladderItemUnlocked: {
    opacity: 1,
  },
  ladderItemCurrent: {
    transform: [{ scale: 1.2 }],
  },
  ladderIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  ladderLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  ladderLabelUnlocked: {
    color: colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  quickActionsSection: {
    marginBottom: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: 16,
    alignItems: 'center',
    ...shadows.small,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  quizCard: {
    marginBottom: 16,
    backgroundColor: colors.primary + '08',
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  quizContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  quizIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quizIcon: {
    fontSize: 28,
  },
  quizText: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  quizSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  sectionCount: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  profileCard: {
    paddingVertical: 8,
  },
  profileRow: {
    marginVertical: 8,
  },
  profileLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  profileIcon: {
    fontSize: 16,
  },
  profileCategory: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  profileBarContainer: {
    position: 'relative',
  },
  profileBarTrack: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  profileBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  profileBarCenter: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.textTertiary,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  retakeText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  achievementIconUnlocked: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementIconLocked: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.chipBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  achievementTitleLocked: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
    textAlign: 'center',
  },
  achievementXP: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  achievementDescription: {
    fontSize: 10,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 4,
  },
  lockedTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
  },
  milestonesCard: {
    paddingVertical: 8,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  milestoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.chipBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  milestoneIconCompleted: {
    backgroundColor: colors.success + '15',
  },
  milestoneEmoji: {
    fontSize: 20,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  milestoneTitleCompleted: {
    color: colors.textPrimary,
  },
  milestoneDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default JourneyScreen;
