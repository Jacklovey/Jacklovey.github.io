import React, { useCallback } from 'react';
import { Card, Button, Space } from 'antd-mobile';
import VoiceRecorder from '../../components/VoiceRecorder/VoiceRecorder';
import StatusBar from '../../components/StatusBar/StatusBar';
import { useSession } from '../../contexts/SessionContext';
import { useTTS } from '../../hooks/useTTS';
import { interpret, execute } from '../../services/apiClient';
import styles from './MainPage.module.css';

function MainPage() {
  const {
    stage,
    setStage,
    setStatusMessage,
    setToolCalls,
    setConfirmText,
    setResult,
    setError,
    toolCalls,
    confirmText,
    result
  } = useSession();
  
  const { speak } = useTTS();

  // 处理语音转写结果
  const handleTranscript = useCallback(async (text) => {
    try {
      setStage('interpreting');
      setStatusMessage('正在理解您的意图...');
      
      // 调用意图解析API
      const interpretResult = await interpret({ query: text });
      
      if (interpretResult.requires_confirmation) {
        // 需要用户确认
        setStage('confirming');
        setToolCalls(interpretResult.tool_calls);
        setConfirmText(interpretResult.confirmation_message);
        speak(interpretResult.confirmation_message);
      } else {
        // 直接执行
        await executeTools(interpretResult.tool_calls);
      }
    } catch (error) {
      setError(error.message);
      setStage('idle');
      speak('抱歉，处理您的请求时出现了错误');
    }
  }, [setStage, setStatusMessage, setToolCalls, setConfirmText, setError, speak]);

  // 执行工具调用
  const executeTools = useCallback(async (tools) => {
    try {
      setStage('executing');
      setStatusMessage('正在执行您的请求...');
      
      const executeResult = await execute({ tool_calls: tools });
      
      setResult(executeResult.result);
      setStage('completed');
      setStatusMessage('执行完成');
      
      // 播放执行结果
      if (executeResult.result && executeResult.result.message) {
        speak(executeResult.result.message);
      }
      
      // 3秒后重置状态
      setTimeout(() => {
        setStage('idle');
        setResult(null);
        setToolCalls(null);
        setConfirmText(null);
      }, 3000);
      
    } catch (error) {
      setError(error.message);
      setStage('idle');
      speak('执行过程中出现了错误');
    }
  }, [setStage, setStatusMessage, setResult, setError, speak]);

  // 确认执行
  const handleConfirm = useCallback(() => {
    if (toolCalls) {
      executeTools(toolCalls);
    }
  }, [toolCalls, executeTools]);

  // 取消执行
  const handleCancel = useCallback(() => {
    setStage('idle');
    setToolCalls(null);
    setConfirmText(null);
    speak('已取消操作');
  }, [setStage, setToolCalls, setConfirmText, speak]);

  return (
    <div className={styles.mainPage}>
      <div className={styles.header}>
        <h1>Solana Earphone</h1>
        <p>语音智能助手</p>
      </div>

      <div className={styles.content}>
        {/* 语音录制区域 */}
        <div className={styles.voiceSection}>
          <VoiceRecorder onTranscript={handleTranscript} />
        </div>

        {/* 确认区域 */}
        {stage === 'confirming' && confirmText && (
          <Card className={styles.confirmCard}>
            <div className={styles.confirmContent}>
              <p>{confirmText}</p>
              <Space className={styles.confirmButtons}>
                <Button 
                  color="primary" 
                  onClick={handleConfirm}
                  data-testid="confirm-button"
                >
                  确认
                </Button>
                <Button 
                  color="default" 
                  onClick={handleCancel}
                  data-testid="cancel-button"
                >
                  取消
                </Button>
              </Space>
            </div>
          </Card>
        )}

        {/* 结果展示区域 */}
        {stage === 'completed' && result && (
          <Card className={styles.resultCard}>
            <div className={styles.resultContent}>
              <h3>执行结果</h3>
              <p>{result.message || '操作已成功完成'}</p>
              {result.data && (
                <pre className={styles.resultData}>
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              )}
            </div>
          </Card>
        )}
      </div>

      <StatusBar />
    </div>
  );
}

export default MainPage;