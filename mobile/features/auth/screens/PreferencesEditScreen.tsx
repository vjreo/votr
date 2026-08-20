import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { Button, ScreenHeader } from '../../../shared/components/ui';
import { ISSUES } from '../../../shared/data/issues';
import { colors, typography } from '../../../shared/theme/colors';

const PreferencesEditScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, updatePreferences } = useUser();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const current = (user?.preferences || []).map((p: any) =>
      typeof p === 'string' ? p : p.issueId || p.issue_id
    ).filter(Boolean);
    setSelectedIds(current);
  }, [user?.preferences]);

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) return;
    setSaving(true);
    try {
      const preferences = selectedIds.map((issueId) => ({
        issueId,
        issueName: ISSUES.find((i) => i.id === issueId)?.name || issueId,
        importance: 1,
      }));
      await updatePreferences(preferences);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Issues you care about" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Tap to add or remove. Match scores use the issues you select.
        </Text>
        <View style={styles.chipRow}>
          {ISSUES.map((issue) => {
            const selected = selectedIds.includes(issue.id);
            return (
              <TouchableOpacity
                key={issue.id}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => toggle(issue.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={issue.name}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {issue.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Text style={styles.footerHint}>
          {selectedIds.length === 0
            ? 'Select at least one issue'
            : `${selectedIds.length} issue${selectedIds.length === 1 ? '' : 's'} selected`}
        </Text>
        <Button
          title={saving ? 'Saving...' : 'Save'}
          onPress={handleSave}
          loading={saving}
          disabled={selectedIds.length === 0}
          fullWidth
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 20,
  },
  subtitle: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.subhead,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: 8,
  },
  footerHint: {
    ...typography.footnote,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default PreferencesEditScreen;
