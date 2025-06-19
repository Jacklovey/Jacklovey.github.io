import { classifyIntent, extractEntities, validateIntentAndEntities, generateConfirmationMessage, INTENT_TYPES } from '../intentClassifier';

describe('intentClassifier', () => {
  describe('classifyIntent', () => {
    it('should classify transfer intent', () => {
      const result = classifyIntent('我要转账给Alice 10 SOL');
      expect(result.intent).toBe(INTENT_TYPES.TRANSFER);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.matchedKeywords).toContain('转账');
    });

    it('should classify query balance intent', () => {
      const result = classifyIntent('查看我的余额');
      expect(result.intent).toBe(INTENT_TYPES.QUERY_BALANCE);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should classify query transaction intent', () => {
      const result = classifyIntent('查看交易记录');
      expect(result.intent).toBe(INTENT_TYPES.QUERY_TRANSACTION);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should classify contact management intent', () => {
      const result = classifyIntent('添加联系人');
      expect(result.intent).toBe(INTENT_TYPES.CONTACT_MANAGEMENT);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should classify settings intent', () => {
      const result = classifyIntent('打开设置');
      expect(result.intent).toBe(INTENT_TYPES.SETTINGS);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should classify help intent', () => {
      const result = classifyIntent('帮助我');
      expect(result.intent).toBe(INTENT_TYPES.HELP);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should return unknown for empty text', () => {
      const result = classifyIntent('');
      expect(result.intent).toBe(INTENT_TYPES.UNKNOWN);
      expect(result.confidence).toBe(0);
    });

    it('should return unknown for null/undefined', () => {
      const result1 = classifyIntent(null);
      const result2 = classifyIntent(undefined);
      expect(result1.intent).toBe(INTENT_TYPES.UNKNOWN);
      expect(result2.intent).toBe(INTENT_TYPES.UNKNOWN);
    });

    it('should return unknown for non-string input', () => {
      const result = classifyIntent(123);
      expect(result.intent).toBe(INTENT_TYPES.UNKNOWN);
      expect(result.confidence).toBe(0);
    });

    it('should return unknown for unrecognized text', () => {
      const result = classifyIntent('xyz random text');
      expect(result.intent).toBe(INTENT_TYPES.UNKNOWN);
      expect(result.confidence).toBe(0);
    });

    it('should handle English keywords', () => {
      const result = classifyIntent('transfer money to Bob');
      expect(result.intent).toBe(INTENT_TYPES.TRANSFER);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should return highest confidence intent', () => {
      const result = classifyIntent('transfer help'); // both transfer and help keywords
      // help comes after transfer in the object, so it will have higher confidence due to the algorithm
      expect(result.intent).toBe(INTENT_TYPES.HELP);
    });
  });

  describe('extractEntities', () => {
    it('should extract transfer entities', () => {
      const entities = extractEntities('我要转账给Alice 10 SOL', INTENT_TYPES.TRANSFER);
      expect(entities.amount).toBe(10);
      expect(entities.recipient).toBe('Alice');
      expect(entities.currency).toBe('SOL');
    });

    it('should extract transfer entities with decimal amount', () => {
      const entities = extractEntities('转给Bob 5.5 USDC', INTENT_TYPES.TRANSFER);
      expect(entities.amount).toBe(5.5);
      expect(entities.recipient).toBe('Bob');
      expect(entities.currency).toBe('USDC');
    });

    it('should extract balance query entities', () => {
      const entities = extractEntities('查看SOL余额', INTENT_TYPES.QUERY_BALANCE);
      expect(entities.currency).toBe('SOL');
    });

    it('should extract contact management entities', () => {
      const entities = extractEntities('添加联系人Charlie', INTENT_TYPES.CONTACT_MANAGEMENT);
      expect(entities.contactName).toBe('Charlie');
      expect(entities.action).toBe('add');
    });

    it('should extract delete contact entities', () => {
      const entities = extractEntities('删除联系人David', INTENT_TYPES.CONTACT_MANAGEMENT);
      expect(entities.contactName).toBe('David');
      expect(entities.action).toBe('delete');
    });

    it('should extract search contact entities', () => {
      const entities = extractEntities('查找联系人Eve', INTENT_TYPES.CONTACT_MANAGEMENT);
      expect(entities.contactName).toBe('Eve');
      expect(entities.action).toBe('search');
    });

    it('should return empty object for invalid input', () => {
      const entities1 = extractEntities('', INTENT_TYPES.TRANSFER);
      const entities2 = extractEntities(null, INTENT_TYPES.TRANSFER);
      const entities3 = extractEntities(123, INTENT_TYPES.TRANSFER);
      
      expect(entities1).toEqual({});
      expect(entities2).toEqual({});
      expect(entities3).toEqual({});
    });

    it('should handle unknown intent type', () => {
      const entities = extractEntities('some text', 'unknown_intent');
      expect(entities).toEqual({});
    });

    it('should preserve case in recipient name', () => {
      const entities = extractEntities('转给AlicE 10 SOL', INTENT_TYPES.TRANSFER);
      expect(entities.recipient).toBe('AlicE');
    });
  });

  describe('validateIntentAndEntities', () => {
    it('should validate valid transfer intent and entities', () => {
      const entities = { amount: 10, recipient: 'Alice', currency: 'SOL' };
      const result = validateIntentAndEntities(INTENT_TYPES.TRANSFER, entities);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should validate invalid transfer without amount', () => {
      const entities = { recipient: 'Alice', currency: 'SOL' };
      const result = validateIntentAndEntities(INTENT_TYPES.TRANSFER, entities);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('请指定有效的转账金额');
    });

    it('should validate invalid transfer without recipient', () => {
      const entities = { amount: 10, currency: 'SOL' };
      const result = validateIntentAndEntities(INTENT_TYPES.TRANSFER, entities);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('请指定转账接收方');
    });

    it('should add default currency for transfer', () => {
      const entities = { amount: 10, recipient: 'Alice' };
      const result = validateIntentAndEntities(INTENT_TYPES.TRANSFER, entities);
      expect(result.warnings).toContain('未指定货币类型，将使用默认的 SOL');
      expect(entities.currency).toBe('SOL');
    });

    it('should validate contact management add action', () => {
      const entities = { action: 'add', contactName: 'Alice' };
      const result = validateIntentAndEntities(INTENT_TYPES.CONTACT_MANAGEMENT, entities);
      expect(result.isValid).toBe(true);
    });

    it('should validate invalid contact management add without name', () => {
      const entities = { action: 'add' };
      const result = validateIntentAndEntities(INTENT_TYPES.CONTACT_MANAGEMENT, entities);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('请指定要添加的联系人名称');
    });

    it('should validate invalid contact management delete without name', () => {
      const entities = { action: 'delete' };
      const result = validateIntentAndEntities(INTENT_TYPES.CONTACT_MANAGEMENT, entities);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('请指定要删除的联系人名称');
    });

    it('should validate unknown intent type', () => {
      const entities = {};
      const result = validateIntentAndEntities('unknown_intent', entities);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('generateConfirmationMessage', () => {
    it('should generate transfer confirmation message', () => {
      const entities = { amount: 10, recipient: 'Alice', currency: 'SOL' };
      const message = generateConfirmationMessage(INTENT_TYPES.TRANSFER, entities);
      expect(message).toBe('您要向 Alice 转账 10 SOL，是否确认？');
    });

    it('should generate transfer confirmation with default currency', () => {
      const entities = { amount: 10, recipient: 'Alice' };
      const message = generateConfirmationMessage(INTENT_TYPES.TRANSFER, entities);
      expect(message).toBe('您要向 Alice 转账 10 SOL，是否确认？');
    });

    it('should generate balance query confirmation', () => {
      const entities = { currency: 'SOL' };
      const message = generateConfirmationMessage(INTENT_TYPES.QUERY_BALANCE, entities);
      expect(message).toBe('您要查询 SOL 的账户余额，是否确认？');
    });

    it('should generate balance query confirmation without currency', () => {
      const entities = {};
      const message = generateConfirmationMessage(INTENT_TYPES.QUERY_BALANCE, entities);
      expect(message).toBe('您要查询 所有 的账户余额，是否确认？');
    });

    it('should generate transaction query confirmation', () => {
      const message = generateConfirmationMessage(INTENT_TYPES.QUERY_TRANSACTION, {});
      expect(message).toBe('您要查看交易记录，是否确认？');
    });

    it('should generate add contact confirmation', () => {
      const entities = { action: 'add', contactName: 'Alice' };
      const message = generateConfirmationMessage(INTENT_TYPES.CONTACT_MANAGEMENT, entities);
      expect(message).toBe('您要添加联系人 Alice，是否确认？');
    });

    it('should generate delete contact confirmation', () => {
      const entities = { action: 'delete', contactName: 'Bob' };
      const message = generateConfirmationMessage(INTENT_TYPES.CONTACT_MANAGEMENT, entities);
      expect(message).toBe('您要删除联系人 Bob，是否确认？');
    });

    it('should generate generic contact management confirmation', () => {
      const entities = { action: 'search' };
      const message = generateConfirmationMessage(INTENT_TYPES.CONTACT_MANAGEMENT, entities);
      expect(message).toBe('您要管理联系人，是否确认？');
    });

    it('should generate settings confirmation', () => {
      const message = generateConfirmationMessage(INTENT_TYPES.SETTINGS, {});
      expect(message).toBe('您要打开设置页面，是否确认？');
    });

    it('should generate help confirmation', () => {
      const message = generateConfirmationMessage(INTENT_TYPES.HELP, {});
      expect(message).toBe('您要查看帮助信息，是否确认？');
    });

    it('should generate unknown intent message', () => {
      const message = generateConfirmationMessage(INTENT_TYPES.UNKNOWN, {});
      expect(message).toBe('抱歉，我没有理解您的意图，请重新说明');
    });

    it('should generate default message for unhandled intent', () => {
      const message = generateConfirmationMessage('custom_intent', {});
      expect(message).toBe('抱歉，我没有理解您的意图，请重新说明');
    });
  });
});
