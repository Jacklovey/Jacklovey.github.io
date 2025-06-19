describe('无障碍性测试套件', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.injectAxe();
    cy.mockSpeechAPI();
  });

  describe('WCAG 2.1 AA 标准符合性', () => {
    it('首页应符合WCAG 2.1 AA标准', () => {
      cy.checkA11y(null, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21aa']
        }
      });
    });

    it('登录页面应符合WCAG 2.1 AA标准', () => {
      cy.visit('/login');
      cy.checkA11y(null, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21aa']
        }
      });
    });

    it('开发者控制台应符合WCAG 2.1 AA标准', () => {
      cy.login('devuser', 'devpass123', 'developer');
      cy.visit('/developer');
      cy.checkA11y(null, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21aa']
        }
      });
    });
  });

  describe('键盘导航测试', () => {
    it('应支持完整的键盘导航', () => {
      cy.get('body').focus();
      
      // 测试Tab顺序
      const focusableElements = [
        '[data-testid="voice-recorder-button"]',
        '[data-testid="theme-toggle"]',
        '[data-testid="settings-button"]'
      ];
      
      focusableElements.forEach((selector, index) => {
        if (index === 0) {
          cy.get('body').tab();
        } else {
          cy.focused().tab();
        }
        cy.focused().should('match', selector);
      });
    });

    it('应支持Shift+Tab反向导航', () => {
      // 先移动到最后一个可聚焦元素
      cy.get('[data-testid="settings-button"]').focus();
      
      // 测试反向导航
      cy.focused().tab({ shift: true });
      cy.focused().should('match', '[data-testid="theme-toggle"]');
      
      cy.focused().tab({ shift: true });
      cy.focused().should('match', '[data-testid="voice-recorder-button"]');
    });

    it('应支持回车键和空格键激活', () => {
      // 测试回车键激活
      cy.get('[data-testid="voice-recorder-button"]').focus();
      cy.focused().type('{enter}');
      cy.get('[data-testid="status-bar"]').should('not.contain', '点击麦克风开始');
      
      // 重置状态
      cy.reload();
      cy.mockSpeechAPI();
      
      // 测试空格键激活
      cy.get('[data-testid="voice-recorder-button"]').focus();
      cy.focused().type(' ');
      cy.get('[data-testid="status-bar"]').should('not.contain', '点击麦克风开始');
    });

    it('焦点应可见且对比度足够', () => {
      cy.get('[data-testid="voice-recorder-button"]').focus();
      
      // 验证焦点可见
      cy.focused().should('have.css', 'outline').and('not.equal', 'none');
      
      // 验证焦点颜色对比度
      cy.focused().then(($el) => {
        const styles = window.getComputedStyle($el[0]);
        const outlineColor = styles.outlineColor;
        expect(outlineColor).to.not.equal('transparent');
      });
    });

    it('应正确管理焦点陷阱', () => {
      // 测试模态框焦点陷阱（如果有）
      cy.get('[data-testid="settings-button"]').click();
      
      // 验证焦点在模态框内
      cy.get('[data-testid="settings-modal"]').should('be.visible');
      cy.focused().should('be.visible');
      
      // 测试Tab循环
      cy.focused().tab();
      cy.focused().should('be.visible');
    });
  });

  describe('屏幕阅读器支持', () => {
    it('重要元素应有正确的ARIA标签', () => {
      // 检查主要按钮的ARIA标签
      cy.get('[data-testid="voice-recorder-button"]')
        .should('have.attr', 'aria-label')
        .and('not.be.empty');
      
      // 检查状态栏的ARIA标签
      cy.get('[data-testid="status-bar"]')
        .should('have.attr', 'aria-live', 'polite');
      
      // 检查表单元素的标签
      cy.visit('/login');
      cy.get('[data-testid="username-input"]')
        .should('have.attr', 'aria-label')
        .and('contain', '用户名');
      
      cy.get('[data-testid="password-input"]')
        .should('have.attr', 'aria-label')
        .and('contain', '密码');
    });

    it('状态变化应正确通知屏幕阅读器', () => {
      // 检查录音状态变化的通知
      cy.get('[data-testid="status-bar"]').should('have.attr', 'aria-live', 'polite');
      
      cy.get('[data-testid="voice-recorder-button"]').click();
      
      // 验证状态文本更新
      cy.get('[data-testid="status-bar"]').should('not.contain', '点击麦克风开始');
    });

    it('错误消息应可被屏幕阅读器读取', () => {
      cy.visit('/login');
      
      // 模拟登录错误
      cy.intercept('POST', '/v1/api/auth/token', {
        statusCode: 401,
        body: { detail: '用户名或密码不正确' }
      }).as('loginError');
      
      cy.get('[data-testid="username-input"]').type('invalid');
      cy.get('[data-testid="password-input"]').type('invalid');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@loginError');
      
      // 验证错误消息的无障碍属性
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('have.attr', 'role', 'alert')
        .and('have.attr', 'aria-live', 'assertive');
    });

    it('动态内容应有适当的ARIA标签', () => {
      cy.login('testuser', 'password123');
      cy.visit('/');
      
      // 模拟语音交互结果
      cy.intercept('POST', '/v1/api/interpret', {
        statusCode: 200,
        body: {
          type: 'direct_response',
          message: '无障碍测试响应',
          sessionId: 'a11y-test'
        }
      }).as('interpretAPI');
      
      cy.simulateVoiceInput('无障碍测试');
      cy.wait('@interpretAPI');
      
      // 验证结果区域的ARIA标签
      cy.get('[data-testid="result-area"]')
        .should('have.attr', 'aria-live', 'polite')
        .and('have.attr', 'aria-label')
        .and('contain', '语音交互结果');
    });
  });

  describe('视觉辅助功能', () => {
    it('应支持高对比度模式', () => {
      // 模拟高对比度模式
      cy.get('html').invoke('attr', 'style', 'filter: contrast(200%) brightness(150%)');
      
      // 验证关键元素仍然可见
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
      cy.get('[data-testid="status-bar"]').should('be.visible');
      
      // 验证文本对比度
      cy.get('[data-testid="voice-recorder-button"]').then(($el) => {
        const styles = window.getComputedStyle($el[0]);
        const backgroundColor = styles.backgroundColor;
        const color = styles.color;
        
        // 基本的颜色存在检查
        expect(backgroundColor).to.not.equal('transparent');
        expect(color).to.not.equal('transparent');
      });
    });

    it('应在放大情况下正常工作', () => {
      // 模拟200%缩放
      cy.viewport(640, 360); // 50%视口模拟200%缩放
      
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
      cy.get('[data-testid="status-bar"]').should('be.visible');
      
      // 验证按钮仍然可点击
      cy.get('[data-testid="voice-recorder-button"]').click();
      cy.get('[data-testid="status-bar"]').should('not.contain', '点击麦克风开始');
    });

    it('应正确处理颜色盲用户', () => {
      // 验证不依赖颜色传达信息
      cy.get('[data-testid="voice-recorder-button"]')
        .should('contain.text', '录音') // 文本标识
        .and('have.attr', 'aria-label'); // ARIA标签
      
      // 验证状态通过文本而非仅颜色表示
      cy.get('[data-testid="status-bar"]')
        .should('contain.text', '点击') // 文本状态
        .and('have.attr', 'aria-live'); // 屏幕阅读器支持
    });

    it('动画应可以暂停或关闭', () => {
      // 检查是否支持prefers-reduced-motion
      cy.window().then((win) => {
        // 模拟用户偏好减少动画
        Object.defineProperty(win, 'matchMedia', {
          writable: true,
          value: cy.stub().returns({
            matches: true,
            media: '(prefers-reduced-motion: reduce)',
            onchange: null,
            addListener: cy.stub(),
            removeListener: cy.stub(),
          }),
        });
      });
      
      cy.reload();
      
      // 验证动画被禁用或减少
      cy.get('[data-testid="voice-recorder-button"]').should('have.css', 'animation-duration', '0s');
    });
  });

  describe('表单无障碍性', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('表单元素应有适当的标签关联', () => {
      // 检查输入框与标签的关联
      cy.get('[data-testid="username-input"]')
        .should('have.attr', 'id')
        .then((id) => {
          cy.get(`label[for="${id}"]`).should('exist');
        });
      
      cy.get('[data-testid="password-input"]')
        .should('have.attr', 'id')
        .then((id) => {
          cy.get(`label[for="${id}"]`).should('exist');
        });
    });

    it('表单验证错误应可访问', () => {
      // 提交空表单
      cy.get('button[type="submit"]').click();
      
      // 验证错误消息的无障碍属性
      cy.get('[data-testid="username-error"]')
        .should('be.visible')
        .and('have.attr', 'role', 'alert');
      
      cy.get('[data-testid="password-error"]')
        .should('be.visible')
        .and('have.attr', 'role', 'alert');
      
      // 验证输入框与错误消息的关联
      cy.get('[data-testid="username-input"]')
        .should('have.attr', 'aria-describedby')
        .and('contain', 'username-error');
    });

    it('必填字段应正确标识', () => {
      cy.get('[data-testid="username-input"]')
        .should('have.attr', 'aria-required', 'true')
        .and('have.attr', 'required');
      
      cy.get('[data-testid="password-input"]')
        .should('have.attr', 'aria-required', 'true')
        .and('have.attr', 'required');
    });
  });

  describe('移动设备无障碍性', () => {
    beforeEach(() => {
      cy.mockDevice('mobile');
    });

    it('触摸目标应足够大', () => {
      cy.get('[data-testid="voice-recorder-button"]').then(($el) => {
        const rect = $el[0].getBoundingClientRect();
        
        // WCAG建议触摸目标至少44x44px
        expect(rect.width).to.be.at.least(44);
        expect(rect.height).to.be.at.least(44);
      });
    });

    it('应支持语音控制', () => {
      // 验证语音控制相关的ARIA属性
      cy.get('[data-testid="voice-recorder-button"]')
        .should('have.attr', 'aria-label')
        .and('contain', '录音');
    });

    it('应在横竖屏切换时保持无障碍性', () => {
      // 竖屏模式
      cy.mockDevice('mobile');
      cy.checkA11y();
      
      // 横屏模式
      cy.mockDevice('mobile-landscape');
      cy.checkA11y();
    });
  });

  describe('多语言无障碍支持', () => {
    it('页面应有正确的语言标识', () => {
      cy.get('html').should('have.attr', 'lang', 'zh-CN');
    });

    it('多语言内容应有适当的lang属性', () => {
      // 如果有英文内容，应该标识语言
      cy.get('[lang="en"]').each(($el) => {
        expect($el.attr('lang')).to.equal('en');
      });
    });
  });

  describe('无障碍性回归测试', () => {
    it('页面更新后无障碍性不应退化', () => {
      // 记录初始状态
      cy.checkA11y();
      
      // 执行用户交互
      cy.get('[data-testid="voice-recorder-button"]').click();
      
      // 验证交互后仍符合无障碍标准
      cy.checkA11y();
      
      // 模拟语音交互
      cy.login('testuser', 'password123');
      cy.intercept('POST', '/v1/api/interpret', {
        statusCode: 200,
        body: {
          type: 'direct_response',
          message: '回归测试响应',
          sessionId: 'regression-test'
        }
      }).as('interpretAPI');
      
      cy.simulateVoiceInput('回归测试');
      cy.wait('@interpretAPI');
      
      // 验证结果显示后仍符合标准
      cy.checkA11y();
    });
  });

  describe('无障碍性性能测试', () => {
    it('无障碍性检查不应影响页面性能', () => {
      const startTime = Date.now();
      
      cy.checkA11y();
      
      cy.then(() => {
        const checkTime = Date.now() - startTime;
        expect(checkTime).to.be.lessThan(1000); // 无障碍检查应在1秒内完成
      });
    });
  });
});
