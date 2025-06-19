import React from 'react';
import { Button } from 'antd-mobile';
import { useVoice } from '../../hooks/useVoice';
import { useSession } from '../../contexts/SessionContext';
import styles from './VoiceRecorder.module.css';

function VoiceRecorder({ onTranscript }) {
  const { isRecording, transcript, error, startRecording, stopRecording, clearTranscript } = useVoice();
  const { setStage } = useSession();
  
  const handleToggleRecording = async () => {
    if (isRecording) {
      const text = stopRecording();
      if (text && onTranscript) {
        clearTranscript();
        onTranscript(text);
      }
    } else {
      setStage('recording');
      await startRecording();
    }
  };
  
  return (
    <div className={styles.voiceRecorder}>
      <Button
        className={`${styles.recordButton} ${isRecording ? styles.recording : ''}`}
        onClick={handleToggleRecording}
        size="large"
        shape="round"
        color="primary"
        data-testid="voice-recorder-button"
        aria-label={isRecording ? '停止录音' : '开始录音'}
      >
        {isRecording ? '停止' : '录音'}
      </Button>
      
      {transcript && (
        <div className={styles.transcript}>
          <p>识别结果: {transcript}</p>
        </div>
      )}
      
      {error && (
        <div className={styles.error} data-testid="voice-error">
          {error}
        </div>
      )}
    </div>
  );
}

export default VoiceRecorder;