import { renderHook, act } from '@testing-library/react';
import { useVoice } from '../useVoice';

// 安装 @testing-library/react-hooks
// npm install --save-dev @testing-library/react-hooks

// 模拟 Web Speech API
beforeAll(() => {
  // 模拟 SpeechRecognition
  global.SpeechRecognition = jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    continuous: false,
    interimResults: true,
    lang: '',
    onresult: null,
    onerror: null,
    onend: null,
  }));
  
  global.webkitSpeechRecognition = global.SpeechRecognition;
});

// 重置模拟
afterEach(() => {
  jest.clearAllMocks();
});

describe('useVoice hook', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useVoice());
    
    expect(result.current.isRecording).toBe(false);
    expect(result.current.transcript).toBe('');
    expect(result.current.error).toBeNull();
    expect(typeof result.current.startRecording).toBe('function');
    expect(typeof result.current.stopRecording).toBe('function');
  });
  
  it('should start recording when startRecording is called', async () => {
    const mockStart = jest.fn();
    global.SpeechRecognition = jest.fn().mockImplementation(() => ({
      start: mockStart,
      stop: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      continuous: false,
      interimResults: true,
      lang: '',
      onresult: null,
      onerror: null,
      onend: null,
    }));

    const { result } = renderHook(() => useVoice());
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    expect(result.current.isRecording).toBe(true);
    expect(mockStart).toHaveBeenCalled();
  });
  
  it('should stop recording when stopRecording is called', async () => {
    const mockStart = jest.fn();
    const mockStop = jest.fn();
    global.SpeechRecognition = jest.fn().mockImplementation(() => ({
      start: mockStart,
      stop: mockStop,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      continuous: false,
      interimResults: true,
      lang: '',
      onresult: null,
      onerror: null,
      onend: null,
    }));

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
    
    expect(result.current.isRecording).toBe(false);
    expect(mockStop).toHaveBeenCalled();
  });

  it('should handle speech recognition result', async () => {
    let recognitionInstance;
    global.SpeechRecognition = jest.fn().mockImplementation(() => {
      recognitionInstance = {
        start: jest.fn(),
        stop: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        continuous: false,
        interimResults: true,
        lang: '',
        onresult: null,
        onerror: null,
        onend: null,
      };
      return recognitionInstance;
    });

    const { result } = renderHook(() => useVoice());
    
    await act(async () => {
      await result.current.startRecording();
    });

    // 模拟语音识别结果
    act(() => {
      if (recognitionInstance.onresult) {
        recognitionInstance.onresult({
          results: [[{ transcript: '测试语音输入' }]]
        });
      }
    });

    expect(result.current.transcript).toBe('测试语音输入');
  });

  it('should handle speech recognition error', async () => {
    let recognitionInstance;
    global.SpeechRecognition = jest.fn().mockImplementation(() => {
      recognitionInstance = {
        start: jest.fn(),
        stop: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        continuous: false,
        interimResults: true,
        lang: '',
        onresult: null,
        onerror: null,
        onend: null,
      };
      return recognitionInstance;
    });

    const { result } = renderHook(() => useVoice());
    
    await act(async () => {
      await result.current.startRecording();
    });

    // 模拟语音识别错误
    act(() => {
      if (recognitionInstance.onerror) {
        recognitionInstance.onerror({
          error: 'network'
        });
      }
    });

    expect(result.current.error).toBe('网络错误，请检查网络连接');
    expect(result.current.isRecording).toBe(false);
  });

  it('should handle unsupported browser', async () => {
    // 清除语音识别API
    const originalSpeechRecognition = global.SpeechRecognition;
    const originalWebkitSpeechRecognition = global.webkitSpeechRecognition;
    
    delete global.SpeechRecognition;
    delete global.webkitSpeechRecognition;

    const { result } = renderHook(() => useVoice());
    
    await act(async () => {
      try {
        await result.current.startRecording();
      } catch (error) {
        // 预期会抛出错误
      }
    });

    expect(result.current.error).toBe('您的浏览器不支持语音识别功能');
    expect(result.current.isRecording).toBe(false);

    // 恢复API
    global.SpeechRecognition = originalSpeechRecognition;
    global.webkitSpeechRecognition = originalWebkitSpeechRecognition;
  });

  it('should reset transcript when starting new recording', async () => {
    let recognitionInstance;
    global.SpeechRecognition = jest.fn().mockImplementation(() => {
      recognitionInstance = {
        start: jest.fn(),
        stop: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        continuous: false,
        interimResults: true,
        lang: '',
        onresult: null,
        onerror: null,
        onend: null,
      };
      return recognitionInstance;
    });

    const { result } = renderHook(() => useVoice());
    
    // 第一次录音
    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      if (recognitionInstance.onresult) {
        recognitionInstance.onresult({
          results: [[{ transcript: '第一次输入' }]]
        });
      }
    });

    expect(result.current.transcript).toBe('第一次输入');

    // 停止录音
    act(() => {
      result.current.stopRecording();
    });

    // 开始新的录音，应该重置transcript
    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.transcript).toBe('');
  });

  it('should handle recording end event', async () => {
    let recognitionInstance;
    global.SpeechRecognition = jest.fn().mockImplementation(() => {
      recognitionInstance = {
        start: jest.fn(),
        stop: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        continuous: false,
        interimResults: true,
        lang: '',
        onresult: null,
        onerror: null,
        onend: null,
      };
      return recognitionInstance;
    });

    const { result } = renderHook(() => useVoice());
    
    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);

    // 模拟录音结束事件
    act(() => {
      if (recognitionInstance.onend) {
        recognitionInstance.onend();
      }
    });

    expect(result.current.isRecording).toBe(false);
  });
});
