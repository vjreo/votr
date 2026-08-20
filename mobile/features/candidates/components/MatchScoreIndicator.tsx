import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography } from '../../../shared/theme/colors';

interface MatchScoreIndicatorProps {
  score: number; // 0–100
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  animate?: boolean;
}

const SIZE_MAP = {
  small:  { diameter: 44, stroke: 3,  fontSize: 13, labelSize: 10 },
  medium: { diameter: 64, stroke: 4,  fontSize: 18, labelSize: 11 },
  large:  { diameter: 96, stroke: 5,  fontSize: 26, labelSize: 12 },
};

function scoreColor(score: number): string {
  if (score >= 75) return colors.matchHigh;
  if (score >= 50) return colors.sand;
  if (score >= 25) return colors.clay;
  return colors.matchLow;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const MatchScoreIndicator: React.FC<MatchScoreIndicatorProps> = ({
  score,
  size = 'medium',
  showLabel = true,
  animate = true,
}) => {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const config = SIZE_MAP[size];
  const radius = (config.diameter - config.stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = scoreColor(clampedScore);

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animate) {
      Animated.timing(progressAnim, {
        toValue: clampedScore / 100,
        duration: 800,
        useNativeDriver: false,
        delay: 100,
      }).start();
    } else {
      progressAnim.setValue(clampedScore / 100);
    }
  }, [clampedScore, animate, progressAnim]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const cx = config.diameter / 2;
  const cy = config.diameter / 2;

  return (
    <View
      style={styles.container}
      accessibilityLabel={`Match score: ${clampedScore}%`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clampedScore }}
    >
      <Svg
        width={config.diameter}
        height={config.diameter}
        style={StyleSheet.absoluteFill}
      >
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          strokeWidth={config.stroke}
          stroke={colors.border}
          fill="none"
          rotation="-90"
          originX={cx}
          originY={cy}
        />
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          strokeWidth={config.stroke}
          stroke={color}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          originX={cx}
          originY={cy}
        />
      </Svg>

      <View
        style={[
          styles.labelWrapper,
          { width: config.diameter, height: config.diameter },
        ]}
      >
        <Text style={[styles.score, { fontSize: config.fontSize, color }]}>
          {clampedScore}
          {size !== 'small' && <Text style={[styles.pct, { color }]}>%</Text>}
        </Text>
        {showLabel && size !== 'small' && (
          <Text style={[styles.matchLabel, { fontSize: config.labelSize }]}>Match</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontWeight: '700',
    includeFontPadding: false,
  },
  pct: {
    fontWeight: '500',
    fontSize: 11,
  },
  matchLabel: {
    ...typography.caption2,
    color: colors.textTertiary,
    marginTop: 1,
    fontWeight: '500',
  },
});

export default MatchScoreIndicator;
