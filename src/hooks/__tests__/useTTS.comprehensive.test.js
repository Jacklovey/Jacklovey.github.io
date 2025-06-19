import { renderHook, act } from '@testing-library/react';
import { useTTS } from '../useTTS';

// 模拟 Web Speech Synthesis API
beforeAll(() => {
  // 模拟 SpeechSynthesisUtterance
  global.SpeechSynthesisUtterance = jest.fn().mockImplementation((text) => ({
    text: text,
    lang: '',
    rate: 1,
    pitch: 1,
    volume: 1,
    onstart: null,
    onend: null,
    onerror: null,
  }));

  // 模拟 speechSynthesis
  global.speechSynthesis = {
    speak: jest.fn(),
    cancel: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    getVoices: jest.fn(() => []),
  };
});

// 重置模拟
afterEach(() => {
  jest.clearAllMocks();
});

describe('useTTS hook', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useTTS());
    
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.speak).toBe('function');
    expect(typeof result.current.stop).toBe('function');
  });

  it('should start speaking when speak is called', () => {
    const { result } = renderHook(() => useTTS());
    
    act(() => {
      result.current.speak('测试文本');
    });

    expect(global.speechSynthesis.speak).toHaveBeenCalled();
    expect(global.SpeechSynthesisUtterance).toHaveBeenCalledWith('测试文本');
  });

  it('should handle speaking start event', () => {
    let utteranceInstance;
    global.SpeechSynthesisUtterance = jest.fn().mockImplementation((text) => {
      utteranceInstance = {
        text: text,
        lang: '',
        rate: 1,
        pitch: 1,
        volume: 1,
        onstart: null,
        onend: null,
        onerror: null,
      };
      return utteranceInstance;
    });

    const { result } = renderHook(() => useTTS());
    
    act(() => {
      result.current.speak('测试文本');
    });

    // 模拟说话开始事件
    act(() => {
      if (utteranceInstance.onstart) {
        utteranceInstance.onstart();
      }
    });

    expect(result.current.isSpeaking).toBe(true);
  });

  it('should handle speaking end event', () => {
    let utteranceInstance;
    global.SpeechSynthesisUtterance = jest.fn().mockImplementation((text) => {
      utteranceInstance = {
        text: text,
        lang: '',
        rate: 1,
        pitch: 1,
        volume: 1,
        onstart: null,
        onend: null,
        onerror: null,
      };
      return utteranceInstance;
    });

    const { result } = renderHook(() => useTTS());
    
    act(() => {
      result.current.speak('测试文本');
    });

    // 模拟说话开始
    act(() => {
      if (utteranceInstance.onstart) {
        utteranceInstance.onstart();
      }
    });

    expect(result.current.isSpeaking).toBe(true);

    // 模拟说话结束事件
    act(() => {
      if (utteranceInstance.onend) {
        utteranceInstance.onend();
      }
    });

    expect(result.current.isSpeaking).toBe(false);
  });

  it('should handle speaking error', () => {
    let utteranceInstance;
    global.SpeechSynthesisUtterance = jest.fn().mockImplementation((text) => {
      utteranceInstance = {
        text: text,
        lang: '',
        rate: 1,
        pitch: 1,
        volume: 1,
        onstart: null,
        onend: null,
        onerror: null,
      };
      return utteranceInstance;
    });

    const { result } = renderHook(() => useTTS());
    
    act(() => {
      result.current.speak('测试文本');
    });

    // 模拟说话错误事件
    act(() => {
      if (utteranceInstance.onerror) {
        utteranceInstance.onerror({
          error: 'synthesis-failed'
        });
      }
    });

    expect(result.current.error).toBe('语音合成失败，请重试');
    expect(result.current.isSpeaking).toBe(false);
  });

  it('should stop speaking when stop is called', () => {
    const { result } = renderHook(() => useTTS());
    
    act(() => {
      result.current.speak('测试文本');
    });

    act(() => {
      result.current.stop();
    });

    expect(global.speechSynthesis.cancel).toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
  });

  it('should handle unsupported browser', () => {
    // 清除语音合成API
    const originalSpeechSynthesis = global.speechSynthesis;
    delete global.speechSynthesis;

    const { result } = renderHook(() => useTTS());
    
    act(() => {
      result.current.speak('测试文本');
    });

    expect(result.current.error).toBe('您的浏览器不支持语音合成功能');
    expect(result.current.isSpeaking).toBe(false);

    // 恢复API
    global.speechSynthesis = originalSpeechSynthesis;
  });

  it('should not start new speech if already speaking', () => {
    let utteranceInstance;
    global.SpeechSynthesisUtterance = jest.fn().mockImplementation((text) => {
      utteranceInstance = {
        text: text,
        lang: '',
        rate: 1,
        pitch: 1,
        volume: 1,
        onstart: null,
        onend: null,
        onerror: null,
      };
      return utteranceInstance;
    });

    const { result } = renderHook(() => useTTS());
    
    // 开始第一次说话
    act(() => {
      result.current.speak('第一段文本');
    });

    act(() => {
      if (utteranceInstance.onstart) {
        utteranceInstance.onstart();
      }
    });

    expect(result.current.isSpeaking).toBe(true);

    // 尝试开始第二次说话
    act(() => {
      result.current.speak('第二段文本');
    });

    // speechSynthesis.speak 应该只被调用一次
    expect(global.speechSynthesis.speak).toHaveBeenCalledTimes(1);
  });

  it('should configure utterance properties correctly', () => {
    let utteranceInstance;
    global.SpeechSynthesisUtterance = jest.fn().mockImplementation((text) => {
      utteranceInstance = {
        text: text,
        lang: '',
        rate: 1,
        pitch: 1,
        volume: 1,
        onstart: null,
        onend: null,
        onerror: null,
      };
      return utteranceInstance;
    });

    const { result } = renderHook(() => useTTS());
    
    act(() => {
      result.current.speak('测试文本');
    });

    expect(utteranceInstance.lang).toBe('zh-CN');
    expect(utteranceInstance.rate).toBe(1.0);
    expect(utteranceInstance.pitch).toBe(1.0);
    expect(utteranceInstance.volume).toBe(1.0);
  });

  it('should clear error when speaking successfully', () => {
    // 首先创建一个错误状态
    const { result } = renderHook(() => useTTS());
    
    // 模拟没有语音合成支持的情况
    const originalSpeechSynthesis = global.speechSynthesis;
    delete global.speechSynthesis;

    act(() => {
      result.current.speak('测试文本');
    });

    expect(result.current.error).toBe('您的浏览器不支持语音合成功能');

    // 恢复语音合成支持
    global.speechSynthesis = originalSpeechSynthesis;

    // 再次尝试说话应该清除错误
    act(() => {
      result.current.speak('新的测试文本');
    });

    expect(result.current.error).toBeNull();
  });
});
