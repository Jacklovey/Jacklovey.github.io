import { rest } from 'msw';

// 模拟用户数据
const mockUsers = [
  {
    id: '1',
    username: 'testuser',
    password: 'password123', // 在实际应用中，这应该是哈希后的密码
    role: 'user',
    profile: {
      displayName: '测试用户',
      avatar: '',
      createdAt: '2024-01-01T00:00:00Z'
    }
  },
  {
    id: '2',
    username: 'developer',
    password: 'dev123456',
    role: 'developer',
    profile: {
      displayName: '开发者',
      avatar: '',
      createdAt: '2024-01-01T00:00:00Z'
    }
  }
];

// 模拟会话存储
let currentSession = null;

// 模拟工具列表
const mockTools = [
  {
    id: 'transfer_sol',
    name: 'SOL转账',
    description: '在Solana网络上转账SOL代币',
    category: 'blockchain',
    parameters: {
      type: 'object',
      properties: {
        recipient: { type: 'string', description: '接收方地址或联系人' },
        amount: { type: 'number', description: '转账金额' },
        currency: { type: 'string', enum: ['SOL', 'USDC'], default: 'SOL' }
      },
      required: ['recipient', 'amount']
    }
  },
  {
    id: 'query_balance',
    name: '查询余额',
    description: '查询钱包余额',
    category: 'blockchain',
    parameters: {
      type: 'object',
      properties: {
        currency: { type: 'string', enum: ['SOL', 'USDC'], description: '货币类型' }
      }
    }
  },
  {
    id: 'query_transactions',
    name: '查询交易记录',
    description: '查询交易历史记录',
    category: 'blockchain',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', default: 10, description: '返回记录数量' },
        offset: { type: 'number', default: 0, description: '偏移量' }
      }
    }
  }
];

// 模拟联系人数据
const mockContacts = [
  {
    id: '1',
    name: 'Alice',
    address: 'So11111111111111111111111111111111111111112',
    note: '朋友'
  },
  {
    id: '2', 
    name: 'Bob',
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    note: '同事'
  }
];

// API处理器
export const handlers = [
  // 用户认证
  rest.post('/v1/api/auth/token', (req, res, ctx) => {
    const formData = req.body;
    const username = formData.get('username');
    const password = formData.get('password');
    
    // 查找用户
    const user = mockUsers.find(u => u.username === username && u.password === password);
    
    if (!user) {
      return res(
        ctx.status(401),
        ctx.json({ message: '用户名或密码错误' })
      );
    }
    
    // 生成模拟token
    const token = `mock_token_${user.id}_${Date.now()}`;
    
    return res(
      ctx.status(200),
      ctx.json({
        access_token: token,
        token_type: 'bearer',
        user_id: user.id,
        username: user.username,
        role: user.role
      })
    );
  }),

  // 刷新令牌
  rest.post('/v1/api/auth/refresh', (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(
        ctx.status(401),
        ctx.json({ message: '无效的认证令牌' })
      );
    }
    
    // 生成新token
    const newToken = `mock_token_refresh_${Date.now()}`;
    
    return res(
      ctx.status(200),
      ctx.json({
        access_token: newToken,
        token_type: 'bearer'
      })
    );
  }),

  // 意图解析
  rest.post('/v1/api/interpret', (req, res, ctx) => {
    const { query } = req.body;
    
    // 简单的意图识别逻辑
    let intent = 'unknown';
    let toolCalls = [];
    let requiresConfirmation = true;
    let confirmationMessage = '';
    
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('转账') || lowerQuery.includes('发送') || lowerQuery.includes('给')) {
      intent = 'transfer';
      
      // 提取金额和接收方
      const amountMatch = lowerQuery.match(/(\d+(?:\.\d+)?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 1;
      
      const recipientMatch = lowerQuery.match(/(?:给|转给|发给)\s*([a-zA-Z0-9\u4e00-\u9fa5]{2,20})/);
      const recipient = recipientMatch ? recipientMatch[1] : 'Alice';
      
      toolCalls = [{
        id: 'transfer_sol',
        function: {
          name: 'transfer_sol',
          arguments: {
            recipient: recipient,
            amount: amount,
            currency: 'SOL'
          }
        }
      }];
      
      confirmationMessage = `您要向 ${recipient} 转账 ${amount} SOL，是否确认？`;
    } else if (lowerQuery.includes('余额') || lowerQuery.includes('账户')) {
      intent = 'query_balance';
      
      toolCalls = [{
        id: 'query_balance',
        function: {
          name: 'query_balance',
          arguments: {
            currency: 'SOL'
          }
        }
      }];
      
      confirmationMessage = '您要查询 SOL 余额，是否确认？';
    } else if (lowerQuery.includes('交易记录') || lowerQuery.includes('历史记录')) {
      intent = 'query_transactions';
      
      toolCalls = [{
        id: 'query_transactions',
        function: {
          name: 'query_transactions',
          arguments: {
            limit: 10,
            offset: 0
          }
        }
      }];
      
      confirmationMessage = '您要查看交易记录，是否确认？';
    }
    
    // 模拟处理延迟
    return res(
      ctx.delay(500),
      ctx.status(200),
      ctx.json({
        intent,
        requires_confirmation: requiresConfirmation,
        confirmation_message: confirmationMessage,
        tool_calls: toolCalls
      })
    );
  }),

  // 工具执行
  rest.post('/v1/api/execute', (req, res, ctx) => {
    const { tool_calls } = req.body;
    
    if (!tool_calls || tool_calls.length === 0) {
      return res(
        ctx.status(400),
        ctx.json({ message: '没有要执行的工具' })
      );
    }
    
    const toolCall = tool_calls[0];
    const { name, arguments: args } = toolCall.function;
    
    let result = {};
    
    switch (name) {
      case 'transfer_sol':
        result = {
          success: true,
          message: `成功向 ${args.recipient} 转账 ${args.amount} ${args.currency}`,
          data: {
            transactionHash: `mock_tx_${Date.now()}`,
            recipient: args.recipient,
            amount: args.amount,
            currency: args.currency,
            timestamp: new Date().toISOString()
          }
        };
        break;
        
      case 'query_balance':
        result = {
          success: true,
          message: `您的 ${args.currency || 'SOL'} 余额为 42.5`,
          data: {
            currency: args.currency || 'SOL',
            balance: 42.5,
            timestamp: new Date().toISOString()
          }
        };
        break;
        
      case 'query_transactions':
        result = {
          success: true,
          message: '以下是您的最近交易记录',
          data: {
            transactions: [
              {
                hash: 'mock_tx_001',
                type: 'transfer',
                amount: 10.5,
                currency: 'SOL',
                from: '您的钱包',
                to: 'Alice',
                timestamp: '2024-12-16T10:30:00Z',
                status: 'confirmed'
              },
              {
                hash: 'mock_tx_002',
                type: 'receive',
                amount: 5.0,
                currency: 'SOL',
                from: 'Bob',
                to: '您的钱包',
                timestamp: '2024-12-15T15:20:00Z',
                status: 'confirmed'
              }
            ],
            total: 2,
            limit: args.limit || 10,
            offset: args.offset || 0
          }
        };
        break;
        
      default:
        result = {
          success: false,
          message: `未知的工具: ${name}`,
          data: {}
        };
    }
    
    // 模拟执行延迟
    return res(
      ctx.delay(1000),
      ctx.status(200),
      ctx.json({ result })
    );
  }),

  // 获取工具列表
  rest.get('/v1/api/tools', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        tools: mockTools
      })
    );
  }),

  // 获取用户配置
  rest.get('/v1/api/user/config', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        contacts: mockContacts,
        settings: {
          theme: 'dark',
          language: 'zh-CN',
          voiceSettings: {
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0
          }
        }
      })
    );
  }),

  // 更新用户配置
  rest.put('/v1/api/user/config', (req, res, ctx) => {
    const config = req.body;
    
    // 在实际应用中，这里会保存到数据库
    return res(
      ctx.status(200),
      ctx.json({
        message: '配置更新成功',
        config
      })
    );
  }),

  // 开发者工具管理
  rest.get('/v1/api/dev/tools', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        tools: mockTools
      })
    );
  }),

  rest.post('/v1/api/dev/tools', (req, res, ctx) => {
    const toolData = req.body;
    
    const newTool = {
      id: `custom_${Date.now()}`,
      ...toolData,
      createdAt: new Date().toISOString()
    };
    
    mockTools.push(newTool);
    
    return res(
      ctx.status(201),
      ctx.json({
        message: '工具创建成功',
        tool: newTool
      })
    );
  }),

  rest.put('/v1/api/dev/tools/:toolId', (req, res, ctx) => {
    const { toolId } = req.params;
    const toolData = req.body;
    
    const toolIndex = mockTools.findIndex(tool => tool.id === toolId);
    
    if (toolIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({ message: '工具不存在' })
      );
    }
    
    mockTools[toolIndex] = {
      ...mockTools[toolIndex],
      ...toolData,
      updatedAt: new Date().toISOString()
    };
    
    return res(
      ctx.status(200),
      ctx.json({
        message: '工具更新成功',
        tool: mockTools[toolIndex]
      })
    );
  }),

  rest.delete('/v1/api/dev/tools/:toolId', (req, res, ctx) => {
    const { toolId } = req.params;
    
    const toolIndex = mockTools.findIndex(tool => tool.id === toolId);
    
    if (toolIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({ message: '工具不存在' })
      );
    }
    
    mockTools.splice(toolIndex, 1);
    
    return res(
      ctx.status(200),
      ctx.json({ message: '工具删除成功' })
    );
  })
];

export default handlers;
