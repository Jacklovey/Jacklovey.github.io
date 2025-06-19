import { renderHook, act } from '@testing-library/react';
import { useTTS } from '../useTTS';

// 创建完整的 Speech Synthesis 模拟
const createMockSpeechSynthesis = () => ({
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => []),
  speaking: false,
  pending: false,
  paused: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
});

const createMockSpeechSynthesisUtterance = () => ({
  text: '',
  lang: 'zh-CN',
  voice: null,
  volume: 1,
  rate: 1,
  pitch: 1,
  onstart: null,
  onend: null,
  onerror: null,
  onpause: null,
  onresume: null,
  onmark: null,
  onboundary: null,
});

describe('useTTS hook', () => {
  let mockSpeechSynthesis;
  let mockUtteranceInstance;
  let originalSpeechSynthesis;
  let originalSpeechSynthesisUtterance;

  beforeEach(() => {
    // 保存原始值
    originalSpeechSynthesis = global.speechSynthesis;
    originalSpeechSynthesisUtterance = global.SpeechSynthesisUtterance;
    
    // 创建模拟实例
    mockSpeechSynthesis = createMockSpeechSynthesis();
    mockUtteranceInstance = createMockSpeechSynthesisUtterance();
    
    // 设置全局模拟
    global.speechSynthesis = mockSpeechSynthesis;
    global.SpeechSynthesisUtterance = jest.fn(() => mockUtteranceInstance);
  });

  afterEach(() => {
    // 恢复原始值
    global.speechSynthesis = originalSpeechSynthesis;
    global.SpeechSynthesisUtterance = originalSpeechSynthesisUtterance;
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useTTS());
    
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.isSupported).toBe(true);
    expect(typeof result.current.speak).toBe('function');
    expect(typeof result.current.stop).toBe('function');
    expect(typeof result.current.pause).toBe('function');
    expect(typeof result.current.resume).toBe('function');
  });

  it('should detect if speech synthesis is not supported', () => {
    // 临时移除语音合成支持
    global.speechSynthesis = undefined;
    
    const { result } = renderHook(() => useTTS());
    
    expect(result.current.isSupported).toBe(false);
    
    // 恢复支持
    global.speechSynthesis = mockSpeechSynthesis;
  });

  it('should speak text when speak function is called', async () => {
    const { result } = renderHook(() => useTTS());
    
    await act(async () => {
      await result.current.speak('你好世界');
    });
    
    expect(global.SpeechSynthesisUtterance).toHaveBeenCalledWith('你好世界');
    expect(mockSpeechSynthesis.speak).toHaveBeenCalledWith(mockUtteranceInstance);
  });

  it('should use custom voice settings', async () => {
    const voiceSettings = {
      rate: 1.5,
      pitch: 1.2,
      volume: 0.8,
      lang: 'en-US'
    };
    
    const { result } = renderHook(() => useTTS(voiceSettings));
    
    await act(async () => {
      await result.current.speak('Hello world');
    });
    
    expect(mockUtteranceInstance.rate).toBe(1.5);
    expect(mockUtteranceInstance.pitch).toBe(1.2);
    expect(mockUtteranceInstance.volume).toBe(0.8);
    expect(mockUtteranceInstance.lang).toBe('en-US');
  });

  it('should update isSpeaking state when speech starts and ends', async () => {
    const { result } = renderHook(() => useTTS());
    
    await act(async () => {
      await result.current.speak('测试文本');
    });
    
    // 模拟语音开始
    act(() => {
      if (mockUtteranceInstance.onstart) {
        mockUtteranceInstance.onstart();
      }
    });
    
    expect(result.current.isSpeaking).toBe(true);
    
    // 模拟语音结束
    act(() => {
      if (mockUtteranceInstance.onend) {
        mockUtteranceInstance.onend();
      }
    });
    
    expect(result.current.isSpeaking).toBe(false);
  });

  it('should handle speech errors', async () => {
    const { result } = renderHook(() => useTTS());
    
    await act(async () => {
      await result.current.speak('测试文本');
    });
    
    // 模拟语音错误
    act(() => {
      if (mockUtteranceInstance.onerror) {
        mockUtteranceInstance.onerror({ error: 'synthesis-failed' });
      }
    });
    
    expect(result.current.error).toBe('语音合成出错: synthesis-failed');
    expect(result.current.isSpeaking).toBe(false);
  });

  it('should stop speech synthesis', () => {
    const { result } = renderHook(() => useTTS());
    
    act(() => {
      result.current.stop();
    });
    
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
  });

  it('should pause and resume speech synthesis', () => {
    const { result } = renderHook(() => useTTS());
    
    // 暂停
    act(() => {
      result.current.pause();
    });
    
    expect(mockSpeechSynthesis.pause).toHaveBeenCalled();
    expect(result.current.isPaused).toBe(true);
    
    // 恢复
    act(() => {
      result.current.resume();
    });
    
    expect(mockSpeechSynthesis.resume).toHaveBeenCalled();
    expect(result.current.isPaused).toBe(false);
  });

  it('should not speak empty or null text', async () => {
    const { result } = renderHook(() => useTTS());
    
    await act(async () => {
      await result.current.speak('');
    });
    
    expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
    
    await act(async () => {
      await result.current.speak(null);
    });
    
    expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
  });

  it('should handle unsupported browser gracefully', async () => {
    // 移除语音合成支持
    global.speechSynthesis = undefined;
    
    const { result } = renderHook(() => useTTS());
    
    expect(result.current.isSupported).toBe(false);
    
    // 尝试朗读应该设置错误
    await act(async () => {
      await result.current.speak('测试文本');
    });
    
    expect(result.current.error).toBe('启动语音合成失败: 您的浏览器不支持语音合成功能');
  });

  it('should cancel existing speech before starting new one', async () => {
    const { result } = renderHook(() => useTTS());
    
    // 开始第一个语音
    await act(async () => {
      await result.current.speak('第一段文本');
    });
    
    // 开始第二个语音应该取消第一个
    await act(async () => {
      await result.current.speak('第二段文本');
    });
    
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
  });

  it('should cleanup on unmount', () => {
    const { result, unmount } = renderHook(() => useTTS());
    
    unmount();
    
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
  });

  it('should validate voice settings', async () => {
    const invalidSettings = {
      rate: -1,  // 无效值
      pitch: 3,  // 超出范围
      volume: 2  // 超出范围
    };
    
    const { result } = renderHook(() => useTTS(invalidSettings));
    
    await act(async () => {
      await result.current.speak('测试文本');
    });
    
    // 应该使用默认值而不是无效值
    expect(mockUtteranceInstance.rate).toBe(1.0);
    expect(mockUtteranceInstance.pitch).toBe(1.0);
    expect(mockUtteranceInstance.volume).toBe(1.0);
  });
});
