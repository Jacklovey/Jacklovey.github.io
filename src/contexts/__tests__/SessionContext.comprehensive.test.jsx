import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionProvider, useSession } from '../SessionContext';

// 包装器组件
const wrapper = ({ children }) => <SessionProvider>{children}</SessionProvider>;

describe('useSession hook', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    
    expect(result.current.sessionId).toBeNull();
    expect(result.current.stage).toBe('idle');
    expect(result.current.statusMessage).toBeNull();
    expect(result.current.toolCalls).toBeNull();
    expect(result.current.confirmText).toBeNull();
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should set session ID', () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    
    act(() => {
      result.current.setSessionId('test-session-123');
    });
    
    expect(result.current.sessionId).toBe('test-session-123');
  });

  it('should set stage', () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    
    act(() => {
      result.current.setStage('recording');
    });
    
    expect(result.current.stage).toBe('recording');
  });

  it('should set status message', () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    
    act(() => {
      result.current.setStatusMessage('正在录音...');
    });
    
    expect(result.current.statusMessage).toBe('正在录音...');
  });

  it('should set tool calls', () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    
    const toolCalls = [
      { tool_id: 'weather', parameters: { city: '上海' } }
    ];
    
    act(() => {
      result.current.setToolCalls(toolCalls);
    });
    
    expect(result.current.toolCalls).toEqual(toolCalls);
  });

  it('should set confirm text', () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    
    act(() => {
      result.current.setConfirmText('您想查询上海的天气吗？');
    });
    
    expect(result.current.confirmText).toBe('您想查询上海的天气吗？');
  });

  it('should set result', () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    
    const resultData = {
      success: true,
      data: { temperature: '25°C' }
    };
    
    act(() => {
      result.current.setResult(resultData);
    });
    
    expect(result.current.result).toEqual(resultData);
  });

  it('should set error', () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    
    act(() => {
      result.current.setError('网络连接失败');
    });
    
    expect(result.current.error).toBe('网络连接失败');
  });

  it('should reset to initial state', () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    
    // 先设置一些状态
    act(() => {
      result.current.setSessionId('test-session-123');
      result.current.setStage('recording');
      result.current.setStatusMessage('正在录音...');
      result.current.setError('某个错误');
    });
    
    // 验证状态已设置
    expect(result.current.sessionId).toBe('test-session-123');
    expect(result.current.stage).toBe('recording');
    expect(result.current.statusMessage).toBe('正在录音...');
    expect(result.current.error).toBe('某个错误');
    
    // 重置状态
    act(() => {
      result.current.reset();
    });
    
    // 验证状态已重置（除了sessionId保持）
    expect(result.current.sessionId).toBe('test-session-123'); // sessionId保持
    expect(result.current.stage).toBe('idle');
    expect(result.current.statusMessage).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should handle multiple state updates in sequence', () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    
    act(() => {
      // 模拟完整的会话流程
      result.current.setSessionId('session-456');
      result.current.setStage('recording');
      result.current.setStatusMessage('正在录音...');
    });
    
    expect(result.current.sessionId).toBe('session-456');
    expect(result.current.stage).toBe('recording');
    expect(result.current.statusMessage).toBe('正在录音...');
    
    act(() => {
      result.current.setStage('interpreting');
      result.current.setStatusMessage('正在理解您的意图...');
    });
    
    expect(result.current.stage).toBe('interpreting');
    expect(result.current.statusMessage).toBe('正在理解您的意图...');
    
    act(() => {
      result.current.setStage('confirming');
      result.current.setConfirmText('您想查询天气吗？');
      result.current.setStatusMessage('请确认您的请求');
    });
    
    expect(result.current.stage).toBe('confirming');
    expect(result.current.confirmText).toBe('您想查询天气吗？');
    expect(result.current.statusMessage).toBe('请确认您的请求');
  });

  it('should throw error when used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useSession());
    }).toThrow('useSession 必须在 SessionProvider 内部使用');

    consoleSpy.mockRestore();
  });
});

describe('SessionProvider', () => {
  it('should provide session context to children', () => {
    const TestComponent = () => {
      const { stage } = useSession();
      return <div data-testid="session-stage">{stage}</div>;
    };

    const { getByTestId } = render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    );

    expect(getByTestId('session-stage')).toHaveTextContent('idle');
  });

  it('should handle multiple children components', () => {
    const TestComponent1 = () => {
      const { stage } = useSession();
      return <div data-testid="component1">{stage}</div>;
    };

    const TestComponent2 = () => {
      const { sessionId } = useSession();
      return <div data-testid="component2">{sessionId || 'no-session'}</div>;
    };

    const { getByTestId } = render(
      <SessionProvider>
        <TestComponent1 />
        <TestComponent2 />
      </SessionProvider>
    );

    expect(getByTestId('component1')).toHaveTextContent('idle');
    expect(getByTestId('component2')).toHaveTextContent('no-session');
  });

  it('should allow context updates from children', () => {
    const TestComponent = () => {
      const { stage, setStage } = useSession();
      
      const handleClick = () => {
        setStage('recording');
      };
      
      return (
        <div>
          <div data-testid="stage">{stage}</div>
          <button onClick={handleClick} data-testid="update-button">
            Update Stage
          </button>
        </div>
      );
    };

    const { getByTestId } = render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    );

    expect(getByTestId('stage')).toHaveTextContent('idle');
    
    fireEvent.click(getByTestId('update-button'));
    
    expect(getByTestId('stage')).toHaveTextContent('recording');
  });
});
