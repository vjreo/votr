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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Candidate } from '../../../shared/types';
import MatchScoreIndicator from './MatchScoreIndicator';
import { colors, borderRadius, typography } from '../../../shared/theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.22;

interface SwipeableCardProps {
  candidate: Candidate;
  matchScore?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  index: number;
  cardWidth?: number;
  cardHeight?: number;
}

function getPartyColor(party: string = ''): string {
  const p = party.toLowerCase();
  if (p.includes('democrat')) return colors.democrat;
  if (p.includes('republican')) return colors.republican;
  if (p.includes('independent')) return colors.independent;
  return colors.other;
}

function getPartyLabel(party: string = ''): string {
  const p = party.toLowerCase();
  if (p.includes('democrat')) return 'DEM';
  if (p.includes('republican')) return 'REP';
  if (p.includes('independent')) return 'IND';
  return party.slice(0, 3).toUpperCase() || '—';
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({
  candidate,
  matchScore,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  index,
  cardWidth = SCREEN_WIDTH - 40,
  cardHeight = 480,
}) => {
  const position = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(index === 0 ? 1 : 0.96 - index * 0.01)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => index === 0,
      onPanResponderMove: (_, g) => {
        position.setValue({ x: g.dx, y: g.dy });
      },
      onPanResponderRelease: (_, { dx, dy }) => {
        const isUpSwipe = Math.abs(dy) > Math.abs(dx) && dy < -SWIPE_THRESHOLD;
        const isRightSwipe = dx > SWIPE_THRESHOLD && !isUpSwipe;
        const isLeftSwipe = dx < -SWIPE_THRESHOLD && !isUpSwipe;

        if (isUpSwipe) {
          onSwipeUp?.();
          resetPosition();
        } else if (isRightSwipe) {
          onSwipeRight?.();
          animateOut('right');
        } else if (isLeftSwipe) {
          onSwipeLeft?.();
          animateOut('left');
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
      speed: 25,
      bounciness: 6,
    }).start();
  };

  const animateOut = (direction: 'left' | 'right') => {
    Animated.parallel([
      Animated.timing(position, {
        toValue: { x: direction === 'right' ? SCREEN_WIDTH * 1.4 : -SCREEN_WIDTH * 1.4, y: 30 },
        duration: 260,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: false }),
    ]).start();
  };

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH * 0.35],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.35, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const glowOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH * 0.5],
    outputRange: [0, 0.18],
    extrapolate: 'clamp',
  });

  const partyColor = getPartyColor(candidate.party);
  const partyLabel = getPartyLabel(candidate.party);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          width: cardWidth,
          height: cardHeight,
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { rotate },
            { scale },
          ],
          opacity,
          zIndex: 100 - index,
        },
      ]}
      {...(index === 0 ? panResponder.panHandlers : {})}
      accessibilityLabel={`${candidate.name}, ${candidate.office}`}
    >
      {candidate.photo ? (
        <Image source={{ uri: candidate.photo }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Ionicons name="person-circle" size={100} color={colors.surfaceHighlight} />
        </View>
      )}

      <LinearGradient
        colors={['transparent', 'rgba(20,20,18,0.55)', 'rgba(20,20,18,0.97)']}
        locations={[0.35, 0.62, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <Animated.View
        style={[styles.glowOverlay, { opacity: glowOpacity }]}
        pointerEvents="none"
      />

      <View style={styles.topRow}>
        {candidate.party && (
          <View style={[styles.partyBadge, { borderColor: partyColor }]}>
            <Text style={[styles.partyText, { color: partyColor }]}>{partyLabel}</Text>
          </View>
        )}
        {matchScore != null && (
          <View style={styles.scoreWrapper}>
            <MatchScoreIndicator score={matchScore} size="small" showLabel={false} animate />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{candidate.name}</Text>
        <Text style={styles.office} numberOfLines={1}>{candidate.office}</Text>

        {candidate.positions && candidate.positions.length > 0 && (
          <View style={styles.positionsRow}>
            {candidate.positions.slice(0, 2).map((pos: any, i: number) => (
              <View key={i} style={styles.positionChip}>
                <Text style={styles.positionText} numberOfLines={1}>{pos.issueName}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <Animated.View style={[styles.likeLabel, { opacity: likeOpacity }]} pointerEvents="none">
        <Ionicons name="heart" size={16} color={colors.swipeLike} />
        <Text style={styles.likeText}>SHORTLIST</Text>
      </Animated.View>

      <Animated.View style={[styles.nopeLabel, { opacity: nopeOpacity }]} pointerEvents="none">
        <Ionicons name="close" size={18} color={colors.swipePass} />
        <Text style={styles.nopeText}>PASS</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    borderRadius: borderRadius.xxl,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
  },
  photoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.swipeLike,
  },
  topRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    backgroundColor: 'rgba(20,20,18,0.55)',
  },
  partyText: {
    ...typography.overline,
    fontWeight: '700',
  },
  scoreWrapper: {
    backgroundColor: 'rgba(20,20,18,0.60)',
    padding: 6,
    borderRadius: borderRadius.lg,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 18,
  },
  name: {
    ...typography.title1,
    color: colors.offWhite,
    marginBottom: 4,
  },
  office: {
    ...typography.callout,
    color: 'rgba(242,239,232,0.72)',
    marginBottom: 14,
  },
  positionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  positionChip: {
    backgroundColor: 'rgba(245,166,35,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  positionText: {
    ...typography.caption1,
    color: colors.primary,
    fontWeight: '600',
  },
  likeLabel: {
    position: 'absolute',
    top: 48,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.successMuted,
    borderWidth: 2,
    borderColor: colors.swipeLike,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    transform: [{ rotate: '12deg' }],
  },
  likeText: {
    ...typography.footnote,
    fontWeight: '700',
    color: colors.swipeLike,
  },
  nopeLabel: {
    position: 'absolute',
    top: 48,
    left: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.errorMuted,
    borderWidth: 2,
    borderColor: colors.swipePass,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    transform: [{ rotate: '-12deg' }],
  },
  nopeText: {
    ...typography.footnote,
    fontWeight: '700',
    color: colors.swipePass,
  },
});

export default SwipeableCard;
