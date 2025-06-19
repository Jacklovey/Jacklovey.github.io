describe('开发者功能集成测试', () => {
  beforeEach(() => {
    // 设置开发者登录状态
    cy.login('devuser', 'devpass123', 'developer');
    
    // 模拟开发者API
    cy.intercept('GET', '/v1/api/developer/tools', {
      statusCode: 200,
      body: {
        tools: [
          {
            tool_id: 'custom_weather',
            name: '自定义天气API',
            type: 'http',
            endpoint: 'https://api.weather.example.com',
            status: 'active',
            created_at: '2024-01-01T00:00:00Z'
          },
          {
            tool_id: 'custom_crypto',
            name: '加密货币查询',
            type: 'mcp',
            endpoint: 'mcp://crypto.example.com',
            status: 'inactive',
            created_at: '2024-01-02T00:00:00Z'
          }
        ]
      }
    }).as('getToolsAPI');
    
    cy.intercept('POST', '/v1/api/developer/tools', {
      statusCode: 201,
      body: {
        tool_id: 'new_tool_123',
        name: '新工具',
        type: 'http',
        status: 'active'
      }
    }).as('createToolAPI');
    
    cy.intercept('PUT', '/v1/api/developer/tools/*', {
      statusCode: 200,
      body: {
        tool_id: 'custom_weather',
        name: '更新的天气API',
        type: 'http',
        status: 'active'
      }
    }).as('updateToolAPI');
    
    cy.intercept('DELETE', '/v1/api/developer/tools/*', {
      statusCode: 204,
      body: {}
    }).as('deleteToolAPI');
    
    cy.visit('/developer');
  });

  describe('开发者控制台访问', () => {
    it('开发者应能访问控制台', () => {
      cy.get('[data-testid="developer-dashboard"]').should('be.visible');
      cy.get('[data-testid="tools-list"]').should('be.visible');
      cy.get('[data-testid="add-tool-button"]').should('be.visible');
    });

    it('普通用户不应能访问控制台', () => {
      // 切换到普通用户
      cy.login('testuser', 'password123', 'user');
      cy.visit('/developer');
      
      // 应被重定向到首页或显示权限错误
      cy.url().should('not.include', '/developer');
      cy.get('[data-testid="access-denied"]').should('be.visible');
    });
  });

  describe('工具管理流程', () => {
    it('应显示现有工具列表', () => {
      cy.wait('@getToolsAPI');
      
      cy.get('[data-testid="tool-item"]').should('have.length', 2);
      cy.get('[data-testid="tool-item"]').first().should('contain', '自定义天气API');
      cy.get('[data-testid="tool-item"]').last().should('contain', '加密货币查询');
      
      // 验证工具状态显示
      cy.get('[data-testid="tool-status-active"]').should('be.visible');
      cy.get('[data-testid="tool-status-inactive"]').should('be.visible');
    });

    it('应能创建新工具', () => {
      // 点击添加工具按钮
      cy.get('[data-testid="add-tool-button"]').click();
      
      // 填写工具信息
      cy.get('[data-testid="tool-name-input"]').type('测试API工具');
      cy.get('[data-testid="tool-type-select"]').select('http');
      cy.get('[data-testid="tool-endpoint-input"]').type('https://api.test.com');
      cy.get('[data-testid="tool-description-input"]').type('这是一个测试API工具');
      
      // 配置请求schema
      cy.get('[data-testid="schema-editor"]').type(JSON.stringify({
        type: 'object',
        properties: {
          query: { type: 'string' }
        }
      }));
      
      // 提交创建
      cy.get('[data-testid="create-tool-button"]').click();
      
      cy.wait('@createToolAPI').its('request.body').should('deep.include', {
        name: '测试API工具',
        type: 'http',
        endpoint: 'https://api.test.com'
      });
      
      // 验证成功提示
      cy.get('[data-testid="success-message"]').should('contain', '工具创建成功');
      
      // 验证工具出现在列表中
      cy.get('[data-testid="tool-item"]').should('contain', '测试API工具');
    });

    it('应能编辑现有工具', () => {
      cy.wait('@getToolsAPI');
      
      // 点击编辑按钮
      cy.get('[data-testid="tool-item"]').first().find('[data-testid="edit-button"]').click();
      
      // 修改工具名称
      cy.get('[data-testid="tool-name-input"]').clear().type('更新的天气API');
      
      // 保存更改
      cy.get('[data-testid="save-changes-button"]').click();
      
      cy.wait('@updateToolAPI').its('request.body').should('deep.include', {
        name: '更新的天气API'
      });
      
      // 验证更新成功
      cy.get('[data-testid="success-message"]').should('contain', '工具更新成功');
    });

    it('应能删除工具', () => {
      cy.wait('@getToolsAPI');
      
      // 点击删除按钮
      cy.get('[data-testid="tool-item"]').first().find('[data-testid="delete-button"]').click();
      
      // 确认删除
      cy.get('[data-testid="confirm-delete-button"]').click();
      
      cy.wait('@deleteToolAPI');
      
      // 验证删除成功
      cy.get('[data-testid="success-message"]').should('contain', '工具删除成功');
      
      // 验证工具从列表中消失
      cy.get('[data-testid="tool-item"]').should('have.length', 1);
    });
  });

  describe('工具测试功能', () => {
    it('应能测试HTTP工具', () => {
      cy.wait('@getToolsAPI');
      
      // 模拟工具测试API
      cy.intercept('POST', '/v1/api/developer/tools/*/test', {
        statusCode: 200,
        body: {
          success: true,
          response_time: 234,
          response_data: {
            temperature: 25,
            condition: 'sunny'
          }
        }
      }).as('testToolAPI');
      
      // 点击测试按钮
      cy.get('[data-testid="tool-item"]').first().find('[data-testid="test-button"]').click();
      
      // 输入测试参数
      cy.get('[data-testid="test-params-input"]').type(JSON.stringify({
        city: '北京'
      }));
      
      // 执行测试
      cy.get('[data-testid="run-test-button"]').click();
      
      cy.wait('@testToolAPI');
      
      // 验证测试结果显示
      cy.get('[data-testid="test-result"]').should('be.visible');
      cy.get('[data-testid="test-success"]').should('contain', '测试成功');
      cy.get('[data-testid="response-time"]').should('contain', '234ms');
    });

    it('应处理工具测试失败', () => {
      cy.wait('@getToolsAPI');
      
      // 模拟工具测试失败
      cy.intercept('POST', '/v1/api/developer/tools/*/test', {
        statusCode: 400,
        body: {
          success: false,
          error: '无效的API端点'
        }
      }).as('testToolFailAPI');
      
      cy.get('[data-testid="tool-item"]').first().find('[data-testid="test-button"]').click();
      cy.get('[data-testid="run-test-button"]').click();
      
      cy.wait('@testToolFailAPI');
      
      // 验证错误信息显示
      cy.get('[data-testid="test-error"]').should('contain', '无效的API端点');
    });
  });

  describe('工具状态管理', () => {
    it('应能激活/停用工具', () => {
      cy.wait('@getToolsAPI');
      
      // 模拟状态切换API
      cy.intercept('PATCH', '/v1/api/developer/tools/*/status', {
        statusCode: 200,
        body: {
          tool_id: 'custom_crypto',
          status: 'active'
        }
      }).as('toggleStatusAPI');
      
      // 激活当前停用的工具
      cy.get('[data-testid="tool-item"]').last().find('[data-testid="status-toggle"]').click();
      
      cy.wait('@toggleStatusAPI').its('request.body').should('deep.include', {
        status: 'active'
      });
      
      // 验证状态更新
      cy.get('[data-testid="tool-item"]').last().find('[data-testid="tool-status-active"]').should('be.visible');
    });

    it('应显示工具使用统计', () => {
      // 模拟统计API
      cy.intercept('GET', '/v1/api/developer/tools/*/stats', {
        statusCode: 200,
        body: {
          total_calls: 1250,
          success_rate: 98.5,
          avg_response_time: 145,
          last_24h_calls: 89
        }
      }).as('getStatsAPI');
      
      cy.wait('@getToolsAPI');
      
      // 点击查看统计
      cy.get('[data-testid="tool-item"]').first().find('[data-testid="stats-button"]').click();
      
      cy.wait('@getStatsAPI');
      
      // 验证统计信息显示
      cy.get('[data-testid="stats-modal"]').should('be.visible');
      cy.get('[data-testid="total-calls"]').should('contain', '1,250');
      cy.get('[data-testid="success-rate"]').should('contain', '98.5%');
      cy.get('[data-testid="avg-response-time"]').should('contain', '145ms');
    });
  });

  describe('开发者设置', () => {
    it('应能配置API密钥', () => {
      // 模拟API密钥配置
      cy.intercept('POST', '/v1/api/developer/settings/api-keys', {
        statusCode: 200,
        body: { success: true }
      }).as('saveApiKeyAPI');
      
      // 导航到设置页面
      cy.get('[data-testid="developer-settings"]').click();
      
      // 添加API密钥
      cy.get('[data-testid="add-api-key-button"]').click();
      cy.get('[data-testid="api-key-name-input"]').type('OpenWeather API');
      cy.get('[data-testid="api-key-value-input"]').type('sk-test-api-key-123');
      cy.get('[data-testid="save-api-key-button"]').click();
      
      cy.wait('@saveApiKeyAPI');
      
      // 验证保存成功
      cy.get('[data-testid="success-message"]').should('contain', 'API密钥保存成功');
    });

    it('应能配置Webhook', () => {
      cy.intercept('POST', '/v1/api/developer/settings/webhooks', {
        statusCode: 200,
        body: { success: true }
      }).as('saveWebhookAPI');
      
      cy.get('[data-testid="developer-settings"]').click();
      
      // 配置Webhook
      cy.get('[data-testid="webhook-url-input"]').type('https://my-app.com/webhook');
      cy.get('[data-testid="webhook-events-select"]').select(['tool_execution', 'tool_error']);
      cy.get('[data-testid="save-webhook-button"]').click();
      
      cy.wait('@saveWebhookAPI');
      
      // 验证保存成功
      cy.get('[data-testid="success-message"]').should('contain', 'Webhook配置成功');
    });
  });

  describe('开发者文档集成', () => {
    it('应显示API文档', () => {
      cy.get('[data-testid="api-docs-button"]').click();
      
      // 验证文档页面打开
      cy.get('[data-testid="api-documentation"]').should('be.visible');
      cy.get('[data-testid="api-endpoints"]').should('be.visible');
      cy.get('[data-testid="example-requests"]').should('be.visible');
    });

    it('应提供代码示例', () => {
      cy.get('[data-testid="code-examples-button"]').click();
      
      // 验证代码示例显示
      cy.get('[data-testid="code-examples"]').should('be.visible');
      cy.get('[data-testid="javascript-example"]').should('be.visible');
      cy.get('[data-testid="python-example"]').should('be.visible');
      cy.get('[data-testid="curl-example"]').should('be.visible');
    });
  });

  describe('权限管理', () => {
    it('应限制非开发者用户的功能', () => {
      // 切换到普通用户
      cy.login('testuser', 'password123', 'user');
      cy.visit('/developer');
      
      // 验证访问被拒绝
      cy.get('[data-testid="access-denied"]').should('be.visible');
      cy.get('[data-testid="developer-dashboard"]').should('not.exist');
    });

    it('应显示开发者权限范围', () => {
      cy.get('[data-testid="permissions-info"]').click();
      
      // 验证权限信息显示
      cy.get('[data-testid="permission-list"]').should('be.visible');
      cy.get('[data-testid="permission-list"]').should('contain', '创建和管理自定义工具');
      cy.get('[data-testid="permission-list"]').should('contain', '查看工具使用统计');
      cy.get('[data-testid="permission-list"]').should('contain', '配置API密钥和Webhook');
    });
  });

  describe('开发者分析', () => {
    it('应显示使用情况分析', () => {
      // 模拟分析数据API
      cy.intercept('GET', '/v1/api/developer/analytics', {
        statusCode: 200,
        body: {
          daily_calls: [120, 145, 98, 156, 134, 167, 189],
          top_tools: [
            { name: '自定义天气API', calls: 543 },
            { name: '加密货币查询', calls: 234 }
          ],
          error_rate: 2.1,
          avg_response_time: 156
        }
      }).as('getAnalyticsAPI');
      
      cy.get('[data-testid="analytics-tab"]').click();
      
      cy.wait('@getAnalyticsAPI');
      
      // 验证分析图表显示
      cy.get('[data-testid="usage-chart"]').should('be.visible');
      cy.get('[data-testid="top-tools-chart"]').should('be.visible');
      cy.get('[data-testid="error-rate-metric"]').should('contain', '2.1%');
    });

    it('应能导出使用数据', () => {
      cy.intercept('GET', '/v1/api/developer/analytics/export', {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="usage-data.csv"'
        },
        body: 'date,calls,errors,response_time\n2024-01-01,120,2,145'
      }).as('exportDataAPI');
      
      cy.get('[data-testid="analytics-tab"]').click();
      cy.get('[data-testid="export-data-button"]').click();
      
      cy.wait('@exportDataAPI');
      
      // 验证下载开始
      cy.get('[data-testid="download-success"]').should('be.visible');
    });
  });

  describe('实时监控', () => {
    it('应显示实时工具状态', () => {
      // 模拟WebSocket连接
      cy.window().then((win) => {
        // 模拟实时状态更新
        const mockWebSocket = {
          send: cy.stub(),
          close: cy.stub(),
          onmessage: null,
          onopen: null,
          onerror: null
        };
        
        win.WebSocket = function() {
          return mockWebSocket;
        };
      });
      
      cy.get('[data-testid="real-time-monitor"]').click();
      
      // 验证实时监控界面
      cy.get('[data-testid="live-status"]').should('be.visible');
      cy.get('[data-testid="real-time-calls"]').should('be.visible');
      cy.get('[data-testid="real-time-errors"]').should('be.visible');
    });
  });
});
