import apiClient from '../apiClient';

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('apiClient', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  describe('Authentication', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        access_token: 'mock-jwt-token',
        token_type: 'bearer',
        expires_in: 3600,
        user_id: 1,
        username: 'testuser'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Map(),
        status: 200,
        statusText: 'OK'
      });

      const result = await apiClient.login('testuser', 'password123');

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/v1/api/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: expect.any(URLSearchParams)
      });

      expect(result).toEqual(mockResponse);
    });

    it('should throw error for invalid credentials', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ message: 'Invalid credentials' }),
        headers: new Map()
      });

      await expect(apiClient.login('testuser', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should handle network errors during login', async () => {
      fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(apiClient.login('testuser', 'password123'))
        .rejects.toThrow('无法连接到服务器，请检查后端服务是否正常运行');
    });

    it('should logout successfully', async () => {
      localStorageMock.getItem.mockReturnValue('mock-token');
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
        headers: new Map(),
        status: 200,
        statusText: 'OK'
      });

      const result = await apiClient.post('/v1/api/auth/logout');

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/v1/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({})
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('Voice Interpretation', () => {
    it('should interpret user query successfully', async () => {
      localStorageMock.getItem.mockReturnValue('mock-token');
      
      const mockResponse = {
        type: 'tool_call',
        tool_calls: [{ tool_id: 'weather', parameters: { city: '上海' } }],
        confirmText: '您想查询上海的天气吗？',
        sessionId: 'session-123'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Map(),
        status: 200,
        statusText: 'OK'
      });

      const result = await apiClient.interpret({ query: '查询上海天气' });

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/v1/api/interpret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({ query: '查询上海天气' })
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle interpretation errors', async () => {
      localStorageMock.getItem.mockReturnValue('mock-token');
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ message: 'Invalid query format' }),
        headers: new Map()
      });

      await expect(apiClient.interpret({ query: '' }))
        .rejects.toThrow('Invalid query format');
    });

    it('should include session ID in interpretation request', async () => {
      localStorageMock.getItem.mockReturnValue('mock-token');
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
        headers: new Map(),
        status: 200,
        statusText: 'OK'
      });

      await apiClient.interpret({
        query: '测试查询',
        session_id: 'existing-session-456'
      });

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/v1/api/interpret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({
          query: '测试查询',
          session_id: 'existing-session-456'
        })
      });
    });
  });

  describe('Tool Execution', () => {
    it('should execute tools successfully', async () => {
      localStorageMock.getItem.mockReturnValue('mock-token');
      
      const tool_calls = [{ tool_id: 'weather', parameters: { city: '上海' } }];
      
      const mockResponse = {
        success: true,
        results: [{ tool_id: 'weather', data: { temperature: '25°C' } }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Map(),
        status: 200,
        statusText: 'OK'
      });

      const result = await apiClient.execute({ tool_calls });

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/v1/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({ tool_calls })
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle execution errors', async () => {
      localStorageMock.getItem.mockReturnValue('mock-token');
      
      const tool_calls = [{ tool_id: 'invalid_tool' }];

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ message: 'Tool execution failed' }),
        headers: new Map()
      });

      await expect(apiClient.execute({ tool_calls }))
        .rejects.toThrow('Tool execution failed');
    });

    it('should include session ID in execution request', async () => {
      localStorageMock.getItem.mockReturnValue('mock-token');
      
      const tool_calls = [{ tool_id: 'weather' }];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
        headers: new Map(),
        status: 200,
        statusText: 'OK'
      });

      await apiClient.execute({ 
        tool_calls,
        session_id: 'test-session-789'
      });

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/v1/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({
          tool_calls,
          session_id: 'test-session-789'
        })
      });
    });
  });

  describe('Tools Management', () => {
    it('should fetch tools list', async () => {
      localStorageMock.getItem.mockReturnValue('mock-token');
      
      const mockTools = [
        { id: 'weather', name: '天气查询', type: 'http' },
        { id: 'calculator', name: '计算器', type: 'builtin' }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTools),
        headers: new Map(),
        status: 200,
        statusText: 'OK'
      });

      const result = await apiClient.getTools();

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/v1/api/tools', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        }
      });

      expect(result).toEqual(mockTools);
    });

    it('should handle tools fetch error', async () => {
      localStorageMock.getItem.mockReturnValue('mock-token');
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ message: 'Access denied' }),
        headers: new Map()
      });

      await expect(apiClient.getTools())
        .rejects.toThrow('Access denied');
    });
  });

  describe('User Configuration', () => {
    it('should fetch user configuration', async () => {
      localStorageMock.getItem.mockReturnValue('mock-token');
      
      const mockConfig = {
        theme: 'dark',
        language: 'zh-CN',
        voiceSettings: { rate: 1.0, pitch: 1.0, volume: 1.0 }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfig),
        headers: new Map(),
        status: 200,
        statusText: 'OK'
      });

      const result = await apiClient.getUserConfig();

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/v1/api/user/config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        }
      });

      expect(result).toEqual(mockConfig);
    });

    it('should update user configuration', async () => {
      localStorageMock.getItem.mockReturnValue('mock-token');
      
      const config = {
        theme: 'light',
        language: 'en-US',
        voiceSettings: { rate: 1.2, pitch: 1.1, volume: 0.8 }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
        headers: new Map(),
        status: 200,
        statusText: 'OK'
      });

      const result = await apiClient.updateUserConfig(config);

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/v1/api/user/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(config)
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('Authorization Headers', () => {
    it('should include authorization header when token exists', async () => {
      localStorageMock.getItem.mockReturnValue('test-token-123');
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
        headers: new Map(),
        status: 200,
        statusText: 'OK'
      });

      await apiClient.getTools();

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/v1/api/tools', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token-123'
        }
      });
    });

    it('should not include authorization header when no token', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
        headers: new Map(),
        status: 200,
        statusText: 'OK'
      });

      await apiClient.getTools();

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/v1/api/tools', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Not found' }),
        headers: new Map()
      });

      await expect(apiClient.getTools())
        .rejects.toThrow('Not found');
    });

    it('should handle 500 errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ message: 'Internal server error' }),
        headers: new Map()
      });

      await expect(apiClient.interpret({ query: 'test' }))
        .rejects.toThrow('Internal server error');
    });

    it('should handle malformed JSON responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.reject(new Error('Invalid JSON')),
        headers: new Map()
      });

      await expect(apiClient.execute({ tool_calls: [] }))
        .rejects.toThrow('HTTP 400: Bad Request');
    });

    it('should handle network timeout errors', async () => {
      fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(apiClient.getTools())
        .rejects.toThrow('无法连接到服务器，请检查后端服务是否正常运行');
    });
  });

  describe('Request Configuration', () => {
    it('should use correct base URL', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
        headers: new Map(),
        status: 200,
        statusText: 'OK'
      });

      await apiClient.getTools();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:8000/v1/api/tools'),
        expect.any(Object)
      );
    });

    it('should set correct content type for JSON requests', async () => {
      localStorageMock.getItem.mockReturnValue('token');
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
        headers: new Map(),
        status: 200,
        statusText: 'OK'
      });

      await apiClient.interpret({ query: 'test' });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should set correct content type for form requests', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
        headers: new Map(),
        status: 200,
        statusText: 'OK'
      });

      await apiClient.login('user', 'pass');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded'
          })
        })
      );
    });
  });
});
