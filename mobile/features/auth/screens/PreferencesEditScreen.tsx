import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import Button from '../../../shared/components/ui/Button';
import { ISSUES } from '../../../shared/data/issues';
import { colors } from '../../../shared/theme/colors';

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Preferences</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Tap issues you care about. Tap again to remove.
        </Text>
        <View style={styles.chipRow}>
          {ISSUES.map((issue) => {
            const selected = selectedIds.includes(issue.id);
            return (
              <TouchableOpacity
                key={issue.id}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => toggle(issue.id)}
              >
                <Text
                  style={[styles.chipText, selected && styles.chipTextSelected]}
                >
                  {issue.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Button
          title={saving ? 'Saving...' : 'Save'}
          onPress={handleSave}
          loading={saving}
          disabled={selectedIds.length === 0}
          fullWidth
          style={styles.saveBtn}
          size="medium"
        />
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headerRight: { width: 44 },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  chipTextSelected: {
    color: colors.white,
  },
  saveBtn: {
    marginTop: 8,
  },
});

export default PreferencesEditScreen;
