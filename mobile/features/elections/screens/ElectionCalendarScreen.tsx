import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Card, Button } from '../../../shared/components/ui';
import { useUser } from '../../../features/auth/context/UserContext';
import { openUrlSafely } from '../../../shared/utils/openUrl';
import { colors, shadows, borderRadius } from '../../../shared/theme/colors';

// NC Election Data - 2024/2025
const NC_ELECTIONS = [
  {
    id: 'nc-general-2024',
    name: '2024 General Election',
    date: '2024-11-05',
    type: 'general',
    isKeyElection: true,
    icon: '🗳️',
    description: 'Vote for President, Governor, US Senate, State Legislature, and local offices',
    deadlines: [
      { name: 'Voter Registration Deadline', date: '2024-10-11', icon: '📝', critical: true },
      { name: 'Absentee Ballot Request Deadline', date: '2024-10-29', icon: '✉️', critical: true },
      { name: 'Early Voting Begins', date: '2024-10-17', icon: '🏃', critical: false },
      { name: 'Early Voting Ends', date: '2024-11-02', icon: '⏰', critical: false },
      { name: 'Election Day', date: '2024-11-05', icon: '🗳️', critical: true },
    ],
    offices: [
      'President of the United States',
      'Governor of North Carolina',
      'Lieutenant Governor',
      'Attorney General',
      'U.S. House of Representatives',
      'NC Supreme Court',
      'NC Court of Appeals',
      'NC State Senate',
      'NC House of Representatives',
      'County Commissioners',
      'School Board',
    ],
    resources: [
      { name: 'Check Registration Status', url: 'https://vt.ncsbe.gov/RegLkup/' },
      { name: 'Find Your Polling Place', url: 'https://vt.ncsbe.gov/PPLkup/' },
      { name: 'View Sample Ballot', url: 'https://vt.ncsbe.gov/BallotLkup/' },
      { name: 'Track Absentee Ballot', url: 'https://northcarolina.ballottrax.net/voter/' },
    ],
  },
  {
    id: 'nc-municipal-2025',
    name: '2025 Municipal Elections',
    date: '2025-11-04',
    type: 'municipal',
    isKeyElection: false,
    icon: '🏛️',
    description: 'City councils, mayors, and local offices across North Carolina',
    deadlines: [
      { name: 'Voter Registration Deadline', date: '2025-10-10', icon: '📝', critical: true },
      { name: 'Election Day', date: '2025-11-04', icon: '🗳️', critical: true },
    ],
    offices: [
      'Charlotte Mayor',
      'Charlotte City Council',
      'Town Councils',
      'Municipal Offices',
    ],
    resources: [],
  },
  {
    id: 'nc-primary-2026',
    name: '2026 Primary Elections',
    date: '2026-03-03',
    type: 'primary',
    isKeyElection: false,
    icon: '🗳️',
    description: 'Party primaries for US Senate, House, and state offices',
    deadlines: [
      { name: 'Voter Registration Deadline', date: '2026-02-06', icon: '📝', critical: true },
      { name: 'Primary Election Day', date: '2026-03-03', icon: '🗳️', critical: true },
    ],
    offices: [
      'U.S. Senate',
      'U.S. House of Representatives',
      'State Legislature',
    ],
    resources: [],
  },
];

// Helper functions
const getDaysUntil = (dateString: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatShortDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const ElectionCalendarScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [remindersSet, setRemindersSet] = useState<Set<string>>(new Set());
  const [notificationPermission, setNotificationPermission] = useState<boolean>(false);

  useEffect(() => {
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationPermission(status === 'granted');
  };

  const requestNotificationPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setNotificationPermission(status === 'granted');
    return status === 'granted';
  };

  const scheduleReminder = async (deadline: any, electionName: string) => {
    const reminderId = `${electionName}-${deadline.name}`;

    if (remindersSet.has(reminderId)) {
      Alert.alert('Already Set', 'You already have a reminder for this deadline.');
      return;
    }

    let hasPermission = notificationPermission;
    if (!hasPermission) {
      hasPermission = await requestNotificationPermission();
    }

    if (!hasPermission) {
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications in your device settings to receive election reminders.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    const targetDate = new Date(deadline.date);
    const reminderDate = new Date(targetDate);
    reminderDate.setDate(reminderDate.getDate() - 1); // Remind 1 day before
    reminderDate.setHours(9, 0, 0, 0); // 9 AM

    // Don't schedule if reminder date is in the past
    if (reminderDate <= new Date()) {
      // If the deadline itself is today or in the future, remind now
      if (targetDate >= new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${deadline.icon} ${deadline.name} - Tomorrow!`,
            body: `${electionName}: ${deadline.name} is tomorrow. Don't forget!`,
            sound: true,
          },
          trigger: { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, repeats: false }, // Show almost immediately
        });
      } else {
        Alert.alert('Past Deadline', 'This deadline has already passed.');
        return;
      }
    } else {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${deadline.icon} ${deadline.name} - Tomorrow!`,
          body: `${electionName}: ${deadline.name} is tomorrow. Don't forget!`,
          sound: true,
        },
        trigger: { type: SchedulableTriggerInputTypes.DATE, date: reminderDate.getTime() },
      });
    }

    setRemindersSet((prev) => new Set(prev).add(reminderId));
    Alert.alert(
      'Reminder Set! 🔔',
      `You'll be reminded about "${deadline.name}" the day before.`
    );
  };

  const openResource = (url: string) => {
    openUrlSafely(url);
  };

  const getUpcomingDeadlines = () => {
    const allDeadlines: Array<{ deadline: any; election: any }> = [];

    NC_ELECTIONS.forEach((election) => {
      election.deadlines.forEach((deadline) => {
        const daysUntil = getDaysUntil(deadline.date);
        if (daysUntil >= 0 && daysUntil <= 60) {
          allDeadlines.push({ deadline, election });
        }
      });
    });

    return allDeadlines.sort(
      (a, b) => new Date(a.deadline.date).getTime() - new Date(b.deadline.date).getTime()
    );
  };

  const upcomingDeadlines = getUpcomingDeadlines();
  const nextElection = NC_ELECTIONS.find((e) => getDaysUntil(e.date) >= 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Election Calendar</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Countdown Card */}
        {nextElection && (
          <Card variant="elevated" style={styles.countdownCard}>
            <View style={styles.countdownHeader}>
              <Text style={styles.countdownIcon}>{nextElection.icon}</Text>
              <View style={styles.countdownInfo}>
                <Text style={styles.countdownLabel}>Next Election</Text>
                <Text style={styles.countdownTitle}>{nextElection.name}</Text>
              </View>
            </View>
            <View style={styles.countdownNumber}>
              <Text style={styles.countdownDays}>{getDaysUntil(nextElection.date)}</Text>
              <Text style={styles.countdownDaysLabel}>days away</Text>
            </View>
            <Text style={styles.countdownDate}>{formatDate(nextElection.date)}</Text>
          </Card>
        )}

        {/* Upcoming Deadlines */}
        {upcomingDeadlines.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
            {upcomingDeadlines.map(({ deadline, election }, index) => {
              const daysUntil = getDaysUntil(deadline.date);
              const isUrgent = daysUntil <= 7 && deadline.critical;
              const reminderId = `${election.name}-${deadline.name}`;
              const hasReminder = remindersSet.has(reminderId);

              return (
                <Card
                  key={`${election.id}-${deadline.name}`}
                  variant="outlined"
                  style={[styles.deadlineCard, isUrgent && styles.urgentCard]}
                >
                  <View style={styles.deadlineRow}>
                    <View style={styles.deadlineIconContainer}>
                      <Text style={styles.deadlineIcon}>{deadline.icon}</Text>
                    </View>
                    <View style={styles.deadlineInfo}>
                      <Text style={[styles.deadlineName, isUrgent && styles.urgentText]}>
                        {deadline.name}
                      </Text>
                      <Text style={styles.deadlineElection}>{election.name}</Text>
                      <Text style={styles.deadlineDate}>{formatDate(deadline.date)}</Text>
                    </View>
                    <View style={styles.deadlineRight}>
                      <View style={[styles.daysChip, isUrgent && styles.urgentChip]}>
                        <Text style={[styles.daysChipText, isUrgent && styles.urgentChipText]}>
                          {daysUntil === 0 ? 'Today!' : `${daysUntil}d`}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.reminderButton, hasReminder && styles.reminderButtonSet]}
                        onPress={() => scheduleReminder(deadline, election.name)}
                      >
                        <Ionicons
                          name={hasReminder ? 'notifications' : 'notifications-outline'}
                          size={20}
                          color={hasReminder ? colors.primary : colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* Quick Resources */}
        {nextElection && nextElection.resources.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Resources</Text>
            <View style={styles.resourceGrid}>
              {nextElection.resources.map((resource, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.resourceButton}
                  onPress={() => {
                    if (resource.name === 'View Sample Ballot') {
                      navigation.navigate('SampleBallot');
                    } else {
                      openResource(resource.url);
                    }
                  }}
                >
                  <Ionicons name="open-outline" size={20} color={colors.primary} />
                  <Text style={styles.resourceText}>{resource.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Elections List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Elections</Text>
          {NC_ELECTIONS.map((election) => {
            const daysUntil = getDaysUntil(election.date);
            const isPast = daysUntil < 0;

            return (
              <Card
                key={election.id}
                variant="outlined"
                style={[styles.electionCard, isPast && styles.pastElectionCard]}
              >
                <View style={styles.electionHeader}>
                  <Text style={styles.electionIcon}>{election.icon}</Text>
                  <View style={styles.electionInfo}>
                    <Text style={[styles.electionName, isPast && styles.pastText]}>
                      {election.name}
                    </Text>
                    <Text style={styles.electionDate}>{formatDate(election.date)}</Text>
                  </View>
                  {!isPast && (
                    <View style={styles.electionDays}>
                      <Text style={styles.electionDaysNumber}>{daysUntil}</Text>
                      <Text style={styles.electionDaysLabel}>days</Text>
                    </View>
                  )}
                  {isPast && (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedText}>Complete</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.electionDescription}>{election.description}</Text>

                {!isPast && (
                  <View style={styles.officesList}>
                    <Text style={styles.officesLabel}>On the ballot:</Text>
                    <Text style={styles.officesText}>
                      {election.offices.slice(0, 4).join(' • ')}
                      {election.offices.length > 4 && ` +${election.offices.length - 4} more`}
                    </Text>
                  </View>
                )}
              </Card>
            );
          })}
        </View>

        {/* NC Voter Info */}
        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text style={styles.infoTitle}>North Carolina Voter Info</Text>
          </View>
          <Text style={styles.infoText}>
            • You can register to vote online, by mail, or in person{'\n'}
            • NC offers early voting for 17 days before Election Day{'\n'}
            • Same-day registration available during early voting{'\n'}
            • Photo ID required to vote (with exceptions)
          </Text>
          <Button
            title="Visit NC State Board of Elections"
            variant="outline"
            onPress={() => Linking.openURL('https://www.ncsbe.gov/')}
            fullWidth
            style={styles.infoButton}
          />
        </Card>
      </ScrollView>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerRight: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  countdownCard: {
    backgroundColor: colors.primary,
    marginBottom: 20,
  },
  countdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  countdownIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  countdownInfo: {
    flex: 1,
  },
  countdownLabel: {
    fontSize: 12,
    color: colors.white + '99',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  countdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  countdownNumber: {
    alignItems: 'center',
    marginBottom: 12,
  },
  countdownDays: {
    fontSize: 64,
    fontWeight: '800',
    color: colors.white,
    lineHeight: 72,
  },
  countdownDaysLabel: {
    fontSize: 16,
    color: colors.white + '99',
    marginTop: -8,
  },
  countdownDate: {
    fontSize: 14,
    color: colors.white,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  deadlineCard: {
    marginBottom: 10,
  },
  urgentCard: {
    borderColor: colors.error,
    backgroundColor: colors.error + '08',
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.chipBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deadlineIcon: {
    fontSize: 20,
  },
  deadlineInfo: {
    flex: 1,
  },
  deadlineName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  urgentText: {
    color: colors.error,
  },
  deadlineElection: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deadlineDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deadlineRight: {
    alignItems: 'center',
    gap: 8,
  },
  daysChip: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  urgentChip: {
    backgroundColor: colors.error,
  },
  daysChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  urgentChipText: {
    color: colors.white,
  },
  reminderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.chipBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderButtonSet: {
    backgroundColor: colors.primary + '15',
  },
  resourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  resourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resourceText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  electionCard: {
    marginBottom: 12,
  },
  pastElectionCard: {
    opacity: 0.6,
  },
  electionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  electionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  electionInfo: {
    flex: 1,
  },
  electionName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pastText: {
    color: colors.textTertiary,
  },
  electionDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  electionDays: {
    alignItems: 'center',
  },
  electionDaysNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  electionDaysLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  completedBadge: {
    backgroundColor: colors.success + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  completedText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  electionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  officesList: {
    backgroundColor: colors.chipBackground,
    padding: 12,
    borderRadius: borderRadius.md,
  },
  officesLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  officesText: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: colors.primary + '08',
    borderColor: colors.primary + '20',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  infoButton: {
    marginTop: 0,
  },
});

export default ElectionCalendarScreen;
