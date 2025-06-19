describe('意图解析与确认流程', () => {
  beforeEach(() => {
    // 登录
    cy.login('testuser', 'password123');
    
    // 访问首页
    cy.visit('/');
    
    // 模拟语音API
    cy.mockSpeechAPI();
    
    // 模拟后端API
    cy.intercept('POST', '/v1/api/interpret', {
      statusCode: 200,
      body: {
        type: 'tool_call',
        tool_calls: [{
          tool_id: 'maps_weather',
          parameters: { city: '上海' }
        }],
        confirmText: '您想查询上海的天气吗？',
        sessionId: 'test-session-123'
      }
    }).as('interpretAPI');
  });
  
  it('语音输入后应调用意图解析API', () => {
    // 模拟语音输入
    cy.simulateVoiceInput('查询上海天气');
    
    // 验证API调用
    cy.wait('@interpretAPI').its('request.body').should('deep.include', {
      text: '查询上海天气'
    });
    
    // 验证状态变化为确认阶段
    cy.get('[data-testid="status-bar"]').should('contain', '请确认您的请求');
  });
  
  it('应显示确认文本并播放语音', () => {
    // 模拟语音输入
    cy.simulateVoiceInput('查询上海天气');
    
    // 验证确认文本显示
    cy.get('[data-testid="confirmation-text"]').should('be.visible');
    cy.get('[data-testid="confirmation-text"]').should('contain', '您想查询上海的天气吗？');
    
    // 验证TTS调用
    cy.get('@speechSynthesisSpeak').should('have.been.called');
  });
  
  it('确认后应调用执行API', () => {
    // 模拟语音输入
    cy.simulateVoiceInput('查询上海天气');
    
    // 模拟执行API
    cy.intercept('POST', '/v1/api/execute', {
      statusCode: 200,
      body: {
        success: true,
        toolId: 'maps_weather',
        data: {
          tts_message: '上海今天多云，气温20到28度',
          raw_data: { temperature: 24, weather: 'cloudy' }
        },
        sessionId: 'test-session-123'
      }
    }).as('executeAPI');
    
    // 模拟确认响应
    cy.simulateVoiceInput('确认');
    
    // 验证执行API调用
    cy.wait('@executeAPI').its('request.body').should('deep.include', {
      toolId: 'maps_weather',
      params: { city: '上海' }
    });
    
    // 验证状态变化为执行阶段
    cy.get('[data-testid="status-bar"]').should('contain', '正在执行');
  });
  
  it('取消后应返回初始状态', () => {
    // 模拟语音输入
    cy.simulateVoiceInput('查询上海天气');
    
    // 模拟取消响应
    cy.simulateVoiceInput('取消');
    
    // 验证返回初始状态
    cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
    cy.get('[data-testid="status-bar"]').should('contain', '点击麦克风开始语音交互');
  });

  it('应处理复杂的多参数意图', () => {
    // 模拟复杂意图API响应
    cy.intercept('POST', '/v1/api/interpret', {
      statusCode: 200,
      body: {
        type: 'tool_call',
        tool_calls: [{
          tool_id: 'crypto_transfer',
          parameters: { 
            recipient: 'Alice',
            amount: 10,
            token: 'SOL'
          }
        }],
        confirmText: '您要向 Alice 转账 10 SOL，是否确认？',
        sessionId: 'test-session-456'
      }
    }).as('complexIntentAPI');

    cy.simulateVoiceInput('向Alice转账10个SOL');
    
    cy.wait('@complexIntentAPI');
    
    // 验证复杂确认文本显示
    cy.get('[data-testid="confirmation-text"]').should('contain', '您要向 Alice 转账 10 SOL，是否确认？');
    
    // 验证参数显示
    cy.get('[data-testid="intent-parameters"]').should('be.visible');
    cy.get('[data-testid="parameter-recipient"]').should('contain', 'Alice');
    cy.get('[data-testid="parameter-amount"]').should('contain', '10');
    cy.get('[data-testid="parameter-token"]').should('contain', 'SOL');
  });

  it('应处理意图解析失败', () => {
    // 模拟意图解析失败
    cy.intercept('POST', '/v1/api/interpret', {
      statusCode: 200,
      body: {
        type: 'clarification',
        message: '抱歉，我没有理解您的意思，请重新描述',
        sessionId: 'test-session-789'
      }
    }).as('failedIntentAPI');

    cy.simulateVoiceInput('这是一段不清楚的语音');
    
    cy.wait('@failedIntentAPI');
    
    // 验证澄清消息显示
    cy.get('[data-testid="clarification-message"]').should('be.visible');
    cy.get('[data-testid="clarification-message"]').should('contain', '抱歉，我没有理解您的意思');
    
    // 验证可以重新录音
    cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
    cy.get('[data-testid="voice-recorder-button"]').should('have.text', '录音');
  });

  it('应处理多轮对话', () => {
    // 第一轮：初始查询
    cy.simulateVoiceInput('查询天气');
    
    // 模拟需要澄清的响应
    cy.intercept('POST', '/v1/api/interpret', {
      statusCode: 200,
      body: {
        type: 'clarification',
        message: '请问您要查询哪个城市的天气？',
        sessionId: 'test-session-multi'
      }
    }).as('clarificationAPI');

    cy.wait('@clarificationAPI');
    
    // 第二轮：提供城市信息
    cy.intercept('POST', '/v1/api/interpret', {
      statusCode: 200,
      body: {
        type: 'tool_call',
        tool_calls: [{
          tool_id: 'maps_weather',
          parameters: { city: '北京' }
        }],
        confirmText: '您想查询北京的天气吗？',
        sessionId: 'test-session-multi'
      }
    }).as('secondIntentAPI');

    cy.simulateVoiceInput('北京');
    
    cy.wait('@secondIntentAPI');
    
    // 验证最终确认
    cy.get('[data-testid="confirmation-text"]').should('contain', '您想查询北京的天气吗？');
  });

  it('应处理网络错误', () => {
    // 模拟网络错误
    cy.intercept('POST', '/v1/api/interpret', {
      forceNetworkError: true
    }).as('networkErrorAPI');

    cy.simulateVoiceInput('查询天气');
    
    cy.wait('@networkErrorAPI');
    
    // 验证网络错误提示
    cy.get('[data-testid="error-message"]').should('contain', '网络连接失败');
    cy.get('[data-testid="retry-button"]').should('be.visible');
  });

  it('应支持重试机制', () => {
    // 第一次失败
    cy.intercept('POST', '/v1/api/interpret', {
      statusCode: 500,
      body: { error: '服务器错误' }
    }).as('firstFailAPI');

    cy.simulateVoiceInput('查询天气');
    cy.wait('@firstFailAPI');
    
    // 第二次成功
    cy.intercept('POST', '/v1/api/interpret', {
      statusCode: 200,
      body: {
        type: 'tool_call',
        tool_calls: [{
          tool_id: 'maps_weather',
          parameters: { city: '上海' }
        }],
        confirmText: '您想查询上海的天气吗？',
        sessionId: 'test-session-retry'
      }
    }).as('retrySuccessAPI');

    // 点击重试按钮
    cy.get('[data-testid="retry-button"]').click();
    
    cy.wait('@retrySuccessAPI');
    
    // 验证重试成功
    cy.get('[data-testid="confirmation-text"]').should('be.visible');
  });

  it('应正确处理按钮点击确认', () => {
    cy.simulateVoiceInput('查询上海天气');
    
    // 模拟执行API
    cy.intercept('POST', '/v1/api/execute', {
      statusCode: 200,
      body: {
        success: true,
        toolId: 'maps_weather',
        data: {
          tts_message: '上海今天多云，气温20到28度',
          raw_data: { temperature: 24 }
        }
      }
    }).as('executeViaButtonAPI');
    
    // 点击确认按钮而不是语音确认
    cy.get('[data-testid="confirm-button"]').click();
    
    cy.wait('@executeViaButtonAPI');
    
    // 验证执行成功
    cy.get('[data-testid="result-display"]').should('be.visible');
    cy.get('[data-testid="result-message"]').should('contain', '上海今天多云，气温20到28度');
  });

  it('应正确处理按钮点击取消', () => {
    cy.simulateVoiceInput('查询上海天气');
    
    // 点击取消按钮
    cy.get('[data-testid="cancel-button"]').click();
    
    // 验证返回初始状态
    cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
    cy.get('[data-testid="status-bar"]').should('contain', '已取消操作');
  });

  it('应支持快捷确认词汇', () => {
    cy.simulateVoiceInput('查询上海天气');
    
    cy.intercept('POST', '/v1/api/execute', {
      statusCode: 200,
      body: {
        success: true,
        toolId: 'maps_weather',
        data: {
          tts_message: '上海今天多云，气温20到28度'
        }
      }
    }).as('executeQuickAPI');
    
    // 测试不同的确认词汇
    const confirmWords = ['是的', '对', '好的', '确认', '可以'];
    
    confirmWords.forEach((word, index) => {
      if (index > 0) {
        // 重新开始流程
        cy.simulateVoiceInput('查询上海天气');
      }
      
      cy.simulateVoiceInput(word);
      cy.wait('@executeQuickAPI');
      
      // 验证确认成功
      cy.get('[data-testid="result-display"]').should('be.visible');
      
      if (index < confirmWords.length - 1) {
        // 重置状态准备下次测试
        cy.get('[data-testid="reset-button"]').click();
      }
    });
  });

  it('应支持快捷取消词汇', () => {
    const cancelWords = ['不', '取消', '算了', '不要', '停止'];
    
    cancelWords.forEach((word, index) => {
      cy.simulateVoiceInput('查询上海天气');
      cy.simulateVoiceInput(word);
      
      // 验证取消成功
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
      cy.get('[data-testid="status-bar"]').should('contain', '已取消操作');
    });
  });

  it('应处理超时情况', () => {
    cy.simulateVoiceInput('查询上海天气');
    
    // 等待超时（假设超时时间是30秒）
    cy.wait(31000);
    
    // 验证超时处理
    cy.get('[data-testid="timeout-message"]').should('be.visible');
    cy.get('[data-testid="timeout-message"]').should('contain', '等待确认超时');
    
    // 验证自动返回初始状态
    cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
  });
});
