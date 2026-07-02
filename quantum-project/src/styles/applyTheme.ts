import { getTheme, type ThemeName } from './theme'

export function applyTheme(themeName: ThemeName = 'quantumDark') {
  const theme = getTheme(themeName)
  const root = document.documentElement

  root.style.setProperty('--color-primary', theme.colors.cyan)
  root.style.setProperty('--color-primary-light', theme.colors.primaryLight)
  root.style.setProperty('--color-secondary', theme.colors.purple)
  root.style.setProperty('--color-secondary-light', theme.colors.lightPurple)
  root.style.setProperty('--color-danger', theme.colors.orange)
  root.style.setProperty('--color-danger-light', theme.colors.dangerLight)
  root.style.setProperty('--color-success', theme.colors.green)
  root.style.setProperty('--color-text', theme.colors.text)
  root.style.setProperty('--color-text-dim', theme.colors.textDim)
  root.style.setProperty('--color-text-darker', theme.colors.muted)
  root.style.setProperty('--color-bg', theme.colors.black)
  root.style.setProperty('--color-bg-light', theme.colors.dark)
  root.style.setProperty('--color-bg-dark', theme.colors.bgDark)
  root.style.setProperty('--color-border', theme.colors.gray)
  root.style.setProperty('--color-muted', theme.colors.muted)
  root.style.setProperty('--color-subtle', theme.colors.subtle)
  root.style.setProperty('--color-overlay', theme.colors.overlay)
  root.style.setProperty('--color-surface', theme.colors.surface)
  root.style.setProperty('--color-surface-hover', theme.colors.surfaceHover)
  root.style.setProperty('--color-text-soft', theme.colors.textSoft)

  root.style.setProperty('--font-mono', theme.typography.mono)
  root.style.setProperty('--radius-sm', theme.radius.sm)
  root.style.setProperty('--radius-md', theme.radius.md)
  root.style.setProperty('--border-radius', theme.radius.sm)

  root.style.setProperty('--duration-fast', theme.motion.fast)
  root.style.setProperty('--duration-normal', theme.motion.normal)
  root.style.setProperty('--transition', theme.motion.fast)

  root.style.setProperty('--size-cell', `${theme.sizing.cell}px`)
  root.style.setProperty('--size-laser-inset', `${theme.sizing.laserInset}px`)
  root.style.setProperty('--size-wall-inset', `${theme.sizing.wallInset}px`)
  root.style.setProperty('--size-ion-radius', `${theme.sizing.ionRadius}px`)
  root.style.setProperty('--size-photon-radius', `${theme.sizing.photonRadius}px`)

  root.style.setProperty('--space-xs', theme.spacing.xs)
  root.style.setProperty('--space-sm', theme.spacing.sm)
  root.style.setProperty('--space-md', theme.spacing.md)
  root.style.setProperty('--space-lg', theme.spacing.lg)
  root.style.setProperty('--space-xl', theme.spacing.xl)

  root.style.setProperty('--shadow-glow', theme.shadows.glowFull)
}
