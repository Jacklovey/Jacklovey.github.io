describe('语音交互集成测试', () => {
  beforeEach(() => {
    // 设置登录状态
    cy.login('testuser', 'password123');
    
    // 模拟语音API
    cy.mockSpeechAPI();
    
    // 设置API拦截
    cy.intercept('POST', '/v1/api/interpret', {
      statusCode: 200,
      body: {
        type: 'tool_use',
        toolId: 'maps_weather',
        params: { city: '上海' },
        confirmation: '您想查询上海的天气吗？',
        sessionId: 'integration-test-123'
      }
    }).as('interpretAPI');
    
    cy.intercept('POST', '/v1/api/execute', {
      statusCode: 200,
      body: {
        success: true,
        toolId: 'maps_weather',
        data: {
          tts_message: '上海今天多云，气温20到28度',
          raw_data: {
            temperature: 24,
            condition: 'cloudy',
            humidity: 65,
            windSpeed: '5km/h'
          }
        },
        sessionId: 'integration-test-123'
      }
    }).as('executeAPI');
    
    cy.visit('/');
  });

  describe('完整语音交互流程', () => {
    it('应完成从语音输入到结果展示的完整流程', () => {
      // 1. 验证初始状态
      cy.get('[data-testid="status-bar"]').should('contain', '点击麦克风开始语音交互');
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
      
      // 2. 开始录音
      cy.get('[data-testid="voice-recorder-button"]').click();
      cy.get('[data-testid="status-bar"]').should('contain', '正在录音');
      
      // 3. 模拟语音输入
      cy.simulateVoiceInput('查询上海天气');
      
      // 4. 验证意图解析API调用
      cy.wait('@interpretAPI').its('request.body').should('deep.include', {
        text: '查询上海天气'
      });
      
      // 5. 验证进入确认阶段
      cy.get('[data-testid="status-bar"]').should('contain', '请确认您的请求');
      cy.get('[data-testid="confirmation-text"]').should('contain', '您想查询上海的天气吗？');
      
      // 6. 验证TTS播放确认信息
      cy.get('@speechSynthesisSpeak').should('have.been.called');
      
      // 7. 确认请求
      cy.simulateVoiceInput('确认');
      
      // 8. 验证工具执行API调用
      cy.wait('@executeAPI').its('request.body').should('deep.include', {
        toolId: 'maps_weather',
        params: { city: '上海' }
      });
      
      // 9. 验证结果展示
      cy.get('[data-testid="result-card"]').should('be.visible');
      cy.get('[data-testid="result-content"]').should('contain', '上海今天多云，气温20到28度');
      
      // 10. 验证TTS播放结果
      cy.get('@speechSynthesisSpeak').should('have.been.calledTwice');
      
      // 11. 验证返回初始状态
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
      cy.get('[data-testid="status-bar"]').should('contain', '点击麦克风开始语音交互');
    });

    it('应正确处理取消流程', () => {
      // 1. 开始语音交互
      cy.simulateVoiceInput('查询北京天气');
      cy.wait('@interpretAPI');
      
      // 2. 验证确认阶段
      cy.get('[data-testid="confirmation-text"]').should('be.visible');
      
      // 3. 取消请求
      cy.simulateVoiceInput('取消');
      
      // 4. 验证返回初始状态
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
      cy.get('[data-testid="status-bar"]').should('contain', '点击麦克风开始语音交互');
      cy.get('[data-testid="confirmation-text"]').should('not.exist');
    });

    it('应处理多轮对话', () => {
      // 第一轮对话
      cy.simulateVoiceInput('查询上海天气');
      cy.wait('@interpretAPI');
      cy.simulateVoiceInput('确认');
      cy.wait('@executeAPI');
      
      // 验证第一轮结果
      cy.get('[data-testid="result-card"]').should('be.visible');
      
      // 第二轮对话
      cy.intercept('POST', '/v1/api/interpret', {
        statusCode: 200,
        body: {
          type: 'tool_use',
          toolId: 'maps_weather',
          params: { city: '北京' },
          confirmation: '您想查询北京的天气吗？',
          sessionId: 'integration-test-123'
        }
      }).as('interpretAPI2');
      
      cy.simulateVoiceInput('查询北京天气');
      cy.wait('@interpretAPI2');
      cy.simulateVoiceInput('确认');
      cy.wait('@executeAPI');
      
      // 验证会话状态保持
      cy.get('[data-testid="session-history"]').should('contain', '上海');
      cy.get('[data-testid="session-history"]').should('contain', '北京');
    });
  });

  describe('错误处理集成', () => {
    it('应处理意图解析失败', () => {
      cy.intercept('POST', '/v1/api/interpret', {
        statusCode: 400,
        body: { detail: '无法理解您的请求' }
      }).as('interpretErrorAPI');
      
      cy.simulateVoiceInput('随机无意义的文本xyzabc');
      
      cy.wait('@interpretErrorAPI');
      
      // 验证错误处理
      cy.get('[data-testid="error-message"]').should('contain', '无法理解您的请求');
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
    });

    it('应处理工具执行失败', () => {
      cy.intercept('POST', '/v1/api/execute', {
        statusCode: 500,
        body: { detail: '工具执行失败' }
      }).as('executeErrorAPI');
      
      cy.simulateVoiceInput('查询上海天气');
      cy.wait('@interpretAPI');
      cy.simulateVoiceInput('确认');
      
      cy.wait('@executeErrorAPI');
      
      // 验证错误处理
      cy.get('[data-testid="error-message"]').should('contain', '工具执行失败');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('应处理网络连接问题', () => {
      cy.intercept('POST', '/v1/api/interpret', { forceNetworkError: true }).as('networkError');
      
      cy.simulateVoiceInput('测试网络错误');
      
      cy.wait('@networkError');
      
      // 验证网络错误处理
      cy.get('[data-testid="error-message"]').should('contain', '网络连接失败');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });
  });

  describe('状态管理集成', () => {
    it('应正确管理会话状态', () => {
      // 验证初始会话状态
      cy.window().then((win) => {
        const sessionData = JSON.parse(win.localStorage.getItem('session_data') || '{}');
        expect(sessionData.sessionId).to.exist;
      });
      
      // 执行语音交互
      cy.simulateVoiceInput('查询上海天气');
      cy.wait('@interpretAPI');
      cy.simulateVoiceInput('确认');
      cy.wait('@executeAPI');
      
      // 验证会话状态更新
      cy.window().then((win) => {
        const sessionData = JSON.parse(win.localStorage.getItem('session_data') || '{}');
        expect(sessionData.history).to.have.length.greaterThan(0);
        expect(sessionData.lastInteraction).to.exist;
      });
    });

    it('应在页面刷新后保持状态', () => {
      // 执行一次交互
      cy.simulateVoiceInput('查询上海天气');
      cy.wait('@interpretAPI');
      cy.simulateVoiceInput('确认');
      cy.wait('@executeAPI');
      
      // 刷新页面
      cy.reload();
      
      // 验证状态恢复
      cy.get('[data-testid="session-history"]').should('exist');
      cy.get('[data-testid="last-result"]').should('be.visible');
    });

    it('应正确处理并发状态更新', () => {
      // 快速连续发起多个请求
      cy.simulateVoiceInput('第一个请求');
      cy.simulateVoiceInput('第二个请求');
      cy.simulateVoiceInput('第三个请求');
      
      // 验证只有最新的请求被处理
      cy.get('[data-testid="confirmation-text"]').should('contain', '第三个请求');
      
      // 验证状态一致性
      cy.get('[data-testid="status-bar"]').should('contain', '请确认您的请求');
    });
  });

  describe('主题系统集成', () => {
    it('应在不同主题下正常工作', () => {
      // 切换到深色主题
      cy.get('[data-testid="theme-toggle"]').click();
      
      // 验证主题切换
      cy.get('html').should('have.attr', 'data-theme', 'dark');
      
      // 验证语音功能在深色主题下正常工作
      cy.simulateVoiceInput('测试深色主题');
      cy.wait('@interpretAPI');
      
      cy.get('[data-testid="confirmation-text"]').should('be.visible');
      
      // 切换回浅色主题
      cy.get('[data-testid="theme-toggle"]').click();
      cy.get('html').should('have.attr', 'data-theme', 'light');
    });
  });

  describe('响应式设计集成', () => {
    it('应在移动设备上完整工作', () => {
      cy.viewport('iphone-6');
      
      // 验证移动端布局
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
      cy.get('[data-testid="status-bar"]').should('be.visible');
      
      // 执行完整交互流程
      cy.simulateVoiceInput('移动端测试');
      cy.wait('@interpretAPI');
      cy.simulateVoiceInput('确认');
      cy.wait('@executeAPI');
      
      // 验证结果在移动端正确显示
      cy.get('[data-testid="result-card"]').should('be.visible');
    });

    it('应在平板设备上正确工作', () => {
      cy.viewport('ipad-2');
      
      // 验证平板端布局
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
      
      // 执行语音交互
      cy.simulateVoiceInput('平板端测试');
      cy.wait('@interpretAPI');
      cy.simulateVoiceInput('确认');
      cy.wait('@executeAPI');
      
      // 验证结果显示
      cy.get('[data-testid="result-card"]').should('be.visible');
    });
  });

  describe('性能集成测试', () => {
    it('完整流程应在合理时间内完成', () => {
      const startTime = Date.now();
      
      // 执行完整语音交互流程
      cy.simulateVoiceInput('性能测试查询');
      cy.wait('@interpretAPI');
      cy.simulateVoiceInput('确认');
      cy.wait('@executeAPI');
      
      cy.then(() => {
        const totalTime = Date.now() - startTime;
        // 完整流程应在10秒内完成
        expect(totalTime).to.be.lessThan(10000);
      });
    });

    it('并发操作应正确处理', () => {
      // 快速执行多个操作
      cy.get('[data-testid="theme-toggle"]').click();
      cy.simulateVoiceInput('并发测试');
      cy.get('[data-testid="settings-button"]').click();
      
      // 验证应用状态稳定
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
      cy.get('[data-testid="status-bar"]').should('exist');
    });
  });

  describe('无障碍性集成', () => {
    beforeEach(() => {
      cy.injectAxe();
    });

    it('完整流程应符合无障碍标准', () => {
      // 检查初始状态无障碍性
      cy.checkA11y();
      
      // 执行语音交互
      cy.simulateVoiceInput('无障碍测试');
      cy.wait('@interpretAPI');
      
      // 检查确认阶段无障碍性
      cy.checkA11y();
      
      cy.simulateVoiceInput('确认');
      cy.wait('@executeAPI');
      
      // 检查结果显示阶段无障碍性
      cy.checkA11y();
    });

    it('应支持键盘导航完整流程', () => {
      // 使用键盘导航到录音按钮
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'voice-recorder-button');
      
      // 使用键盘激活录音
      cy.focused().type('{enter}');
      
      // 验证状态变化
      cy.get('[data-testid="status-bar"]').should('contain', '正在录音');
    });
  });
});
