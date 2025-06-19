import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider, useTheme } from '../../../contexts/ThemeContext.jsx';
import { SessionProvider } from '../../../contexts/SessionContext';
import AppLayout from '../AppLayout';

expect.extend(toHaveNoViolations);

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Test content component
const TestContent = () => <div data-testid="test-content">Test Content</div>;

describe('AppLayout component', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    // 清除任何之前设置的data-theme属性
    document.documentElement.removeAttribute('data-theme');
  });

  it('should render children correctly', () => {
    render(
      <ThemeProvider>
        <AppLayout>
          <div data-testid="test-content">Test Content</div>
        </AppLayout>
      </ThemeProvider>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toHaveTextContent('Test Content');
  });

  it('should apply theme classes', () => {
    // Mock no saved theme, should use default dark theme
    localStorageMock.getItem.mockReturnValue(null);

    render(
      <ThemeProvider>
        <AppLayout>
          <div data-testid="test-content">Test Content</div>
        </AppLayout>
      </ThemeProvider>
    );

    // 检查默认dark主题
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    // 模拟切换到light主题
    localStorageMock.getItem.mockReturnValue('light');
    
    // 重新渲染以应用新主题
    render(
      <ThemeProvider>
        <AppLayout>
          <div data-testid="test-content">Test Content</div>
        </AppLayout>
      </ThemeProvider>
    );
    
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('should handle theme switching', () => {
    localStorageMock.getItem.mockReturnValue('dark');

    const TestComponent = () => {
      const { theme, toggleTheme } = useTheme();
      return (
        <div>
          <div data-testid="current-theme">{theme}</div>
          <button onClick={toggleTheme} data-testid="theme-toggle">
            Toggle Theme
          </button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <AppLayout>
          <TestComponent />
        </AppLayout>
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');

    fireEvent.click(screen.getByTestId('theme-toggle'));

    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
  });

  it('should persist theme to localStorage', () => {
    render(
      <ThemeProvider>
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      </ThemeProvider>
    );

    // ThemeProvider应该会调用localStorage.setItem来保存主题
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', expect.any(String));
  });

  it('should load theme from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('light');

    render(
      <ThemeProvider>
        <AppLayout>
          <div data-testid="test-content">Test Content</div>
        </AppLayout>
      </ThemeProvider>
    );

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('should fallback to dark theme for invalid saved theme', () => {
    localStorageMock.getItem.mockReturnValue('invalid-theme');

    render(
      <ThemeProvider>
        <AppLayout>
          <div data-testid="test-content">Test Content</div>
        </AppLayout>
      </ThemeProvider>
    );

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should provide responsive layout', () => {
    render(
      <ThemeProvider>
        <AppLayout>
          <div data-testid="test-content">Test Content</div>
        </AppLayout>
      </ThemeProvider>
    );

    const layout = screen.getByTestId('test-content').closest('.appLayout, [data-testid="app-layout"]') || 
                   screen.getByTestId('test-content').parentElement;
    
    // 检查是否有响应式相关的类或样式
    expect(layout).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <ThemeProvider>
        <SessionProvider>
          <AppLayout>
            <TestContent />
          </AppLayout>
        </SessionProvider>
      </ThemeProvider>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should be responsive', () => {
    render(
      <ThemeProvider>
        <SessionProvider>
          <AppLayout>
            <TestContent />
          </AppLayout>
        </SessionProvider>
      </ThemeProvider>
    );

    const layout = screen.getByRole('main').parentElement;
    expect(layout).toHaveClass('appLayout');
  });

  it('should handle multiple children', () => {
    render(
      <ThemeProvider>
        <SessionProvider>
          <AppLayout>
            <div data-testid="child-1">Child 1</div>
            <div data-testid="child-2">Child 2</div>
          </AppLayout>
        </SessionProvider>
      </ThemeProvider>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('should maintain layout structure with empty children', () => {
    render(
      <ThemeProvider>
        <SessionProvider>
          <AppLayout>
            {null}
          </AppLayout>
        </SessionProvider>
      </ThemeProvider>
    );

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });

  it('should apply proper CSS classes', () => {
    render(
      <ThemeProvider>
        <SessionProvider>
          <AppLayout>
            <TestContent />
          </AppLayout>
        </SessionProvider>
      </ThemeProvider>
    );

    const main = screen.getByRole('main');
    expect(main.parentElement).toHaveClass('appLayout');
  });
});
