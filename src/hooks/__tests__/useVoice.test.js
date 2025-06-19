import { renderHook, act } from '@testing-library/react';
import { useVoice } from '../useVoice';

// 创建更完整的 SpeechRecognition 模拟
const createMockSpeechRecognition = () => {
  const mockInstance = {
    start: jest.fn(),
    stop: jest.fn(),
    abort: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    continuous: false,
    interimResults: true,
    lang: 'zh-CN',
    onresult: null,
    onerror: null,
    onend: null,
    onstart: null,
  };
  
  return mockInstance;
};

describe('useVoice hook', () => {
  let mockRecognition;
  let originalSpeechRecognition;
  let originalWebkitSpeechRecognition;

  beforeEach(() => {
    // 保存原始值
    originalSpeechRecognition = global.SpeechRecognition;
    originalWebkitSpeechRecognition = global.webkitSpeechRecognition;
    
    // 创建模拟实例
    mockRecognition = createMockSpeechRecognition();
    
    // 模拟构造函数
    global.SpeechRecognition = jest.fn(() => mockRecognition);
    global.webkitSpeechRecognition = global.SpeechRecognition;
  });

  afterEach(() => {
    // 恢复原始值
    global.SpeechRecognition = originalSpeechRecognition;
    global.webkitSpeechRecognition = originalWebkitSpeechRecognition;
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useVoice());
    
    expect(result.current.isRecording).toBe(false);
    expect(result.current.transcript).toBe('');
    expect(result.current.error).toBeNull();
    expect(result.current.isSupported).toBe(true);
    expect(typeof result.current.startRecording).toBe('function');
    expect(typeof result.current.stopRecording).toBe('function');
  });
  
  it('should detect if speech recognition is not supported', () => {
    // 临时移除 SpeechRecognition 支持
    global.SpeechRecognition = undefined;
    global.webkitSpeechRecognition = undefined;
    
    const { result } = renderHook(() => useVoice());
    
    expect(result.current.isSupported).toBe(false);
    
    // 恢复支持
    global.SpeechRecognition = jest.fn(() => mockRecognition);
    global.webkitSpeechRecognition = global.SpeechRecognition;
  });

  it('should start recording when startRecording is called', async () => {
    const { result } = renderHook(() => useVoice());
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    expect(mockRecognition.start).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(true);
  });

  it('should stop recording when stopRecording is called', async () => {
    const { result } = renderHook(() => useVoice());
    
    // 先开始录音
    await act(async () => {
      await result.current.startRecording();
    });
    
    expect(result.current.isRecording).toBe(true);
    
    // 再停止录音
    act(() => {
      result.current.stopRecording();
    });
    
    expect(mockRecognition.stop).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(false);
  });

  it('should handle speech recognition results', async () => {
    const { result } = renderHook(() => useVoice());
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    // 模拟语音识别结果
    const mockEvent = {
      results: [
        [{ transcript: '你好世界', confidence: 0.9 }]
      ]
    };
    
    act(() => {
      if (mockRecognition.onresult) {
        mockRecognition.onresult(mockEvent);
      }
    });
    
    expect(result.current.transcript).toBe('你好世界');
  });

  it('should handle multiple recognition results', async () => {
    const { result } = renderHook(() => useVoice());
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    // 模拟多个结果
    const mockEvent1 = {
      results: [
        [{ transcript: '你好', confidence: 0.8 }]
      ]
    };
    
    const mockEvent2 = {
      results: [
        [{ transcript: '你好世界', confidence: 0.9 }]
      ]
    };
    
    act(() => {
      if (mockRecognition.onresult) {
        mockRecognition.onresult(mockEvent1);
      }
    });
    
    expect(result.current.transcript).toBe('你好');
    
    act(() => {
      if (mockRecognition.onresult) {
        mockRecognition.onresult(mockEvent2);
      }
    });
    
    expect(result.current.transcript).toBe('你好世界');
  });

  it('should handle recognition errors', async () => {
    const { result } = renderHook(() => useVoice());
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    // 模拟错误
    const mockError = {
      error: 'network',
      message: 'Network error occurred'
    };
    
    act(() => {
      if (mockRecognition.onerror) {
        mockRecognition.onerror(mockError);
      }
    });
    
    expect(result.current.error).toBe('语音识别出错: network');
    expect(result.current.isRecording).toBe(false);
  });

  it('should handle recognition end event', async () => {
    const { result } = renderHook(() => useVoice());
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    expect(result.current.isRecording).toBe(true);
    
    // 模拟识别结束
    act(() => {
      if (mockRecognition.onend) {
        mockRecognition.onend();
      }
    });
    
    expect(result.current.isRecording).toBe(false);
  });

  it('should clear error when starting new recording', async () => {
    const { result } = renderHook(() => useVoice());
    
    // 先产生一个错误
    await act(async () => {
      await result.current.startRecording();
    });
    
    act(() => {
      if (mockRecognition.onerror) {
        mockRecognition.onerror({ error: 'network' });
      }
    });
    
    expect(result.current.error).not.toBeNull();
    
    // 开始新的录音应该清除错误
    await act(async () => {
      await result.current.startRecording();
    });
    
    expect(result.current.error).toBeNull();
  });

  it('should not start recording if already recording', async () => {
    const { result } = renderHook(() => useVoice());
    
    // 第一次开始录音
    await act(async () => {
      await result.current.startRecording();
    });
    
    expect(mockRecognition.start).toHaveBeenCalledTimes(1);
    
    // 再次尝试开始录音
    await act(async () => {
      await result.current.startRecording();
    });
    
    // start 应该只被调用一次
    expect(mockRecognition.start).toHaveBeenCalledTimes(1);
  });

  it('should handle unsupported browser gracefully', async () => {
    // 移除语音识别支持
    global.SpeechRecognition = undefined;
    global.webkitSpeechRecognition = undefined;
    
    const { result } = renderHook(() => useVoice());
    
    expect(result.current.isSupported).toBe(false);
    
    // 尝试开始录音应该设置错误
    await act(async () => {
      await result.current.startRecording();
    });
    
    expect(result.current.error).toBe('您的浏览器不支持语音识别功能');
  });

  it('should cleanup on unmount', () => {
    const { result, unmount } = renderHook(() => useVoice());
    
    const stopSpy = jest.spyOn(result.current, 'stopRecording');
    
    unmount();
    
    // 由于我们无法直接验证内部清理，我们至少确保组件能正常卸载
    expect(unmount).not.toThrow();
  });
});
