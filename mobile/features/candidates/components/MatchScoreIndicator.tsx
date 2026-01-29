import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../../shared/theme/colors';

interface MatchScoreIndicatorProps {
  score: number; // 0-100
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const MatchScoreIndicator: React.FC<MatchScoreIndicatorProps> = ({
  score,
  size = 'medium',
  showLabel = true,
}) => {
  const getColor = () => {
    if (score >= 80) return colors.matchHigh; // Green
    if (score >= 60) return colors.matchMedium; // Amber
    if (score >= 40) return colors.warning; // Warning color
    if (score >= 20) return colors.matchLow; // Red
    return colors.matchLow; // Red
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { fontSize: 14, circleSize: 40 };
      case 'large':
        return { fontSize: 32, circleSize: 100 };
      default:
        return { fontSize: 20, circleSize: 60 };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.circle,
          {
            width: sizeStyles.circleSize,
            height: sizeStyles.circleSize,
            borderRadius: sizeStyles.circleSize / 2,
            borderColor: getColor(),
          },
        ]}
      >
        <Text style={[styles.score, { fontSize: sizeStyles.fontSize, color: getColor() }]}>
          {score}%
        </Text>
      </View>
      {showLabel && (
        <Text style={styles.label}>Match</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  score: {
    fontWeight: 'bold',
  },
  label: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

export default MatchScoreIndicator;
