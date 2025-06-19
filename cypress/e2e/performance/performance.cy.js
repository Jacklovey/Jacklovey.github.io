describe('性能测试 - 完整套件', () => {
  beforeEach(() => {
    // 设置登录状态
    cy.login('testuser', 'password123');

    // 设置性能监控
    cy.window().then((win) => {
      win.performance.mark('test-start');
    });
  });

  afterEach(() => {
    // 清理性能标记
    cy.window().then((win) => {
      win.performance.clearMarks();
      win.performance.clearMeasures();
    });
  });

  describe('页面加载性能', () => {
    it('首页应在3秒内完成加载', () => {
      const startTime = Date.now();
      
      cy.visit('/');
      
      // 等待关键元素加载完成
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
      cy.get('[data-testid="status-bar"]').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000);
      });

      // 验证Lighthouse性能指标
      cy.window().then((win) => {
        const navigation = win.performance.getEntriesByType('navigation')[0];
        expect(navigation.loadEventEnd - navigation.fetchStart).to.be.lessThan(3000);
      });
    });

    it('登录页面应快速渲染', () => {
      cy.visit('/login');
      
      cy.window().then((win) => {
        win.performance.mark('login-page-start');
      });
      
      cy.get('[data-testid="login-form"]').should('be.visible');
      
        win.performance.measure('login-page-load', 'login-page-start', 'login-page-end');
        
        const measures = win.performance.getEntriesByName('login-page-load');
        expect(measures[0].duration).to.be.lessThan(1000);
      });
    });

    it('开发者控制台页面应快速加载', () => {
      cy.visit('/developer');
      
      const startTime = Date.now();
      
      cy.get('[data-testid="developer-dashboard"]').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(2000);
      });
    });

    it('应该有合理的核心网页指标', () => {
      cy.visit('/');
      
      // 等待页面完全加载
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
      
      cy.window().then((win) => {
        // 检查页面性能指标
        const navigation = win.performance.getEntriesByType('navigation')[0];
        
        // FCP (First Contentful Paint) 应小于 1.8秒
        expect(navigation.responseEnd - navigation.fetchStart).to.be.lessThan(1800);
        
        // TTI (Time to Interactive) 估算应合理
        expect(navigation.loadEventEnd - navigation.fetchStart).to.be.lessThan(3000);
      });
    });

    it('资源加载应优化', () => {
      cy.visit('/');
      
      cy.window().then((win) => {
        const resources = win.performance.getEntriesByType('resource');
        
        // 检查关键资源加载时间
        const jsResources = resources.filter(r => r.name.includes('.js'));
        const cssResources = resources.filter(r => r.name.includes('.css'));
        
        // JS文件应在合理时间内加载
        jsResources.forEach(resource => {
          expect(resource.duration).to.be.lessThan(1000);
        });
        
        // CSS文件应快速加载
        cssResources.forEach(resource => {
          expect(resource.duration).to.be.lessThan(500);
        });
      });
    });
  });

  describe('API响应性能', () => {
    beforeEach(() => {
      cy.visit('/');
    });

    it('意图解析API应在2秒内响应', () => {
      const startTime = Date.now();
      
      cy.intercept('POST', '/v1/api/interpret', {
        statusCode: 200,
        body: {
          type: 'direct_response',
          message: '测试响应',
          sessionId: 'performance-test'
        },
        delay: 500 // 模拟网络延迟
      }).as('interpretAPI');

      // 模拟语音输入触发API调用
      cy.simulateVoiceInput('测试语音输入');
      
      cy.wait('@interpretAPI').then(() => {
        const responseTime = Date.now() - startTime;
        expect(responseTime).to.be.lessThan(2000);
      });
    });

    it('工具执行API应在5秒内响应', () => {
      const startTime = Date.now();
      
      cy.intercept('POST', '/v1/api/execute', {
        statusCode: 200,
        body: {
          success: true,
          toolId: 'maps_weather',
          data: {
            tts_message: '上海今天多云，气温20到28度',
            raw_data: { temperature: 24, condition: 'cloudy' }
          },
          sessionId: 'performance-test'
        },
        delay: 1000
      }).as('executeAPI');

      // 模拟完整的语音交互流程
      cy.simulateVoiceInput('查询上海天气');
      cy.simulateVoiceInput('确认');
      
      cy.wait('@executeAPI').then(() => {
        const responseTime = Date.now() - startTime;
        expect(responseTime).to.be.lessThan(5000);
      });
    });

    it('认证API应快速响应', () => {
      cy.window().then((win) => {
        win.localStorage.clear();
      });
      
      const startTime = Date.now();
      
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
        delay: 200
      }).as('authAPI');

      cy.visit('/login');
      cy.get('[data-testid="username-input"]').type('testuser');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@authAPI').then(() => {
        const responseTime = Date.now() - startTime;
        expect(responseTime).to.be.lessThan(1000);
      });
    });
  });

  describe('内存和CPU性能', () => {
    it('长时间使用不应导致内存泄漏', () => {
      cy.visit('/');
      
      // 获取初始内存使用情况
      cy.window().then((win) => {
        if (win.performance.memory) {
          const initialMemory = win.performance.memory.usedJSHeapSize;
          
          // 模拟多次语音交互
          for (let i = 0; i < 5; i++) {
            cy.simulateVoiceInput(`测试语音输入 ${i + 1}`);
            cy.wait(1000);
          }
          
          // 强制垃圾回收（如果支持）
          if (win.gc) {
            win.gc();
          }
          
          cy.wait(2000).then(() => {
            const finalMemory = win.performance.memory.usedJSHeapSize;
            const memoryIncrease = finalMemory - initialMemory;
            
            // 内存增长不应超过10MB
            expect(memoryIncrease).to.be.lessThan(10 * 1024 * 1024);
          });
        }
      });
    });

    it('CPU使用应保持在合理范围', () => {
      cy.visit('/');
      
      // 测试CPU密集型操作
      cy.window().then((win) => {
        const startTime = win.performance.now();
        
        // 模拟快速连续的语音交互
        for (let i = 0; i < 10; i++) {
          cy.simulateVoiceInput(`快速测试 ${i + 1}`);
        }
        
        cy.then(() => {
          const endTime = win.performance.now();
          const processingTime = endTime - startTime;
          
          // 处理时间应合理
          expect(processingTime).to.be.lessThan(5000);
        });
      });
    });
  });

  describe('移动设备性能', () => {
    beforeEach(() => {
      cy.viewport('iphone-6');
    });

    it('移动设备上页面加载应优化', () => {
      const startTime = Date.now();
      
      cy.visit('/');
      
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        // 移动设备加载时间可以稍长
        expect(loadTime).to.be.lessThan(4000);
      });
    });

    it('移动设备上语音功能应响应迅速', () => {
      cy.visit('/');
      
      const startTime = Date.now();
      
      cy.get('[data-testid="voice-recorder-button"]').click();
      
      cy.then(() => {
        const responseTime = Date.now() - startTime;
        expect(responseTime).to.be.lessThan(500);
      });
    });

    it('移动设备上滚动应流畅', () => {
      cy.visit('/');
      
      // 模拟长页面内容
      cy.window().then((win) => {
        const startTime = win.performance.now();
        
        // 模拟滚动操作
        cy.scrollTo(0, 500);
        cy.scrollTo(0, 1000);
        cy.scrollTo(0, 0);
        
        cy.then(() => {
          const endTime = win.performance.now();
          const scrollTime = endTime - startTime;
          
          // 滚动操作应该流畅
          expect(scrollTime).to.be.lessThan(1000);
        });
      });
    });
  });

  describe('网络性能优化', () => {
    it('应正确处理慢网络连接', () => {
      // 模拟慢网络
      cy.intercept('**/*', { delay: 2000 }).as('slowNetwork');
      
      cy.visit('/');
      
      // 验证页面仍能正常工作
      cy.get('[data-testid="voice-recorder-button"]', { timeout: 10000 }).should('be.visible');
    });

    it('应实现资源缓存策略', () => {
      cy.visit('/');
      
      // 第二次访问应更快
      const startTime = Date.now();
      
      cy.reload();
      
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
      
      cy.then(() => {
        const reloadTime = Date.now() - startTime;
        // 重新加载应该更快（由于缓存）
        expect(reloadTime).to.be.lessThan(2000);
      });
    });

    it('应优化图片加载', () => {
      cy.visit('/');
      
      cy.window().then((win) => {
        const images = win.document.querySelectorAll('img');
        
        images.forEach(img => {
          // 验证图片有loading属性
          expect(img.loading).to.be.oneOf(['lazy', 'eager']);
          
          // 验证图片有合适的尺寸
          if (img.complete) {
            expect(img.naturalWidth).to.be.greaterThan(0);
            expect(img.naturalHeight).to.be.greaterThan(0);
          }
        });
      });
    });
  });

  describe('性能监控和报告', () => {
    it('应收集性能指标', () => {
      cy.visit('/');
      
      cy.window().then((win) => {
        // 验证性能API可用
        expect(win.performance).to.exist;
        expect(win.performance.getEntriesByType).to.be.a('function');
        
        // 验证有导航时间数据
        const navigation = win.performance.getEntriesByType('navigation');
        expect(navigation).to.have.length.greaterThan(0);
        
        // 验证有资源时间数据
        const resources = win.performance.getEntriesByType('resource');
        expect(resources).to.have.length.greaterThan(0);
      });
    });

    it('应生成性能报告', () => {
      cy.visit('/');
      
      cy.window().then((win) => {
        const performanceData = {
          navigation: win.performance.getEntriesByType('navigation')[0],
          resources: win.performance.getEntriesByType('resource'),
          memory: win.performance.memory,
          timeOrigin: win.performance.timeOrigin
        };
        
        // 验证性能数据完整性
        expect(performanceData.navigation).to.exist;
        expect(performanceData.resources).to.be.an('array');
        
        // 记录性能数据用于报告
        cy.task('log', {
          type: 'performance',
          data: performanceData,
          timestamp: new Date().toISOString()
        });
      });
    });
  });
});
        if (win.mockSpeechResult) {
          win.mockSpeechResult('测试性能');
        }
      });
      cy.get('[data-testid="voice-recorder-button"]').click();

      cy.wait('@interpretAPI').then((interception) => {
        const responseTime = interception.response.headers['X-Response-Time'];
        expect(parseInt(responseTime)).to.be.lessThan(2000);
      });
    });

    it('工具执行API应在5秒内完成', () => {
      cy.intercept('POST', '/v1/api/interpret', {
        statusCode: 200,
        body: {
          type: 'tool_call',
          tool_calls: [{
            tool_id: 'check_balance',
            parameters: { wallet_address: 'test_wallet' }
          }],
          confirmText: '要查询钱包余额吗？',
          sessionId: 'perf-test-execute'
        }
      }).as('interpretAPI');

      cy.intercept('POST', '/v1/api/execute', (req) => {
        const start = Date.now();
        // 模拟一些处理时间
        setTimeout(() => {
          req.reply({
            statusCode: 200,
            body: {
              success: true,
              toolId: 'check_balance',
              data: {
                tts_message: '余额查询完成',
                raw_data: { balance: 100 }
              },
              error: null,
              sessionId: 'perf-test-execute'
            },
            headers: {
              'X-Execution-Time': Date.now() - start
            }
          });
        }, 1000); // 模拟1秒的处理时间
      }).as('executeAPI');

      cy.visit('/');
      
      cy.get('[data-testid="voice-recorder-button"]').click();
      cy.window().then((win) => {
        if (win.mockSpeechResult) {
          win.mockSpeechResult('查询余额');
        }
      });
      cy.get('[data-testid="voice-recorder-button"]').click();

      cy.wait('@interpretAPI');
      cy.get('[data-testid="confirm-button"]').click();

      cy.wait('@executeAPI').then((interception) => {
        const executionTime = interception.response.headers['X-Execution-Time'];
        expect(parseInt(executionTime)).to.be.lessThan(5000);
      });
    });
  });

  describe('内存使用情况', () => {
    it('长时间使用不应导致内存泄漏', () => {
      cy.visit('/');
      
      // 记录初始内存使用
      let initialMemory;
      cy.window().then((win) => {
        if (win.performance.memory) {
          initialMemory = win.performance.memory.usedJSHeapSize;
        }
      });

      // 模拟多次语音交互
      for (let i = 0; i < 5; i++) {
        cy.intercept('POST', '/v1/api/interpret', {
          statusCode: 200,
          body: {
            type: 'direct_response',
            message: `测试响应 ${i + 1}`,
            sessionId: `memory-test-${i}`
          }
        }).as(`interpretAPI${i}`);

        cy.get('[data-testid="voice-recorder-button"]').click();
        cy.window().then((win) => {
          if (win.mockSpeechResult) {
            win.mockSpeechResult(`测试语音 ${i + 1}`);
          }
        });
        cy.get('[data-testid="voice-recorder-button"]').click();
        cy.wait(`@interpretAPI${i}`);
        cy.wait(500); // 等待处理完成
      }

      // 强制垃圾回收（在支持的浏览器中）
      cy.window().then((win) => {
        if (win.gc) {
          win.gc();
        }
      });

      // 检查内存使用
      cy.window().then((win) => {
        if (win.performance.memory && initialMemory) {
          const finalMemory = win.performance.memory.usedJSHeapSize;
          const memoryIncrease = finalMemory - initialMemory;
          
          // 内存增长应该在合理范围内（比如不超过10MB）
          expect(memoryIncrease).to.be.lessThan(10 * 1024 * 1024);
        }
      });
    });
  });

  describe('并发处理性能', () => {
    it('应能处理快速连续的用户操作', () => {
      cy.visit('/');
      
      // 设置多个API拦截
      for (let i = 0; i < 3; i++) {
        cy.intercept('POST', '/v1/api/interpret', {
          statusCode: 200,
          body: {
            type: 'direct_response',
            message: `并发响应 ${i + 1}`,
            sessionId: `concurrent-test-${i}`
          }
        }).as(`concurrentAPI${i}`);
      }

      const startTime = Date.now();

      // 快速连续操作
      for (let i = 0; i < 3; i++) {
        cy.get('[data-testid="voice-recorder-button"]').click();
        cy.window().then((win) => {
          if (win.mockSpeechResult) {
            win.mockSpeechResult(`快速操作 ${i + 1}`);
          }
        });
        cy.get('[data-testid="voice-recorder-button"]').click();
      }

      // 等待所有请求完成
      cy.wait('@concurrentAPI0');
      
      cy.then(() => {
        const totalTime = Date.now() - startTime;
        // 并发处理应该在合理时间内完成
        expect(totalTime).to.be.lessThan(10000);
      });
    });
  });

  describe('移动设备性能', () => {
    it('在移动设备上应保持良好性能', () => {
      // 模拟移动设备环境
      cy.viewport('iphone-x');
      
      const startTime = Date.now();
      cy.visit('/');
      
      // 等待关键元素加载
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        // 移动设备上的加载时间应该在合理范围内
        expect(loadTime).to.be.lessThan(4000);
      });

      // 测试滚动性能
      cy.get('[data-testid="main-content"]').scrollTo('bottom', { duration: 500 });
      cy.get('[data-testid="main-content"]').scrollTo('top', { duration: 500 });
      
      // 验证界面响应
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
    });

    it('触摸交互应响应迅速', () => {
      cy.viewport('iphone-x');
      cy.visit('/');
      
      const startTime = Date.now();
      
      // 触摸操作
      cy.get('[data-testid="voice-recorder-button"]').trigger('touchstart');
      cy.get('[data-testid="voice-recorder-button"]').trigger('touchend');
      
      // 验证响应时间
      cy.get('[data-testid="voice-recorder-button"]').should('have.class', 'recording').then(() => {
        const responseTime = Date.now() - startTime;
        expect(responseTime).to.be.lessThan(100); // 触摸响应应在100ms内
      });
    });
  });

  describe('网络条件性能', () => {
    it('慢速网络下应优雅降级', () => {
      // 模拟慢速网络
      cy.intercept('POST', '/v1/api/interpret', {
        delay: 3000, // 3秒延迟
        statusCode: 200,
        body: {
          type: 'direct_response',
          message: '慢速网络响应',
          sessionId: 'slow-network-test'
        }
      }).as('slowAPI');

      cy.visit('/');
      
      cy.get('[data-testid="voice-recorder-button"]').click();
      cy.window().then((win) => {
        if (win.mockSpeechResult) {
          win.mockSpeechResult('测试慢速网络');
        }
      });
      cy.get('[data-testid="voice-recorder-button"]').click();

      // 应该显示加载状态
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
      cy.get('[data-testid="status-bar"]').should('contain', '正在处理');

      cy.wait('@slowAPI');

      // 加载完成后应正常显示结果
      cy.get('[data-testid="loading-spinner"]').should('not.exist');
      cy.get('[data-testid="response-message"]').should('contain', '慢速网络响应');
    });
  });

  describe('资源使用优化', () => {
    it('应正确清理事件监听器', () => {
      cy.visit('/');
      
      // 记录初始事件监听器数量
      let initialListeners;
      cy.window().then((win) => {
        initialListeners = win.getEventListeners ? 
          Object.keys(win.getEventListeners(win.document)).length : 0;
      });

      // 进行多次操作
      for (let i = 0; i < 3; i++) {
        cy.get('[data-testid="voice-recorder-button"]').click();
        cy.get('[data-testid="voice-recorder-button"]').click();
        cy.wait(100);
      }

      // 导航到其他页面再返回
      cy.visit('/login');
      cy.visit('/');

      // 检查事件监听器是否正确清理
      cy.window().then((win) => {
        if (win.getEventListeners) {
          const finalListeners = Object.keys(win.getEventListeners(win.document)).length;
          // 监听器数量不应该大幅增加
          expect(finalListeners - initialListeners).to.be.lessThan(10);
        }
      });
    });

    it('应正确处理组件卸载', () => {
      cy.visit('/');
      
      // 确保组件已加载
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
      
      // 导航离开页面
      cy.visit('/login');
      
      // 返回主页面
      cy.visit('/');
      
      // 验证组件重新加载正常
      cy.get('[data-testid="voice-recorder-button"]').should('be.visible');
      cy.get('[data-testid="status-bar"]').should('contain', '点击麦克风开始语音交互');
    });
  });
});
