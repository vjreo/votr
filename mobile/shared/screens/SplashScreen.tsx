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
  const scaleAnim = new Animated.Value(0.85);
  const taglineAnim = new Animated.Value(0);

  useEffect(() => {
    // Logo animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // Tagline fade-in (delayed)
    setTimeout(() => {
      Animated.timing(taglineAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 400);

    // Navigate after delay
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Subtle gradient-like background */}
      <View style={styles.backgroundTint} />
      <View style={styles.backgroundAccent} />

      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoWrapper}>
          <Text style={styles.logoV}>V</Text>
          <Text style={styles.logoText}>OTR</Text>
        </View>

        <Animated.Text style={[styles.tagline, { opacity: taglineAnim }]}>
          Making democracy sexy. Discover candidates that match your values.
        </Animated.Text>
      </Animated.View>

      <View style={styles.decorativeBottom}>
        <View style={[styles.decorativeCircle, styles.circle1]} />
        <View style={[styles.decorativeCircle, styles.circle2]} />
        <View style={[styles.decorativeCircle, styles.circle3]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary + '08',
  },
  backgroundAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: colors.primary + '0a',
  },
  logoContainer: {
    alignItems: 'center',
    zIndex: 1,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoV: {
    fontSize: 76,
    fontWeight: '800',
    color: colors.primary,
    transform: [{ skewX: '-4deg' }],
  },
  logoText: {
    fontSize: 76,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 18,
    letterSpacing: 2,
    fontWeight: '600',
  },
  decorativeBottom: {
    position: 'absolute',
    bottom: -80,
    left: 0,
    right: 0,
    height: 280,
    overflow: 'hidden',
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  circle1: {
    width: 320,
    height: 320,
    backgroundColor: colors.primary,
    opacity: 0.12,
    bottom: -160,
    left: -80,
  },
  circle2: {
    width: 220,
    height: 220,
    backgroundColor: colors.moss,
    opacity: 0.08,
    bottom: -80,
    right: -40,
  },
  circle3: {
    width: 160,
    height: 160,
    backgroundColor: colors.primary,
    opacity: 0.08,
    bottom: -40,
    left: width * 0.3,
  },
});

export default SplashScreen;
