// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// 登录命令 - 支持不同角色
Cypress.Commands.add('login', (username, password, role = 'user') => {
  cy.window().then((win) => {
    // 模拟登录API响应
    cy.intercept('POST', '/v1/api/auth/token', {
      statusCode: 200,
      body: {
        access_token: `mock-${role}-token`,
        token_type: 'bearer',
        expires_in: 604800,
        user_id: role === 'developer' ? 2 : (role === 'admin' ? 3 : 1),
        username: username,
        role: role
      }
    }).as('loginAPI');
    
    // 设置localStorage
    win.localStorage.setItem('auth_token', `mock-${role}-token`);
    win.localStorage.setItem('user_id', role === 'developer' ? '2' : (role === 'admin' ? '3' : '1'));
    win.localStorage.setItem('username', username);
    win.localStorage.setItem('user_role', role);
  });
});

// 登出命令
Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.clear();
    win.sessionStorage.clear();
  });
});

// 模拟语音API
Cypress.Commands.add('mockSpeechAPI', () => {
  cy.window().then((win) => {
    // 模拟SpeechRecognition
    if (!win.SpeechRecognition && !win.webkitSpeechRecognition) {
      win.SpeechRecognition = function() {
        this.continuous = false;
        this.interimResults = true;
        this.lang = 'zh-CN';
        this.onresult = null;
        this.onerror = null;
        this.onend = null;
        this.onstart = null;
      };
      
      win.SpeechRecognition.prototype.start = cy.stub().as('recognitionStart');
      win.SpeechRecognition.prototype.stop = cy.stub().as('recognitionStop');
      win.SpeechRecognition.prototype.addEventListener = cy.stub();
      win.SpeechRecognition.prototype.removeEventListener = cy.stub();
      
      win.webkitSpeechRecognition = win.SpeechRecognition;
    }
    
    // 模拟SpeechSynthesis
    if (!win.speechSynthesis) {
      win.speechSynthesis = {
        speak: cy.stub().as('speechSynthesisSpeak'),
        cancel: cy.stub().as('speechSynthesisCancel'),
        pause: cy.stub().as('speechSynthesisPause'),
        resume: cy.stub().as('speechSynthesisResume'),
        getVoices: cy.stub().returns([]),
        speaking: false,
        pending: false,
        paused: false
      };
    }
    
    // 模拟SpeechSynthesisUtterance
    if (!win.SpeechSynthesisUtterance) {
      win.SpeechSynthesisUtterance = function(text) {
        this.text = text || '';
        this.lang = 'zh-CN';
        this.rate = 1;
        this.pitch = 1;
        this.volume = 1;
        this.onstart = null;
        this.onend = null;
        this.onerror = null;
        this.onpause = null;
        this.onresume = null;
        this.onmark = null;
        this.onboundary = null;
      };
    }
  });
});

// 模拟语音输入
Cypress.Commands.add('simulateVoiceInput', (text, options = {}) => {
  const { delay = 100, interim = false } = options;
  
  cy.window().then((win) => {
    // 如果没有开始录音，先点击录音按钮
    cy.get('[data-testid="voice-recorder-button"]').then(($button) => {
      const buttonText = $button.text();
      if (buttonText.includes('录音') || buttonText.includes('开始')) {
        cy.wrap($button).click();
        cy.wait(delay);
      }
    });
    
    // 模拟语音识别结果
    cy.wait(delay).then(() => {
      if (win.SpeechRecognition && win.SpeechRecognition.prototype.onresult) {
        const event = {
          results: [[{ 
            transcript: text,
            confidence: 0.95,
            isFinal: !interim
          }]],
          resultIndex: 0
        };
        
        if (typeof win.SpeechRecognition.prototype.onresult === 'function') {
          win.SpeechRecognition.prototype.onresult(event);
        }
      }
    });
    
    // 如果是最终结果，停止录音
    if (!interim) {
      cy.wait(delay).then(() => {
        cy.get('[data-testid="voice-recorder-button"]').then(($button) => {
          const buttonText = $button.text();
          if (buttonText.includes('停止') || buttonText.includes('结束')) {
            cy.wrap($button).click();
          }
        });
      });
    }
  });
});

// 模拟语音识别错误
Cypress.Commands.add('simulateVoiceError', (errorType = 'no-speech') => {
  cy.window().then((win) => {
    if (win.SpeechRecognition && win.SpeechRecognition.prototype.onerror) {
      const event = {
        error: errorType,
        message: `Speech recognition error: ${errorType}`
      };
      
      if (typeof win.SpeechRecognition.prototype.onerror === 'function') {
        win.SpeechRecognition.prototype.onerror(event);
      }
    }
  });
});

// 检查无障碍性
Cypress.Commands.add('checkA11y', (selector, options = {}) => {
  const defaultOptions = {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21aa']
    },
    ...options
  };
  
  cy.injectAxe();
  cy.checkA11y(selector, defaultOptions);
});

// 模拟设备
Cypress.Commands.add('mockDevice', (deviceType) => {
  const devices = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 720 },
    'mobile-landscape': { width: 667, height: 375 },
    'tablet-landscape': { width: 1024, height: 768 }
  };
  
  const device = devices[deviceType] || devices.desktop;
  cy.viewport(device.width, device.height);
  
  // 模拟触摸设备特性
  if (deviceType.includes('mobile') || deviceType.includes('tablet')) {
    cy.window().then((win) => {
      // 模拟触摸事件支持
      win.ontouchstart = () => {};
      
      // 模拟设备API
      Object.defineProperty(win.navigator, 'maxTouchPoints', {
        value: 5,
        writable: false
      });
    });
  }
});

// 等待API响应
Cypress.Commands.add('waitForAPI', (alias, timeout = 10000) => {
  cy.wait(alias, { timeout });
});

// 模拟网络状况
Cypress.Commands.add('mockNetworkCondition', (condition) => {
  const conditions = {
    offline: { offline: true },
    slow: { delay: 2000, throttleKbps: 50 },
    fast: { delay: 50, throttleKbps: 10000 }
  };
  
  const config = conditions[condition];
  if (config) {
    if (config.offline) {
      cy.intercept('**/*', { forceNetworkError: true });
    } else {
      cy.intercept('**/*', { delay: config.delay });
    }
  }
});

// 清除所有存储
Cypress.Commands.add('clearAllStorage', () => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.window().then((win) => {
    win.sessionStorage.clear();
    if (win.indexedDB && win.indexedDB.databases) {
      win.indexedDB.databases().then((databases) => {
        databases.forEach(({ name }) => {
          win.indexedDB.deleteDatabase(name);
        });
      });
    }
  });
});

// 等待元素稳定（动画完成）
Cypress.Commands.add('waitForStable', (selector, timeout = 5000) => {
  cy.get(selector, { timeout }).should('be.visible');
  cy.wait(300); // 等待动画完成
});

// 模拟键盘导航
Cypress.Commands.add('tabTo', (selector) => {
  cy.get('body').tab();
  cy.focused().should('match', selector);
});

// 验证性能指标
Cypress.Commands.add('checkPerformance', (thresholds = {}) => {
  const defaultThresholds = {
    loadTime: 3000,
    domElements: 1500,
    ...thresholds
  };
  
  cy.window().then((win) => {
    const navigation = win.performance.getEntriesByType('navigation')[0];
    const loadTime = navigation.loadEventEnd - navigation.fetchStart;
    
    expect(loadTime).to.be.lessThan(defaultThresholds.loadTime);
    
    const domElements = win.document.querySelectorAll('*').length;
    expect(domElements).to.be.lessThan(defaultThresholds.domElements);
  });
});

// 截图并比较（视觉回归测试）
Cypress.Commands.add('visualSnapshot', (name) => {
  cy.screenshot(name, {
    capture: 'viewport',
    overwrite: true
  });
});

// 模拟用户偏好设置
Cypress.Commands.add('setUserPreferences', (preferences = {}) => {
  const defaultPreferences = {
    theme: 'light',
    language: 'zh-CN',
    voiceRate: 1,
    voicePitch: 1,
    ...preferences
  };
  
  cy.window().then((win) => {
    win.localStorage.setItem('user_preferences', JSON.stringify(defaultPreferences));
  });
});

// 模拟地理位置
Cypress.Commands.add('mockGeolocation', (latitude = 31.2304, longitude = 121.4737) => {
  cy.window().then((win) => {
    const mockGeolocation = {
      getCurrentPosition: cy.stub().callsFake((success) => {
        success({
          coords: {
            latitude,
            longitude,
            accuracy: 10
          },
          timestamp: Date.now()
        });
      }),
      watchPosition: cy.stub(),
      clearWatch: cy.stub()
    };
    
    Object.defineProperty(win.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: false
    });
  });
});

// 模拟剪贴板API
Cypress.Commands.add('mockClipboard', () => {
  cy.window().then((win) => {
    if (!win.navigator.clipboard) {
      const mockClipboard = {
        writeText: cy.stub().resolves(),
        readText: cy.stub().resolves('mock clipboard text'),
        write: cy.stub().resolves(),
        read: cy.stub().resolves()
      };
      
      Object.defineProperty(win.navigator, 'clipboard', {
        value: mockClipboard,
        writable: false
      });
    }
  });
});

// 验证控制台错误
Cypress.Commands.add('checkConsoleErrors', () => {
  cy.window().then((win) => {
    const errors = win.console.error.getCalls();
    if (errors.length > 0) {
      throw new Error(`Console errors found: ${errors.map(call => call.args.join(' ')).join(', ')}`);
    }
  });
});

// 模拟文件上传
Cypress.Commands.add('uploadFile', (selector, fileName, fileType = 'application/json') => {
  cy.fixture(fileName).then((content) => {
    const blob = new Blob([JSON.stringify(content)], { type: fileType });
    const file = new File([blob], fileName, { type: fileType });
    
    cy.get(selector).then((input) => {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input[0].files = dataTransfer.files;
      
      cy.wrap(input).trigger('change', { force: true });
    });
  });
});
