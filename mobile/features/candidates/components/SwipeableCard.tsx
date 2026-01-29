import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { Candidate } from '../../../../shared/types';
import MatchScoreIndicator from './MatchScoreIndicator';
import { colors } from '../../../../shared/theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface SwipeableCardProps {
  candidate: Candidate;
  matchScore?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  index: number;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({
  candidate,
  matchScore,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  index,
}) => {
  const position = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, dy } = gestureState;

        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > SWIPE_THRESHOLD) {
          // Swipe up
          if (dy < 0 && onSwipeUp) {
            onSwipeUp();
          }
          resetPosition();
        } else if (Math.abs(dx) > SWIPE_THRESHOLD) {
          // Swipe left or right
          if (dx > 0 && onSwipeRight) {
            onSwipeRight();
            animateOut('right');
          } else if (dx < 0 && onSwipeLeft) {
            onSwipeLeft();
            animateOut('left');
          } else {
            resetPosition();
          }
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
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const rotateCard = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 2],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0],
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
      {...panResponder.panHandlers}
    >
      {(candidate.photo || (candidate as any).photo_url) && (
        <Image 
          source={{ uri: candidate.photo || (candidate as any).photo_url }} 
          style={styles.photo} 
        />
      )}
      
      <View style={styles.overlay}>
        <View style={styles.header}>
          <View style={styles.matchScoreContainer}>
            {matchScore !== undefined && (
              <MatchScoreIndicator score={matchScore} size="small" />
            )}
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.name}>{candidate.name}</Text>
          <Text style={styles.office}>{candidate.office}</Text>
          {candidate.party && (
            <Text style={styles.party}>{candidate.party}</Text>
          )}
          
          {candidate.positions && candidate.positions.length > 0 && (
            <View style={styles.positions}>
              <Text style={styles.positionsTitle}>Key Positions:</Text>
              {candidate.positions.slice(0, 3).map((pos: { issueName: string; stance: string }, idx: number) => (
                <Text key={idx} style={styles.position}>
                  • {pos.issueName}: {pos.stance}
                </Text>
              ))}
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.swipeHint}>Swipe ↑ to learn more</Text>
        </View>
      </View>

      {/* Like/Nope indicators */}
      <Animated.View
        style={[styles.likeLabel, { opacity: likeOpacity }]}
        pointerEvents="none"
      >
        <Text style={styles.likeText}>LIKE</Text>
      </Animated.View>
      <Animated.View
        style={[styles.nopeLabel, { opacity: nopeOpacity }]}
        pointerEvents="none"
      >
        <Text style={styles.nopeText}>NOPE</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH - 40,
    height: 600,
    borderRadius: 20,
    backgroundColor: colors.white,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '60%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.overlay,
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  matchScoreContainer: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    borderRadius: 20,
  },
  content: {
    marginTop: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  office: {
    fontSize: 18,
    color: colors.white,
    marginBottom: 4,
  },
  party: {
    fontSize: 14,
    color: colors.textTertiary,
    marginBottom: 12,
  },
  positions: {
    marginTop: 8,
  },
  positionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 4,
  },
  position: {
    fontSize: 12,
    color: colors.white,
    marginBottom: 2,
  },
  footer: {
    marginTop: 12,
    alignItems: 'center',
  },
  swipeHint: {
    fontSize: 12,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  likeLabel: {
    position: 'absolute',
    top: 50,
    right: 20,
    borderWidth: 4,
    borderColor: colors.swipeLike,
    padding: 8,
    borderRadius: 8,
    transform: [{ rotate: '15deg' }],
  },
  likeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.swipeLike,
  },
  nopeLabel: {
    position: 'absolute',
    top: 50,
    left: 20,
    borderWidth: 4,
    borderColor: colors.swipePass,
    padding: 8,
    borderRadius: 8,
    transform: [{ rotate: '-15deg' }],
  },
  nopeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.swipePass,
  },
});

export default SwipeableCard;
