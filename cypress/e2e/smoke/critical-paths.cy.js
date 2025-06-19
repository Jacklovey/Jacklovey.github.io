describe('冒烟测试 - 关键功能验证', () => {
  beforeEach(() => {
    // 设置基本环境
    cy.clearAllStorage();
    cy.mockSpeechAPI();
  });

  describe('应用基础功能', () => {
    it('应用应能正常启动并加载', () => {
      cy.visit('/');
      
      // 验证关键元素存在
      cy.get('[data-testid="app-container"]').should('be.visible');
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
      cy.get('[data-testid="status-bar"]').should('be.visible');
      
      // 验证页面标题
      cy.title().should('include', 'Echo');
      
      // 验证基本性能
      cy.checkPerformance({ loadTime: 5000 });
    });

    it('登录功能应正常工作', () => {
      cy.visit('/login');
      
      // 模拟成功登录
      cy.intercept('POST', '/v1/api/auth/token', {
        statusCode: 200,
        body: {
          access_token: 'smoke-test-token',
          token_type: 'bearer',
          expires_in: 604800,
          user_id: 1,
          username: 'smokeuser',
          role: 'user'
        }
      }).as('loginAPI');
      
      cy.get('[data-testid="username-input"]').type('smokeuser');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@loginAPI');
      
      // 验证登录成功
      cy.url().should('include', '/');
      cy.window().then((win) => {
        expect(win.localStorage.getItem('auth_token')).to.not.be.null;
      });
    });

    it('语音录制按钮应响应点击', () => {
      cy.visit('/');
      
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
      cy.get('[data-testid="voice-recorder-button"]').click();
      
      // 验证状态变化
      cy.get('[data-testid="status-bar"]').should('not.contain', '点击麦克风开始');
    });
  });

  describe('API连接验证', () => {
    it('应能连接到认证API', () => {
      cy.intercept('POST', '/v1/api/auth/token', {
        statusCode: 200,
        body: { access_token: 'test-token' }
      }).as('authAPI');
      
      cy.visit('/login');
      cy.get('[data-testid="username-input"]').type('test');
      cy.get('[data-testid="password-input"]').type('test');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@authAPI').its('response.statusCode').should('eq', 200);
    });

    it('应能连接到意图解析API', () => {
      cy.intercept('POST', '/v1/api/interpret', {
        statusCode: 200,
        body: {
          type: 'direct_response',
          message: '冒烟测试响应',
          sessionId: 'smoke-test'
        }
      }).as('interpretAPI');
      
      cy.login('smokeuser', 'password123');
      cy.visit('/');
      
      cy.simulateVoiceInput('冒烟测试');
      
      cy.wait('@interpretAPI').its('response.statusCode').should('eq', 200);
    });
  });

  describe('响应式设计验证', () => {
    it('应在移动设备上正常工作', () => {
      cy.mockDevice('mobile');
      cy.visit('/');
      
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
      cy.get('[data-testid="status-bar"]').should('be.visible');
      
      // 验证触摸交互
      cy.get('[data-testid="voice-recorder-button"]').click();
      cy.get('[data-testid="status-bar"]').should('not.contain', '点击麦克风开始');
    });

    it('应在桌面设备上正常工作', () => {
      cy.mockDevice('desktop');
      cy.visit('/');
      
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
      cy.get('[data-testid="status-bar"]').should('be.visible');
      
      // 验证鼠标交互
      cy.get('[data-testid="voice-recorder-button"]').click();
      cy.get('[data-testid="status-bar"]').should('not.contain', '点击麦克风开始');
    });
  });

  describe('主题系统验证', () => {
    it('主题切换应正常工作', () => {
      cy.visit('/');
      
      // 验证默认主题
      cy.get('html').should('have.attr', 'data-theme', 'light');
      
      // 切换到深色主题
      cy.get('[data-testid="theme-toggle"]').click();
      cy.get('html').should('have.attr', 'data-theme', 'dark');
      
      // 切换回浅色主题
      cy.get('[data-testid="theme-toggle"]').click();
      cy.get('html').should('have.attr', 'data-theme', 'light');
    });
  });

  describe('错误处理验证', () => {
    it('应正确处理网络错误', () => {
      cy.intercept('POST', '/v1/api/interpret', { forceNetworkError: true }).as('networkError');
      
      cy.login('smokeuser', 'password123');
      cy.visit('/');
      
      cy.simulateVoiceInput('测试网络错误');
      
      cy.wait('@networkError');
      
      // 验证错误提示
      cy.get('[data-testid="error-message"]').should('be.visible');
    });

    it('应正确处理服务器错误', () => {
      cy.intercept('POST', '/v1/api/interpret', {
        statusCode: 500,
        body: { detail: '服务器内部错误' }
      }).as('serverError');
      
      cy.login('smokeuser', 'password123');
      cy.visit('/');
      
      cy.simulateVoiceInput('测试服务器错误');
      
      cy.wait('@serverError');
      
      // 验证错误提示
      cy.get('[data-testid="error-message"]').should('be.visible');
    });
  });

  describe('无障碍性基础验证', () => {
    it('关键页面应通过基础无障碍检查', () => {
      cy.visit('/');
      cy.injectAxe();
      
      // 检查关键的无障碍问题
      cy.checkA11y(null, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a']
        }
      });
    });

    it('应支持键盘导航', () => {
      cy.visit('/');
      
      // 测试Tab导航
      cy.get('body').tab();
      cy.focused().should('be.visible');
      
      // 测试焦点可见性
      cy.focused().should('have.css', 'outline').and('not.equal', 'none');
    });
  });

  describe('本地存储验证', () => {
    it('应正确保存和读取用户设置', () => {
      cy.visit('/');
      
      // 设置用户偏好
      cy.setUserPreferences({
        theme: 'dark',
        language: 'zh-CN',
        voiceRate: 1.2
      });
      
      // 刷新页面
      cy.reload();
      
      // 验证设置保持
      cy.window().then((win) => {
        const preferences = JSON.parse(win.localStorage.getItem('user_preferences') || '{}');
        expect(preferences.theme).to.equal('dark');
        expect(preferences.voiceRate).to.equal(1.2);
      });
    });
  });

  describe('基础性能验证', () => {
    it('页面加载时间应在合理范围内', () => {
      const startTime = Date.now();
      
      cy.visit('/');
      
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(5000); // 5秒内加载
      });
    });

    it('应用应响应迅速', () => {
      cy.visit('/');
      
      const startTime = Date.now();
      
      cy.get('[data-testid="voice-recorder-button"]').click();
      
      cy.then(() => {
        const responseTime = Date.now() - startTime;
        expect(responseTime).to.be.lessThan(500); // 500ms内响应
      });
    });
  });

  describe('开发者功能验证（如果适用）', () => {
    it('开发者应能访问控制台', () => {
      cy.login('devuser', 'devpass123', 'developer');
      cy.visit('/developer');
      
      cy.get('[data-testid="developer-dashboard"]').should('be.visible');
    });

    it('普通用户不应能访问开发者控制台', () => {
      cy.login('smokeuser', 'password123', 'user');
      cy.visit('/developer');
      
      // 应被重定向或显示权限错误
      cy.url().should('not.include', '/developer');
    });
  });

  describe('会话管理验证', () => {
    it('会话数据应正确保存', () => {
      cy.login('smokeuser', 'password123');
      cy.visit('/');
      
      // 模拟语音交互
      cy.intercept('POST', '/v1/api/interpret', {
        statusCode: 200,
        body: {
          type: 'direct_response',
          message: '会话测试响应',
          sessionId: 'smoke-session-123'
        }
      }).as('interpretAPI');
      
      cy.simulateVoiceInput('会话测试');
      cy.wait('@interpretAPI');
      
      // 验证会话数据保存
      cy.window().then((win) => {
        const sessionData = JSON.parse(win.localStorage.getItem('session_data') || '{}');
        expect(sessionData.sessionId).to.exist;
      });
    });
  });
});
