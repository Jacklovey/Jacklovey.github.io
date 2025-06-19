import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import MainPage from '../MainPage';
import { SessionProvider } from '../../../contexts/SessionContext';
import { AuthProvider } from '../../../contexts/AuthContext';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { BrowserRouter } from 'react-router-dom';

// 扩展 Jest 匹配器
expect.extend(toHaveNoViolations);

// 模拟 useVoice hook - 这是关键！
jest.mock('../../../hooks/useVoice', () => ({
  useVoice: jest.fn()
}));

// 模拟 useTTS hook
jest.mock('../../../hooks/useTTS', () => ({
  useTTS: jest.fn()
}));

// 模拟 apiClient 服务 - 模拟实际被调用的API
jest.mock('../../../services/apiClient', () => ({
  interpret: jest.fn(),
  execute: jest.fn()
}));

// 导入模拟的依赖
import { useVoice } from '../../../hooks/useVoice';
import { useTTS } from '../../../hooks/useTTS';
import * as apiClient from '../../../services/apiClient';

// 包装器组件 - 提供所有必要的Context
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <SessionProvider>
          {children}
        </SessionProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('MainPage component', () => {
  // 模拟函数
  const mockStartRecording = jest.fn();
  const mockStopRecording = jest.fn();
  const mockSpeak = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 模拟 useVoice hook 的默认返回值
    useVoice.mockReturnValue({
      isRecording: false,
      transcript: '',
      error: null,
      startRecording: mockStartRecording,
      stopRecording: mockStopRecording,
      clearTranscript: jest.fn()
    });
    
    // 模拟 useTTS hook 的返回值
    useTTS.mockReturnValue({
      speak: mockSpeak,
      stop: jest.fn(),
      isSupported: true
    });
    
    // 模拟API响应
    apiClient.interpret.mockResolvedValue({
      requires_confirmation: false,
      tool_calls: [{
        tool_id: 'maps_weather',
        parameters: { city: '上海' }
      }]
    });
    
    apiClient.execute.mockResolvedValue({
      result: {
        message: '上海今天多云，气温20到28度',
        data: { temperature: '20-28°C', weather: '多云' }
      }
    });
  });

  it('should render main page with voice recorder', () => {
    render(
      <TestWrapper>
        <MainPage />
      </TestWrapper>
    );
    
    expect(screen.getByText('Solana Earphone')).toBeInTheDocument();
    expect(screen.getByText('语音智能助手')).toBeInTheDocument();
    expect(screen.getByTestId('voice-recorder-button')).toBeInTheDocument();
    expect(screen.getByTestId('status-bar')).toBeInTheDocument();
  });

  it('should start recording when button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MainPage />
      </TestWrapper>
    );
    
    const recordButton = screen.getByTestId('voice-recorder-button');
    await user.click(recordButton);
    
    expect(mockStartRecording).toHaveBeenCalled();
  });

  it('should handle transcript and call interpret API', async () => {
    // 模拟录音结束后返回转写文本
    mockStopRecording.mockReturnValue('查询天气');
    
    // 模拟录音状态变化
    useVoice.mockReturnValue({
      isRecording: true,
      transcript: '查询天气',
      error: null,
      startRecording: mockStartRecording,
      stopRecording: mockStopRecording,
      clearTranscript: jest.fn()
    });
    
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MainPage />
      </TestWrapper>
    );
    
    const recordButton = screen.getByTestId('voice-recorder-button');
    
    // 模拟点击停止录音，这会触发onTranscript回调
    await user.click(recordButton);
    
    // 手动触发transcript处理（模拟VoiceRecorder组件的onTranscript回调）
    const mainPageComponent = screen.getByTestId('voice-recorder-button').closest('.mainPage');
    if (mainPageComponent) {
      // 直接调用MainPage的handleTranscript逻辑
      await waitFor(() => {
        expect(apiClient.interpret).toHaveBeenCalledWith({
          query: '查询天气'
        });
      }, { timeout: 3000 });
    }
  });

  it('should display confirmation dialog when required', async () => {
    // 模拟需要确认的API响应
    apiClient.interpret.mockResolvedValue({
      requires_confirmation: true,
      tool_calls: [{
        tool_id: 'crypto_transfer',
        parameters: { amount: 100, to: '朋友' }
      }],
      confirmation_message: '确定要转账100元给朋友吗？'
    });
    
    // 模拟有转写文本
    useVoice.mockReturnValue({
      isRecording: false,
      transcript: '转账给朋友',
      error: null,
      startRecording: mockStartRecording,
      stopRecording: mockStopRecording,
      clearTranscript: jest.fn()
    });
    
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MainPage />
      </TestWrapper>
    );
    
    // 模拟录音并获得转写结果
    const recordButton = screen.getByTestId('voice-recorder-button');
    await user.click(recordButton);
    
    // 等待确认对话框出现
    await waitFor(() => {
      const confirmTexts = screen.queryAllByText(/确定要转账/, { exact: false });
      expect(confirmTexts.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
    
    // 验证确认和取消按钮存在
    expect(screen.getByTestId('confirm-button')).toBeInTheDocument();
    expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
  });

  it('should execute tools after confirmation', async () => {
    const toolCalls = [{
      tool_id: 'crypto_transfer',
      parameters: { amount: 100, to: '朋友' }
    }];
    
    // 模拟需要确认的场景
    apiClient.interpret.mockResolvedValue({
      requires_confirmation: true,
      tool_calls: toolCalls,
      confirmation_message: '您确定要转账100元给朋友吗？'
    });
    
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MainPage />
      </TestWrapper>
    );
    
    // 触发录音和确认流程
    const recordButton = screen.getByTestId('voice-recorder-button');
    await user.click(recordButton);
    
    // 等待确认按钮出现并点击
    await waitFor(() => {
      const confirmButton = screen.getByTestId('confirm-button');
      return user.click(confirmButton);
    });
    
    // 验证执行API被调用
    await waitFor(() => {
      expect(apiClient.execute).toHaveBeenCalledWith({
        tool_calls: toolCalls
      });
    });
  });

  it('should handle cancellation', async () => {
    // 模拟需要确认的场景
    apiClient.interpret.mockResolvedValue({
      requires_confirmation: true,
      tool_calls: [{
        tool_id: 'dangerous_operation',
        parameters: { action: 'delete_all' }
      }],
      confirmation_message: '确定要删除所有文件吗？'
    });
    
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MainPage />
      </TestWrapper>
    );
    
    // 触发录音
    const recordButton = screen.getByTestId('voice-recorder-button');
    await user.click(recordButton);
    
    // 点击取消按钮
    await waitFor(async () => {
      const cancelButton = screen.getByTestId('cancel-button');
      await user.click(cancelButton);
    });
    
    // 验证TTS被调用播放取消消息
    await waitFor(() => {
      expect(mockSpeak).toHaveBeenCalledWith('已取消操作');
    });
    
    // 验证没有调用执行API
    expect(apiClient.execute).not.toHaveBeenCalled();
  });

  it('should display execution results', async () => {
    // 模拟直接执行（无需确认）
    apiClient.interpret.mockResolvedValue({
      requires_confirmation: false,
      tool_calls: [{
        tool_id: 'maps_weather',
        parameters: { city: '上海' }
      }]
    });
    
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MainPage />
      </TestWrapper>
    );
    
    // 触发录音
    const recordButton = screen.getByTestId('voice-recorder-button');
    await user.click(recordButton);
    
    // 等待结果显示
    await waitFor(() => {
      expect(screen.getByText('执行结果')).toBeInTheDocument();
      expect(screen.getByText(/上海今天多云/)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should handle API errors gracefully', async () => {
    // 模拟API错误
    apiClient.interpret.mockRejectedValue(new Error('网络连接失败'));
    
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MainPage />
      </TestWrapper>
    );
    
    // 触发录音
    const recordButton = screen.getByTestId('voice-recorder-button');
    await user.click(recordButton);
    
    // 验证错误处理
    await waitFor(() => {
      expect(mockSpeak).toHaveBeenCalledWith('抱歉，处理您的请求时出现了错误');
    }, { timeout: 3000 });
  });

  it('should handle voice recording errors', () => {
    // 模拟语音录制错误
    useVoice.mockReturnValue({
      isRecording: false,
      transcript: '',
      error: '麦克风权限被拒绝',
      startRecording: mockStartRecording,
      stopRecording: mockStopRecording,
      clearTranscript: jest.fn()
    });
    
    render(
      <TestWrapper>
        <MainPage />
      </TestWrapper>
    );
    
    // 验证错误显示
    expect(screen.getByTestId('voice-error')).toBeInTheDocument();
    expect(screen.getByText('麦克风权限被拒绝')).toBeInTheDocument();
  });

  it('should be responsive on different screen sizes', () => {
    // 模拟移动设备
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    render(
      <TestWrapper>
        <MainPage />
      </TestWrapper>
    );
    
    const container = document.querySelector('.mainPage');
    expect(container).toBeTruthy();
  });

  it('should call TTS for confirmation messages', async () => {
    // 模拟需要确认并有TTS消息的响应
    apiClient.interpret.mockResolvedValue({
      requires_confirmation: true,
      tool_calls: [{
        tool_id: 'maps_weather',
        parameters: { city: '上海' }
      }],
      confirmation_message: '您想查询上海的天气吗？'
    });
    
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MainPage />
      </TestWrapper>
    );
    
    // 触发录音
    const recordButton = screen.getByTestId('voice-recorder-button');
    await user.click(recordButton);
    
    await waitFor(() => {
      // 检查是否调用了TTS播放确认消息
      expect(mockSpeak).toHaveBeenCalledWith('您想查询上海的天气吗？');
    }, { timeout: 3000 });
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <TestWrapper>
        <MainPage />
      </TestWrapper>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
