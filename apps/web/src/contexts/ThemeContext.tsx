'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type ThemeName = 'cosmic' | 'imperial' | 'holographic';

interface ThemeColors {
  // Backgrounds
  bgPrimary: string;
  bgSecondary: string;
  bgPanel: string;
  bgPanelHover: string;

  // Accents
  accent: string;
  accentGlow: string;
  accentSecondary: string;

  // Borders
  border: string;
  borderGlow: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
}

interface ThemeConfig {
  name: ThemeName;
  displayName: string;
  colors: ThemeColors;
  effects: {
    panelBlur: boolean;
    glowIntensity: 'low' | 'medium' | 'high';
    scanLines: boolean;
    particles: 'stars' | 'dust' | 'grid' | 'none';
  };
}

export const themes: Record<ThemeName, ThemeConfig> = {
  cosmic: {
    name: 'cosmic',
    displayName: 'Cosmic',
    colors: {
      bgPrimary: 'from-slate-950 via-purple-950/30 to-slate-950',
      bgSecondary: 'from-indigo-950/50 to-purple-950/50',
      bgPanel: 'bg-slate-900/60 backdrop-blur-md',
      bgPanelHover: 'hover:bg-slate-800/70',
      accent: 'purple-500',
      accentGlow: 'shadow-purple-500/50',
      accentSecondary: 'cyan-400',
      border: 'border-purple-500/30',
      borderGlow: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]',
      textPrimary: 'text-white',
      textSecondary: 'text-purple-200',
      textMuted: 'text-slate-400',
      success: 'emerald-400',
      warning: 'amber-400',
      error: 'rose-400',
      info: 'cyan-400',
    },
    effects: {
      panelBlur: true,
      glowIntensity: 'medium',
      scanLines: false,
      particles: 'stars',
    },
  },
  imperial: {
    name: 'imperial',
    displayName: 'Imperial',
    colors: {
      bgPrimary: 'from-zinc-950 via-zinc-900 to-zinc-950',
      bgSecondary: 'from-amber-950/20 to-zinc-900/50',
      bgPanel: 'bg-zinc-900/90 backdrop-blur-sm',
      bgPanelHover: 'hover:bg-zinc-800/90',
      accent: 'amber-500',
      accentGlow: 'shadow-amber-500/40',
      accentSecondary: 'amber-300',
      border: 'border-amber-500/40',
      borderGlow: 'shadow-[0_0_10px_rgba(245,158,11,0.3)]',
      textPrimary: 'text-amber-50',
      textSecondary: 'text-amber-200',
      textMuted: 'text-zinc-400',
      success: 'emerald-400',
      warning: 'amber-400',
      error: 'rose-400',
      info: 'sky-400',
    },
    effects: {
      panelBlur: false,
      glowIntensity: 'low',
      scanLines: false,
      particles: 'dust',
    },
  },
  holographic: {
    name: 'holographic',
    displayName: 'Holographic',
    colors: {
      bgPrimary: 'from-slate-950 via-cyan-950/20 to-slate-950',
      bgSecondary: 'from-cyan-950/30 to-teal-950/30',
      bgPanel: 'bg-cyan-950/40 backdrop-blur-lg',
      bgPanelHover: 'hover:bg-cyan-900/50',
      accent: 'cyan-400',
      accentGlow: 'shadow-cyan-400/60',
      accentSecondary: 'teal-300',
      border: 'border-cyan-400/40',
      borderGlow: 'shadow-[0_0_20px_rgba(34,211,238,0.5)]',
      textPrimary: 'text-cyan-50',
      textSecondary: 'text-cyan-200',
      textMuted: 'text-slate-400',
      success: 'emerald-400',
      warning: 'amber-400',
      error: 'rose-400',
      info: 'cyan-300',
    },
    effects: {
      panelBlur: true,
      glowIntensity: 'high',
      scanLines: true,
      particles: 'grid',
    },
  },
};

interface ThemeContextValue {
  theme: ThemeConfig;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>('holographic');

  const setTheme = useCallback((name: ThemeName) => {
    setThemeName(name);
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('ti4-theme', name);
    }
  }, []);

  const cycleTheme = useCallback(() => {
    const themeOrder: ThemeName[] = ['cosmic', 'imperial', 'holographic'];
    const currentIndex = themeOrder.indexOf(themeName);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  }, [themeName, setTheme]);

  // Load from localStorage on mount
  // useEffect(() => {
  //   if (typeof window !== 'undefined') {
  //     const saved = localStorage.getItem('ti4-theme') as ThemeName | null;
  //     if (saved && themes[saved]) {
  //       setThemeName(saved);
  //     }
  //   }
  // }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme: themes[themeName],
        themeName,
        setTheme,
        cycleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
