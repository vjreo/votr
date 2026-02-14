/**
 * VOTER App Color Palette
 * Based on the Figma prototype design system
 */

export const colors = {
  // Primary brand color - Coral/Salmon red
  primary: '#E8594D',
  primaryLight: '#F07B71',
  primaryDark: '#D14840',

  // Secondary - Soft blue (for illustrations and accents)
  secondary: '#5DADE2',
  secondaryLight: '#85C1E9',
  secondaryDark: '#3498DB',

  // Accent - Warm orange (for highlights)
  accent: '#F5A962',
  accentLight: '#F8C291',
  accentDark: '#E67E22',

  // Neutral colors
  white: '#FFFFFF',
  offWhite: '#FAFBFC',
  background: '#F5F6F8',
  backgroundLight: '#FFFFFF',

  // Text colors
  textPrimary: '#2D3436',
  textSecondary: '#636E72',
  textTertiary: '#B2BEC3',
  textInverse: '#FFFFFF',

  // Border and divider colors
  border: '#E8EAED',
  borderLight: '#F1F3F4',
  divider: '#DFE6E9',

  // Status colors
  success: '#00B894',
  warning: '#FDCB6E',
  error: '#E74C3C',
  info: '#74B9FF',

  // Card and surface colors
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  surface: '#FFFFFF',

  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',

  // Party colors
  democrat: '#3498DB',
  republican: '#E74C3C',
  independent: '#9B59B6',
  other: '#95A5A6',

  // Swipe action colors
  swipeLike: '#00B894',
  swipePass: '#E74C3C',
  swipeSave: '#F5A962',

  // Match score colors
  matchHigh: '#00B894',
  matchMedium: '#FDCB6E',
  matchLow: '#E74C3C',

  // Bias tier colors
  biasReliable: '#00B894',
  biasCaution: '#FDCB6E',
  biasBiased: '#E74C3C',

  // Tab/chip colors
  tabActive: '#E8594D',
  tabInactive: '#B2BEC3',
  chipBackground: '#F5F6F8',
  chipActiveBackground: '#E8594D',
};

export const gradients = {
  primary: ['#E8594D', '#F07B71'],
  secondary: ['#5DADE2', '#85C1E9'],
  background: ['#F5F6F8', '#FFFFFF'],
  card: ['#FFFFFF', '#FAFBFC'],
};

// Shadow styles
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Typography scale
export const typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 41,
  },
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  title2: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 25,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 21,
  },
  subhead: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  caption1: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 13,
  },
};

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Border radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export default colors;
