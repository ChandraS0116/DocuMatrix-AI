import React, { createContext, useContext, useState, useEffect } from 'react';
import { getThemeByName, themes } from './themes';

const DesignContext = createContext(null);

export const useDesignSystem = () => {
  const context = useContext(DesignContext);
  if (!context) throw new Error("useDesignSystem must be used within a DesignProvider");
  return context;
};

export function DesignProvider({ children }) {
  // Load preferences from localStorage or use defaults
  const [themeName, setThemeName] = useState(() => localStorage.getItem('theme') || 'Midnight');
  const [density, setDensity] = useState(() => localStorage.getItem('density') || 'Comfortable');
  const [typography, setTypography] = useState(() => localStorage.getItem('typography') || 'Inter');
  const [motionLevel, setMotionLevel] = useState(() => localStorage.getItem('motion') || 'Premium');

  const currentTheme = getThemeByName(themeName);

  // Apply CSS Variables
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme colors
    Object.entries(currentTheme.tokens).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Apply Density (Scales base spacing and radius)
    let spacingMultiplier = 1;
    let radiusScale = 1;
    if (density === 'Compact') { spacingMultiplier = 0.75; radiusScale = 0.75; }
    if (density === 'Spacious') { spacingMultiplier = 1.25; radiusScale = 1.25; }

    root.style.setProperty('--spacing-scale', spacingMultiplier);
    root.style.setProperty('--radius-sm', `${6 * radiusScale}px`);
    root.style.setProperty('--radius-md', `${12 * radiusScale}px`);
    root.style.setProperty('--radius-lg', `${20 * radiusScale}px`);
    root.style.setProperty('--radius-xl', `${32 * radiusScale}px`);

    // Apply Typography
    root.style.setProperty('--font-sans', `'${typography}', sans-serif`);
    
    // Persist to local storage
    localStorage.setItem('theme', themeName);
    localStorage.setItem('density', density);
    localStorage.setItem('typography', typography);
    localStorage.setItem('motion', motionLevel);

  }, [themeName, density, typography, motionLevel, currentTheme]);

  // Motion config generator for Framer Motion
  const getMotionConfig = (baseConfig) => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || motionLevel === 'No Animation') {
      return { initial: false, animate: false, transition: { duration: 0 } };
    }
    if (motionLevel === 'Reduced') {
      return { ...baseConfig, transition: { ...baseConfig.transition, duration: 0.15, type: 'tween' } };
    }
    return baseConfig; // Premium
  };

  const val = {
    theme: currentTheme,
    themes,
    themeName, setThemeName,
    density, setDensity,
    typography, setTypography,
    motionLevel, setMotionLevel,
    getMotionConfig
  };

  return (
    <DesignContext.Provider value={val}>
      {children}
    </DesignContext.Provider>
  );
}
