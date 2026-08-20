import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { getApiErrorMessage } from '../../../shared/services/api';
import { Button, Input } from '../../../shared/components/ui';
import { colors, typography } from '../../../shared/theme/colors';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { login, register, isAnonymous, linkAnonymousAccount, user } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => navigation.goBack();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!isLogin && password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    const anonymousId = isAnonymous ? user?.id : undefined;

    try {
      setLoading(true);

      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
        if (anonymousId) {
          try {
            await linkAnonymousAccount(anonymousId);
          } catch (error) {
            console.error('Error linking anonymous account:', error);
          }
        }
      }

      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={28} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>{isLogin ? 'Welcome back' : 'Create account'}</Text>
          <Text style={styles.subtitle}>
            {isLogin
              ? 'Sign in to sync your shortlist across devices'
              : 'Save your shortlist so it isn’t stuck on this phone'}
          </Text>
        </View>

        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Input
          label="Password"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        {!isLogin && (
          <Input
            label="Confirm password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        )}

        <Button
          title={isLogin ? 'Sign in' : 'Create account'}
          onPress={handleSubmit}
          loading={loading}
          fullWidth
          size="large"
        />

        <TouchableOpacity style={styles.switchButton} onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleClose}>
          <Text style={styles.skipText}>Not now</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 28,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.callout,
    color: colors.textSecondary,
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 16,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  skipText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});

export default LoginScreen;
