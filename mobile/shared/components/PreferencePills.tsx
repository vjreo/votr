import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { colors } from '../theme/colors';

export interface Issue {
  id: string;
  name: string;
  description?: string;
}

interface PreferencePillsProps {
  issues: Issue[];
  selectedIssues: string[];
  onToggle: (issueId: string) => void;
  multiSelect?: boolean;
}

const PreferencePills: React.FC<PreferencePillsProps> = ({
  issues,
  selectedIssues,
  onToggle,
  multiSelect = true,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {issues.map((issue) => {
        const isSelected = selectedIssues.includes(issue.id);
        return (
          <TouchableOpacity
            key={issue.id}
            style={[styles.pill, isSelected && styles.pillSelected]}
            onPress={() => onToggle(issue.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
              {issue.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    gap: 10,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.offWhite,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  pillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  pillTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
});

export default PreferencePills;

