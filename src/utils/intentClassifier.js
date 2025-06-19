/**
 * 意图分类器
 * 用于识别用户语音输入的意图类型
 */

// 意图类型定义
export const INTENT_TYPES = {
  TRANSFER: 'transfer',
  QUERY_BALANCE: 'query_balance',
  QUERY_TRANSACTION: 'query_transaction',
  CONTACT_MANAGEMENT: 'contact_management',
  SETTINGS: 'settings',
  HELP: 'help',
  UNKNOWN: 'unknown'
};

// 关键词映射
const INTENT_KEYWORDS = {
  [INTENT_TYPES.TRANSFER]: [
    '转账', '发送', '付款', '支付', '转给', '给', '发给',
    'transfer', 'send', 'pay', 'give'
  ],
  [INTENT_TYPES.QUERY_BALANCE]: [
    '余额', '账户', '有多少', '查看余额', '我的余额',
    'balance', 'account', 'how much', 'my balance'
  ],
  [INTENT_TYPES.QUERY_TRANSACTION]: [
    '交易记录', '历史记录', '转账记录', '交易', '记录',
    'transaction', 'history', 'record', 'transactions'
  ],
  [INTENT_TYPES.CONTACT_MANAGEMENT]: [
    '联系人', '添加联系人', '删除联系人', '联系人列表',
    'contact', 'add contact', 'delete contact', 'contact list'
  ],
  [INTENT_TYPES.SETTINGS]: [
    '设置', '配置', '修改设置', '偏好设置',
    'settings', 'config', 'preferences', 'configure'
  ],
  [INTENT_TYPES.HELP]: [
    '帮助', '怎么', '如何', '教程', '说明',
    'help', 'how to', 'tutorial', 'guide', 'instruction'
  ]
};

/**
 * 分类用户意图
 * @param {string} text - 用户输入的文本
 * @returns {Object} 意图分类结果
 */
export function classifyIntent(text) {
  if (!text || typeof text !== 'string') {
    return {
      intent: INTENT_TYPES.UNKNOWN,
      confidence: 0,
      matchedKeywords: []
    };
  }

  const normalizedText = text.toLowerCase().trim();
  const results = [];

  // 遍历所有意图类型，计算匹配度
  for (const [intentType, keywords] of Object.entries(INTENT_KEYWORDS)) {
    const matchedKeywords = keywords.filter(keyword => 
      normalizedText.includes(keyword.toLowerCase())
    );
    
    if (matchedKeywords.length > 0) {
      results.push({
        intent: intentType,
        confidence: matchedKeywords.length / keywords.length,
        matchedKeywords
      });
    }
  }

  // 如果没有匹配的意图，返回未知
  if (results.length === 0) {
    return {
      intent: INTENT_TYPES.UNKNOWN,
      confidence: 0,
      matchedKeywords: []
    };
  }

  // 返回置信度最高的意图
  results.sort((a, b) => b.confidence - a.confidence);
  return results[0];
}

/**
 * 提取实体信息
 * @param {string} text - 用户输入的文本
 * @param {string} intent - 意图类型
 * @returns {Object} 提取的实体信息
 */
export function extractEntities(text, intent) {
  const entities = {};
  
  if (!text || typeof text !== 'string') {
    return entities;
  }

  const normalizedText = text.toLowerCase().trim();

  switch (intent) {
    case INTENT_TYPES.TRANSFER:
      // 提取金额
      const amountMatch = normalizedText.match(/(\d+(?:\.\d+)?)\s*(?:sol|usdc|元|块|刀)?/);
      if (amountMatch) {
        entities.amount = parseFloat(amountMatch[1]);
      }

      // 提取接收方（保留原始大小写）
      // 在原始文本中查找与 normalizedText 匹配的 recipient
      const recipientRegex = /(?:给|转给|发给|to)\s*([a-zA-Z0-9\u4e00-\u9fa5]{2,20})/i;
      const recipientMatch = text.match(recipientRegex);
      if (recipientMatch) {
        entities.recipient = recipientMatch[1];
      }

      // 提取货币类型
      if (normalizedText.includes('sol')) {
        entities.currency = 'SOL';
      } else if (normalizedText.includes('usdc')) {
        entities.currency = 'USDC';
      }
      break;

    case INTENT_TYPES.QUERY_BALANCE:
      // 提取查询的货币类型
      if (normalizedText.includes('sol')) {
        entities.currency = 'SOL';
      } else if (normalizedText.includes('usdc')) {
        entities.currency = 'USDC';
      }
      break;

    case INTENT_TYPES.CONTACT_MANAGEMENT:
      // 提取联系人名称（保留原始大小写）
      const contactRegex = /(?:添加|删除|查找)\s*联系人\s*([a-zA-Z0-9\u4e00-\u9fa5]{2,20})/i;
      const contactMatch = text.match(contactRegex);
      if (contactMatch) {
        entities.contactName = contactMatch[1];
      }

      // 提取操作类型
      if (normalizedText.includes('添加')) {
        entities.action = 'add';
      } else if (normalizedText.includes('删除')) {
        entities.action = 'delete';
      } else if (normalizedText.includes('查找') || normalizedText.includes('搜索')) {
        entities.action = 'search';
      }
      break;

    default:
      break;
  }

  return entities;
}

/**
 * 验证意图和实体
 * @param {string} intent - 意图类型
 * @param {Object} entities - 实体信息
 * @returns {Object} 验证结果
 */
export function validateIntentAndEntities(intent, entities) {
  const errors = [];
  const warnings = [];

  switch (intent) {
    case INTENT_TYPES.TRANSFER:
      if (!entities.amount || entities.amount <= 0) {
        errors.push('请指定有效的转账金额');
      }
      if (!entities.recipient) {
        errors.push('请指定转账接收方');
      }
      if (!entities.currency) {
        warnings.push('未指定货币类型，将使用默认的 SOL');
        entities.currency = 'SOL';
      }
      break;

    case INTENT_TYPES.CONTACT_MANAGEMENT:
      if (entities.action === 'add' && !entities.contactName) {
        errors.push('请指定要添加的联系人名称');
      }
      if (entities.action === 'delete' && !entities.contactName) {
        errors.push('请指定要删除的联系人名称');
      }
      break;

    default:
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    normalizedEntities: entities
  };
}

/**
 * 生成确认消息
 * @param {string} intent - 意图类型
 * @param {Object} entities - 实体信息
 * @returns {string} 确认消息
 */
export function generateConfirmationMessage(intent, entities) {
  switch (intent) {
    case INTENT_TYPES.TRANSFER:
      return `您要向 ${entities.recipient} 转账 ${entities.amount} ${entities.currency || 'SOL'}，是否确认？`;
    
    case INTENT_TYPES.QUERY_BALANCE:
      const currency = entities.currency ? entities.currency : '所有';
      return `您要查询 ${currency} 的账户余额，是否确认？`;
    
    case INTENT_TYPES.QUERY_TRANSACTION:
      return '您要查看交易记录，是否确认？';
    
    case INTENT_TYPES.CONTACT_MANAGEMENT:
      if (entities.action === 'add') {
        return `您要添加联系人 ${entities.contactName}，是否确认？`;
      } else if (entities.action === 'delete') {
        return `您要删除联系人 ${entities.contactName}，是否确认？`;
      } else {
        return '您要管理联系人，是否确认？';
      }
    
    case INTENT_TYPES.SETTINGS:
      return '您要打开设置页面，是否确认？';
    
    case INTENT_TYPES.HELP:
      return '您要查看帮助信息，是否确认？';
    
    default:
      return '抱歉，我没有理解您的意图，请重新说明';
  }
}
