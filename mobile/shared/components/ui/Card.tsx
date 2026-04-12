/**
 * Card — 2026 Bento-Grid Design System
 *
 * Variants:
 * - default   : standard dark surface card
 * - elevated  : higher z-level surface with larger shadow
 * - outlined  : subtle border, transparent base (for list items)
 * - glass     : glassmorphism — semi-transparent with blur tint
 * - bento     : flat accent-bordered compartment (grid layouts)
 * - highlight : primary-tinted surface for featured content
 *
 * Press feedback: scale-down spring micro-interaction.
 */
import React, { useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors, borderRadius, shadows } from '../../theme/colors';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'glass' | 'bento' | 'highlight';
type CardPadding = 'none' | 'small' | 'medium' | 'large';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: CardVariant;
  padding?: CardPadding;
  style?: StyleProp<ViewStyle>;
  /** Disables press animation (use for cards with internal scroll) */
  staticPress?: boolean;
}

const PADDING_MAP: Record<CardPadding, number> = {
  none: 0,
  small: 12,
  medium: 16,
  large: 20,
};

const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'default',
  padding = 'medium',
  style,
  staticPress = false,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (staticPress) return;
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 40,
      bounciness: 2,
    }).start();
  }, [scale, staticPress]);

  const handlePressOut = useCallback(() => {
    if (staticPress) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  }, [scale, staticPress]);

  const cardStyle = [
    styles.base,
    variantStyles[variant],
    { padding: PADDING_MAP[padding] },
    style,
  ];

  if (onPress) {
    return (
      <Animated.View style={[{ transform: [{ scale }] }]}>
        <TouchableOpacity
          style={cardStyle}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          accessibilityRole="button"
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const variantStyles: Record<CardVariant, ViewStyle> = {
  default: {
    backgroundColor: colors.surface,
    ...(shadows.small as ViewStyle),
  },
  elevated: {
    backgroundColor: colors.surfaceElevated,
    ...(shadows.medium as ViewStyle),
  },
  outlined: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  glass: {
    backgroundColor: 'rgba(36,34,32,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    ...(shadows.medium as ViewStyle),
  },
  bento: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...(shadows.small as ViewStyle),
  },
  highlight: {
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.22)',
  },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
});

export default Card;
