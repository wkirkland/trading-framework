// lib/hooks/useThemeStore.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  systemTheme: 'light' | 'dark';
}

// Key for localStorage
const THEME_STORAGE_KEY = 'trading-framework-theme';

// Check system preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches 
    ? 'dark' 
    : 'light';
};

// Get stored theme or default to system
const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system';
  
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored as Theme;
    }
  } catch (error) {
    console.warn('Failed to read theme from localStorage:', error);
  }
  
  return 'system';
};

// Store theme preference
const storeTheme = (theme: Theme): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn('Failed to store theme in localStorage:', error);
  }
};

// Apply theme to document
const applyTheme = (resolvedTheme: 'light' | 'dark'): void => {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  
  // Remove existing theme classes
  root.classList.remove('light', 'dark');
  
  // Add current theme class
  root.classList.add(resolvedTheme);
  
  // Set data attribute for CSS
  root.setAttribute('data-theme', resolvedTheme);
  
  // Set color-scheme for native form controls
  root.style.colorScheme = resolvedTheme;
};

export function useThemeStore(): ThemeStore {
  const [theme, setThemeState] = useState<Theme>('system');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    const storedTheme = getStoredTheme();
    const currentSystemTheme = getSystemTheme();
    
    setThemeState(storedTheme);
    setSystemTheme(currentSystemTheme);
    setMounted(true);
    
    // Apply initial theme
    const resolvedTheme = storedTheme === 'system' ? currentSystemTheme : storedTheme;
    applyTheme(resolvedTheme);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      setSystemTheme(newSystemTheme);
      
      // If user is using system theme, apply the change immediately
      if (theme === 'system') {
        applyTheme(newSystemTheme);
      }
    };

    // Use modern addEventListener if available, fallback to deprecated addListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme]);

  // Apply theme changes
  useEffect(() => {
    if (!mounted) return;
    
    const resolvedTheme = theme === 'system' ? systemTheme : theme;
    applyTheme(resolvedTheme);
  }, [theme, systemTheme, mounted]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    storeTheme(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const resolvedTheme = theme === 'system' ? systemTheme : theme;
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [theme, systemTheme, setTheme]);

  // Calculate resolved theme
  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    systemTheme,
  };
}