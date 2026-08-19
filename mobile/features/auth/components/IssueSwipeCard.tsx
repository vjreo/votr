import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { colors } from '../../../shared/theme/colors';

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
        <Text style={styles.hint}>Swipe right if it matters to you, or use the buttons below</Text>
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
    height: 320,
    borderRadius: 24,
    backgroundColor: colors.card,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    alignItems: 'center',
    padding: 32,
  },
  issueName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  likeLabel: {
    position: 'absolute',
    top: 40,
    right: 24,
    borderWidth: 4,
    borderColor: colors.swipeLike,
    padding: 10,
    borderRadius: 12,
    transform: [{ rotate: '15deg' }],
  },
  likeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.swipeLike,
  },
  nopeLabel: {
    position: 'absolute',
    top: 40,
    left: 24,
    borderWidth: 4,
    borderColor: colors.swipePass,
    padding: 10,
    borderRadius: 12,
    transform: [{ rotate: '-15deg' }],
  },
  nopeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.swipePass,
  },
});

export default IssueSwipeCard;
