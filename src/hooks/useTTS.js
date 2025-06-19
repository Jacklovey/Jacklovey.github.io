import { useState, useCallback, useMemo, useEffect } from 'react';

export function useTTS(settings = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState(null);

  // 检查浏览器是否支持语音合成
  const isSupported = useMemo(() => {
    return !!window.speechSynthesis;
  }, []);

  // 默认语音设置
  const defaultSettings = {
    lang: 'zh-CN',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    ...settings
  };

  const speak = useCallback(async (text) => {
    if (!text || text.trim() === '') {
      return; // 空文本不播放
    }

    if (!isSupported) {
      setError('启动语音合成失败: 您的浏览器不支持语音合成功能');
      return;
    }

    setError(null);
    
    try {
      // 停止当前播放
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      
      // 创建语音合成实例
      const utterance = new SpeechSynthesisUtterance(text);
      
      // 配置
      utterance.lang = defaultSettings.lang;
      utterance.rate = defaultSettings.rate;
      utterance.pitch = defaultSettings.pitch;
      utterance.volume = defaultSettings.volume;
      
      // 事件处理
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setError(null);
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      
      utterance.onerror = (event) => {
        let errorMessage = '语音合成失败，请重试';
        switch(event.error) {
          case 'network':
            errorMessage = '网络错误，请检查网络连接';
            break;
          case 'synthesis-unavailable':
            errorMessage = '语音合成服务不可用';
            break;
          case 'synthesis-failed':
            errorMessage = '语音合成失败，请重试';
            break;
          default:
            errorMessage = `语音合成出错: ${event.error}`;
        }
        setError(errorMessage);
        setIsSpeaking(false);
        setIsPaused(false);
      };
      
      // 开始播放
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      setError(`启动语音合成失败: ${err.message}`);
    }
  }, [isSupported, defaultSettings]);

  // 停止播放
  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

  // 暂停播放
  const pause = useCallback(() => {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  // 恢复播放
  const resume = useCallback(() => {
    if (window.speechSynthesis && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  // 清理函数
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
    error
  };
}