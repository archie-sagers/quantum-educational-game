export type ThemeName = 'quantumDark';

export interface ThemeConfig {
  colors: {
    cyan: string;
    purple: string;
    green: string;
    orange: string;
    lightPurple: string;
    red: string;
    black: string;
    blackSoft: string;
    panel: string;
    panelHover: string;
    lightGray: string;
    gray: string;
    borderSoft: string;
    borderMuted: string;
    dark: string;
    primaryLight: string;
    primaryBg: string;
    primaryBgHover: string;
    text: string;
    textDim: string;
    muted: string;
    subtle: string;
    bgDark: string;
    successBg: string;
    successBgHover: string;
    successBgSoft: string;
    dangerLight: string;
    dangerBgSoft: string;
    overlay: string;
    surface: string;
    surfaceHover: string;
    textSoft: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    glow: string;
    glowFull: string;
    glowSuccess: string;
    glowDanger: string;
  };
  typography: {
    mono: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
  };
  motion: {
    fast: string;
    normal: string;
    photonTravelMs: number;
    animationFps: number;
  };
  sizing: {
    cell: number;
    laserInset: number;
    wallInset: number;
    ionRadius: number;
    photonRadius: number;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

const quantumDarkTheme: ThemeConfig = {
  colors: {
    cyan: '#0ef',
    purple: '#b47cff',
    green: '#0f8',
    orange: '#f84',
    lightPurple: '#d4aaff',
    red: '#ff4444',
    black: '#000000',
    blackSoft: '#111111',
    panel: '#1a1a1a',
    panelHover: '#2a2a2a',
    lightGray: '#aaa',
    gray: '#333',
    borderSoft: '#222222',
    borderMuted: '#555555',
    dark: '#0a0a0a',
    primaryLight: '#1af',
    primaryBg: '#0a2a3a',
    primaryBgHover: '#0d4a5a',
    text: '#eee',
    textDim: '#999',
    muted: '#666',
    subtle: '#888',
    bgDark: '#1a1a1a',
    successBg: '#0a3a0a',
    successBgHover: '#0d5a0d',
    successBgSoft: '#0a2a0a',
    dangerLight: '#ff6644',
    dangerBgSoft: '#1c0f0f',
    overlay: 'rgba(0, 0, 0, 0.92)',
    surface: '#1a1a1a',
    surfaceHover: '#2a2a2a',
    textSoft: '#ddd',
  },
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.5)',
    md: '0 4px 12px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 30px rgba(0, 0, 0, 0.8)',
    glow: 'rgba(0, 238, 255, 0.3)',
    glowFull: '0 0 30px rgba(0, 238, 255, 0.3)',
    glowSuccess: '0 0 20px rgba(0, 255, 0, 0.2)',
    glowDanger: '0 0 20px rgba(220, 70, 70, 0.2)',
  },
  typography: {
    mono: 'monospace',
  },
  radius: {
    sm: '3px',
    md: '4px',
    lg: '8px',
  },
  motion: {
    fast: '0.2s',
    normal: '0.3s',
    photonTravelMs: 800,
    animationFps: 60,
  },
  sizing: {
    cell: 56,
    laserInset: 4,
    wallInset: 16,
    ionRadius: 20,
    photonRadius: 4,
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '20px',
    xl: '32px',
  },
};

const THEMES: Record<ThemeName, ThemeConfig> = {
  quantumDark: quantumDarkTheme,
};

export const DEFAULT_THEME_NAME: ThemeName = 'quantumDark';

export function getTheme(themeName: ThemeName = DEFAULT_THEME_NAME): ThemeConfig {
  return THEMES[themeName];
}
