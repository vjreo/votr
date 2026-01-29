import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Animate logo in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after delay
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* VOTER Logo */}
        <View style={styles.logoWrapper}>
          <Text style={styles.logoV}>V</Text>
          <Text style={styles.logoText}>OTER</Text>
        </View>

        {/* Tagline */}
        <Text style={styles.tagline}>Your vote. Your voice.</Text>
      </Animated.View>

      {/* Decorative elements */}
      <View style={styles.decorativeBottom}>
        <View style={[styles.decorativeCircle, styles.circle1]} />
        <View style={[styles.decorativeCircle, styles.circle2]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoV: {
    fontSize: 72,
    fontWeight: '800',
    color: colors.primary,
    // Custom styling for the V - like a checkmark
    transform: [{ skewX: '-5deg' }],
  },
  logoText: {
    fontSize: 72,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -2,
  },
  tagline: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
    letterSpacing: 1,
  },
  decorativeBottom: {
    position: 'absolute',
    bottom: -50,
    left: 0,
    right: 0,
    height: 200,
    overflow: 'hidden',
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.1,
  },
  circle1: {
    width: 300,
    height: 300,
    backgroundColor: colors.primary,
    bottom: -150,
    left: -50,
  },
  circle2: {
    width: 200,
    height: 200,
    backgroundColor: colors.secondary,
    bottom: -100,
    right: -30,
  },
});

export default SplashScreen;
