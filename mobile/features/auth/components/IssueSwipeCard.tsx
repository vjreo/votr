import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { colors, borderRadius, typography } from '../../../shared/theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

export interface Issue {
  id: string;
  name: string;
}

interface IssueSwipeCardProps {
  issue: Issue;
  index: number;
  onSwipeRight: (issue: Issue) => void;
  onSwipeLeft: (issue: Issue) => void;
  onAnimationComplete?: (issue: Issue) => void;
}

const IssueSwipeCard: React.FC<IssueSwipeCardProps> = ({
  issue,
  index,
  onSwipeRight,
  onSwipeLeft,
  onAnimationComplete,
}) => {
  const position = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => index === 0,
      onPanResponderMove: (_, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx } = gestureState;

        if (Math.abs(dx) > SWIPE_THRESHOLD) {
          if (dx > 0) {
            onSwipeRight(issue);
            animateOut('right');
          } else {
            onSwipeLeft(issue);
            animateOut('left');
          }
          setTimeout(() => onAnimationComplete?.(issue), 220);
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const animateOut = (direction: 'left' | 'right') => {
    Animated.parallel([
      Animated.timing(position, {
        toValue: { x: direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH, y: 0 },
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const rotateCard = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { rotate: rotateCard },
          ],
          opacity,
          zIndex: 100 - index,
        },
      ]}
      {...(index === 0 ? panResponder.panHandlers : {})}
    >
      <View style={styles.content}>
        <Text style={styles.issueName}>{issue.name}</Text>
        <Text style={styles.hint}>Swipe right if it matters — or use the buttons</Text>
      </View>

      <Animated.View style={[styles.likeLabel, { opacity: likeOpacity }]} pointerEvents="none">
        <Text style={styles.likeText}>CARE</Text>
      </Animated.View>
      <Animated.View style={[styles.nopeLabel, { opacity: nopeOpacity }]} pointerEvents="none">
        <Text style={styles.nopeText}>PASS</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH - 48,
    height: 340,
    borderRadius: 28,
    backgroundColor: colors.surface,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  content: {
    alignItems: 'center',
    padding: 36,
  },
  issueName: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  hint: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginTop: 14,
    textAlign: 'center',
  },
  likeLabel: {
    position: 'absolute',
    top: 36,
    right: 22,
    borderWidth: 2,
    borderColor: colors.swipeLike,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    transform: [{ rotate: '12deg' }],
    backgroundColor: colors.successMuted,
  },
  likeText: {
    ...typography.title3,
    fontWeight: '800',
    color: colors.swipeLike,
  },
  nopeLabel: {
    position: 'absolute',
    top: 36,
    left: 22,
    borderWidth: 2,
    borderColor: colors.swipePass,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    transform: [{ rotate: '-12deg' }],
    backgroundColor: colors.errorMuted,
  },
  nopeText: {
    ...typography.title3,
    fontWeight: '800',
    color: colors.swipePass,
  },
});

export default IssueSwipeCard;
