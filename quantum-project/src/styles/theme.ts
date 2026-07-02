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
    lightGray: string;
    gray: string;
    dark: string;
    primaryLight: string;
    text: string;
    textDim: string;
    muted: string;
    subtle: string;
    bgDark: string;
    dangerLight: string;
    overlay: string;
    surface: string;
    surfaceHover: string;
    textSoft: string;
  };
  shadows: {
    glow: string;
    glowFull: string;
  };
  typography: {
    mono: string;
  };
  radius: {
    sm: string;
    md: string;
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
    lightGray: '#aaa',
    gray: '#333',
    dark: '#0a0a0a',
    primaryLight: '#1af',
    text: '#eee',
    textDim: '#999',
    muted: '#666',
    subtle: '#888',
    bgDark: '#1a1a1a',
    dangerLight: '#ff6644',
    overlay: 'rgba(0, 0, 0, 0.92)',
    surface: '#1a1a1a',
    surfaceHover: '#2a2a2a',
    textSoft: '#ddd',
  },
  shadows: {
    glow: 'rgba(0, 238, 255, 0.3)',
    glowFull: '0 0 30px rgba(0, 238, 255, 0.3)',
  },
  typography: {
    mono: 'monospace',
  },
  radius: {
    sm: '3px',
    md: '4px',
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
