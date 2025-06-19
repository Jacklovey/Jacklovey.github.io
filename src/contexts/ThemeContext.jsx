import React, { createContext, useState, useEffect, useContext } from 'react';

const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

const ThemeContext = createContext({
  theme: THEMES.DARK,
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    // 验证保存的主题是否有效
    if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
      return savedTheme;
    }
    return THEMES.DARK;
  });

  const toggleTheme = () => {
    setTheme(current => current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { THEMES };
