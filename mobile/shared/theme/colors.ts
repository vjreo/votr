/**
 * VOTR Color System — 2026 "Nature Distilled" Edition
 *
 * Design philosophy: Smart Simplicity
 * - Warm near-black base (not cold digital black) for natural depth
 * - Primary accent: amber-orange — energy without aggression
 * - Nature tones: clay, sand, moss as supporting palette
 * - High contrast ratios for accessibility (WCAG AA+)
 */

export const colors = {
  // ── Primary Accent ─────────────────────────────────────────────────────────
  primary: '#F5A623',         // Warm amber (refined from flat orange)
  primaryLight: '#FFB84D',
  primaryDark: '#D4891A',
  primaryMuted: 'rgba(245,166,35,0.12)',   // Tinted backgrounds

  // ── Nature Tones (secondary palette) ───────────────────────────────────────
  clay: '#C4715A',            // Warm terracotta
  clayMuted: 'rgba(196,113,90,0.15)',
  sand: '#D4A96A',            // Warm sand / golden
  sandMuted: 'rgba(212,169,106,0.15)',
  moss: '#5D7A5A',            // Muted sage green
  mossMuted: 'rgba(93,122,90,0.15)',
  sky: '#4A7FA5',             // Muted cerulean

  // ── Neutral Surfaces (warm dark theme) ─────────────────────────────────────
  background: '#141412',      // Warmest near-black (not pure #000)
  backgroundLight: '#1D1C1A',
  surface: '#242220',         // Card base
  surfaceElevated: '#2C2A27', // Elevated card
  surfaceHighlight: '#353230',// Hover / pressed state

  // ── Text ───────────────────────────────────────────────────────────────────
  textPrimary: '#F2EFE8',     // Warm white (not pure #FFF)
  textSecondary: '#A09A90',   // Warm mid-grey
  textTertiary: '#5E5A55',    // Muted label
  textInverse: '#141412',

  // ── Borders & Dividers ─────────────────────────────────────────────────────
  border: '#2A2825',
  borderLight: '#363330',
  divider: '#222020',
  borderFocus: '#F5A623',
  borderError: '#E05252',
  borderSuccess: '#4CAF7D',

  // ── Status ─────────────────────────────────────────────────────────────────
  success: '#4CAF7D',
  successMuted: 'rgba(76,175,125,0.12)',
  warning: '#F5A623',
  warningMuted: 'rgba(245,166,35,0.12)',
  error: '#E05252',
  errorMuted: 'rgba(224,82,82,0.12)',
  info: '#4A7FA5',

  // ── Shared ─────────────────────────────────────────────────────────────────
  white: '#FFFFFF',
  offWhite: '#F2EFE8',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.65)',
  overlayLight: 'rgba(0,0,0,0.35)',

  // ── Aliases (for backward compatibility) ────────────────────────────────────
  secondary: '#5D7A5A',       // moss — used in decorations, non-primary accents
  accent: '#F5A623',          // same as primary — energy highlights

  // ── Party Colors ───────────────────────────────────────────────────────────
  democrat: '#4A7FA5',        // Muted blue (matches sky)
  republican: '#C4715A',      // Muted red-clay (matches clay)
  independent: '#8A78B8',     // Muted purple
  other: '#A09A90',

  // ── Swipe Actions ──────────────────────────────────────────────────────────
  swipeLike: '#4CAF7D',
  swipePass: '#E05252',
  swipeSave: '#F5A623',

  // ── Match Score ────────────────────────────────────────────────────────────
  matchHigh: '#4CAF7D',
  matchMedium: '#D4A96A',
  matchLow: '#E05252',

  // ── Bias Tiers ─────────────────────────────────────────────────────────────
  biasReliable: '#4CAF7D',
  biasCaution: '#D4A96A',
  biasBiased: '#E05252',

  // ── Tabs / Chips ───────────────────────────────────────────────────────────
  tabActive: '#F5A623',
  tabInactive: '#5E5A55',
  chipBackground: '#2C2A27',
  chipActiveBackground: '#F5A623',

  // ── Card ───────────────────────────────────────────────────────────────────
  card: '#242220',
  cardElevated: '#2C2A27',
};

// ── Gradients ────────────────────────────────────────────────────────────────
export const gradients = {
  primary: ['#F5A623', '#FFB84D'] as const,
  warm: ['#C4715A', '#D4A96A'] as const,
  background: ['#141412', '#1D1C1A'] as const,
  card: ['#242220', '#2C2A27'] as const,
  overlay: ['transparent', 'rgba(20,20,18,0.95)'] as const,
};

// ── Shadows (warm-tinted for depth on dark surfaces) ─────────────────────────
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 10,
  },
  glow: {
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
};

// ── Typography ───────────────────────────────────────────────────────────────
export const typography = {
  largeTitle: { fontSize: 34, fontWeight: '700' as const, lineHeight: 41, letterSpacing: -0.5 },
  title1:     { fontSize: 28, fontWeight: '700' as const, lineHeight: 34, letterSpacing: -0.3 },
  title2:     { fontSize: 22, fontWeight: '600' as const, lineHeight: 28, letterSpacing: -0.2 },
  title3:     { fontSize: 20, fontWeight: '600' as const, lineHeight: 25, letterSpacing: -0.1 },
  headline:   { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  body:       { fontSize: 17, fontWeight: '400' as const, lineHeight: 24 },
  callout:    { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  subhead:    { fontSize: 15, fontWeight: '400' as const, lineHeight: 20 },
  footnote:   { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption1:   { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  caption2:   { fontSize: 11, fontWeight: '400' as const, lineHeight: 14 },
  overline:   { fontSize: 11, fontWeight: '600' as const, lineHeight: 14, letterSpacing: 0.8, textTransform: 'uppercase' as const },
};

// ── Spacing ───────────────────────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 48,
  /** WCAG 2.1 minimum touch target (44pt) for interactive elements */
  minTouchTarget: 44,
};

// ── Border Radius ─────────────────────────────────────────────────────────────
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 999,
};

export default colors;
