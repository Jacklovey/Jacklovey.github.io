describe('登录功能 - 完整测试套件', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.injectAxe(); // 注入无障碍测试工具
  });

  describe('界面显示', () => {
    it('应正确显示登录表单', () => {
      cy.get('form').should('be.visible');
      cy.get('[data-testid="username-input"]').should('be.visible');
      cy.get('[data-testid="password-input"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
      
      // 验证无障碍性
      cy.checkA11y();
    });

    it('应显示正确的页面标题和元素', () => {
      cy.title().should('include', '登录');
      cy.get('h1').should('contain', '登录');
      cy.get('[data-testid="register-link"]').should('be.visible');
      cy.get('[data-testid="forgot-password-link"]').should('be.visible');
    });

    it('应在移动设备上正确显示', () => {
      cy.viewport('iphone-6');
      cy.get('form').should('be.visible');
      cy.get('[data-testid="username-input"]').should('be.visible');
      cy.get('[data-testid="password-input"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });
  });

  describe('成功登录场景', () => {
    it('使用有效凭据应成功登录', () => {
      // 模拟登录API响应
      cy.intercept('POST', '/v1/api/auth/token', {
        statusCode: 200,
        body: {
          access_token: 'mock-jwt-token',
          token_type: 'bearer',
          expires_in: 604800,
          user_id: 1,
          username: 'testuser',
          role: 'user'
        }
      }).as('loginAPI');

      cy.get('[data-testid="username-input"]').type('testuser');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('button[type="submit"]').click();

      // 验证API调用
      cy.wait('@loginAPI');

      // 验证登录成功，跳转到首页
      cy.url().should('include', '/');
      
      // 验证localStorage中有令牌
      cy.window().then((win) => {
        expect(win.localStorage.getItem('auth_token')).to.not.be.null;
        expect(win.localStorage.getItem('username')).to.equal('testuser');
      });
    });

    it('应在刷新后保持登录状态', () => {
      // 首先登录
      cy.login('testuser', 'password123');
      cy.visit('/');
      
      // 刷新页面
      cy.reload();
      
      // 验证仍然登录
      cy.get('[data-testid="user-menu"]').should('contain', 'testuser');
      cy.url().should('not.include', '/login');
    });

    it('开发者角色应能访问开发者控制台', () => {
      // 模拟开发者登录
      cy.intercept('POST', '/v1/api/auth/token', {
        statusCode: 200,
        body: {
          access_token: 'mock-dev-token',
          token_type: 'bearer',
          expires_in: 604800,
          user_id: 2,
          username: 'devuser',
          role: 'developer'
        }
      }).as('devLoginAPI');

      cy.get('[data-testid="username-input"]').type('devuser');
      cy.get('[data-testid="password-input"]').type('devpass123');
      cy.get('button[type="submit"]').click();

      cy.wait('@devLoginAPI');
      
      // 验证可以访问开发者控制台
      cy.visit('/developer');
      cy.get('[data-testid="developer-dashboard"]').should('be.visible');
    });
  });

  describe('失败登录场景', () => {
    it('使用无效凭据应显示错误信息', () => {
      // 模拟登录失败响应
      cy.intercept('POST', '/v1/api/auth/token', {
        statusCode: 401,
        body: { detail: '用户名或密码不正确' }
      }).as('loginFailAPI');

      cy.get('[data-testid="username-input"]').type('testuser');
      cy.get('[data-testid="password-input"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();

      // 验证API调用
      cy.wait('@loginFailAPI');

      // 验证错误提示
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.get('[data-testid="error-message"]').should('contain', '用户名或密码不正确');

      // 验证仍在登录页面
      cy.url().should('include', '/login');
    });

    it('应验证必填字段', () => {
      // 尝试提交空表单
      cy.get('button[type="submit"]').click();

      // 验证表单验证错误
      cy.get('[data-testid="username-error"]').should('contain', '请输入用户名');
      cy.get('[data-testid="password-error"]').should('contain', '请输入密码');
    });

    it('应验证密码长度', () => {
      cy.get('[data-testid="username-input"]').type('testuser');
      cy.get('[data-testid="password-input"]').type('123');
      cy.get('[data-testid="password-input"]').blur();

      // 验证密码长度验证
      cy.get('[data-testid="password-error"]').should('contain', '密码至少6个字符');
    });

    it('应处理网络错误', () => {
      // 模拟网络错误
      cy.intercept('POST', '/v1/api/auth/token', { forceNetworkError: true }).as('networkError');

      cy.get('[data-testid="username-input"]').type('testuser');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('button[type="submit"]').click();

      cy.wait('@networkError');

      // 验证网络错误提示
      cy.get('[data-testid="error-message"]').should('contain', '网络连接失败');
    });

    it('应处理服务器错误', () => {
      // 模拟服务器错误
      cy.intercept('POST', '/v1/api/auth/token', {
        statusCode: 500,
        body: { detail: '服务器内部错误' }
      }).as('serverError');

      cy.get('[data-testid="username-input"]').type('testuser');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('button[type="submit"]').click();

      cy.wait('@serverError');

      // 验证服务器错误提示
      cy.get('[data-testid="error-message"]').should('contain', '服务器错误，请稍后重试');
    });
  });

  describe('用户体验', () => {
    it('应支持回车键提交', () => {
      // 模拟登录API响应
      cy.intercept('POST', '/v1/api/auth/token', {
        statusCode: 200,
        body: {
          access_token: 'mock-jwt-token',
          token_type: 'bearer',
          expires_in: 604800,
          user_id: 1,
          username: 'testuser',
          role: 'user'
        }
      }).as('loginAPI');

      cy.get('[data-testid="username-input"]').type('testuser');
      cy.get('[data-testid="password-input"]').type('password123{enter}');

      // 验证API调用
      cy.wait('@loginAPI');

      // 验证跳转到首页
      cy.url().should('include', '/');
    });

    it('应显示加载状态', () => {
      // 模拟慢速API响应
      cy.intercept('POST', '/v1/api/auth/token', {
        statusCode: 200,
        body: {
          access_token: 'mock-jwt-token',
          token_type: 'bearer',
          expires_in: 604800,
          user_id: 1,
          username: 'testuser',
          role: 'user'
        },
        delay: 1000
      }).as('slowLoginAPI');

      cy.get('[data-testid="username-input"]').type('testuser');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('button[type="submit"]').click();

      // 验证加载状态
      cy.get('button[type="submit"]').should('be.disabled');
      cy.get('[data-testid="loading-spinner"]').should('be.visible');

      // 等待API完成
      cy.wait('@slowLoginAPI');

      // 验证加载状态消失
      cy.get('button[type="submit"]').should('not.be.disabled');
    });

    it('应正确导航到注册页面', () => {
      cy.get('[data-testid="register-link"]').click();
      cy.url().should('include', '/register');
    });

    it('应正确导航到忘记密码页面', () => {
      cy.get('[data-testid="forgot-password-link"]').click();
      cy.url().should('include', '/forgot-password');
    });

    it('应在平板设备上正确显示', () => {
      cy.viewport('ipad-2');
      cy.get('form').should('be.visible');
      cy.get('[data-testid="username-input"]').should('be.visible');
      cy.get('[data-testid="password-input"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('应保持表单数据在页面刷新前', () => {
      cy.get('[data-testid="username-input"]').type('testuser');
      cy.get('[data-testid="password-input"]').type('password123');
      
      // 验证表单数据存在
      cy.get('[data-testid="username-input"]').should('have.value', 'testuser');
      cy.get('[data-testid="password-input"]').should('have.value', 'password123');
    });
  });

  describe('安全性测试', () => {
    it('应清除敏感数据在登录失败后', () => {
      cy.intercept('POST', '/v1/api/auth/token', {
        statusCode: 401,
        body: { detail: '用户名或密码不正确' }
      }).as('loginFailAPI');

      cy.get('[data-testid="username-input"]').type('testuser');
      cy.get('[data-testid="password-input"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginFailAPI');

      // 验证密码字段被清空
      cy.get('[data-testid="password-input"]').should('have.value', '');
    });

    it('应防止重复提交', () => {
      cy.intercept('POST', '/v1/api/auth/token', {
        statusCode: 200,
        body: {
          access_token: 'mock-jwt-token',
          token_type: 'bearer',
          expires_in: 604800,
          user_id: 1,
          username: 'testuser',
          role: 'user'
        },
        delay: 500
      }).as('loginAPI');

      cy.get('[data-testid="username-input"]').type('testuser');
      cy.get('[data-testid="password-input"]').type('password123');
      
      // 快速点击两次提交按钮
      cy.get('button[type="submit"]').click();
      cy.get('button[type="submit"]').click();

      // 验证只有一次API调用
      cy.get('@loginAPI.all').should('have.length', 1);
    });
  });

  describe('无障碍性测试', () => {
    it('应通过无障碍检查', () => {
      cy.checkA11y();
    });

    it('应支持键盘导航', () => {
      // Tab 导航
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'username-input');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'password-input');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'type', 'submit');
    });

    it('应有正确的ARIA标签', () => {
      cy.get('[data-testid="username-input"]').should('have.attr', 'aria-label', '用户名');
      cy.get('[data-testid="password-input"]').should('have.attr', 'aria-label', '密码');
      cy.get('button[type="submit"]').should('have.attr', 'aria-label', '登录');
    });

    it('应在高对比度模式下可见', () => {
      // 模拟高对比度模式
      cy.get('html').invoke('attr', 'style', 'filter: contrast(200%)');
      
      cy.get('form').should('be.visible');
      cy.get('[data-testid="username-input"]').should('be.visible');
      cy.get('[data-testid="password-input"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });
  });
});

  it('应有无障碍属性', () => {
    // 检查表单无障碍性
    cy.get('[data-testid="username-input"]').should('have.attr', 'aria-label');
    cy.get('[data-testid="password-input"]').should('have.attr', 'aria-label');
    cy.get('button[type="submit"]').should('have.attr', 'aria-label');

    // 检查键盘导航
    cy.get('[data-testid="username-input"]').focus();
    cy.get('[data-testid="username-input"]').should('have.focus');
    
    cy.get('[data-testid="username-input"]').tab();
    cy.get('[data-testid="password-input"]').should('have.focus');
    
    cy.get('[data-testid="password-input"]').tab();
    cy.get('button[type="submit"]').should('have.focus');
  });

  it('应在移动设备上正确显示', () => {
    // 设置移动设备视口
    cy.viewport(375, 667);

    cy.get('form').should('be.visible');
    cy.get('[data-testid="username-input"]').should('be.visible');
    cy.get('[data-testid="password-input"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');

    // 验证响应式布局
    cy.get('.loginPage').should('have.css', 'padding');
  });
});
