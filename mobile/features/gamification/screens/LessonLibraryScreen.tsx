import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  CIVIC_LESSONS,
  LESSON_CATEGORIES,
  CivicLesson,
} from '../../../shared/data/civicLessons';
import { colors } from '../../../shared/theme/colors';

const LessonLibraryScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const lessonsByCategory = LESSON_CATEGORIES.map((cat) => ({
    ...cat,
    lessons: CIVIC_LESSONS.filter((l) => l.category === cat.key),
  }));

  const handleSelectLesson = (lesson: CivicLesson) => {
    navigation.navigate('DailyLesson' as never, { lesson } as never);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lesson Library</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Browse all civic lessons. Tap to start.
        </Text>

        {lessonsByCategory.map(({ key, label, icon, color, lessons }) => {
          if (lessons.length === 0) return null;
          return (
            <View key={key} style={styles.section}>
              <View style={[styles.sectionHeader, { backgroundColor: color + '20' }]}>
                <Text style={styles.sectionIcon}>{icon}</Text>
                <Text style={[styles.sectionTitle, { color }]}>{label}</Text>
                <Text style={styles.sectionCount}>{lessons.length} lessons</Text>
              </View>
              {lessons.map((lesson) => (
                <TouchableOpacity
                  key={lesson.id}
                  style={styles.lessonRow}
                  onPress={() => handleSelectLesson(lesson)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.lessonIcon, { backgroundColor: color + '20' }]}>
                    <Text style={styles.lessonIconText}>{lesson.icon}</Text>
                  </View>
                  <View style={styles.lessonInfo}>
                    <Text style={styles.lessonTitle}>{lesson.title}</Text>
                    <Text style={styles.lessonMeta}>{lesson.duration} · +{lesson.xpReward} XP</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
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
    backgroundColor: colors.card,
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
  scrollContent: { padding: 16 },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  sectionCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  lessonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lessonIconText: {
    fontSize: 20,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  lessonMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default LessonLibraryScreen;
