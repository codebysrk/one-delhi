export const COLORS = {
  primary: '#c7342a',
  primaryLight: '#a51f38',
  primaryDark: '#7F1D1D',
  secondary: '#1F2937',
  accent: '#F59E0B',
  success: '#08b968',
  error: '#EF4444',
  warning: '#F97316',
  info: '#3B82F6',
  background: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceVariant: '#F1F5F9',
  inputBg: '#F8FAFC',
  text: '#0F172A',
  textSecondary: '#4f4f4f',
  textMuted: '#aeaeae',
  border: '#E2E8F0',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent'
};
export const SPACING = {
  zero: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64
};
export const RADII = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  round: 999
};
export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -0.5
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.3
  },
  h3: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.2
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18
  },
  caption: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
    letterSpacing: 0.5
  },
  button: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.1
  }
} as const;
export const SHADOWS = {
  none: {
    elevation: 0,
    shadowOpacity: 0
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5
  },
  high: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8
  },
  premium: {
    shadowColor: '#A51F38',
    shadowOffset: {
      width: 0,
      height: 8
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10
  }
};
export const LAYOUT = {
  screenPadding: SPACING.lg,
  cardPadding: SPACING.md,
  headerHeight: 56,
  tabBarHeight: 60
};
export const ANIMATIONS = {
  spring: {
    damping: 20,
    stiffness: 150,
    mass: 0.8
  },
  fastSpring: {
    damping: 15,
    stiffness: 200,
    mass: 0.5
  },
  timing: {
    duration: 300
  },
  fastTiming: {
    duration: 200
  }
};