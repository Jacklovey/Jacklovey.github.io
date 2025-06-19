import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Button from '../Button/Button';
import { SessionProvider } from '../../contexts/SessionContext';
import VoiceRecorder from '../VoiceRecorder/VoiceRecorder';
import { ThemeProvider } from '../../contexts/ThemeContext.jsx';

expect.extend(toHaveNoViolations);

// Mock the useVoice hook
jest.mock('../../hooks/useVoice', () => ({
  useVoice: () => ({
    isRecording: false,
    transcript: '',
    error: null,
    isSupported: true,
    startRecording: jest.fn(),
    stopRecording: jest.fn(),
    clearTranscript: jest.fn()
  })
}));

// Mock the useTTS hook
jest.mock('../../hooks/useTTS', () => ({
  useTTS: () => ({
    speak: jest.fn(),
    stop: jest.fn(),
    isSpeaking: false,
    isSupported: true,
    error: null
  })
}));

describe('无障碍测试', () => {
  describe('Button组件', () => {
    it('应该通过无障碍检查', async () => {
      const { container } = render(<Button>测试按钮</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('按钮应该有正确的ARIA属性', async () => {
      const { container } = render(
        <Button disabled aria-label="禁用的按钮">
          禁用按钮
        </Button>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('VoiceRecorder组件', () => {
    it('应该通过无障碍检查', async () => {
      const { container } = render(
        <ThemeProvider>
          <SessionProvider>
            <VoiceRecorder />
          </SessionProvider>
        </ThemeProvider>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('基本HTML结构', () => {
    it('表单元素应该通过无障碍检查', async () => {
      const { container } = render(
        <form>
          <label htmlFor="test-input">测试输入</label>
          <input id="test-input" type="text" />
          <button type="submit">提交</button>
        </form>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('标题层级应该正确', async () => {
      const { container } = render(
        <div>
          <h1>主标题</h1>
          <h2>二级标题</h2>
          <h3>三级标题</h3>
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
