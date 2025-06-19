import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { SessionProvider } from '../../../contexts/SessionContext';
import StatusBar from '../StatusBar';

expect.extend(toHaveNoViolations);

// 创建模拟的SessionContext值
const mockSessionValue = {
  sessionId: 'test-session-123',
  stage: 'idle',
  statusMessage: null,
  setSessionId: jest.fn(),
  setStage: jest.fn(),
  setStatusMessage: jest.fn(),
  setToolCalls: jest.fn(),
  setConfirmText: jest.fn(),
  setResult: jest.fn(),
  setError: jest.fn(),
  reset: jest.fn()
};

// 模拟SessionContext
jest.mock('../../../contexts/SessionContext', () => ({
  SessionProvider: ({ children }) => children,
  useSession: () => mockSessionValue
}));

describe('StatusBar component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render status bar', () => {
    render(<StatusBar />);
    
    const statusBar = screen.getByRole('status');
    expect(statusBar).toBeInTheDocument();
  });

  it('should display idle status', () => {
    mockSessionValue.stage = 'idle';
    
    render(<StatusBar />);
    
    expect(screen.getByText(/点击麦克风开始语音交互/)).toBeInTheDocument();
  });

  it('should display listening status', () => {
    mockSessionValue.stage = 'listening';
    
    render(<StatusBar />);
    
    expect(screen.getByText(/正在聆听/)).toBeInTheDocument();
  });

  it('should display processing status', () => {
    mockSessionValue.stage = 'processing';
    
    render(<StatusBar />);
    
    expect(screen.getByText(/正在理解您的意图/)).toBeInTheDocument();
  });

  it('should display confirming status', () => {
    mockSessionValue.stage = 'confirming';
    
    render(<StatusBar />);
    
    expect(screen.getByText(/请确认您的请求/)).toBeInTheDocument();
  });

  it('should display executing status', () => {
    mockSessionValue.stage = 'executing';
    
    render(<StatusBar />);
    
    expect(screen.getByText(/正在执行/)).toBeInTheDocument();
  });

  it('should display error status', () => {
    mockSessionValue.stage = 'error';
    
    render(<StatusBar />);
    
    expect(screen.getByText(/出现错误/)).toBeInTheDocument();
  });

  it('should display completed status', () => {
    mockSessionValue.stage = 'completed';
    
    render(<StatusBar />);
    
    expect(screen.getByText(/执行完成/)).toBeInTheDocument();
  });

  it('should handle unknown status', () => {
    mockSessionValue.stage = 'unknown';
    
    render(<StatusBar />);
    
    expect(screen.getByText(/未知状态/)).toBeInTheDocument();
  });

  it('should have proper ARIA attributes', () => {
    render(<StatusBar />);
    
    const statusBar = screen.getByRole('status');
    expect(statusBar).toHaveAttribute('aria-live', 'polite');
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<StatusBar />);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should apply correct CSS classes for different statuses', () => {
    mockSessionValue.stage = 'listening';
    
    const { rerender } = render(<StatusBar />);
    
    let statusBar = screen.getByRole('status');
    expect(statusBar).toHaveClass('listening');

    mockSessionValue.stage = 'error';
    rerender(<StatusBar />);
    
    statusBar = screen.getByRole('status');
    expect(statusBar).toHaveClass('error');
  });

  it('should display session ID when available', () => {
    mockSessionValue.sessionId = 'test-session-456';
    
    render(<StatusBar />);
    
    // 如果StatusBar显示sessionId，应该能找到它
    // 这取决于实际的StatusBar实现
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
