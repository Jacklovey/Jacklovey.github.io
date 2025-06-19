// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// 登录命令
Cypress.Commands.add('login', (username, password) => {
  cy.window().then((win) => {
    // 模拟登录API响应
    cy.intercept('POST', '/v1/api/auth/token', {
      statusCode: 200,
      body: {
        access_token: 'mock-jwt-token',
        token_type: 'bearer',
        expires_in: 604800,
        user_id: 1,
        username: username,
        role: 'user'
      }
    }).as('loginAPI');
    
    // 设置localStorage
    win.localStorage.setItem('auth_token', 'mock-jwt-token');
    win.localStorage.setItem('user_id', '1');
    win.localStorage.setItem('username', username);
    win.localStorage.setItem('user_role', 'user');
  });
});

// 模拟语音API
Cypress.Commands.add('mockSpeechAPI', () => {
  cy.window().then((win) => {
    // 模拟SpeechRecognition
    win.SpeechRecognition = function() {
      return {
        start: cy.stub().as('recognitionStart'),
        stop: cy.stub().as('recognitionStop'),
        addEventListener: cy.stub(),
        removeEventListener: cy.stub(),
        continuous: false,
        interimResults: true,
        lang: '',
        onresult: null,
        onerror: null,
        onend: null,
      };
    };
    win.webkitSpeechRecognition = win.SpeechRecognition;
    
    // 存储实例引用
    win.speechRecognitionInstance = null;
    
    // 重写构造函数以捕获实例
    const OriginalSpeechRecognition = win.SpeechRecognition;
    win.SpeechRecognition = function() {
      const instance = new OriginalSpeechRecognition();
      win.speechRecognitionInstance = instance;
      return instance;
    };
    
    // 模拟SpeechSynthesis
    win.speechSynthesis = {
      speak: cy.stub().as('speechSynthesisSpeak'),
      cancel: cy.stub().as('speechSynthesisCancel'),
      pause: cy.stub().as('speechSynthesisResume'),
      resume: cy.stub().as('speechSynthesisPause'),
      getVoices: cy.stub().returns([])
    };
    
    win.SpeechSynthesisUtterance = function(text) {
      this.text = text;
      this.lang = '';
      this.rate = 1;
      this.pitch = 1;
      this.volume = 1;
      this.onstart = null;
      this.onend = null;
      this.onerror = null;
      return this;
    };
  });
});

// 模拟语音输入
Cypress.Commands.add('simulateVoiceInput', (text) => {
  cy.window().then((win) => {
    // 如果没有开始录音，先点击录音按钮
    cy.get('[data-testid="voice-recorder-button"]').then(($button) => {
      if ($button.text().includes('录音') || $button.text().includes('开始')) {
        cy.wrap($button).click();
        
        // 等待录音状态更新
        cy.wait(100);
      }
    });
    
    // 模拟语音识别结果
    cy.window().then((win) => {
      if (win.speechRecognitionInstance && win.speechRecognitionInstance.onresult) {
        const fakeEvent = {
          results: [{
            0: { transcript: text },
            isFinal: true,
            length: 1
          }],
          resultIndex: 0
        };
        win.speechRecognitionInstance.onresult(fakeEvent);
      }
    });
    
    // 等待一下再停止录音
    cy.wait(500);
    
    // 停止录音
    cy.get('[data-testid="voice-recorder-button"]').then(($button) => {
      if ($button.text().includes('停止') || $button.text().includes('结束')) {
        cy.wrap($button).click();
      }
    });
  });
});

// 等待元素出现
Cypress.Commands.add('waitForElement', (selector, timeout = 10000) => {
  cy.get(selector, { timeout }).should('be.visible');
});

// 模拟网络延迟
Cypress.Commands.add('mockNetworkDelay', (delay = 1000) => {
  cy.intercept('**', (req) => {
    req.reply((res) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(res);
        }, delay);
      });
    });
  });
});

// 检查无障碍性
Cypress.Commands.add('checkA11y', (context, options) => {
  cy.injectAxe();
  cy.checkA11y(context, options);
});

// 模拟移动设备
Cypress.Commands.add('mockMobile', () => {
  cy.viewport('iphone-x');
  cy.get('body').then(($body) => {
    $body.addClass('mobile-device');
  });
});

// 模拟桌面设备
Cypress.Commands.add('mockDesktop', () => {
  cy.viewport(1280, 720);
  cy.get('body').then(($body) => {
    $body.removeClass('mobile-device');
  });
});

// 设置主题
Cypress.Commands.add('setTheme', (theme) => {
  cy.window().then((win) => {
    win.localStorage.setItem('theme', theme);
    // 触发主题变更事件
    win.dispatchEvent(new Event('themechange'));
  });
});

// 模拟离线状态
Cypress.Commands.add('goOffline', () => {
  cy.window().then((win) => {
    cy.stub(win.navigator, 'onLine').value(false);
    win.dispatchEvent(new Event('offline'));
  });
});

// 模拟在线状态
Cypress.Commands.add('goOnline', () => {
  cy.window().then((win) => {
    cy.stub(win.navigator, 'onLine').value(true);
    win.dispatchEvent(new Event('online'));
  });
});

// 清除所有存储
Cypress.Commands.add('clearAllStorage', () => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.window().then((win) => {
    win.sessionStorage.clear();
    if (win.indexedDB) {
      // 清除 IndexedDB（如果有使用）
    }
  });
});

// 等待 API 响应
Cypress.Commands.add('waitForAPI', (alias, timeout = 10000) => {
  cy.wait(alias, { timeout });
});

// 模拟键盘导航
Cypress.Commands.add('tabToElement', (selector) => {
  cy.get('body').focus();
  cy.get(selector).focus().should('be.focused');
});

// 验证焦点管理
Cypress.Commands.add('checkFocusManagement', () => {
  // 检查是否有可见的焦点指示器
  cy.focused().should('exist');
  cy.focused().should('be.visible');
});

// 模拟语音合成事件
Cypress.Commands.add('triggerSpeechSynthesisEvent', (eventType, utteranceText) => {
  cy.window().then((win) => {
    if (win.speechSynthesis && win.SpeechSynthesisUtterance) {
      const utterance = new win.SpeechSynthesisUtterance(utteranceText);
      if (utterance[`on${eventType}`]) {
        utterance[`on${eventType}`]();
      }
    }
  });
});

// 检查页面性能
Cypress.Commands.add('checkPerformance', () => {
  cy.window().then((win) => {
    const performance = win.performance;
    const navigation = performance.getEntriesByType('navigation')[0];
    
    // 检查加载时间
    const loadTime = navigation.loadEventEnd - navigation.fetchStart;
    expect(loadTime).to.be.lessThan(5000); // 5秒内加载完成
    
    // 检查首次内容绘制
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    if (fcp) {
      expect(fcp.startTime).to.be.lessThan(2000); // 2秒内首次内容绘制
    }
  });
});
