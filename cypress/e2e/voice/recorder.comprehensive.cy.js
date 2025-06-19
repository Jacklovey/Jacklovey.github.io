describe('语音录制功能', () => {
  beforeEach(() => {
    // 登录
    cy.login('testuser', 'password123');
    
    // 访问首页
    cy.visit('/');
    
    // 模拟浏览器语音API
    cy.mockSpeechAPI();
  });
  
  it('应正确显示录音按钮', () => {
    cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
    cy.get('[data-testid="voice-recorder-button"]').should('have.text', '录音');
    
    // 检查无障碍性
    cy.checkA11y('[data-testid="voice-recorder-button"]');
  });
  
  it('点击按钮应开始录音', () => {
    cy.get('[data-testid="voice-recorder-button"]').click();
    
    // 验证调用了语音API的start方法
    cy.get('@recognitionStart').should('have.been.called');
    
    // 验证按钮状态变化
    cy.get('[data-testid="voice-recorder-button"]').should('have.text', '停止');
    cy.get('[data-testid="voice-recorder-button"]').should('have.class', 'recording');
    
    // 验证状态栏显示
    cy.get('[data-testid="status-bar"]').should('contain', '正在录音');
  });
  
  it('再次点击按钮应停止录音', () => {
    // 先开始录音
    cy.get('[data-testid="voice-recorder-button"]').click();
    
    // 再停止录音
    cy.get('[data-testid="voice-recorder-button"]').click();
    
    // 验证调用了语音API的stop方法
    cy.get('@recognitionStop').should('have.been.called');
    
    // 验证按钮状态恢复
    cy.get('[data-testid="voice-recorder-button"]').should('have.text', '录音');
    cy.get('[data-testid="voice-recorder-button"]').should('not.have.class', 'recording');
  });
  
  it('模拟语音识别结果应正确处理', () => {
    // 开始录音
    cy.get('[data-testid="voice-recorder-button"]').click();
    
    // 模拟语音识别结果
    cy.simulateVoiceInput('查询上海天气');
    
    // 验证进入意图解析状态
    cy.get('[data-testid="status-bar"]').should('contain', '正在理解您的意图');
  });

  it('应处理语音识别错误', () => {
    cy.get('[data-testid="voice-recorder-button"]').click();
    
    // 模拟语音识别错误
    cy.window().then((win) => {
      if (win.speechRecognitionInstance && win.speechRecognitionInstance.onerror) {
        win.speechRecognitionInstance.onerror({
          error: 'network'
        });
      }
    });
    
    // 验证错误提示
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain', '网络错误');
    
    // 验证录音状态重置
    cy.get('[data-testid="voice-recorder-button"]').should('have.text', '录音');
  });

  it('应支持键盘操作', () => {
    // 使用键盘焦点到录音按钮
    cy.tabToElement('[data-testid="voice-recorder-button"]');
    
    // 使用空格键或回车键触发录音
    cy.get('[data-testid="voice-recorder-button"]').type(' ');
    
    // 验证录音开始
    cy.get('@recognitionStart').should('have.been.called');
    
    // 再次按空格键停止录音
    cy.get('[data-testid="voice-recorder-button"]').type(' ');
    
    // 验证录音停止
    cy.get('@recognitionStop').should('have.been.called');
  });

  it('应在移动设备上正常工作', () => {
    cy.mockMobile();
    
    cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
    cy.get('[data-testid="voice-recorder-button"]').click();
    
    // 验证移动设备上的录音功能
    cy.get('@recognitionStart').should('have.been.called');
    
    // 验证移动设备上的触摸交互
    cy.get('[data-testid="voice-recorder-button"]').should('have.css', 'min-height');
  });

  it('应处理权限被拒绝的情况', () => {
    // 模拟权限被拒绝
    cy.window().then((win) => {
      cy.stub(win.navigator.mediaDevices, 'getUserMedia').rejects(
        new Error('Permission denied')
      );
    });
    
    cy.get('[data-testid="voice-recorder-button"]').click();
    
    // 验证权限错误提示
    cy.get('[data-testid="error-message"]').should('contain', '麦克风权限');
  });

  it('应显示录音时长', () => {
    cy.get('[data-testid="voice-recorder-button"]').click();
    
    // 等待一段时间
    cy.wait(2000);
    
    // 验证显示录音时长
    cy.get('[data-testid="recording-duration"]').should('be.visible');
    cy.get('[data-testid="recording-duration"]').should('contain', '00:0');
  });

  it('应支持最大录音时长限制', () => {
    cy.get('[data-testid="voice-recorder-button"]').click();
    
    // 模拟录音超时
    cy.wait(30000); // 假设最大录音时长是30秒
    
    // 验证自动停止录音
    cy.get('[data-testid="voice-recorder-button"]').should('have.text', '录音');
    cy.get('[data-testid="status-bar"]').should('contain', '录音时间过长，已自动停止');
  });

  it('应正确处理多次快速点击', () => {
    // 快速多次点击录音按钮
    cy.get('[data-testid="voice-recorder-button"]').click();
    cy.get('[data-testid="voice-recorder-button"]').click();
    cy.get('[data-testid="voice-recorder-button"]').click();
    
    // 验证只有一次start调用
    cy.get('@recognitionStart').should('have.been.calledOnce');
  });

  it('应在离线状态下显示适当提示', () => {
    cy.goOffline();
    
    cy.get('[data-testid="voice-recorder-button"]').click();
    
    // 验证离线提示
    cy.get('[data-testid="error-message"]').should('contain', '网络连接');
  });

  it('应保持录音状态在页面刷新后', () => {
    cy.get('[data-testid="voice-recorder-button"]').click();
    
    // 验证录音开始
    cy.get('@recognitionStart').should('have.been.called');
    
    // 刷新页面
    cy.reload();
    
    // 重新模拟语音API
    cy.mockSpeechAPI();
    
    // 验证录音状态恢复为初始状态
    cy.get('[data-testid="voice-recorder-button"]').should('have.text', '录音');
  });
});
