/**
 * API客户端模块
 * 提供与后端API通信的接口
 */

// 环境变量处理，支持 GitHub Pages 部署
const getApiBaseUrl = () => {
  // 生产环境 - GitHub Pages (使用Mock模式)
  if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
    // GitHub Pages 环境使用 Mock API
    return 'https://github-pages-mock-api';
  }
  
  // 开发环境
  if (typeof process !== 'undefined' && process.env && process.env.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }
  
  // 在浏览器环境中，检查全局配置
  if (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.API_URL) {
    return window.APP_CONFIG.API_URL;
  }
  
  // 默认开发环境地址
  return 'http://localhost:8001';
};

// 检查是否为 GitHub Pages 环境
const isGitHubPages = () => {
  return typeof window !== 'undefined' && 
         (window.location.hostname.includes('github.io') || 
          window.location.hostname.includes('github.com'));
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔧 API配置调试信息:');
console.log('- 最终API_BASE_URL:', API_BASE_URL);
console.log('- GitHub Pages环境:', isGitHubPages());

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    console.log('🏗️ ApiClient初始化，baseURL:', this.baseURL);
  }

  // 获取认证头
  getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // GitHub Pages Mock API 响应
  getMockResponse(endpoint, options) {
    console.log('🎭 使用Mock API响应:', endpoint);
    
    // 模拟延迟
    const delay = Math.random() * 500 + 200;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        switch (endpoint) {
          case '/v1/api/auth/token':
            resolve({
              access_token: 'mock_token_' + Date.now(),
              token_type: 'bearer',
              expires_in: 3600,
              user: {
                id: 1,
                username: 'demo_user',
                email: 'demo@example.com'
              }
            });
            break;

          case '/v1/api/user/profile':
            resolve({
              id: 1,
              username: 'demo_user',
              email: 'demo@example.com',
              created_at: '2024-01-01T00:00:00Z'
            });
            break;

          case '/v1/api/voice/upload':
            resolve({
              message: 'Voice uploaded successfully (Mock)',
              transcription: '这是一个模拟的语音转录结果',
              confidence: 0.95
            });
            break;

          case '/v1/api/tools/list':
            resolve({
              tools: [
                { id: 1, name: 'Mock Tool 1', description: '模拟工具1' },
                { id: 2, name: 'Mock Tool 2', description: '模拟工具2' }
              ]
            });
            break;

          default:
            resolve({
              message: 'Mock API response',
              data: {},
              timestamp: new Date().toISOString()
            });
        }
      }, delay);
    });
  }

  // 通用请求方法
  async request(endpoint, options = {}) {
    // 检查是否在GitHub Pages环境下使用Mock API
    if (this.baseURL === 'https://github-pages-mock-api') {
      console.log('🎭 GitHub Pages环境，使用Mock API');
      return this.getMockResponse(endpoint, options);
    }

    const url = `${this.baseURL}${endpoint}`;
    console.log('🔗 API请求 URL:', url);
    console.log('🔧 请求配置:', options);
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log('📡 发送请求到:', url);
      console.log('📋 请求头:', config.headers);
      
      const response = await fetch(url, config);
      
      console.log('📥 响应状态:', response.status, response.statusText);
      console.log('📥 响应头:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API错误响应:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ API成功响应:', result);
      return result;
    } catch (error) {
      console.error('💥 API请求失败:', error);
      console.error('🔍 错误详情:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // 提供更友好的错误信息
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('无法连接到服务器，请检查后端服务是否正常运行');
      }
      
      throw error;
    }
  }

  // GET请求
  async get(endpoint, params = {}) {
    const searchParams = new URLSearchParams(params);
    const url = searchParams.toString() ? `${endpoint}?${searchParams}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  // POST请求
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT请求
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE请求
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // 登录 - 特殊处理，使用表单格式
  async login(username, password) {
    console.log('🌐 ApiClient.login called with:', { username, password: '***' });
    
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    console.log('📡 Making login request to:', `${this.baseURL}/v1/api/auth/token`);
    
    const result = await this.request('/v1/api/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });
    
    console.log('✅ Login response:', result);
    return result;
  }

  // 注册
  async register(userData) {
    return this.post('/v1/api/auth/register', userData);
  }

  // 刷新令牌
  async refreshToken() {
    return this.post('/v1/api/auth/refresh');
  }

  // 意图解析
  async interpret(data) {
    return this.post('/v1/api/interpret', data);
  }

  // 工具执行
  async execute(data) {
    return this.post('/v1/api/execute', data);
  }

  // 获取工具列表
  async getTools() {
    return this.get('/v1/api/tools');
  }

  // 开发者工具管理
  async getDevTools() {
    return this.get('/v1/api/dev/tools');
  }

  async createTool(toolData) {
    return this.post('/v1/api/dev/tools', toolData);
  }

  async updateTool(toolId, toolData) {
    return this.put(`/v1/api/dev/tools/${toolId}`, toolData);
  }

  async deleteTool(toolId) {
    return this.delete(`/v1/api/dev/tools/${toolId}`);
  }

  // 用户配置
  async getUserConfig() {
    return this.get('/v1/api/user/config');
  }

  async updateUserConfig(config) {
    return this.put('/v1/api/user/config', config);
  }
}

// 创建单例实例
const apiClient = new ApiClient();

// 导出具体的API方法，便于使用
export const login = (username, password) => apiClient.login(username, password);
export const register = (userData) => apiClient.register(userData);
export const refreshToken = () => apiClient.refreshToken();
export const interpret = (data) => apiClient.interpret(data);
export const execute = (data) => apiClient.execute(data);
export const getTools = () => apiClient.getTools();
export const getDevTools = () => apiClient.getDevTools();
export const createTool = (toolData) => apiClient.createTool(toolData);
export const updateTool = (toolId, toolData) => apiClient.updateTool(toolId, toolData);
export const deleteTool = (toolId) => apiClient.deleteTool(toolId);
export const getUserConfig = () => apiClient.getUserConfig();
export const updateUserConfig = (config) => apiClient.updateUserConfig(config);

export default apiClient;