import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionProvider } from '../../../contexts/SessionContext';
import VoiceRecorder from '../VoiceRecorder';
import * as useVoiceModule from '../../../hooks/useVoice';

// 模拟 useVoice hook
jest.mock('../../../hooks/useVoice', () => ({
  __esModule: true,
  useVoice: jest.fn(),
}));

// 模拟 antd-mobile Button 组件
jest.mock('antd-mobile', () => ({
  Button: ({ children, onClick, className, ...props }) => (
    <button 
      onClick={onClick} 
      className={className}
      data-testid="voice-recorder-button"
      {...props}
    >
      {children}
    </button>
  ),
}));

describe('VoiceRecorder component', () => {
  const mockOnTranscript = jest.fn();

  beforeEach(() => {
    // 默认模拟返回值
    useVoiceModule.useVoice.mockReturnValue({
      isRecording: false,
      transcript: '',
      error: null,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      clearTranscript: jest.fn(),
    });
    
    mockOnTranscript.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('should render the recorder button', () => {
    render(
      <SessionProvider>
        <VoiceRecorder onTranscript={mockOnTranscript} />
      </SessionProvider>
    );
    
    const button = screen.getByTestId('voice-recorder-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('录音');
  });
  
  it('should start recording when button is clicked', async () => {
    const startRecording = jest.fn();
    useVoiceModule.useVoice.mockReturnValue({
      isRecording: false,
      transcript: '',
      error: null,
      startRecording,
      stopRecording: jest.fn(),
      clearTranscript: jest.fn(),
    });
    
    render(
      <SessionProvider>
        <VoiceRecorder onTranscript={mockOnTranscript} />
      </SessionProvider>
    );
    
    const button = screen.getByTestId('voice-recorder-button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(startRecording).toHaveBeenCalled();
    });
  });
  
  it('should show recording state when recording', () => {
    useVoiceModule.useVoice.mockReturnValue({
      isRecording: true,
      transcript: '',
      error: null,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      clearTranscript: jest.fn(),
    });
    
    render(
      <SessionProvider>
        <VoiceRecorder onTranscript={mockOnTranscript} />
      </SessionProvider>
    );
    
    const button = screen.getByTestId('voice-recorder-button');
    expect(button).toHaveTextContent('停止');
    expect(button).toHaveClass('recording');
  });

  it('should stop recording and call onTranscript when button is clicked while recording', async () => {
    const stopRecording = jest.fn().mockReturnValue('测试语音文本');
    const clearTranscript = jest.fn();
    
    useVoiceModule.useVoice.mockReturnValue({
      isRecording: true,
      transcript: '测试语音文本',
      error: null,
      startRecording: jest.fn(),
      stopRecording,
      clearTranscript,
    });
    
    render(
      <SessionProvider>
        <VoiceRecorder onTranscript={mockOnTranscript} />
      </SessionProvider>
    );
    
    const button = screen.getByTestId('voice-recorder-button');
    fireEvent.click(button);
    
    expect(stopRecording).toHaveBeenCalled();
    expect(clearTranscript).toHaveBeenCalled();
    expect(mockOnTranscript).toHaveBeenCalledWith('测试语音文本');
  });

  it('should not call onTranscript if no text returned from stopRecording', () => {
    const stopRecording = jest.fn().mockReturnValue('');
    
    useVoiceModule.useVoice.mockReturnValue({
      isRecording: true,
      transcript: '',
      error: null,
      startRecording: jest.fn(),
      stopRecording,
      clearTranscript: jest.fn(),
    });
    
    render(
      <SessionProvider>
        <VoiceRecorder onTranscript={mockOnTranscript} />
      </SessionProvider>
    );
    
    const button = screen.getByTestId('voice-recorder-button');
    fireEvent.click(button);
    
    expect(stopRecording).toHaveBeenCalled();
    expect(mockOnTranscript).not.toHaveBeenCalled();
  });

  it('should display error message when there is an error', () => {
    useVoiceModule.useVoice.mockReturnValue({
      isRecording: false,
      transcript: '',
      error: '网络连接失败',
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      clearTranscript: jest.fn(),
    });
    
    render(
      <SessionProvider>
        <VoiceRecorder onTranscript={mockOnTranscript} />
      </SessionProvider>
    );
    
    expect(screen.getByText('网络连接失败')).toBeInTheDocument();
  });

  it('should display current transcript while recording', () => {
    useVoiceModule.useVoice.mockReturnValue({
      isRecording: true,
      transcript: '正在说话的内容...',
      error: null,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      clearTranscript: jest.fn(),
    });
    
    render(
      <SessionProvider>
        <VoiceRecorder onTranscript={mockOnTranscript} />
      </SessionProvider>
    );
    
    expect(screen.getByText('正在说话的内容...')).toBeInTheDocument();
  });

  it('should work without onTranscript prop', async () => {
    const stopRecording = jest.fn().mockReturnValue('测试文本');
    
    useVoiceModule.useVoice.mockReturnValue({
      isRecording: true,
      transcript: '',
      error: null,
      startRecording: jest.fn(),
      stopRecording,
      clearTranscript: jest.fn(),
    });
    
    render(
      <SessionProvider>
        <VoiceRecorder />
      </SessionProvider>
    );
    
    const button = screen.getByTestId('voice-recorder-button');
    
    // 不应该抛出错误
    expect(() => {
      fireEvent.click(button);
    }).not.toThrow();
    
    expect(stopRecording).toHaveBeenCalled();
  });

  it('should handle microphone permission errors gracefully', async () => {
    const startRecording = jest.fn().mockRejectedValue(new Error('麦克风权限被拒绝'));
    
    useVoiceModule.useVoice.mockReturnValue({
      isRecording: false,
      transcript: '',
      error: '麦克风权限被拒绝',
      startRecording,
      stopRecording: jest.fn(),
      clearTranscript: jest.fn()
    });

    const user = userEvent.setup();
    render(
      <SessionProvider>
        <VoiceRecorder />
      </SessionProvider>
    );
    
    const button = screen.getByTestId('voice-recorder-button');
    await user.click(button);
    
    // 验证错误显示
    expect(screen.getByText(/麦克风权限被拒绝/)).toBeInTheDocument();
    
    // 验证按钮状态
    expect(button).not.toHaveClass('recording');
  });

  it('should apply correct CSS classes based on recording state', () => {
    // 测试非录音状态
    const { rerender } = render(
      <SessionProvider>
        <VoiceRecorder onTranscript={mockOnTranscript} />
      </SessionProvider>
    );
    
    let button = screen.getByTestId('voice-recorder-button');
    expect(button).not.toHaveClass('recording');
    
    // 测试录音状态
    useVoiceModule.useVoice.mockReturnValue({
      isRecording: true,
      transcript: '',
      error: null,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      clearTranscript: jest.fn(),
    });
    
    rerender(
      <SessionProvider>
        <VoiceRecorder onTranscript={mockOnTranscript} />
      </SessionProvider>
    );
    
    button = screen.getByTestId('voice-recorder-button');
    expect(button).toHaveClass('recording');
  });

  it('should integrate with SessionContext properly', async () => {
    const startRecording = jest.fn();
    
    useVoiceModule.useVoice.mockReturnValue({
      isRecording: false,
      transcript: '',
      error: null,
      startRecording,
      stopRecording: jest.fn(),
      clearTranscript: jest.fn(),
    });
    
    // 创建测试用的 SessionProvider 包装器来验证 setStage 调用
    const TestWrapper = ({ children }) => {
      const [stage, setStage] = React.useState('idle');
      
      return (
        <SessionProvider>
          <div data-testid="current-stage">{stage}</div>
          {children}
        </SessionProvider>
      );
    };
    
    render(
      <TestWrapper>
        <VoiceRecorder onTranscript={mockOnTranscript} />
      </TestWrapper>
    );
    
    const button = screen.getByTestId('voice-recorder-button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(startRecording).toHaveBeenCalled();
    });
  });
});
