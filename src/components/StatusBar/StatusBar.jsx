import React from 'react';
import { ProgressBar } from 'antd-mobile';
import 'antd-mobile/es/global';
import { useSession } from '../../contexts/SessionContext';
import styles from './StatusBar.module.css';

// 定义各个阶段对应的进度
const STAGE_PROGRESS = {
  idle: 0,
  listening: 25,        // 测试中的 listening 映射到 recording
  recording: 25,
  processing: 50,       // 测试中的 processing 映射到 interpreting  
  interpreting: 50,
  confirming: 75,
  executing: 90,
  completed: 100,
  error: 0              // 错误状态进度为0
};

// 根据阶段获取默认消息
function getDefaultMessage(stage) {
  switch (stage) {
    case 'idle':
      return '点击麦克风开始语音交互';
    case 'listening':
    case 'recording':
      return '正在聆听...';
    case 'processing':
    case 'interpreting':
      return '正在理解您的意图...';
    case 'confirming':
      return '请确认您的请求...';
    case 'executing':
      return '正在执行...';
    case 'completed':
      return '执行完成';
    case 'error':
      return '出现错误，请重试';
    case 'unknown':
      return '未知状态';
    default:
      return '准备就绪';
  }
}

function StatusBar() {
  const { stage, statusMessage } = useSession();
  const progress = STAGE_PROGRESS[stage] || 0;
  
  return (
    <div 
      className={`${styles.statusBar} ${stage ? styles[stage] : ''}`} 
      data-testid="status-bar"
      role="status"
      aria-live="polite"
      aria-label="系统状态信息"
    >
      <div className={styles.progress}>
        <ProgressBar
          percent={progress}
          style={{
            '--fill-color': progress === 100 ? 'var(--success-color)' : 'var(--color-primary)'
          }}
        />
      </div>
      <div className={styles.status}>
        {statusMessage || getDefaultMessage(stage)}
      </div>
    </div>
  );
}

export default StatusBar;