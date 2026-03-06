export const FONTS = {
  heading: 'LuckiestGuy_400Regular',
  accent: 'Bungee_400Regular',
  body: 'Nunito_400Regular',
  bodySemiBold: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
  bodyExtraBold: 'Nunito_800ExtraBold',
} as const;

export const FORTNITE_COLORS = {
  bgDark: '#0D0B14',
  bgCard: '#1A1520',
  bgMid: '#231C2B',

  gradientStart: '#E85D75',
  gradientMid: '#9B59B6',
  gradientEnd: '#6C5CE7',

  ctaYellow: '#FFD93D',
  ctaDark: '#CA8A04',
  ctaGlow: '#FDE047',

  textPrimary: '#FFFFFF',
  textSecondary: '#B8A9C9',
  textMuted: '#7B6B8A',

  glowPink: '#E85D75',
  glowPurple: '#9B59B6',
  glowYellow: '#FFD93D',

  teamRed: '#EF4444',
  teamBlue: '#3B82F6',
} as const;

export const GRADIENTS = {
  heroBg: {
    colors: ['#0D0B14', '#1A1028', '#0D0B14'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  buttonPrimary: {
    colors: ['#E85D75', '#9B59B6'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  buttonCta: {
    colors: ['#FFD93D', '#F59E0B'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
} as const;

export const SHADOWS = {
  glowPink: {
    shadowColor: '#E85D75',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  glowPurple: {
    shadowColor: '#9B59B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  glowYellow: {
    shadowColor: '#FFD93D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  cardSubtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  textGlowYellow: {
    textShadowColor: 'rgba(255, 217, 61, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 15,
  },
} as const;

export const ANIMATION = {
  staggerDelay: 80,
  bounceDamping: 12,
  confettiCount: 40,
} as const;

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
  '7xl': 72,
  '8xl': 96,
} as const;
