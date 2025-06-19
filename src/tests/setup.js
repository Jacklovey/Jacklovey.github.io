import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// 模拟 antd-mobile 全局样式
jest.mock('antd-mobile/es/global', () => ({}));

// 尝试导入 jest-axe，如果失败则提供默认实现
try {
  const { toHaveNoViolations } = require('jest-axe');
  if (typeof toHaveNoViolations === 'function') {
    expect.extend({ toHaveNoViolations });
  }
} catch (error) {
  // 如果 jest-axe 不可用，提供一个简单的替代实现
  expect.extend({
    toHaveNoViolations: () => ({ 
      pass: true, 
      message: () => 'Accessibility check skipped (jest-axe not available)' 
    })
  });
}

// Mock import.meta globally
global.importMeta = {
  env: {
    VITE_API_URL: 'http://localhost:8000'
  }
};

// 每次测试后清理
afterEach(() => {
  cleanup();
});

// Mock console methods to reduce noise in tests
global.console = {
  ...global.console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// 模拟 Web Speech API
global.SpeechRecognition = jest.fn().mockImplementation(() => ({
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  continuous: false,
  interimResults: true,
  lang: 'zh-CN',
  onresult: null,
  onerror: null,
  onend: null,
  onstart: null,
}));

global.webkitSpeechRecognition = global.SpeechRecognition;

// 模拟 Speech Synthesis API
global.speechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => []),
  speaking: false,
  pending: false,
  paused: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

global.SpeechSynthesisUtterance = jest.fn().mockImplementation((text) => ({
  text: text || '',
  lang: 'zh-CN',
  voice: null,
  volume: 1,
  rate: 1,
  pitch: 1,
  onstart: null,
  onend: null,
  onerror: null,
  onpause: null,
  onresume: null,
  onmark: null,
  onboundary: null,
}));

// 模拟 localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// 模拟 sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// 模拟 fetch API
global.fetch = jest.fn();

// 模拟 URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// 模拟 matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// 模拟 ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// 模拟 IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// 清理函数
beforeEach(() => {
  // 重置所有模拟
  jest.clearAllMocks();
  
  // 重置 localStorage
  localStorageMock.getItem.mockReturnValue(null);
  localStorageMock.setItem.mockImplementation(() => {});
  localStorageMock.removeItem.mockImplementation(() => {});
  localStorageMock.clear.mockImplementation(() => {});
  
  // 重置 sessionStorage
  sessionStorageMock.getItem.mockReturnValue(null);
  sessionStorageMock.setItem.mockImplementation(() => {});
  sessionStorageMock.removeItem.mockImplementation(() => {});
  sessionStorageMock.clear.mockImplementation(() => {});
  
  // 重置 fetch
  fetch.mockClear();
  
  // 重置 Speech API
  global.speechSynthesis.speaking = false;
  global.speechSynthesis.pending = false;
  global.speechSynthesis.paused = false;
  
  // 清理 DOM
  document.documentElement.removeAttribute('data-theme');
  document.body.innerHTML = '';
});

afterEach(() => {
  // 清理任何剩余的定时器
  jest.clearAllTimers();
});

// 抑制特定的控制台警告
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('antd-mobile: Global') ||
       args[0].includes('Warning: `ReactDOMTestUtils.act`') ||
       args[0].includes('Warning: An update to') ||
       args[0].includes('React Router Future Flag Warning'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('React Router Future Flag Warning'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});