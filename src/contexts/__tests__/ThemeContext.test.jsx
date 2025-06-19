import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeContext.jsx';

// 测试用子组件
function TestComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
    </div>
  );
}

// 模拟localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
});

describe('ThemeContext', () => {
  it('should provide default theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });

  it('should restore theme from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('dark');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });

  it('should toggle theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');

    const toggleButton = screen.getByText('Toggle Theme');
    
    act(() => {
      toggleButton.click();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');

    act(() => {
      toggleButton.click();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('should set specific theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const setDarkButton = screen.getByText('Set Dark');
    
    act(() => {
      setDarkButton.click();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');

    const setLightButton = screen.getByText('Set Light');
    
    act(() => {
      setLightButton.click();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
  });

  it('should apply theme attribute to document element', () => {
    const originalDataTheme = document.documentElement.getAttribute('data-theme');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    const toggleButton = screen.getByText('Toggle Theme');
    
    act(() => {
      toggleButton.click();
    });

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    // 清理
    if (originalDataTheme) {
      document.documentElement.setAttribute('data-theme', originalDataTheme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  });

  it('should handle invalid theme from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('invalid-theme');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });
});
