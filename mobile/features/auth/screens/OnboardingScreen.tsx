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
import { colors } from '../../../shared/theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const OnboardingScreen: React.FC = () => {
  const { updatePreferences } = useUser();
  const [deck, setDeck] = useState<typeof ISSUES>([...ISSUES]);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSwipeRight = (issue: { id: string; name: string }) => {
    setSelectedIssues((prev) => [...prev, issue.id]);
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>What matters to you?</Text>
        <Text style={styles.subtitle}>
          Swipe right on issues you care about. Swipe left to skip.
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
          <Text style={styles.counter}>
            {selectedIssues.length} selected • {deck.length} left
          </Text>
          {selectedIssues.length > 0 && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => setDeck([])}
            >
              <Text style={styles.skipButtonText}>I'm done</Text>
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
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
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
    borderRadius: 12,
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
