import React from 'react';
import PropTypes from 'prop-types';
import styles from './AppLayout.module.css';
import ThemeToggle from '../ThemeToggle';

/**
 * 应用主布局组件
 * 提供统一的页面布局结构
 */
const AppLayout = ({ children, showHeader = true, showFooter = false }) => {
  return (
    <div className={styles.appLayout} data-testid="app-layout">
      {showHeader && (
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Solana Earphone</h1>
            <p className={styles.subtitle}>语音智能助手</p>
            <ThemeToggle />
          </div>
        </header>
      )}
      
      <main className={styles.main}>
        {children}
      </main>
      
      {showFooter && (
        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <p>&copy; 2024 Solana Earphone. All rights reserved.</p>
          </div>
        </footer>
      )}
    </div>
  );
};

AppLayout.propTypes = {
  children: PropTypes.node.isRequired,
  showHeader: PropTypes.bool,
  showFooter: PropTypes.bool,
};

export default AppLayout;
