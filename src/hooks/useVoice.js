import { useState, useCallback, useRef, useMemo } from 'react';

export function useVoice() {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  // 检查浏览器是否支持语音识别
  const isSupported = useMemo(() => {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  // 开始录音
  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('启动语音识别失败: 您的浏览器不支持语音识别功能');
      return;
    }

    if (isRecording) {
      return; // 如果已经在录音，不重复开始
    }

    setError(null);
    setTranscript(''); // 重置转写文本
    
    try {
      // 创建语音识别实例
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // 配置
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN'; // 设置语言为中文
      
      // 事件处理
      recognition.onresult = (event) => {
        const result = event.results[0];
        const text = result[0].transcript;
        setTranscript(text);
      };
      
      recognition.onerror = (event) => {
        let errorMessage = '语音识别出错';
        switch(event.error) {
          case 'network':
            errorMessage = '网络错误，请检查网络连接';
            break;
          case 'not-allowed':
            errorMessage = '麦克风权限被拒绝';
            break;
          case 'service-not-allowed':
            errorMessage = '语音识别服务不可用';
            break;
          default:
            errorMessage = `语音识别出错: ${event.error}`;
        }
        setError(errorMessage);
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      // 开始录音
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch (err) {
      setError(`启动语音识别失败: ${err.message}`);
    }
  }, [isSupported, isRecording]);

  // 停止录音
  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    return transcript;
  }, [transcript]);

  // 清除转写文本
  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isRecording,
    transcript,
    error,
    isSupported,
    startRecording,
    stopRecording,
    clearTranscript
  };
}