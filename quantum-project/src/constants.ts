/**
 * Centralised constants
 * Includes colours, timing, grid settings + other global values
 */

export const COLORS = {
  cyan: '#0ef',
  purple: '#b47cff',
  green: '#0f8',
  orange: '#f84',
  lightPurple: '#d4aaff',
  red: '#ff4444',
  black: '#000000',
  lightGray: '#aaa',
  gray: '#333',
  dark: '#0a0a0a',
} as const;

export const TIMING = {
  PHOTON_TRAVEL_MS: 800,
  ANIMATION_FPS: 60,
} as const;

export const GRID = {
  CELL_SIZE: 56,
} as const;

export const SHADOWS = {
  glow: 'rgba(0, 238, 255, 0.3)',
  glowFull: '0 0 30px rgba(0, 238, 255, 0.3)'
} as const;

// Helper colors for CSS variables and UI semantics
export const UI = {
  primaryLight: '#1af',
  text: '#eee',
  muted: '#666',
  subtle: '#888',
  bgDark: '#1a1a1a',
} as const;
