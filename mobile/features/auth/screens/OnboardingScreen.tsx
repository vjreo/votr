import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import IssueSwipeCard from '../components/IssueSwipeCard';
import { useUser } from '../context/UserContext';
import { ISSUES } from '../../../shared/data/issues';
import { colors, borderRadius, typography } from '../../../shared/theme/colors';
import { logEvent } from '../../../shared/services/analytics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const OnboardingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { updatePreferences } = useUser();
  const [deck, setDeck] = useState<typeof ISSUES>([...ISSUES]);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSwipeRight = (issue: { id: string; name: string }) => {
    setSelectedIssues((prev) => (prev.includes(issue.id) ? prev : [...prev, issue.id]));
  };

  const handleSwipeLeft = (_issue: { id: string }) => {
    // Selection unchanged; deck updated on animation complete
  };

  const handleAnimationComplete = (issue: { id: string }) => {
    setDeck((prev) => prev.filter((i) => i.id !== issue.id));
  };

  const handleContinue = async () => {
    if (selectedIssues.length === 0) {
      Alert.alert('Select Issues', 'Swipe right on at least one issue you care about.');
      return;
    }

    setSaving(true);
    try {
      const preferences = selectedIssues.map((issueId) => ({
        issueId,
        issueName: ISSUES.find((i) => i.id === issueId)?.name || issueId,
        importance: 1,
      }));

      await updatePreferences(preferences);
      logEvent('onboarding_preferences_saved', { issueCount: preferences.length });
      // Parent re-renders when user state updates; no navigation needed
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const canContinue = selectedIssues.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.title}>What do you care about?</Text>
        <Text style={styles.subtitle}>
          We’ll match you with candidates who share those priorities.
        </Text>
      </View>

      <View style={styles.deckContainer}>
        {deck.length > 0 ? (
          deck
            .slice(0, 3)
            .map((issue, idx) => (
              <IssueSwipeCard
                key={issue.id}
                issue={issue}
                index={idx}
                onSwipeRight={handleSwipeRight}
                onSwipeLeft={handleSwipeLeft}
                onAnimationComplete={handleAnimationComplete}
              />
            ))
        ) : (
          <View style={styles.emptyDeck}>
            <Text style={styles.emptyTitle}>All done!</Text>
            <Text style={styles.emptySubtitle}>
              You selected {selectedIssues.length} issue{selectedIssues.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity
              style={[styles.button, !canContinue && styles.buttonDisabled]}
              onPress={handleContinue}
              disabled={!canContinue || saving}
            >
              <Text style={styles.buttonText}>
                {saving ? 'Saving...' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {deck.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.choiceButton, styles.passButton]}
              onPress={() => {
                const top = deck[0];
                if (!top) return;
                handleSwipeLeft(top);
                handleAnimationComplete(top);
              }}
              accessibilityRole="button"
              accessibilityLabel="Pass on this issue"
            >
              <Text style={styles.passButtonText}>Pass</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.choiceButton, styles.careButton]}
              onPress={() => {
                const top = deck[0];
                if (!top) return;
                handleSwipeRight(top);
                handleAnimationComplete(top);
              }}
              accessibilityRole="button"
              accessibilityLabel="I care about this issue"
            >
              <Text style={styles.careButtonText}>I care</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.counter}>
            {selectedIssues.length} selected · {deck.length} left
          </Text>
          {selectedIssues.length > 0 && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleContinue}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Done selecting issues"
            >
              <Text style={styles.skipButtonText}>{saving ? 'Saving...' : "I'm done"}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 0,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  subtitle: {
    ...typography.callout,
    color: colors.textSecondary,
  },
  deckContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDeck: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: borderRadius.full,
  },
  buttonDisabled: {
    backgroundColor: colors.border,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 4,
  },
  choiceButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  passButton: {
    backgroundColor: colors.errorMuted,
    borderWidth: 1,
    borderColor: colors.swipePass + '55',
  },
  careButton: {
    backgroundColor: colors.successMuted,
    borderWidth: 1,
    borderColor: colors.swipeLike + '55',
  },
  passButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.swipePass,
  },
  careButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.swipeLike,
  },
  counter: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default OnboardingScreen;
