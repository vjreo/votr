/**
 * Button — 2026 "Smart Simplicity" design
 *
 * Micro-interactions:
 * - Scale-down spring on press (feels physical, not flat)
 * - Animated opacity transition for disabled state
 * - Loading state with spinner replacing label (no layout shift)
 */
import React, { useRef, useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { colors, shadows, borderRadius, typography } from '../../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
  iconRight,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  }, [scale]);

  const containerStyles: ViewStyle[] = [
    styles.base,
    sizeStyles[size],
    variantStyles[variant],
    fullWidth && styles.fullWidth,
    variant === 'primary' && !disabled ? (shadows.medium as ViewStyle) : {},
    (disabled || loading) && styles.disabled,
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  const labelStyles: TextStyle[] = [
    styles.label,
    textSizeStyles[size],
    variantTextStyles[variant],
    (disabled || loading) && styles.labelDisabled,
    textStyle as TextStyle,
  ].filter(Boolean) as TextStyle[];

  const spinnerColor = variant === 'primary' ? colors.textInverse : colors.primary;

  return (
    <Animated.View style={{ transform: [{ scale }], ...(fullWidth ? { width: '100%' } : {}) }}>
      <TouchableOpacity
        style={containerStyles}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1} // We control opacity via Animated scale
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        accessibilityLabel={title}
      >
        {loading ? (
          <ActivityIndicator color={spinnerColor} size="small" />
        ) : (
          <>
            {icon}
            <Text style={labelStyles}>{title}</Text>
            {iconRight}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Size tokens ───────────────────────────────────────────────────────────────
const sizeStyles: Record<string, ViewStyle> = {
  small:  { paddingVertical: 10, paddingHorizontal: 18, minHeight: 44, gap: 6 },
  medium: { paddingVertical: 14, paddingHorizontal: 24, minHeight: 50, gap: 8 },
  large:  { paddingVertical: 18, paddingHorizontal: 32, minHeight: 58, gap: 8 },
};

const textSizeStyles: Record<string, TextStyle> = {
  small:  { fontSize: 14 },
  medium: { fontSize: 16 },
  large:  { fontSize: 18 },
};

// ── Variant styles ────────────────────────────────────────────────────────────
const variantStyles: Record<string, ViewStyle> = {
  primary:   { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surfaceElevated },
  outline:   { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  ghost:     { backgroundColor: 'transparent' },
  danger:    { backgroundColor: colors.errorMuted, borderWidth: 1, borderColor: colors.error },
};

const variantTextStyles: Record<string, TextStyle> = {
  primary:   { color: colors.textInverse },
  secondary: { color: colors.textPrimary },
  outline:   { color: colors.primary },
  ghost:     { color: colors.primary },
  danger:    { color: colors.error },
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.42,
  },
  label: {
    ...typography.callout,
    fontWeight: '600',
  },
  labelDisabled: {
    // Color comes from variantTextStyles; opacity handled on container
  },
});

export default Button;
