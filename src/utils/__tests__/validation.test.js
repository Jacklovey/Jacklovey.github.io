import {
  validateLoginData,
  validateTransferData,
  validateContactData,
  validateToolData,
  validateEmail,
  validatePassword,
  validateUsername,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateForm
} from '../validation';

describe('validation', () => {
  describe('validateLoginData', () => {
    it('should validate correct login data', () => {
      const data = { username: 'testuser', password: 'password123' };
      const result = validateLoginData(data);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('should reject empty username', () => {
      const data = { username: '', password: 'password123' };
      const result = validateLoginData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.username).toBe('用户名不能为空');
    });

    it('should reject short username', () => {
      const data = { username: 'ab', password: 'password123' };
      const result = validateLoginData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.username).toBe('用户名至少3个字符');
    });

    it('should reject long username', () => {
      const data = { username: 'a'.repeat(21), password: 'password123' };
      const result = validateLoginData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.username).toBe('用户名不能超过20个字符');
    });

    it('should reject invalid username characters', () => {
      const data = { username: 'test@user', password: 'password123' };
      const result = validateLoginData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.username).toBe('用户名只能包含字母、数字、下划线和中文');
    });

    it('should accept valid username with Chinese characters', () => {
      const data = { username: '测试用户123', password: 'password123' };
      const result = validateLoginData(data);
      expect(result.isValid).toBe(true);
    });

    it('should reject empty password', () => {
      const data = { username: 'testuser', password: '' };
      const result = validateLoginData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.password).toBe('密码不能为空');
    });

    it('should reject short password', () => {
      const data = { username: 'testuser', password: '12345' };
      const result = validateLoginData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.password).toBe('密码至少6个字符');
    });

    it('should reject long password', () => {
      const data = { username: 'testuser', password: 'a'.repeat(51) };
      const result = validateLoginData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.password).toBe('密码不能超过50个字符');
    });

    it('should handle missing username', () => {
      const data = { password: 'password123' };
      const result = validateLoginData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.username).toBe('用户名不能为空');
    });

    it('should handle missing password', () => {
      const data = { username: 'testuser' };
      const result = validateLoginData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.password).toBe('密码不能为空');
    });
  });

  describe('validateTransferData', () => {
    it('should validate correct transfer data', () => {
      const data = { amount: 10, recipient: 'Alice', currency: 'SOL' };
      const result = validateTransferData(data);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('should reject empty amount', () => {
      const data = { recipient: 'Alice', currency: 'SOL' };
      const result = validateTransferData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.amount).toBe('转账金额不能为空');
    });

    it('should reject non-numeric amount', () => {
      const data = { amount: 'abc', recipient: 'Alice', currency: 'SOL' };
      const result = validateTransferData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.amount).toBe('转账金额必须是数字');
    });

    it('should reject zero amount', () => {
      const data = { amount: 0, recipient: 'Alice', currency: 'SOL' };
      const result = validateTransferData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.amount).toBe('转账金额必须大于0');
    });

    it('should reject negative amount', () => {
      const data = { amount: -10, recipient: 'Alice', currency: 'SOL' };
      const result = validateTransferData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.amount).toBe('转账金额必须大于0');
    });

    it('should reject excessive amount', () => {
      const data = { amount: 1000001, recipient: 'Alice', currency: 'SOL' };
      const result = validateTransferData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.amount).toBe('转账金额不能超过1,000,000');
    });

    it('should accept decimal amounts', () => {
      const data = { amount: 10.5, recipient: 'Alice', currency: 'SOL' };
      const result = validateTransferData(data);
      expect(result.isValid).toBe(true);
    });

    it('should reject empty recipient', () => {
      const data = { amount: 10, currency: 'SOL' };
      const result = validateTransferData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.recipient).toBe('接收方不能为空');
    });

    it('should reject short recipient', () => {
      const data = { amount: 10, recipient: 'A', currency: 'SOL' };
      const result = validateTransferData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.recipient).toBe('接收方标识至少2个字符');
    });

    it('should reject invalid currency', () => {
      const data = { amount: 10, recipient: 'Alice', currency: 'BTC' };
      const result = validateTransferData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.currency).toBe('不支持的货币类型');
    });

    it('should accept valid currencies', () => {
      const solData = { amount: 10, recipient: 'Alice', currency: 'SOL' };
      const usdcData = { amount: 10, recipient: 'Alice', currency: 'USDC' };
      
      expect(validateTransferData(solData).isValid).toBe(true);
      expect(validateTransferData(usdcData).isValid).toBe(true);
    });

    it('should accept valid Solana address', () => {
      const data = { 
        amount: 10, 
        recipient: 'So11111111111111111111111111111111111111112', 
        currency: 'SOL' 
      };
      const result = validateTransferData(data);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid Solana address format', () => {
      const data = { 
        amount: 10, 
        recipient: 'invalid_solana_address_too_short', 
        currency: 'SOL' 
      };
      const result = validateTransferData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.recipient).toBe('无效的Solana地址格式');
    });

    it('should allow empty currency', () => {
      const data = { amount: 10, recipient: 'Alice' };
      const result = validateTransferData(data);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateContactData', () => {
    it('should validate correct contact data', () => {
      const data = { 
        name: 'Alice', 
        address: 'So11111111111111111111111111111111111111112',
        note: 'Friend'
      };
      const result = validateContactData(data);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('should reject empty name', () => {
      const data = { 
        name: '', 
        address: 'So11111111111111111111111111111111111111112' 
      };
      const result = validateContactData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('联系人名称不能为空');
    });

    it('should reject short name', () => {
      const data = { 
        name: 'A', 
        address: 'So11111111111111111111111111111111111111112' 
      };
      const result = validateContactData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('联系人名称至少2个字符');
    });

    it('should reject long name', () => {
      const data = { 
        name: 'A'.repeat(21), 
        address: 'So11111111111111111111111111111111111111112' 
      };
      const result = validateContactData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('联系人名称不能超过20个字符');
    });

    it('should reject invalid name characters', () => {
      const data = { 
        name: 'Alice@#$', 
        address: 'So11111111111111111111111111111111111111112' 
      };
      const result = validateContactData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('联系人名称包含无效字符');
    });

    it('should accept valid name with spaces and Chinese', () => {
      const data = { 
        name: '张三 Zhang', 
        address: 'So11111111111111111111111111111111111111112' 
      };
      const result = validateContactData(data);
      expect(result.isValid).toBe(true);
    });

    it('should reject empty address', () => {
      const data = { name: 'Alice', address: '' };
      const result = validateContactData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.address).toBe('联系人地址不能为空');
    });

    it('should reject invalid address format', () => {
      const data = { name: 'Alice', address: 'invalid_address' };
      const result = validateContactData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.address).toBe('无效的Solana地址格式');
    });

    it('should accept valid address', () => {
      const data = { 
        name: 'Alice', 
        address: 'So11111111111111111111111111111111111111112' 
      };
      const result = validateContactData(data);
      expect(result.isValid).toBe(true);
    });

    it('should reject long note', () => {
      const data = { 
        name: 'Alice', 
        address: 'So11111111111111111111111111111111111111112',
        note: 'A'.repeat(101)
      };
      const result = validateContactData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.note).toBe('备注不能超过100个字符');
    });

    it('should accept valid note', () => {
      const data = { 
        name: 'Alice', 
        address: 'So11111111111111111111111111111111111111112',
        note: 'My friend from college'
      };
      const result = validateContactData(data);
      expect(result.isValid).toBe(true);
    });

    it('should allow empty note', () => {
      const data = { 
        name: 'Alice', 
        address: 'So11111111111111111111111111111111111111112'
      };
      const result = validateContactData(data);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateToolData', () => {
    it('should validate correct tool data', () => {
      const data = { 
        name: 'Weather API', 
        description: 'Get weather information',
        endpoint: 'https://api.weather.com/v1/forecast',
        method: 'GET'
      };
      const result = validateToolData(data);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('should reject empty name', () => {
      const data = { 
        name: '', 
        description: 'Get weather information',
        endpoint: 'https://api.weather.com/v1/forecast'
      };
      const result = validateToolData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('工具名称不能为空');
    });

    it('should reject short name', () => {
      const data = { 
        name: 'A', 
        description: 'Get weather information',
        endpoint: 'https://api.weather.com/v1/forecast'
      };
      const result = validateToolData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('工具名称至少2个字符');
    });

    it('should reject long name', () => {
      const data = { 
        name: 'A'.repeat(51), 
        description: 'Get weather information',
        endpoint: 'https://api.weather.com/v1/forecast'
      };
      const result = validateToolData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('工具名称不能超过50个字符');
    });

    it('should reject empty description', () => {
      const data = { 
        name: 'Weather API', 
        description: '',
        endpoint: 'https://api.weather.com/v1/forecast'
      };
      const result = validateToolData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.description).toBe('工具描述不能为空');
    });

    it('should reject long description', () => {
      const data = { 
        name: 'Weather API', 
        description: 'A'.repeat(201),
        endpoint: 'https://api.weather.com/v1/forecast'
      };
      const result = validateToolData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.description).toBe('工具描述不能超过200个字符');
    });

    it('should reject empty endpoint', () => {
      const data = { 
        name: 'Weather API', 
        description: 'Get weather information',
        endpoint: ''
      };
      const result = validateToolData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.endpoint).toBe('API端点不能为空');
    });

    it('should reject invalid endpoint URL', () => {
      const data = { 
        name: 'Weather API', 
        description: 'Get weather information',
        endpoint: 'invalid-url'
      };
      const result = validateToolData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.endpoint).toBe('API端点必须是有效的HTTP(S) URL');
    });

    it('should accept HTTP endpoint', () => {
      const data = { 
        name: 'Weather API', 
        description: 'Get weather information',
        endpoint: 'http://api.weather.com/v1/forecast',
        method: 'GET'
      };
      const result = validateToolData(data);
      expect(result.isValid).toBe(true);
    });

    it('should accept HTTPS endpoint', () => {
      const data = { 
        name: 'Weather API', 
        description: 'Get weather information',
        endpoint: 'https://api.weather.com/v1/forecast',
        method: 'POST'
      };
      const result = validateToolData(data);
      expect(result.isValid).toBe(true);
    });

    it('should handle multiple validation errors', () => {
      const data = { 
        name: '', 
        description: '',
        endpoint: 'invalid-url'
      };
      const result = validateToolData(data);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBe(4);
      expect(result.errors.name).toBeTruthy();
      expect(result.errors.description).toBeTruthy();
      expect(result.errors.endpoint).toBeTruthy();
      expect(result.errors.method).toBeTruthy();
    });
  });

  describe('validation utilities', () => {
    describe('validateEmail', () => {
      it('should validate correct email formats', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.org',
          'user+tag@example.co.uk',
          'firstname.lastname@example.com',
          'email@123.123.123.123', // IP地址格式
          '1234567890@example.com',
          'email@example-one.com',
          '_______@example.com',
          'email@example.name'
        ];

        validEmails.forEach(email => {
          const result = validateEmail(email);
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        });
      });

      it('should reject invalid email formats', () => {
        const invalidEmails = [
          'plainaddress',
          '@missinglocalpart.com',
          'missing-at-sign.net',
          'missing-domain@.com',
          'spaces in@email.com',
          'email@',
          'email..double.dot@example.com',
          'email@-example.com',
          'email@example-.com'
        ];

        invalidEmails.forEach(email => {
          const result = validateEmail(email);
          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('请输入有效的邮箱地址');
        });
      });

      it('should handle empty or null values', () => {
        expect(validateEmail('').isValid).toBe(false);
        expect(validateEmail(null).isValid).toBe(false);
        expect(validateEmail(undefined).isValid).toBe(false);
      });
    });

    describe('validatePassword', () => {
      it('should validate strong passwords', () => {
        const strongPasswords = [
          'Password123!',
          'MyStr0ng#Pass',
          'C0mpl3x$P@ssw0rd',
          'Secure123#Password'
        ];

        strongPasswords.forEach(password => {
          const result = validatePassword(password);
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        });
      });

      it('should reject passwords that are too short', () => {
        const shortPasswords = ['123', 'pass', 'Sh0rt!'];

        shortPasswords.forEach(password => {
          const result = validatePassword(password);
          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('密码长度至少8位');
        });
      });

      it('should reject passwords without uppercase letters', () => {
        const result = validatePassword('lowercase123!');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('密码必须包含至少一个大写字母');
      });

      it('should reject passwords without lowercase letters', () => {
        const result = validatePassword('UPPERCASE123!');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('密码必须包含至少一个小写字母');
      });

      it('should reject passwords without numbers', () => {
        const result = validatePassword('NoNumbers!');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('密码必须包含至少一个数字');
      });

      it('should reject passwords without special characters', () => {
        const result = validatePassword('NoSpecialChars123');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('密码必须包含至少一个特殊字符');
      });

      it('should accumulate multiple validation errors', () => {
        const result = validatePassword('weak');
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(1);
        expect(result.errors).toContain('密码长度至少8位');
        expect(result.errors).toContain('密码必须包含至少一个大写字母');
      });

      it('should handle empty or null values', () => {
        expect(validatePassword('').isValid).toBe(false);
        expect(validatePassword(null).isValid).toBe(false);
        expect(validatePassword(undefined).isValid).toBe(false);
      });
    });

    describe('validateUsername', () => {
      it('should validate correct usernames', () => {
        const validUsernames = [
          'user123',
          'test_user',
          'User-Name',
          'username',
          'user',
          'a'.repeat(20) // 20 characters
        ];

        validUsernames.forEach(username => {
          const result = validateUsername(username);
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        });
      });

      it('should reject usernames that are too short', () => {
        const result = validateUsername('ab');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('用户名长度必须在3-20位之间');
      });

      it('should reject usernames that are too long', () => {
        const result = validateUsername('a'.repeat(21));
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('用户名长度必须在3-20位之间');
      });

      it('should reject usernames with invalid characters', () => {
        const invalidUsernames = [
          'user name', // 空格
          'user@name', // 特殊字符
          'user#name',
          'user$name',
          '用户名', // 中文字符
          'user.name' // 点号
        ];

        invalidUsernames.forEach(username => {
          const result = validateUsername(username);
          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('用户名只能包含字母、数字、下划线和连字符');
        });
      });

      it('should handle empty or null values', () => {
        expect(validateUsername('').isValid).toBe(false);
        expect(validateUsername(null).isValid).toBe(false);
        expect(validateUsername(undefined).isValid).toBe(false);
      });
    });

    describe('validateRequired', () => {
      it('should validate non-empty values', () => {
        const validValues = ['text', 'a', '123', 0, false];

        validValues.forEach(value => {
          const result = validateRequired(value);
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        });
      });

      it('should reject empty or null values', () => {
        const invalidValues = [
          '',
          null,
          undefined,
          '   ', // 只有空格
          '\t\n' // 只有空白字符
        ];

        invalidValues.forEach(value => {
          const result = validateRequired(value);
          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('此字段为必填项');
        });
      });

      it('should use custom error message', () => {
        const result = validateRequired('', '请输入用户名');
        expect(result.errors).toContain('请输入用户名');
      });
    });

    describe('validateMinLength', () => {
      it('should validate strings meeting minimum length', () => {
        const result = validateMinLength('hello', 3);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject strings shorter than minimum length', () => {
        const result = validateMinLength('hi', 5);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('长度不能少于5位');
      });

      it('should handle exact minimum length', () => {
        const result = validateMinLength('hello', 5);
        expect(result.isValid).toBe(true);
      });

      it('should handle empty values', () => {
        const result = validateMinLength('', 1);
        expect(result.isValid).toBe(false);
      });
    });

    describe('validateMaxLength', () => {
      it('should validate strings within maximum length', () => {
        const result = validateMaxLength('hello', 10);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject strings longer than maximum length', () => {
        const result = validateMaxLength('hello world', 5);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('长度不能超过5位');
      });

      it('should handle exact maximum length', () => {
        const result = validateMaxLength('hello', 5);
        expect(result.isValid).toBe(true);
      });

      it('should handle empty values', () => {
        const result = validateMaxLength('', 10);
        expect(result.isValid).toBe(true);
      });
    });

    describe('validateForm', () => {
      const sampleRules = {
        username: [validateRequired, (value) => validateMinLength(value, 3)],
        email: [validateRequired, validateEmail],
        password: [validateRequired, validatePassword]
      };

      it('should validate form with all valid fields', () => {
        const formData = {
          username: 'testuser',
          email: 'test@example.com',
          password: 'SecurePass123!'
        };

        const result = validateForm(formData, sampleRules);
        expect(result.isValid).toBe(true);
        expect(Object.keys(result.errors)).toHaveLength(0);
      });

      it('should collect errors from multiple fields', () => {
        const formData = {
          username: 'ab', // 太短
          email: 'invalid-email', // 格式错误
          password: 'weak' // 不满足密码要求
        };

        const result = validateForm(formData, sampleRules);
        expect(result.isValid).toBe(false);
        expect(result.errors.username).toBeDefined();
        expect(result.errors.email).toBeDefined();
        expect(result.errors.password).toBeDefined();
      });

      it('should handle missing fields', () => {
        const formData = {
          username: 'testuser'
          // 缺少 email 和 password
        };

        const result = validateForm(formData, sampleRules);
        expect(result.isValid).toBe(false);
        expect(result.errors.email).toContain('此字段为必填项');
        expect(result.errors.password).toContain('此字段为必填项');
      });

      it('should handle empty form data', () => {
        const result = validateForm({}, sampleRules);
        expect(result.isValid).toBe(false);
        expect(Object.keys(result.errors)).toHaveLength(3);
      });

      it('should handle fields with multiple validation rules', () => {
        const formData = {
          username: '', // 违反必填和最小长度
          email: 'test@example.com',
          password: 'SecurePass123!'
        };

        const result = validateForm(formData, sampleRules);
        expect(result.isValid).toBe(false);
        expect(result.errors.username.length).toBeGreaterThanOrEqual(1);
      });

      it('should stop at first error per field', () => {
        const formData = {
          username: '', // 会触发 required 错误，不会执行后续规则
          email: 'test@example.com',
          password: 'SecurePass123!'
        };

        const result = validateForm(formData, sampleRules);
        expect(result.errors.username).toContain('此字段为必填项');
      });

      it('should handle complex validation scenarios', () => {
        const complexRules = {
          phone: [
            validateRequired,
            (value) => {
              const phoneRegex = /^1[3-9]\d{9}$/;
              if (!phoneRegex.test(value)) {
                return { isValid: false, errors: ['请输入有效的手机号码'] };
              }
              return { isValid: true, errors: [] };
            }
          ],
          age: [
            validateRequired,
            (value) => {
              const age = parseInt(value);
              if (isNaN(age) || age < 18 || age > 120) {
                return { isValid: false, errors: ['年龄必须在18-120之间'] };
              }
              return { isValid: true, errors: [] };
            }
          ]
        };

        const formData = {
          phone: '13812345678',
          age: '25'
        };

        const result = validateForm(formData, complexRules);
        expect(result.isValid).toBe(true);
      });

      it('should handle validation rule exceptions gracefully', () => {
        const faultyRules = {
          field1: [
            (value) => {
              throw new Error('Validation rule error');
            }
          ]
        };

        const formData = { field1: 'test' };
        
        // 验证函数应该能够处理规则执行异常
        expect(() => {
          validateForm(formData, faultyRules);
        }).not.toThrow();
      });
    });

    describe('edge cases and error handling', () => {
      it('should handle non-string values in string validators', () => {
        expect(validateEmail(123).isValid).toBe(false);
        expect(validatePassword(null).isValid).toBe(false);
        expect(validateUsername(undefined).isValid).toBe(false);
      });

      it('should handle very long strings', () => {
        const veryLongString = 'a'.repeat(10000);
        const result = validateMaxLength(veryLongString, 50);
        expect(result.isValid).toBe(false);
      });

      it('should handle special Unicode characters', () => {
        const unicodeString = '测试用户名123';
        const result = validateUsername(unicodeString);
        expect(result.isValid).toBe(false); // 应该拒绝Unicode字符
      });

      it('should handle extremely long email addresses', () => {
        const longEmail = 'a'.repeat(250) + '@example.com';
        const result = validateEmail(longEmail);
        expect(result.isValid).toBe(false);
      });
    });
  });
});
