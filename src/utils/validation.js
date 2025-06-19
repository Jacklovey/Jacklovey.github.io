/**
 * 数据校验工具
 * 提供各种数据验证的 schema 和验证函数
 */

/**
 * 用户登录数据校验
 * @param {Object} data - 登录数据
 * @returns {Object} 校验结果
 */
export function validateLoginData(data) {
  const errors = {};
  
  // 用户名校验
  if (!data.username) {
    errors.username = '用户名不能为空';
  } else if (data.username.length < 3) {
    errors.username = '用户名至少3个字符';
  } else if (data.username.length > 20) {
    errors.username = '用户名不能超过20个字符';
  } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(data.username)) {
    errors.username = '用户名只能包含字母、数字、下划线和中文';
  }
  
  // 密码校验
  if (!data.password) {
    errors.password = '密码不能为空';
  } else if (data.password.length < 6) {
    errors.password = '密码至少6个字符';
  } else if (data.password.length > 50) {
    errors.password = '密码不能超过50个字符';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * 转账数据校验
 * @param {Object} data - 转账数据
 * @returns {Object} 校验结果
 */
export function validateTransferData(data) {
  const errors = {};
  
  // 金额校验
  if (data.amount === undefined || data.amount === null || data.amount === '') {
    errors.amount = '转账金额不能为空';
  } else if (isNaN(data.amount)) {
    errors.amount = '转账金额必须是数字';
  } else if (Number(data.amount) <= 0) {
    errors.amount = '转账金额必须大于0';
  } else if (Number(data.amount) > 1000000) {
    errors.amount = '转账金额不能超过1,000,000';
  }
  
  // 接收方校验
  if (!data.recipient) {
    errors.recipient = '接收方不能为空';
  } else if (data.recipient.length < 2) {
    errors.recipient = '接收方标识至少2个字符';
  }
  
  // 货币类型校验
  const validCurrencies = ['SOL', 'USDC'];
  if (data.currency && !validCurrencies.includes(data.currency)) {
    errors.currency = '不支持的货币类型';
  }
  
  // Solana地址校验（如果是地址格式）
  if (data.recipient && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(data.recipient)) {
    // 基本的 Base58 格式检查，如果匹配了正则但长度不对，才报错
    // 注意：正则中已经包含了长度限制{32,44}，所以这里实际上不会触发
    if (data.recipient.length < 32 || data.recipient.length > 44) {
      errors.recipient = '无效的Solana地址格式';
    }
  } else if (data.recipient && data.recipient.length >= 32) {
    // 如果长度看起来像是地址但格式不对
    errors.recipient = '无效的Solana地址格式';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * 联系人数据校验
 * @param {Object} data - 联系人数据
 * @returns {Object} 校验结果
 */
export function validateContactData(data) {
  const errors = {};
  
  // 联系人名称校验
  if (!data.name) {
    errors.name = '联系人名称不能为空';
  } else if (data.name.length < 2) {
    errors.name = '联系人名称至少2个字符';
  } else if (data.name.length > 20) {
    errors.name = '联系人名称不能超过20个字符';
  } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5\s]+$/.test(data.name)) {
    errors.name = '联系人名称包含无效字符';
  }
  
  // 地址校验
  if (!data.address) {
    errors.address = '联系人地址不能为空';
  } else if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(data.address)) {
    errors.address = '无效的Solana地址格式';
  }
  
  // 备注校验（可选）
  if (data.note && data.note.length > 100) {
    errors.note = '备注不能超过100个字符';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * 工具配置数据校验
 * @param {Object} data - 工具配置数据
 * @returns {Object} 校验结果
 */
export function validateToolData(data) {
  const errors = {};
  
  // 工具名称校验
  if (!data.name) {
    errors.name = '工具名称不能为空';
  } else if (data.name.length < 2) {
    errors.name = '工具名称至少2个字符';
  } else if (data.name.length > 50) {
    errors.name = '工具名称不能超过50个字符';
  }
  
  // 工具描述校验
  if (!data.description) {
    errors.description = '工具描述不能为空';
  } else if (data.description.length > 200) {
    errors.description = '工具描述不能超过200个字符';
  }
  
  // API端点校验
  if (!data.endpoint) {
    errors.endpoint = 'API端点不能为空';
  } else if (!/^https?:\/\/.+/.test(data.endpoint)) {
    errors.endpoint = 'API端点必须是有效的HTTP(S) URL';
  }
  
  // 请求方法校验
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE'];
  if (!data.method) {
    errors.method = '请求方法不能为空';
  } else if (!validMethods.includes(data.method)) {
    errors.method = '无效的请求方法';
  }
  
  // 参数模式校验（如果提供）
  if (data.parameters) {
    try {
      if (typeof data.parameters === 'string') {
        JSON.parse(data.parameters);
      }
    } catch (e) {
      errors.parameters = '参数模式必须是有效的JSON格式';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * 通用字符串校验
 * @param {string} value - 要校验的值
 * @param {Object} options - 校验选项
 * @returns {Object} 校验结果
 */
export function validateString(value, options = {}) {
  const {
    required = false,
    minLength = 0,
    maxLength = Infinity,
    pattern = null,
    patternMessage = '格式不正确'
  } = options;
  
  const errors = [];
  
  // 必填校验
  if (required && (!value || value.trim() === '')) {
    errors.push('此字段为必填项');
    return { isValid: false, errors };
  }
  
  // 如果不是必填且为空，直接通过
  if (!required && (!value || value.trim() === '')) {
    return { isValid: true, errors: [] };
  }
  
  // 长度校验
  if (value.length < minLength) {
    errors.push(`长度不能少于${minLength}个字符`);
  }
  
  if (value.length > maxLength) {
    errors.push(`长度不能超过${maxLength}个字符`);
  }
  
  // 正则表达式校验
  if (pattern && !pattern.test(value)) {
    errors.push(patternMessage);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 通用数字校验
 * @param {number|string} value - 要校验的值
 * @param {Object} options - 校验选项
 * @returns {Object} 校验结果
 */
export function validateNumber(value, options = {}) {
  const {
    required = false,
    min = -Infinity,
    max = Infinity,
    integer = false
  } = options;
  
  const errors = [];
  
  // 必填校验
  if (required && (value === null || value === undefined || value === '')) {
    errors.push('此字段为必填项');
    return { isValid: false, errors };
  }
  
  // 如果不是必填且为空，直接通过
  if (!required && (value === null || value === undefined || value === '')) {
    return { isValid: true, errors: [] };
  }
  
  // 数字类型校验
  const numValue = Number(value);
  if (isNaN(numValue)) {
    errors.push('必须是有效的数字');
    return { isValid: false, errors };
  }
  
  // 整数校验
  if (integer && !Number.isInteger(numValue)) {
    errors.push('必须是整数');
  }
  
  // 范围校验
  if (numValue < min) {
    errors.push(`不能小于${min}`);
  }
  
  if (numValue > max) {
    errors.push(`不能大于${max}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 批量校验
 * @param {Object} data - 要校验的数据对象
 * @param {Object} schema - 校验模式
 * @returns {Object} 校验结果
 */
export function validateSchema(data, schema) {
  const errors = {};
  let isValid = true;
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    const fieldErrors = [];
    
    // 执行该字段的所有校验规则
    for (const rule of rules) {
      const result = rule(value);
      if (!result.isValid) {
        fieldErrors.push(...result.errors);
      }
    }
    
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
      isValid = false;
    }
  }
  
  return {
    isValid,
    errors
  };
}

/**
 * 邮箱校验
 * @param {string} email - 邮箱地址
 * @returns {Object} 校验结果
 */
export function validateEmail(email) {
  const errors = [];
  
  // 类型检查
  if (typeof email !== 'string') {
    errors.push('邮箱必须是字符串类型');
    return { isValid: false, errors };
  }
  
  if (!email || email.trim() === '') {
    errors.push('此字段为必填项');
    return { isValid: false, errors };
  }

  // 基本邮箱格式验证（更严格的正则表达式）
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email.trim())) {
    errors.push('请输入有效的邮箱地址');
  }

  // 长度验证
  if (email.length > 254) {
    errors.push('邮箱地址过长');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 密码强度校验
 * @param {string} password - 密码
 * @returns {Object} 校验结果
 */
export function validatePassword(password) {
  const errors = [];
  
  if (!password || password.trim() === '') {
    errors.push('此字段为必填项');
    return { isValid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('密码长度至少8位');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含至少一个大写字母');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含至少一个小写字母');
  }
  
  if (!/\d/.test(password)) {
    errors.push('密码必须包含至少一个数字');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码必须包含至少一个特殊字符');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 用户名校验
 * @param {string} username - 用户名
 * @returns {Object} 校验结果
 */
export function validateUsername(username) {
  const errors = [];
  
  if (!username || username.trim() === '') {
    errors.push('此字段为必填项');
    return { isValid: false, errors };
  }
  
  if (username.length < 3 || username.length > 20) {
    errors.push('用户名长度必须在3-20位之间');
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('用户名只能包含字母、数字、下划线和连字符');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 必填项校验
 * @param {any} value - 值
 * @param {string} customMessage - 自定义错误信息
 * @returns {Object} 校验结果
 */
export function validateRequired(value, customMessage = '此字段为必填项') {
  const errors = [];
  
  if (value === null || value === undefined || value === '' || 
      (typeof value === 'string' && value.trim() === '')) {
    errors.push(customMessage);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 最小长度校验
 * @param {string} value - 值
 * @param {number} minLength - 最小长度
 * @returns {Object} 校验结果
 */
export function validateMinLength(value, minLength) {
  const errors = [];
  
  if (!value || value.length < minLength) {
    errors.push(`长度不能少于${minLength}位`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 最大长度校验
 * @param {string} value - 值
 * @param {number} maxLength - 最大长度
 * @returns {Object} 校验结果
 */
export function validateMaxLength(value, maxLength) {
  const errors = [];
  
  if (value && value.length > maxLength) {
    errors.push(`长度不能超过${maxLength}位`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 表单整体校验
 * @param {Object} formData - 表单数据
 * @param {Object} rules - 校验规则
 * @returns {Object} 校验结果
 */
export function validateForm(formData, rules) {
  const errors = {};
  let isValid = true;
  
  try {
    for (const [fieldName, fieldRules] of Object.entries(rules)) {
      const fieldValue = formData[fieldName];
      const fieldErrors = [];
      
      // 执行该字段的所有校验规则
      for (const rule of fieldRules) {
        try {
          const result = rule(fieldValue);
          if (!result.isValid) {
            fieldErrors.push(...result.errors);
            break; // 遇到第一个错误就停止，避免多个错误信息
          }
        } catch (ruleError) {
          console.warn('Validation rule error:', ruleError);
          // 继续执行其他规则，不让单个规则错误影响整体校验
        }
      }
      
      if (fieldErrors.length > 0) {
        errors[fieldName] = fieldErrors;
        isValid = false;
      }
    }
  } catch (error) {
    console.error('Form validation error:', error);
    isValid = false;
  }
  
  return {
    isValid,
    errors
  };
}
