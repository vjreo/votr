import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../../shared/theme/colors';

interface StreakCounterProps {
  streak: number;
  size?: 'small' | 'medium' | 'large';
}

const StreakCounter: React.FC<StreakCounterProps> = ({ streak, size = 'medium' }) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { fontSize: 14, iconSize: 16 };
      case 'large':
        return { fontSize: 24, iconSize: 28 };
      default:
        return { fontSize: 18, iconSize: 20 };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={styles.container}>
      <Text style={[styles.fire, { fontSize: sizeStyles.iconSize }]}>🔥</Text>
      <Text style={[styles.streak, { fontSize: sizeStyles.fontSize }]}>
        {streak} day{streak !== 1 ? 's' : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fire: {
    fontSize: 20,
  },
  streak: {
    fontWeight: '600',
    color: colors.accent,
  },
});

export default StreakCounter;

