import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BadgeType } from '../../../shared/types';
import { colors } from '../../../shared/theme/colors';

interface AchievementBadgeProps {
  type: BadgeType;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: Date;
  onPress?: () => void;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  type,
  name,
  description,
  unlocked,
  unlockedAt,
  onPress,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'informed_voter':
        return '📚';
      case 'local_expert':
        return '🏛️';
      case 'civic_champion':
        return '🏆';
      case 'researcher':
        return '🔍';
      case 'streak_master':
        return '🔥';
      default:
        return '⭐';
    }
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[styles.container, !unlocked && styles.locked]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!unlocked}
    >
      <Text style={styles.icon}>{getIcon()}</Text>
      <View style={styles.textContainer}>
        <Text style={[styles.name, !unlocked && styles.lockedText]}>{name}</Text>
        <Text style={[styles.description, !unlocked && styles.lockedText]}>
          {description}
        </Text>
        {unlocked && unlockedAt && (
          <Text style={styles.unlockedAt}>
            Unlocked {unlockedAt.toLocaleDateString()}
          </Text>
        )}
      </View>
    </Component>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locked: {
    opacity: 0.5,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  unlockedAt: {
    fontSize: 10,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  lockedText: {
    color: colors.textTertiary,
  },
});

// StreakDisplay component
interface StreakDisplayProps {
  streak: number;
  size?: 'small' | 'medium' | 'large';
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({ streak, size = 'medium' }) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { fontSize: 14, iconSize: 16, padding: 6 };
      case 'large':
        return { fontSize: 24, iconSize: 28, padding: 12 };
      default:
        return { fontSize: 18, iconSize: 22, padding: 8 };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[streakStyles.container, { padding: sizeStyles.padding }]}>
      <Text style={{ fontSize: sizeStyles.iconSize }}>🔥</Text>
      <Text style={[streakStyles.text, { fontSize: sizeStyles.fontSize }]}>{streak}</Text>
      <Text style={streakStyles.label}>day streak</Text>
    </View>
  );
};

const streakStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 20,
    gap: 4,
  },
  text: {
    fontWeight: '700',
    color: '#E65100',
  },
  label: {
    fontSize: 12,
    color: '#F57C00',
  },
});

export default AchievementBadge;

