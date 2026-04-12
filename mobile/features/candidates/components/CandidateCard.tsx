/**
 * CandidateCard — 2026 redesign
 *
 * Visual changes:
 * - Party pill chip with color-coded border (DEM / REP / IND)
 * - Animated scale spring on press (physical feedback)
 * - Photo ring border inherits party color for instant visual grouping
 * - Selected state: amber glow border + checkmark overlay
 * - Bento-style row: compact avatar | name + meta | actions
 */
import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, typography } from '../../../shared/theme/colors';

interface CandidateCardProps {
  name: string;
  party: string;
  photo?: string;
  office?: string;
  onPress?: () => void;
  onCompare?: () => void;
  selected?: boolean;
  size?: 'small' | 'medium' | 'large';
  /** 0–100 when loaded with includeMatch */
  matchScore?: number | null;
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

const PHOTO_SIZES: Record<string, number> = {
  small: 40,
  medium: 52,
  large: 72,
};

const CandidateCard: React.FC<CandidateCardProps> = ({
  name,
  party,
  photo,
  office,
  onPress,
  onCompare,
  selected = false,
  size = 'medium',
  matchScore,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
      bounciness: 2,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 5,
    }).start();
  }, [scale]);

  const partyColor = getPartyColor(party);
  const partyLabel = getPartyLabel(party);
  const photoSize = PHOTO_SIZES[size] ?? PHOTO_SIZES.medium;
  const avatarRadius = photoSize / 2;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.container, selected && styles.containerSelected]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${party}${office ? `, ${office}` : ''}`}
        accessibilityState={{ selected }}
      >
        {/* Avatar */}
        <View
          style={[
            styles.avatarRing,
            {
              width: photoSize + 4,
              height: photoSize + 4,
              borderRadius: avatarRadius + 2,
              borderColor: selected ? colors.primary : partyColor,
            },
          ]}
        >
          {photo ? (
            <Image
              source={{ uri: photo }}
              style={[
                styles.photo,
                { width: photoSize, height: photoSize, borderRadius: avatarRadius },
              ]}
            />
          ) : (
            <View
              style={[
                styles.photoPlaceholder,
                {
                  width: photoSize,
                  height: photoSize,
                  borderRadius: avatarRadius,
                  backgroundColor: partyColor + '22',
                },
              ]}
            >
              <Ionicons name="person" size={photoSize * 0.45} color={partyColor} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>

          <View style={styles.metaRow}>
            <View style={[styles.partyChip, { borderColor: partyColor }]}>
              <Text style={[styles.partyChipText, { color: partyColor }]}>{partyLabel}</Text>
            </View>
            {matchScore != null && (
              <View
                style={[
                  styles.matchChip,
                  matchScore === 0 && styles.matchChipLowSignal,
                ]}
              >
                <Text
                  style={[
                    styles.matchChipText,
                    matchScore === 0 && styles.matchChipTextLowSignal,
                  ]}
                >
                  {matchScore === 0 ? 'Low overlap' : `${matchScore}% match`}
                </Text>
              </View>
            )}
            {office && size !== 'small' && (
              <Text style={styles.office} numberOfLines={1}>{office}</Text>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {onCompare && (
            <TouchableOpacity
              style={styles.compareButton}
              onPress={(e) => {
                e?.stopPropagation?.();
                onCompare();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Add to compare"
            >
              <Ionicons
                name="git-compare-outline"
                size={20}
                color={selected ? colors.primary : colors.textTertiary}
              />
            </TouchableOpacity>
          )}

          {selected ? (
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          ) : (
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  containerSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  avatarRing: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    backgroundColor: colors.surfaceElevated,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partyChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  partyChipText: {
    ...typography.caption2,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  matchChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary + '55',
  },
  matchChipText: {
    ...typography.caption2,
    fontWeight: '700',
    color: colors.primary,
  },
  matchChipLowSignal: {
    borderColor: colors.textTertiary + '66',
    backgroundColor: colors.surfaceElevated,
  },
  matchChipTextLowSignal: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  office: {
    ...typography.caption1,
    color: colors.textSecondary,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compareButton: {
    padding: 2,
  },
});

export default CandidateCard;
