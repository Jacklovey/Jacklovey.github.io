import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { login, refreshToken } from '../services/apiClient';

// 初始状态
const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  role: null,
  loading: true,
  error: null
};

// 动作类型
const ActionTypes = {
  LOGIN_REQUEST: 'LOGIN_REQUEST',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REFRESH_TOKEN: 'REFRESH_TOKEN'
};

// Reducer 函数
function authReducer(state, action) {
  switch (action.type) {
    case ActionTypes.LOGIN_REQUEST:
      return { ...state, loading: true, error: null };
    case ActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        role: action.payload.role,
        loading: false,
        error: null
      };
    case ActionTypes.LOGIN_FAILURE:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        role: null,
        loading: false,
        error: action.payload
      };
    case ActionTypes.LOGOUT:
      return {
        ...initialState,
        loading: false
      };
    case ActionTypes.REFRESH_TOKEN:
      return {
        ...state,
        token: action.payload
      };
    default:
      return state;
  }
}

// 创建上下文
const AuthContext = createContext();

// 认证提供者组件
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // 从 localStorage 恢复认证状态
  useEffect(() => {
    console.log('🔍 AuthContext: Checking localStorage for saved auth...');
    
    const token = localStorage.getItem('auth_token');
    const userId = localStorage.getItem('user_id');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('user_role');
    
    console.log('💾 Found in localStorage:', { token: token ? 'present' : 'none', userId, username, role });
    
    if (token && userId && username) {
      console.log('✅ Restoring authentication state');
      dispatch({
        type: ActionTypes.LOGIN_SUCCESS,
        payload: {
          token,
          user: { id: userId, username },
          role
        }
      });
    } else {
      console.log('❌ No valid auth found, logging out');
      dispatch({ type: ActionTypes.LOGOUT });
    }
  }, []);
  
  // 登录方法
  const loginUser = async (username, password) => {
    console.log('🔐 AuthContext.loginUser called');
    dispatch({ type: ActionTypes.LOGIN_REQUEST });
    
    try {
      console.log('📡 Calling API login...');
      const response = await login(username, password);
      console.log('✅ API login successful:', response);
      
      // 保存认证信息到 localStorage
      localStorage.setItem('auth_token', response.access_token);
      localStorage.setItem('user_id', response.user_id);
      localStorage.setItem('username', response.username);
      localStorage.setItem('user_role', response.role);
      
      console.log('💾 Saved auth to localStorage');
      
      dispatch({
        type: ActionTypes.LOGIN_SUCCESS,
        payload: {
          token: response.access_token,
          user: { id: response.user_id, username: response.username },
          role: response.role
        }
      });
      
      console.log('🎉 Login dispatch successful');
      return response;
    } catch (error) {
      console.error('❌ Login failed:', error);
      dispatch({
        type: ActionTypes.LOGIN_FAILURE,
        payload: error.message
      });
      
      throw error;
    }
  };
  
  // 刷新令牌方法
  const refreshUserToken = async () => {
    try {
      const response = await refreshToken();
      
      localStorage.setItem('auth_token', response.access_token);
      
      dispatch({
        type: ActionTypes.REFRESH_TOKEN,
        payload: response.access_token
      });
      
      return response.access_token;
    } catch (error) {
      dispatch({ type: ActionTypes.LOGOUT });
      throw error;
    }
  };
  
  // 登出方法
  const logoutUser = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('user_role');
    
    dispatch({ type: ActionTypes.LOGOUT });
  };
  
  const value = {
    ...state,
    login: loginUser,
    logout: logoutUser,
    refreshToken: refreshUserToken
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 自定义 Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}