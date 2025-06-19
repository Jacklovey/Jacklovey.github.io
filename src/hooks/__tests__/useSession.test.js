// useSession hook单元测试
import { renderHook, act } from '@testing-library/react';
import { SessionProvider, useSession } from '../../contexts/SessionContext';

// 创建包装器组件
const createWrapper = () => {
  return ({ children }) => (
    <SessionProvider>{children}</SessionProvider>
  );
};

describe('useSession hook', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSession(), {
      wrapper: createWrapper()
    });

    expect(result.current.sessionId).toBeNull();
    expect(result.current.stage).toBe('idle');
    expect(result.current.statusMessage).toBeNull();
    expect(result.current.toolCalls).toBeNull();
    expect(result.current.confirmText).toBeNull();
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should provide all required dispatch functions', () => {
    const { result } = renderHook(() => useSession(), {
      wrapper: createWrapper()
    });

    expect(typeof result.current.setSessionId).toBe('function');
    expect(typeof result.current.setStage).toBe('function');
    expect(typeof result.current.setStatusMessage).toBe('function');
    expect(typeof result.current.setToolCalls).toBe('function');
    expect(typeof result.current.setConfirmText).toBe('function');
    expect(typeof result.current.setResult).toBe('function');
    expect(typeof result.current.setError).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('should update sessionId when setSessionId is called', () => {
    const { result } = renderHook(() => useSession(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.setSessionId('test-session-123');
    });

    expect(result.current.sessionId).toBe('test-session-123');
  });

  it('should update stage when setStage is called', () => {
    const { result } = renderHook(() => useSession(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.setStage('recording');
    });

    expect(result.current.stage).toBe('recording');
  });

  it('should handle stage transitions correctly', () => {
    const { result } = renderHook(() => useSession(), {
      wrapper: createWrapper()
    });

    // 模拟完整的语音交互流程
    act(() => {
      result.current.setStage('recording');
    });
    expect(result.current.stage).toBe('recording');

    act(() => {
      result.current.setStage('interpreting');
    });
    expect(result.current.stage).toBe('interpreting');

    act(() => {
      result.current.setStage('confirming');
    });
    expect(result.current.stage).toBe('confirming');

    act(() => {
      result.current.setStage('executing');
    });
    expect(result.current.stage).toBe('executing');

    act(() => {
      result.current.setStage('completed');
    });
    expect(result.current.stage).toBe('completed');
  });

  it('should update status message when setStatusMessage is called', () => {
    const { result } = renderHook(() => useSession(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.setStatusMessage('正在处理您的请求...');
    });

    expect(result.current.statusMessage).toBe('正在处理您的请求...');
  });

  it('should update tool calls when setToolCalls is called', () => {
    const { result } = renderHook(() => useSession(), {
      wrapper: createWrapper()
    });

    const mockToolCalls = [{
      tool_id: 'maps_weather',
      parameters: { city: '上海' }
    }];

    act(() => {
      result.current.setToolCalls(mockToolCalls);
    });

    expect(result.current.toolCalls).toEqual(mockToolCalls);
  });

  it('should update confirm text when setConfirmText is called', () => {
    const { result } = renderHook(() => useSession(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.setConfirmText('您想查询上海的天气吗？');
    });

    expect(result.current.confirmText).toBe('您想查询上海的天气吗？');
  });

  it('should update result when setResult is called', () => {
    const { result } = renderHook(() => useSession(), {
      wrapper: createWrapper()
    });

    const mockResult = {
      tts_message: '上海今天多云，气温20到28度',
      raw_data: { temperature: 24, weather: '多云' }
    };

    act(() => {
      result.current.setResult(mockResult);
    });

    expect(result.current.result).toEqual(mockResult);
  });

  it('should update error when setError is called', () => {
    const { result } = renderHook(() => useSession(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.setError('网络请求失败');
    });

    expect(result.current.error).toBe('网络请求失败');
  });

  it('should reset state when reset is called but preserve sessionId', () => {
    const { result } = renderHook(() => useSession(), {
      wrapper: createWrapper()
    });

    // 设置一些状态
    act(() => {
      result.current.setSessionId('test-session-123');
      result.current.setStage('executing');
      result.current.setStatusMessage('处理中...');
      result.current.setError('某个错误');
    });

    // 验证状态已设置
    expect(result.current.sessionId).toBe('test-session-123');
    expect(result.current.stage).toBe('executing');
    expect(result.current.statusMessage).toBe('处理中...');
    expect(result.current.error).toBe('某个错误');

    // 重置
    act(() => {
      result.current.reset();
    });

    // 验证除sessionId外其他状态都重置了
    expect(result.current.sessionId).toBe('test-session-123'); // 保留
    expect(result.current.stage).toBe('idle');
    expect(result.current.statusMessage).toBeNull();
    expect(result.current.toolCalls).toBeNull();
    expect(result.current.confirmText).toBeNull();
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should handle multiple state updates in sequence', () => {
    const { result } = renderHook(() => useSession(), {
      wrapper: createWrapper()
    });

    // 模拟完整的语音交互流程
    act(() => {
      result.current.setSessionId('session-123');
      result.current.setStage('recording');
      result.current.setStatusMessage('正在录音...');
    });

    expect(result.current.sessionId).toBe('session-123');
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
      result.current.setConfirmText('您想查询北京的天气吗？');
      result.current.setStatusMessage('请确认您的请求...');
    });

    expect(result.current.stage).toBe('confirming');
    expect(result.current.confirmText).toBe('您想查询北京的天气吗？');
    expect(result.current.statusMessage).toBe('请确认您的请求...');
  });
});
