import { COLORS, SHADOWS, UI } from '@/constants'

export function applyTheme() {
  const root = document.documentElement

  root.style.setProperty('--color-primary', COLORS.cyan)
  root.style.setProperty('--color-primary-light', UI.primaryLight)
  root.style.setProperty('--color-secondary', COLORS.purple)
  root.style.setProperty('--color-secondary-light', COLORS.lightPurple)
  root.style.setProperty('--color-danger', COLORS.orange)
  root.style.setProperty('--color-success', COLORS.green)
  root.style.setProperty('--color-text', UI.text)
  root.style.setProperty('--color-text-dim', '#999')
  root.style.setProperty('--color-text-darker', UI.muted)
  root.style.setProperty('--color-bg-light', COLORS.dark)
  root.style.setProperty('--color-bg', COLORS.black)
  root.style.setProperty('--color-bg-dark', UI.bgDark)
  root.style.setProperty('--color-border', COLORS.gray)
  root.style.setProperty('--color-danger-light', '#ff6644')
  root.style.setProperty('--color-muted', UI.muted)
  root.style.setProperty('--color-subtle', UI.subtle)

  root.style.setProperty('--shadow-glow', SHADOWS.glowFull)
}
