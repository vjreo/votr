import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, borderRadius, shadows } from '../../theme/colors';

interface Tab {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  variant?: 'pills' | 'underline';
  scrollable?: boolean;
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'pills',
  scrollable = true,
}) => {
  const renderTab = (tab: Tab) => {
    const isActive = tab.key === activeTab;

    if (variant === 'underline') {
      return (
        <TouchableOpacity
          key={tab.key}
          style={[styles.underlineTab, isActive && styles.underlineTabActive]}
          onPress={() => onTabChange(tab.key)}
          activeOpacity={0.7}
        >
          {tab.icon}
          <Text
            style={[
              styles.underlineTabText,
              isActive && styles.underlineTabTextActive,
            ]}
          >
            {tab.label}
          </Text>
          {isActive && <View style={styles.underlineIndicator} />}
        </TouchableOpacity>
      );
    }

    // Pills variant (default)
    return (
      <TouchableOpacity
        key={tab.key}
        style={[
          styles.pillTab,
          isActive && styles.pillTabActive,
          isActive && (shadows.small as any),
        ]}
        onPress={() => onTabChange(tab.key)}
        activeOpacity={0.7}
      >
        {tab.icon}
        <Text style={[styles.pillTabText, isActive && styles.pillTabTextActive]}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const content = (
    <View style={[styles.container, variant === 'underline' && styles.underlineContainer]}>
      {tabs.map(renderTab)}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {content}
      </ScrollView>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  underlineContainer: {
    gap: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  // Pill styles
  pillTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: borderRadius.full,
    backgroundColor: colors.chipBackground,
    gap: 6,
  },
  pillTabActive: {
    backgroundColor: colors.primary,
  },
  pillTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  pillTabTextActive: {
    color: colors.white,
  },
  // Underline styles
  underlineTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    position: 'relative',
    gap: 6,
  },
  underlineTabActive: {},
  underlineTabText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  underlineTabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  underlineIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
});

export default TabBar;
