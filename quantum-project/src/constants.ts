/**
 * Centralised constants
 * Includes colours, timing, grid settings + other global values
 */

import { getTheme } from '@/styles/theme';

const theme = getTheme();

export const COLORS = {
  cyan: theme.colors.cyan,
  purple: theme.colors.purple,
  green: theme.colors.green,
  orange: theme.colors.orange,
  lightPurple: theme.colors.lightPurple,
  red: theme.colors.red,
  black: theme.colors.black,
  lightGray: theme.colors.lightGray,
  gray: theme.colors.gray,
  dark: theme.colors.dark,
} as const;

export const TIMING = {
  PHOTON_TRAVEL_MS: theme.motion.photonTravelMs,
  ANIMATION_FPS: theme.motion.animationFps,
} as const;

export const GRID = {
  CELL_SIZE: theme.sizing.cell,
} as const;

export const BOARD_STYLE = {
  LASER_INSET: theme.sizing.laserInset,
  WALL_INSET: theme.sizing.wallInset,
  ION_RADIUS: theme.sizing.ionRadius,
  PHOTON_RADIUS: theme.sizing.photonRadius,
  BEAM_GLOW_BLUR: 8,
  PHOTON_GLOW_BLUR: 10,
  ION_GLOW_BLUR: 12,
  LABEL_FONT_PX: 9,
} as const;

export const SHADOWS = {
  glow: theme.shadows.glow,
  glowFull: theme.shadows.glowFull,
} as const;

// Helper colors for CSS variables and UI semantics
export const UI = {
  primaryLight: theme.colors.primaryLight,
  text: theme.colors.text,
  textDim: theme.colors.textDim,
  muted: theme.colors.muted,
  subtle: theme.colors.subtle,
  bgDark: theme.colors.bgDark,
  overlay: theme.colors.overlay,
  surface: theme.colors.surface,
  surfaceHover: theme.colors.surfaceHover,
  textSoft: theme.colors.textSoft,
  monoFont: theme.typography.mono,
  radiusSm: theme.radius.sm,
  radiusMd: theme.radius.md,
  transitionFast: theme.motion.fast,
  transitionNormal: theme.motion.normal,
} as const;
