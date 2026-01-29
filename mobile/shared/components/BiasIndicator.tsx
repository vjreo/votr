import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BiasTier } from '../types';
import { colors } from '../theme/colors';

interface BiasIndicatorProps {
  tier: BiasTier;
  score?: number;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const BiasIndicator: React.FC<BiasIndicatorProps> = ({
  tier,
  score,
  onPress,
  size = 'medium',
}) => {
  const getColor = () => {
    switch (tier) {
      case 'most_reliable':
        return colors.success; // Green
      case 'reliable':
        return colors.info; // Blue
      case 'use_caution':
        return colors.warning; // Amber
      case 'highly_biased':
        return colors.error; // Red
      default:
        return colors.textTertiary; // Gray
    }
  };

  const getLabel = () => {
    switch (tier) {
      case 'most_reliable':
        return 'Most Reliable';
      case 'reliable':
        return 'Reliable';
      case 'use_caution':
        return 'Use Caution';
      case 'highly_biased':
        return 'Highly Biased';
      default:
        return 'Unknown';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: 8, height: 8, borderRadius: 4 };
      case 'large':
        return { width: 16, height: 16, borderRadius: 8 };
      default:
        return { width: 12, height: 12, borderRadius: 6 };
    }
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.indicator, { backgroundColor: getColor() }, getSizeStyles()]} />
      <Text style={styles.label}>{getLabel()}</Text>
      {score !== undefined && (
        <Text style={styles.score}>{score}/100</Text>
      )}
    </Component>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  indicator: {
    backgroundColor: colors.textTertiary,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  score: {
    fontSize: 10,
    color: colors.textTertiary,
  },
});

export default BiasIndicator;

