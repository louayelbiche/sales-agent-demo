/**
 * Kaslik Workshop M3 Theme
 * Seed Color: #B8976E (Gold/Tan)
 *
 * Brand Palette:
 * - Primary Gold/Tan: #B8976E
 * - Dark Charcoal: #4A4A4A
 * - Cream/Beige: #F5F0E8
 * - Accent Gold (Light): #D4B896
 *
 * Full Material Design 3 implementation for MUI
 * Includes light/dark modes and all color roles
 */

import { createTheme, ThemeOptions } from '@mui/material/styles';

// =============================================================================
// TONAL PALETTES
// =============================================================================

export const palettes = {
  primary: {
    0: '#000000',
    5: '#1A1308',
    10: '#271E10',
    15: '#352918',
    20: '#433520',
    25: '#514129',
    30: '#604D32',
    35: '#6F5A3C',
    40: '#7E6746',
    50: '#998058',
    60: '#B4996B',
    70: '#CFB384',
    80: '#EBCE9E',
    90: '#FFE8C0',
    95: '#FFF3DC',
    98: '#FFF9EF',
    99: '#FFFCF7',
    100: '#FFFFFF',
  },
  secondary: {
    0: '#000000',
    5: '#15120B',
    10: '#211D14',
    15: '#2C281E',
    20: '#373328',
    25: '#433E32',
    30: '#4F4A3D',
    35: '#5B5548',
    40: '#676154',
    50: '#817A6C',
    60: '#9B9485',
    70: '#B6AE9F',
    80: '#D2C9BA',
    90: '#EEE5D6',
    95: '#FDF3E4',
    98: '#FFF9EF',
    99: '#FFFCF7',
    100: '#FFFFFF',
  },
  tertiary: {
    0: '#000000',
    5: '#0D1415',
    10: '#172022',
    15: '#222B2D',
    20: '#2D3638',
    25: '#384143',
    30: '#444D4F',
    35: '#50595B',
    40: '#5C6567',
    50: '#757E80',
    60: '#8F989A',
    70: '#AAB2B5',
    80: '#C5CED0',
    90: '#E1EAEC',
    95: '#EFF8FA',
    98: '#F6FEFF',
    99: '#FBFEFF',
    100: '#FFFFFF',
  },
  error: {
    0: '#000000',
    10: '#410002',
    20: '#690005',
    30: '#93000A',
    40: '#BA1A1A',
    50: '#DD3730',
    60: '#FF5449',
    70: '#FF897D',
    80: '#FFB4AB',
    90: '#FFDAD6',
    95: '#FFEDEA',
    99: '#FFFBFF',
    100: '#FFFFFF',
  },
  neutral: {
    0: '#000000',
    5: '#121110',
    10: '#1D1C1A',
    15: '#282724',
    20: '#33312F',
    25: '#3E3C39',
    30: '#4A4744',
    35: '#565350',
    40: '#625F5C',
    50: '#7B7875',
    60: '#95928E',
    70: '#B0ACA9',
    80: '#CBC8C4',
    90: '#E8E4E0',
    95: '#F6F2EE',
    98: '#FFF9F5',
    99: '#FFFBFF',
    100: '#FFFFFF',
  },
  neutralVariant: {
    0: '#000000',
    5: '#14120D',
    10: '#1F1D17',
    15: '#2A2721',
    20: '#35322B',
    25: '#403D36',
    30: '#4C4941',
    35: '#58544C',
    40: '#646058',
    50: '#7D7970',
    60: '#979289',
    70: '#B2ADA3',
    80: '#CEC8BE',
    90: '#EAE4DA',
    95: '#F9F2E8',
    98: '#FFF9EF',
    99: '#FFFCF7',
    100: '#FFFFFF',
  },
} as const;

// =============================================================================
// COLOR SCHEMES
// =============================================================================

export const schemes = {
  light: {
    primary: '#7E6746',
    surfaceTint: '#7E6746',
    onPrimary: '#FFFFFF',
    primaryContainer: '#FFE8C0',
    onPrimaryContainer: '#604D32',
    secondary: '#676154',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#EEE5D6',
    onSecondaryContainer: '#4F4A3D',
    tertiary: '#5C6567',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#E1EAEC',
    onTertiaryContainer: '#444D4F',
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#93000A',
    background: '#FFF9F5',
    onBackground: '#1D1C1A',
    surface: '#FFF9F5',
    onSurface: '#1D1C1A',
    surfaceVariant: '#EAE4DA',
    onSurfaceVariant: '#4C4941',
    outline: '#7D7970',
    outlineVariant: '#CEC8BE',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#33312F',
    inverseOnSurface: '#F6F2EE',
    inversePrimary: '#EBCE9E',
    surfaceDim: '#DED9D4',
    surfaceBright: '#FFF9F5',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#F8F3EE',
    surfaceContainer: '#F2EDE8',
    surfaceContainerHigh: '#ECE7E2',
    surfaceContainerHighest: '#E6E1DD',
  },
  dark: {
    primary: '#EBCE9E',
    surfaceTint: '#EBCE9E',
    onPrimary: '#433520',
    primaryContainer: '#604D32',
    onPrimaryContainer: '#FFE8C0',
    secondary: '#D2C9BA',
    onSecondary: '#373328',
    secondaryContainer: '#4F4A3D',
    onSecondaryContainer: '#EEE5D6',
    tertiary: '#C5CED0',
    onTertiary: '#2D3638',
    tertiaryContainer: '#444D4F',
    onTertiaryContainer: '#E1EAEC',
    error: '#FFB4AB',
    onError: '#690005',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',
    background: '#15130F',
    onBackground: '#E6E1DD',
    surface: '#15130F',
    onSurface: '#E6E1DD',
    surfaceVariant: '#4C4941',
    onSurfaceVariant: '#CEC8BE',
    outline: '#979289',
    outlineVariant: '#4C4941',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#E6E1DD',
    inverseOnSurface: '#33312F',
    inversePrimary: '#7E6746',
    surfaceDim: '#15130F',
    surfaceBright: '#3C3935',
    surfaceContainerLowest: '#0F0D0A',
    surfaceContainerLow: '#1D1C1A',
    surfaceContainer: '#22201D',
    surfaceContainerHigh: '#2C2A27',
    surfaceContainerHighest: '#373532',
  },
};

// =============================================================================
// BRAND CONSTANTS
// =============================================================================

export const brandColors = {
  primaryGold: '#B8976E',
  accentGoldLight: '#D4B896',
  darkCharcoal: '#4A4A4A',
  creamBeige: '#F5F0E8',
  darkGray: '#666666',
  white: '#FFFFFF',
} as const;

// =============================================================================
// MUI THEME
// =============================================================================

const getDesignTokens = (mode: 'light' | 'dark'): ThemeOptions => {
  const colors = schemes[mode];

  return {
    palette: {
      mode,
      primary: {
        main: colors.primary,
        light: palettes.primary[60],
        dark: palettes.primary[mode === 'light' ? 50 : 90],
        contrastText: colors.onPrimary,
      },
      secondary: {
        main: colors.secondary,
        light: palettes.secondary[60],
        dark: palettes.secondary[mode === 'light' ? 50 : 90],
        contrastText: colors.onSecondary,
      },
      error: {
        main: colors.error,
        light: palettes.error[60],
        dark: palettes.error[mode === 'light' ? 50 : 90],
        contrastText: colors.onError,
      },
      warning: {
        main: mode === 'light' ? '#E65100' : '#FFB74D',
        contrastText: mode === 'light' ? '#FFFFFF' : '#000000',
      },
      info: {
        main: mode === 'light' ? '#5C6567' : '#C5CED0',
        contrastText: '#FFFFFF',
      },
      success: {
        main: mode === 'light' ? '#6B7E46' : '#B8CE9E',
        contrastText: mode === 'light' ? '#FFFFFF' : '#000000',
      },
      background: {
        default: colors.background,
        paper: colors.surfaceContainer,
      },
      text: {
        primary: colors.onSurface,
        secondary: colors.onSurfaceVariant,
        disabled: palettes.neutral[60],
      },
      divider: colors.outlineVariant,
      action: {
        active: colors.primary,
        hover: `${colors.primary}14`,
        selected: `${colors.primary}29`,
        disabled: palettes.neutral[60],
        disabledBackground: palettes.neutral[mode === 'light' ? 90 : 30],
      },
    },
    typography: {
      fontFamily: '"Inter", "system-ui", sans-serif',
      h1: { fontWeight: 600, fontSize: '3rem', lineHeight: 1.2 },
      h2: { fontWeight: 600, fontSize: '2.25rem', lineHeight: 1.25 },
      h3: { fontWeight: 600, fontSize: '1.5rem', lineHeight: 1.3 },
      h4: { fontWeight: 600, fontSize: '1.25rem', lineHeight: 1.4 },
      h5: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.5 },
      h6: { fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.5 },
      body1: { fontSize: '1rem', lineHeight: 1.6 },
      body2: { fontSize: '0.875rem', lineHeight: 1.5 },
      button: { fontWeight: 500, textTransform: 'none' as const },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 9999, padding: '12px 24px' },
          contained: {
            boxShadow: `0 10px 15px -3px ${colors.primary}40`,
            '&:hover': { boxShadow: `0 20px 25px -5px ${colors.primary}50` },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${colors.outlineVariant}`,
            backgroundColor: colors.surfaceContainer,
          },
        },
      },
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
    },
  };
};

export const lightTheme = createTheme(getDesignTokens('light'));
export const darkTheme = createTheme(getDesignTokens('dark'));
export const theme = lightTheme; // Default to light for Kaslik's clean aesthetic

export default { lightTheme, darkTheme, palettes, schemes, brandColors };
