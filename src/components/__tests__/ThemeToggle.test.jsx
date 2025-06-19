import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from '../ThemeToggle';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock antd-mobile components
jest.mock('antd-mobile', () => ({
  Switch: ({ checked, onChange, ...props }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      data-testid="theme-switch"
      {...props}
    />
  ),
}));

// Create test wrapper with ThemeProvider
const TestWrapper = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('ThemeToggle', () => {
  it('should render the theme toggle switch', () => {
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );
    
    const themeSwitch = screen.getByTestId('theme-switch');
    expect(themeSwitch).toBeInTheDocument();
  });

  it('should toggle theme when switch is clicked', () => {
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );
    
    const themeSwitch = screen.getByTestId('theme-switch');
    
    // 初始状态应该是 true (深色主题为默认)
    expect(themeSwitch).toBeChecked();
    
    // 点击切换到浅色主题
    fireEvent.click(themeSwitch);
    expect(themeSwitch).not.toBeChecked();
    
    // 再次点击切换回深色主题
    fireEvent.click(themeSwitch);
    expect(themeSwitch).toBeChecked();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );
    
    const themeSwitch = screen.getByTestId('theme-switch');
    expect(themeSwitch).toHaveAttribute('type', 'checkbox');
  });
});