import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import * as apiClient from '../../services/apiClient';

// 模拟 API 客户端
jest.mock('../../services/apiClient', () => ({
  login: jest.fn(),
  refreshToken: jest.fn(),
}));

// 模拟 localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// 测试用的包装器组件
const TestWrapper = ({ children }) => (
  <AuthProvider>
    {children}
  </AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('AuthProvider', () => {
    it('should initialize with unauthenticated state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should restore authentication state from localStorage', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        switch (key) {
          case 'auth_token':
            return 'mock-token';
          case 'user_id':
            return '123';
          case 'username':
            return 'testuser';
          case 'user_role':
            return 'user';
          default:
            return null;
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        id: '123',
        username: 'testuser',
        role: 'user'
      });
    });

    it('should handle incomplete localStorage data gracefully', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        switch (key) {
          case 'auth_token':
            return 'mock-token';
          case 'username':
            return 'testuser';
          default:
            return null; // 缺少 user_id 和 user_role
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('login functionality', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        access_token: 'new-token',
        user_id: 456,
        username: 'newuser',
        role: 'admin'
      };

      apiClient.login.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      
      await act(async () => {
        await result.current.loginUser('newuser', 'password123');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        id: 456,
        username: 'newuser',
        role: 'admin'
      });
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);

      // 验证 localStorage 调用
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'new-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user_id', 456);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('username', 'newuser');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user_role', 'admin');
    });

    it('should handle login failure with invalid credentials', async () => {
      const mockError = new Error('用户名或密码错误');
      apiClient.login.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      
      await act(async () => {
        await result.current.loginUser('wronguser', 'wrongpass');
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBe('用户名或密码错误');
      expect(result.current.isLoading).toBe(false);

      // 不应该设置 localStorage
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should set loading state during login', async () => {
      let resolveLogin;
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      });
      apiClient.login.mockReturnValue(loginPromise);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      
      act(() => {
        result.current.loginUser('testuser', 'password');
      });

      // 应该处于加载状态
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();

      // 完成登录
      await act(async () => {
        resolveLogin({
          access_token: 'token',
          user_id: 1,
          username: 'testuser',
          role: 'user'
        });
        await loginPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should clear previous error when starting new login', async () => {
      // 先设置一个错误状态
      const mockError = new Error('Previous error');
      apiClient.login.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      
      await act(async () => {
        await result.current.loginUser('user1', 'pass1');
      });

      expect(result.current.error).toBe('Previous error');

      // 开始新的登录，应该清除之前的错误
      apiClient.login.mockResolvedValue({
        access_token: 'token',
        user_id: 1,
        username: 'user2',
        role: 'user'
      });

      await act(async () => {
        await result.current.loginUser('user2', 'pass2');
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('logout functionality', () => {
    it('should logout and clear all stored data', () => {
      // 先设置已认证状态
      localStorageMock.getItem.mockImplementation((key) => {
        switch (key) {
          case 'auth_token':
            return 'existing-token';
          case 'user_id':
            return '123';
          case 'username':
            return 'testuser';
          case 'user_role':
            return 'user';
          default:
            return null;
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      
      // 验证初始状态
      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logoutUser();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();

      // 验证 localStorage 清理
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user_id');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('username');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user_role');
    });
  });

  describe('token refresh functionality', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = {
        access_token: 'new-refreshed-token',
        token_type: 'bearer'
      };

      apiClient.refreshToken.mockResolvedValue(mockResponse);

      // 设置初始认证状态
      localStorageMock.getItem.mockImplementation((key) => {
        switch (key) {
          case 'auth_token':
            return 'old-token';
          case 'user_id':
            return '123';
          case 'username':
            return 'testuser';
          case 'user_role':
            return 'user';
          default:
            return null;
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      
      await act(async () => {
        await result.current.refreshUserToken();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'new-refreshed-token');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle token refresh failure', async () => {
      const mockError = new Error('Token refresh failed');
      apiClient.refreshToken.mockRejectedValue(mockError);

      // 设置初始认证状态
      localStorageMock.getItem.mockImplementation((key) => {
        switch (key) {
          case 'auth_token':
            return 'expired-token';
          case 'user_id':
            return '123';
          case 'username':
            return 'testuser';
          case 'user_role':
            return 'user';
          default:
            return null;
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      
      await act(async () => {
        await result.current.refreshUserToken();
      });

      // 刷新失败应该登出用户
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';
      apiClient.login.mockRejectedValue(networkError);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      
      await act(async () => {
        await result.current.loginUser('testuser', 'password');
      });

      expect(result.current.error).toContain('网络连接失败');
    });

    it('should handle server errors gracefully', async () => {
      const serverError = new Error('Internal Server Error');
      serverError.status = 500;
      apiClient.login.mockRejectedValue(serverError);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      
      await act(async () => {
        await result.current.loginUser('testuser', 'password');
      });

      expect(result.current.error).toContain('服务器错误');
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      const TestComponent = () => {
        useAuth();
        return <div>Test</div>;
      };

      // 使用 console.error 的 mock 来避免测试输出中的错误信息
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = originalError;
    });

    it('should provide all required context values', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('loginUser');
      expect(result.current).toHaveProperty('logoutUser');
      expect(result.current).toHaveProperty('refreshUserToken');
      
      expect(typeof result.current.loginUser).toBe('function');
      expect(typeof result.current.logoutUser).toBe('function');
      expect(typeof result.current.refreshUserToken).toBe('function');
    });
  });

  describe('edge cases', () => {
    it('should handle missing token gracefully', async () => {
      apiClient.login.mockResolvedValue({
        // 缺少 access_token
        user_id: 1,
        username: 'testuser',
        role: 'user'
      });

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      
      await act(async () => {
        await result.current.loginUser('testuser', 'password');
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toContain('登录响应格式错误');
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'auth_token') {
          throw new Error('localStorage is corrupted');
        }
        return null;
      });

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      
      // 应该回退到未认证状态
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should handle simultaneous login attempts', async () => {
      let resolveFirst, resolveSecond;
      
      apiClient.login
        .mockReturnValueOnce(new Promise(resolve => { resolveFirst = resolve; }))
        .mockReturnValueOnce(new Promise(resolve => { resolveSecond = resolve; }));

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      
      // 同时发起两个登录请求
      const firstLogin = act(async () => {
        await result.current.loginUser('user1', 'pass1');
      });
      
      const secondLogin = act(async () => {
        await result.current.loginUser('user2', 'pass2');
      });

      // 第二个请求应该取消第一个
      await act(async () => {
        resolveSecond({
          access_token: 'token2',
          user_id: 2,
          username: 'user2',
          role: 'user'
        });
        await secondLogin;
      });

      expect(result.current.user.username).toBe('user2');
    });
  });
});
