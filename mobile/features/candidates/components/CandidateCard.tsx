import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, shadows } from '../../../shared/theme/colors';

interface CandidateCardProps {
  id: string;
  name: string;
  party: string;
  photo?: string;
  office?: string;
  onPress?: () => void;
  onCompare?: () => void;
  selected?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const CandidateCard: React.FC<CandidateCardProps> = ({
  id,
  name,
  party,
  photo,
  office,
  onPress,
  onCompare,
  selected = false,
  size = 'medium',
}) => {
  const getPartyColor = () => {
    return colors.textSecondary;
  };

  const getPhotoSize = () => {
    switch (size) {
      case 'small':
        return 40;
      case 'large':
        return 80;
      default:
        return 56;
    }
  };

  const photoSize = getPhotoSize();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        shadows.small as any,
        selected && styles.selected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={[styles.photoContainer, { width: photoSize, height: photoSize }]}>
          {photo ? (
            <Image
              source={{ uri: photo }}
              style={[styles.photo, { width: photoSize, height: photoSize, borderRadius: photoSize / 2 }]}
            />
          ) : (
            <View style={[styles.photoPlaceholder, { width: photoSize, height: photoSize, borderRadius: photoSize / 2 }]}>
              <Ionicons name="person" size={photoSize / 2} color={colors.textTertiary} />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={[styles.party, { color: getPartyColor() }]} numberOfLines={1}>
            {party}
          </Text>
          {office && size !== 'small' && (
            <Text style={styles.office} numberOfLines={1}>{office}</Text>
          )}
        </View>

        <View style={styles.actions}>
          {onCompare && (
            <TouchableOpacity
              style={styles.compareButton}
              onPress={(e) => {
                e.stopPropagation?.();
                onCompare();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="git-compare-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </View>

      {selected && (
        <View style={styles.selectedIndicator}>
          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: 12,
    marginBottom: 8,
  },
  selected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoContainer: {
    marginRight: 12,
  },
  photo: {
    backgroundColor: colors.background,
  },
  photoPlaceholder: {
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  party: {
    fontSize: 13,
    fontWeight: '500',
  },
  office: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compareButton: {
    padding: 4,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});

export default CandidateCard;
