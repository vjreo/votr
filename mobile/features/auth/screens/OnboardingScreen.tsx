import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import PreferencePills from '../../../../shared/components/PreferencePills';
import { useUser } from '../context/UserContext';
import { userApi } from '../services/userApi';
import { colors } from '../../../../shared/theme/colors';

const ISSUES = [
  { id: 'education', name: 'Education' },
  { id: 'healthcare', name: 'Healthcare' },
  { id: 'economy', name: 'Economy' },
  { id: 'environment', name: 'Environment' },
  { id: 'immigration', name: 'Immigration' },
  { id: 'criminal_justice', name: 'Criminal Justice' },
  { id: 'gun_control', name: 'Gun Control' },
  { id: 'abortion', name: 'Abortion' },
  { id: 'taxes', name: 'Taxes' },
  { id: 'infrastructure', name: 'Infrastructure' },
  { id: 'housing', name: 'Housing' },
  { id: 'climate', name: 'Climate Change' },
  { id: 'voting_rights', name: 'Voting Rights' },
  { id: 'social_security', name: 'Social Security' },
  { id: 'foreign_policy', name: 'Foreign Policy' },
];

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { updatePreferences } = useUser();
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);

  const handleToggleIssue = (issueId: string) => {
    setSelectedIssues((prev) => {
      if (prev.includes(issueId)) {
        return prev.filter((id) => id !== issueId);
      } else {
        return [...prev, issueId];
      }
    });
  };

  const handleContinue = async () => {
    if (selectedIssues.length === 0) {
      Alert.alert('Select Issues', 'Please select at least one issue you care about.');
      return;
    }

    try {
      // Save preferences to existing user (anonymous or authenticated)
      const preferences = selectedIssues.map((issueId) => ({
        issueId,
        issueName: ISSUES.find((i) => i.id === issueId)?.name || issueId,
        importance: 1, // Default importance
      }));

      await updatePreferences(preferences);
      navigation.navigate('Home' as never);
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>What matters to you?</Text>
        <Text style={styles.subtitle}>
          Select the issues you care about most. We'll use this to match you with candidates.
        </Text>
      </View>

      <View style={styles.pillsContainer}>
        <PreferencePills
          issues={ISSUES}
          selectedIssues={selectedIssues}
          onToggle={handleToggleIssue}
        />
      </View>

      <View style={styles.selectedContainer}>
        <Text style={styles.selectedLabel}>
          {selectedIssues.length} issue{selectedIssues.length !== 1 ? 's' : ''} selected
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, selectedIssues.length === 0 && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={selectedIssues.length === 0}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
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
  pillsContainer: {
    marginBottom: 20,
  },
  selectedContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  selectedLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: colors.border,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OnboardingScreen;

