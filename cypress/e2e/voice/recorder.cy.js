describe('语音录制功能', () => {
  beforeEach(() => {
    // 设置API拦截
    cy.intercept('POST', '/v1/api/interpret', {
      statusCode: 200,
      body: {
        type: 'tool_call',
        tool_calls: [{
          tool_id: 'transfer_sol',
          parameters: { recipient: 'Alice', amount: 10 }
        }],
        confirmText: '您要向 Alice 转账 10 SOL，是否确认？',
        sessionId: 'test-session-123'
      }
    }).as('interpretAPI');

    // 登录状态设置
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'mock-jwt-token');
      win.localStorage.setItem('user_id', '1');
      win.localStorage.setItem('username', 'testuser');
      win.localStorage.setItem('user_role', 'user');
    });
    
    cy.visit('/');
    
    // 模拟Web Speech API
    cy.window().then((win) => {
      let mockRecognition = {
        continuous: true,
        interimResults: true,
        lang: 'zh-CN',
        start: cy.stub().as('recognitionStart'),
        stop: cy.stub().as('recognitionStop'),
        addEventListener: cy.stub(),
        removeEventListener: cy.stub(),
        onresult: null,
        onerror: null,
        onstart: null,
        onend: null
      };

      win.SpeechRecognition = function() { return mockRecognition; };
      win.webkitSpeechRecognition = win.SpeechRecognition;
      
      // 模拟语音识别结果
      win.mockSpeechResult = (transcript) => {
        if (mockRecognition.onresult) {
          const mockEvent = {
            results: [{
              [0]: { transcript, confidence: 0.9 },
              isFinal: true
            }],
            resultIndex: 0
          };
          mockRecognition.onresult(mockEvent);
        }
      };
    });
  });

  describe('基础录音功能', () => {
    it('应正确显示录音按钮和初始状态', () => {
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
      cy.get('[data-testid="voice-recorder-button"]').should('contain', '开始录音');
      cy.get('[data-testid="status-bar"]').should('contain', '点击麦克风开始语音交互');
    });

    it('点击按钮应开始录音并更新UI状态', () => {
      cy.get('[data-testid="voice-recorder-button"]').click();
      
      // 验证录音状态
      cy.get('@recognitionStart').should('have.been.called');
      cy.get('[data-testid="voice-recorder-button"]').should('contain', '停止录音');
      cy.get('[data-testid="voice-recorder-button"]').should('have.class', 'recording');
      cy.get('[data-testid="status-bar"]').should('contain', '正在录音');
    });

    it('再次点击按钮应停止录音', () => {
      cy.get('[data-testid="voice-recorder-button"]').click();
      cy.get('[data-testid="voice-recorder-button"]').click();
      
      // 验证停止录音
      cy.get('@recognitionStop').should('have.been.called');
      cy.get('[data-testid="voice-recorder-button"]').should('contain', '开始录音');
      cy.get('[data-testid="voice-recorder-button"]').should('not.have.class', 'recording');
    });
  });

  describe('语音识别流程', () => {
    it('应正确处理语音识别结果', () => {
      cy.get('[data-testid="voice-recorder-button"]').click();
      
      // 模拟语音识别结果
      cy.window().then((win) => {
        win.mockSpeechResult('向Alice转账10个SOL');
      });
      
      // 停止录音触发处理
      cy.get('[data-testid="voice-recorder-button"]').click();
      
      // 验证API调用
      cy.wait('@interpretAPI').then((interception) => {
        expect(interception.request.body).to.have.property('query', '向Alice转账10个SOL');
        expect(interception.request.body).to.have.property('userId', 1);
      });
      
      // 验证UI更新
      cy.get('[data-testid="status-bar"]').should('contain', '正在分析意图');
    });

    it('应处理空的语音识别结果', () => {
      cy.get('[data-testid="voice-recorder-button"]').click();
      
      // 模拟空结果
      cy.window().then((win) => {
        win.mockSpeechResult('');
      });
      
      cy.get('[data-testid="voice-recorder-button"]').click();
      
      // 应显示提示消息
      cy.get('[data-testid="status-bar"]').should('contain', '未识别到语音，请重试');
    });
  });

  describe('错误处理', () => {
    it('应处理语音识别错误', () => {
      cy.window().then((win) => {
        // 模拟语音识别错误
        win.SpeechRecognition = function() {
          return {
            start: () => {
              setTimeout(() => {
                if (this.onerror) {
                  this.onerror({ error: 'not-allowed' });
                }
              }, 100);
            },
            stop: cy.stub(),
            addEventListener: cy.stub(),
            removeEventListener: cy.stub(),
            onerror: null
          };
        };
      });
      
      cy.get('[data-testid="voice-recorder-button"]').click();
      
      // 应显示错误消息
      cy.get('[data-testid="status-bar"]').should('contain', '无法访问麦克风');
      cy.get('[data-testid="voice-recorder-button"]').should('not.have.class', 'recording');
    });

    it('应处理API调用失败', () => {
      // 设置API失败响应
      cy.intercept('POST', '/v1/api/interpret', {
        statusCode: 500,
        body: { error: { message: '服务器内部错误' } }
      }).as('interpretAPIError');
      
      cy.get('[data-testid="voice-recorder-button"]').click();
      
      cy.window().then((win) => {
        win.mockSpeechResult('测试语音');
      });
      
      cy.get('[data-testid="voice-recorder-button"]').click();
      
      cy.wait('@interpretAPIError');
      
      // 应显示错误消息
      cy.get('[data-testid="status-bar"]').should('contain', '分析失败，请重试');
    });
  });

  describe('浏览器兼容性', () => {
    it('应处理不支持语音识别的浏览器', () => {
      cy.window().then((win) => {
        delete win.SpeechRecognition;
        delete win.webkitSpeechRecognition;
      });
      
      cy.reload();
      
      // 应显示不支持的提示
      cy.get('[data-testid="voice-recorder-button"]').should('be.disabled');
      cy.get('[data-testid="status-bar"]').should('contain', '您的浏览器不支持语音识别');
    });
  });

  describe('响应式设计', () => {
    it('应在移动设备上正确显示', () => {
      cy.viewport('iphone-x');
      
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
      cy.get('[data-testid="voice-recorder-button"]').should('have.css', 'width').and('match', /\d+px/);
      
      // 验证按钮在小屏幕上的大小
      cy.get('[data-testid="voice-recorder-button"]').then(($btn) => {
        expect($btn.width()).to.be.greaterThan(60);
        expect($btn.height()).to.be.greaterThan(60);
      });
    });

    it('应在平板设备上正确显示', () => {
      cy.viewport('ipad-2');
      
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
      cy.get('[data-testid="status-bar"]').should('be.visible');
    });
  });

  describe('无障碍性', () => {
    it('应具有正确的ARIA属性', () => {
      cy.get('[data-testid="voice-recorder-button"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="voice-recorder-button"]').should('have.attr', 'role', 'button');
    });

    it('应支持键盘导航', () => {
      cy.get('[data-testid="voice-recorder-button"]').focus();
      cy.get('[data-testid="voice-recorder-button"]').should('have.focus');
      
      // 空格键应触发录音
      cy.get('[data-testid="voice-recorder-button"]').type(' ');
      cy.get('@recognitionStart').should('have.been.called');
    });

    it('应提供适当的状态反馈', () => {
      cy.get('[data-testid="voice-recorder-button"]').click();
      
      // 检查状态更新
      cy.get('[data-testid="voice-recorder-button"]').should('have.attr', 'aria-pressed', 'true');
      cy.get('[data-testid="status-bar"]').should('have.attr', 'aria-live', 'polite');
    });
  });
});
