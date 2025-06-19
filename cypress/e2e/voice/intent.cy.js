describe('意图解析与确认流程', () => {
  beforeEach(() => {
    // 设置登录状态
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'mock-jwt-token');
      win.localStorage.setItem('user_id', '1');
      win.localStorage.setItem('username', 'testuser');
      win.localStorage.setItem('user_role', 'user');
    });
    
    cy.visit('/');
    
    // 设置通用API拦截
    cy.intercept('GET', '/v1/api/tools', {
      statusCode: 200,
      body: {
        tools: [
          {
            tool_id: 'transfer_sol',
            name: 'SOL转账',
            type: 'blockchain',
            description: '在Solana网络上转账SOL'
          },
          {
            tool_id: 'check_balance',
            name: '余额查询',
            type: 'blockchain',
            description: '查询钱包余额'
          }
        ]
      }
    }).as('getTools');
  });

  describe('基础意图解析流程', () => {
    beforeEach(() => {
      cy.intercept('POST', '/v1/api/interpret', {
        statusCode: 200,
        body: {
          type: 'tool_call',
          tool_calls: [{
            tool_id: 'transfer_sol',
            parameters: { recipient: 'Alice', amount: 10, currency: 'SOL' }
          }],
          confirmText: '您要向 Alice 转账 10 SOL，是否确认？',
          sessionId: 'test-session-123'
        }
      }).as('interpretAPI');

      cy.intercept('POST', '/v1/api/execute', {
        statusCode: 200,
        body: {
          success: true,
          toolId: 'transfer_sol',
          data: {
            tts_message: '转账成功！已向 Alice 转账 10 SOL',
            raw_data: { 
              transactionHash: 'mock_tx_123456789',
              status: 'confirmed',
              fee: '0.000005 SOL'
            }
          },
          error: null,
          sessionId: 'test-session-123'
        }
      }).as('executeAPI');
    });

    it('应正确显示意图解析结果', () => {
      // 模拟完成语音录制并触发意图解析
      cy.get('[data-testid="voice-recorder-button"]').click();
      
      // 模拟语音识别完成
      cy.window().then((win) => {
        if (win.mockSpeechResult) {
          win.mockSpeechResult('向Alice转账10个SOL');
        }
      });
      
      cy.get('[data-testid="voice-recorder-button"]').click();
      
      // 验证API调用
      cy.wait('@interpretAPI').then((interception) => {
        expect(interception.request.body).to.have.property('userId', 1);
        expect(interception.request.body.query || interception.request.body.text).to.exist;
      });
      
      // 验证确认对话框显示
      cy.get('[data-testid="confirmation-dialog"]').should('be.visible');
      cy.get('[data-testid="confirmation-text"]').should('contain', '您要向 Alice 转账 10 SOL，是否确认？');
      cy.get('[data-testid="confirm-button"]').should('be.visible');
      cy.get('[data-testid="cancel-button"]').should('be.visible');
    });

    it('确认执行应调用执行API并显示结果', () => {
      // 触发意图解析
      cy.get('[data-testid="voice-recorder-button"]').click();
      cy.window().then((win) => {
        if (win.mockSpeechResult) {
          win.mockSpeechResult('向Alice转账10个SOL');
        }
      });
      cy.get('[data-testid="voice-recorder-button"]').click();
      
      cy.wait('@interpretAPI');
      
      // 点击确认按钮
      cy.get('[data-testid="confirm-button"]').click();
      
      // 验证执行API调用
      cy.wait('@executeAPI').then((interception) => {
        expect(interception.request.body).to.deep.include({
          sessionId: 'test-session-123',
          userId: 1,
          toolId: 'transfer_sol'
        });
        expect(interception.request.body.params).to.deep.equal({
          recipient: 'Alice',
          amount: 10,
          currency: 'SOL'
        });
      });
      
      // 验证结果显示
      cy.get('[data-testid="result-display"]').should('be.visible');
      cy.get('[data-testid="result-message"]').should('contain', '转账成功！已向 Alice 转账 10 SOL');
      cy.get('[data-testid="transaction-hash"]').should('contain', 'mock_tx_123456789');
    });

    it('取消执行应返回初始状态', () => {
      // 触发意图解析
      cy.get('[data-testid="voice-recorder-button"]').click();
      cy.window().then((win) => {
        if (win.mockSpeechResult) {
          win.mockSpeechResult('向Alice转账10个SOL');
        }
      });
      cy.get('[data-testid="voice-recorder-button"]').click();
      
      cy.wait('@interpretAPI');
      
      // 点击取消按钮
      cy.get('[data-testid="cancel-button"]').click();
      
      // 验证返回初始状态
      cy.get('[data-testid="confirmation-dialog"]').should('not.exist');
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
      cy.get('[data-testid="status-bar"]').should('contain', '点击麦克风开始语音交互');
    });
  });

  describe('不同类型的意图处理', () => {
    it('应处理查询类型的意图', () => {
      cy.intercept('POST', '/v1/api/interpret', {
        statusCode: 200,
        body: {
          type: 'tool_call',
          tool_calls: [{
            tool_id: 'check_balance',
            parameters: { wallet_address: 'user_wallet' }
          }],
          confirmText: '要查询您的钱包余额吗？',
          sessionId: 'test-session-456'
        }
      }).as('interpretBalanceAPI');

      cy.intercept('POST', '/v1/api/execute', {
        statusCode: 200,
        body: {
          success: true,
          toolId: 'check_balance',
          data: {
            tts_message: '您的钱包余额为 25.5 SOL',
            raw_data: { 
              balance: 25.5,
              currency: 'SOL',
              usd_value: 510.0
            }
          },
          error: null,
          sessionId: 'test-session-456'
        }
      }).as('executeBalanceAPI');

      // 模拟余额查询语音
      cy.get('[data-testid="voice-recorder-button"]').click();
      cy.window().then((win) => {
        if (win.mockSpeechResult) {
          win.mockSpeechResult('查询我的钱包余额');
        }
      });
      cy.get('[data-testid="voice-recorder-button"]').click();

      cy.wait('@interpretBalanceAPI');
      cy.get('[data-testid="confirm-button"]').click();
      cy.wait('@executeBalanceAPI');

      // 验证余额显示
      cy.get('[data-testid="result-message"]').should('contain', '您的钱包余额为 25.5 SOL');
      cy.get('[data-testid="balance-details"]').should('contain', '$510.0');
    });

    it('应处理直接响应类型的意图', () => {
      cy.intercept('POST', '/v1/api/interpret', {
        statusCode: 200,
        body: {
          type: 'direct_response',
          message: '您好！我是您的语音助手，有什么可以帮助您的吗？',
          sessionId: 'test-session-789'
        }
      }).as('interpretDirectAPI');

      // 模拟问候语音
      cy.get('[data-testid="voice-recorder-button"]').click();
      cy.window().then((win) => {
        if (win.mockSpeechResult) {
          win.mockSpeechResult('你好');
        }
      });
      cy.get('[data-testid="voice-recorder-button"]').click();

      cy.wait('@interpretDirectAPI');

      // 验证直接响应显示
      cy.get('[data-testid="direct-response"]').should('be.visible');
      cy.get('[data-testid="response-message"]').should('contain', '您好！我是您的语音助手');
      
      // 应该没有确认对话框
      cy.get('[data-testid="confirmation-dialog"]').should('not.exist');
    });
  });

  describe('错误处理场景', () => {
    it('应处理意图解析失败', () => {
      cy.intercept('POST', '/v1/api/interpret', {
        statusCode: 400,
        body: {
          error: {
            code: 'INVALID_PARAM',
            message: '无法理解您的意图，请重新描述'
          }
        }
      }).as('interpretErrorAPI');

      cy.get('[data-testid="voice-recorder-button"]').click();
      cy.window().then((win) => {
        if (win.mockSpeechResult) {
          win.mockSpeechResult('模糊的语音内容');
        }
      });
      cy.get('[data-testid="voice-recorder-button"]').click();

      cy.wait('@interpretErrorAPI');

      // 验证错误提示
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.get('[data-testid="error-message"]').should('contain', '无法理解您的意图，请重新描述');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('应处理工具执行失败', () => {
      cy.intercept('POST', '/v1/api/interpret', {
        statusCode: 200,
        body: {
          type: 'tool_call',
          tool_calls: [{
            tool_id: 'transfer_sol',
            parameters: { recipient: 'Alice', amount: 10000 }
          }],
          confirmText: '您要向 Alice 转账 10000 SOL，是否确认？',
          sessionId: 'test-session-error'
        }
      }).as('interpretAPI');

      cy.intercept('POST', '/v1/api/execute', {
        statusCode: 200,
        body: {
          success: false,
          toolId: 'transfer_sol',
          data: null,
          error: {
            code: 'INSUFFICIENT_BALANCE',
            message: '余额不足，无法完成转账'
          },
          sessionId: 'test-session-error'
        }
      }).as('executeErrorAPI');

      cy.get('[data-testid="voice-recorder-button"]').click();
      cy.window().then((win) => {
        if (win.mockSpeechResult) {
          win.mockSpeechResult('向Alice转账10000个SOL');
        }
      });
      cy.get('[data-testid="voice-recorder-button"]').click();

      cy.wait('@interpretAPI');
      cy.get('[data-testid="confirm-button"]').click();
      cy.wait('@executeErrorAPI');

      // 验证错误显示
      cy.get('[data-testid="execution-error"]').should('be.visible');
      cy.get('[data-testid="error-message"]').should('contain', '余额不足，无法完成转账');
    });

    it('应处理网络超时', () => {
      cy.intercept('POST', '/v1/api/interpret', { forceNetworkError: true }).as('networkError');

      cy.get('[data-testid="voice-recorder-button"]').click();
      cy.window().then((win) => {
        if (win.mockSpeechResult) {
          win.mockSpeechResult('测试网络错误');
        }
      });
      cy.get('[data-testid="voice-recorder-button"]').click();

      cy.wait('@networkError');

      // 验证网络错误提示
      cy.get('[data-testid="error-message"]').should('contain', '网络连接失败');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });
  });

  describe('状态管理和会话', () => {
    it('应正确管理会话状态', () => {
      cy.intercept('POST', '/v1/api/interpret', {
        statusCode: 200,
        body: {
          type: 'tool_call',
          tool_calls: [{
            tool_id: 'transfer_sol',
            parameters: { recipient: 'Bob', amount: 5 }
          }],
          confirmText: '您要向 Bob 转账 5 SOL，是否确认？',
          sessionId: 'session-state-test'
        }
      }).as('interpretAPI');

      cy.get('[data-testid="voice-recorder-button"]').click();
      cy.window().then((win) => {
        if (win.mockSpeechResult) {
          win.mockSpeechResult('向Bob转账5个SOL');
        }
      });
      cy.get('[data-testid="voice-recorder-button"]').click();

      cy.wait('@interpretAPI');

      // 验证会话ID在本地存储
      cy.window().then((win) => {
        const sessionData = JSON.parse(win.sessionStorage.getItem('currentSession') || '{}');
        expect(sessionData.sessionId).to.equal('session-state-test');
      });
    });

    it('应支持多轮对话', () => {
      // 第一轮对话
      cy.intercept('POST', '/v1/api/interpret', {
        statusCode: 200,
        body: {
          type: 'tool_call',
          tool_calls: [{
            tool_id: 'transfer_sol',
            parameters: { recipient: 'Charlie', amount: 15 }
          }],
          confirmText: '您要向 Charlie 转账 15 SOL，是否确认？',
          sessionId: 'multi-turn-session'
        }
      }).as('firstInterpret');

      cy.get('[data-testid="voice-recorder-button"]').click();
      cy.window().then((win) => {
        if (win.mockSpeechResult) {
          win.mockSpeechResult('向Charlie转账15个SOL');
        }
      });
      cy.get('[data-testid="voice-recorder-button"]').click();

      cy.wait('@firstInterpret');
      cy.get('[data-testid="cancel-button"]').click();

      // 第二轮对话应保持会话
      cy.intercept('POST', '/v1/api/interpret', (req) => {
        expect(req.body.sessionId).to.equal('multi-turn-session');
        req.reply({
          statusCode: 200,
          body: {
            type: 'direct_response',
            message: '好的，已取消转账操作',
            sessionId: 'multi-turn-session'
          }
        });
      }).as('secondInterpret');

      cy.get('[data-testid="voice-recorder-button"]').click();
      cy.window().then((win) => {
        if (win.mockSpeechResult) {
          win.mockSpeechResult('取消刚才的操作');
        }
      });
      cy.get('[data-testid="voice-recorder-button"]').click();

      cy.wait('@secondInterpret');
    });
  });

  describe('用户体验优化', () => {
    it('应显示适当的加载状态', () => {
      cy.intercept('POST', '/v1/api/interpret', {
        delay: 2000,
        statusCode: 200,
        body: {
          type: 'direct_response',
          message: '处理完成',
          sessionId: 'loading-test'
        }
      }).as('slowInterpret');

      cy.get('[data-testid="voice-recorder-button"]').click();
      cy.window().then((win) => {
        if (win.mockSpeechResult) {
          win.mockSpeechResult('测试加载状态');
        }
      });
      cy.get('[data-testid="voice-recorder-button"]').click();

      // 验证加载状态
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
      cy.get('[data-testid="status-bar"]').should('contain', '正在分析意图');

      cy.wait('@slowInterpret');

      // 加载完成后应隐藏加载状态
      cy.get('[data-testid="loading-spinner"]').should('not.exist');
    });

    it('应提供重试功能', () => {
      cy.intercept('POST', '/v1/api/interpret', {
        statusCode: 500,
        body: { error: { message: '服务器错误' } }
      }).as('errorAPI');

      cy.get('[data-testid="voice-recorder-button"]').click();
      cy.window().then((win) => {
        if (win.mockSpeechResult) {
          win.mockSpeechResult('测试重试功能');
        }
      });
      cy.get('[data-testid="voice-recorder-button"]').click();

      cy.wait('@errorAPI');

      // 设置成功的重试响应
      cy.intercept('POST', '/v1/api/interpret', {
        statusCode: 200,
        body: {
          type: 'direct_response',
          message: '重试成功',
          sessionId: 'retry-test'
        }
      }).as('retryAPI');

      // 点击重试
      cy.get('[data-testid="retry-button"]').click();
      cy.wait('@retryAPI');

      // 验证重试成功
      cy.get('[data-testid="response-message"]').should('contain', '重试成功');
    });
  });
});
