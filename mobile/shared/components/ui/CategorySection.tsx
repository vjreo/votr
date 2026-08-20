import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../theme/colors';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CategorySectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  title,
  description,
  icon,
  children,
  defaultExpanded = true,
  actionLabel,
  onAction,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            {description && !expanded && (
              <Text style={styles.collapsedDescription} numberOfLines={1}>
                {description}
              </Text>
            )}
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textTertiary}
        />
      </TouchableOpacity>

      {expanded && (
        <>
          {description && (
            <Text style={styles.description}>{description}</Text>
          )}
          <View style={styles.content}>{children}</View>
          {actionLabel && onAction && (
            <TouchableOpacity style={styles.actionButton} onPress={onAction}>
              <Text style={styles.actionText}>{actionLabel}</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: 10,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...typography.overline,
    color: colors.textTertiary,
  },
  collapsedDescription: {
    ...typography.caption1,
    color: colors.textSecondary,
    marginTop: 2,
  },
  description: {
    ...typography.footnote,
    color: colors.textSecondary,
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  content: {
    paddingBottom: 8,
  },
  actionButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionText: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default CategorySection;
