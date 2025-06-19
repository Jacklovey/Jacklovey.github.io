import React from 'react';
import { Switch } from 'antd-mobile';
import { useTheme, THEMES } from '../contexts/ThemeContext.jsx';
import styles from './ThemeToggle.module.css';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className={styles.themeToggle}>
      <span>🌞</span>
      <Switch
        checked={theme === THEMES.DARK}
        onChange={checked => setTheme(checked ? THEMES.DARK : THEMES.LIGHT)}
        aria-label="切换深色/浅色主题"
      />
      <span>🌙</span>
    </div>
  );
}

export default ThemeToggle;
