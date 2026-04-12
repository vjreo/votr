/**
 * Input — 2026 "Smart Simplicity" design
 *
 * Improvements over v1:
 * - Animated focus border (color transition, not just width jump)
 * - Success state with green border + checkmark icon
 * - Real-time validation icon (error ✕ / success ✓)
 * - Descriptive hint text below field (separate from error)
 * - Character count display for fields with maxLength
 * - Secure text toggle for password fields
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, typography } from '../../theme/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  success?: boolean;
  containerStyle?: ViewStyle;
  showCharCount?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  success = false,
  containerStyle,
  style,
  secureTextEntry,
  maxLength,
  showCharCount = false,
  value,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const [secureVisible, setSecureVisible] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = useCallback(() => {
    setFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false,
    }).start();
    props.onFocus?.({} as any);
  }, [borderAnim, props]);

  const handleBlur = useCallback(() => {
    setFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
    props.onBlur?.({} as any);
  }, [borderAnim, props]);

  const borderColor = error
    ? colors.borderError
    : success
    ? colors.borderSuccess
    : borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.border, colors.borderFocus],
      });

  const showToggle = secureTextEntry;
  const charCount = typeof value === 'string' ? value.length : 0;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, focused && styles.labelFocused, error && styles.labelError]}>
          {label}
        </Text>
      )}

      <Animated.View
        style={[
          styles.inputWrapper,
          { borderColor },
          focused && styles.inputWrapperFocused,
          error && styles.inputWrapperError,
          success && styles.inputWrapperSuccess,
        ]}
      >
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !secureVisible}
          maxLength={maxLength}
          value={value}
          selectionColor={colors.primary}
          {...props}
        />

        {/* Right icon: secure toggle | error | success */}
        <View style={styles.rightIcon}>
          {showToggle ? (
            <TouchableOpacity
              onPress={() => setSecureVisible((v) => !v)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel={secureVisible ? 'Hide password' : 'Show password'}
            >
              <Ionicons
                name={secureVisible ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          ) : error ? (
            <Ionicons name="alert-circle" size={18} color={colors.error} />
          ) : success ? (
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          ) : null}
        </View>
      </Animated.View>

      <View style={styles.meta}>
        <View style={styles.metaLeft}>
          {error ? (
            <Text style={styles.errorText} accessibilityRole="alert">{error}</Text>
          ) : hint ? (
            <Text style={styles.hintText}>{hint}</Text>
          ) : null}
        </View>
        {showCharCount && maxLength != null && (
          <Text style={[styles.charCount, charCount >= maxLength && styles.charCountLimit]}>
            {charCount}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
};

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    ...typography.overline,
    color: colors.textTertiary,
    marginBottom: 7,
  },
  labelFocused: {
    color: colors.primary,
  },
  labelError: {
    color: colors.error,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  inputWrapperFocused: {
    backgroundColor: colors.backgroundLight,
  },
  inputWrapperError: {
    borderColor: colors.borderError,
    backgroundColor: colors.errorMuted,
  },
  inputWrapperSuccess: {
    borderColor: colors.borderSuccess,
  },
  input: {
    flex: 1,
    ...typography.callout,
    color: colors.textPrimary,
    paddingVertical: 12,
    paddingRight: 8,
  },
  rightIcon: {
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 5,
    minHeight: 16,
  },
  metaLeft: {
    flex: 1,
  },
  errorText: {
    ...typography.caption1,
    color: colors.error,
  },
  hintText: {
    ...typography.caption1,
    color: colors.textTertiary,
  },
  charCount: {
    ...typography.caption1,
    color: colors.textTertiary,
    marginLeft: 8,
  },
  charCountLimit: {
    color: colors.error,
  },
});

export default Input;
