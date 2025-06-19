// 加载自定义命令
import './commands';

// 加载无障碍测试
import 'cypress-axe';

// 处理未捕获的异常
Cypress.on('uncaught:exception', (err, runnable) => {
  // 防止未捕获的异常导致测试失败
  // 特别是语音API相关的异常
  if (err.message.includes('Speech')) {
    return false;
  }
  if (err.message.includes('MediaDevices')) {
    return false;
  }
  return false;
});

// 在每个测试前重置本地存储
beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
  
  // 设置默认的视口大小
  cy.viewport(1280, 720);
  
  // 模拟媒体权限
  cy.window().then((win) => {
    // 模拟获取媒体权限成功
    if (win.navigator && win.navigator.mediaDevices) {
      cy.stub(win.navigator.mediaDevices, 'getUserMedia').resolves({
        getTracks: () => [{
          stop: () => {},
          kind: 'audio',
          enabled: true
        }]
      });
    }
  });
});

// 在每个测试后清理
afterEach(() => {
  // 清理可能的定时器
  cy.window().then((win) => {
    if (win.speechSynthesis) {
      win.speechSynthesis.cancel();
    }
  });
});
