import React, { createContext, useReducer, useContext } from 'react';

// 初始状态
const initialState = {
  sessionId: null,
  stage: 'idle', // idle, recording, interpreting, confirming, executing, completed
  statusMessage: null,
  toolCalls: null,
  confirmText: null,
  result: null,
  error: null
};

// 动作类型
const ActionTypes = {
  SET_SESSION_ID: 'SET_SESSION_ID',
  SET_STAGE: 'SET_STAGE',
  SET_STATUS_MESSAGE: 'SET_STATUS_MESSAGE',
  SET_TOOL_CALLS: 'SET_TOOL_CALLS',
  SET_CONFIRM_TEXT: 'SET_CONFIRM_TEXT',
  SET_RESULT: 'SET_RESULT',
  SET_ERROR: 'SET_ERROR',
  RESET: 'RESET'
};

// Reducer 函数
function sessionReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_SESSION_ID:
      return { ...state, sessionId: action.payload };
    case ActionTypes.SET_STAGE:
      return { ...state, stage: action.payload };
    case ActionTypes.SET_STATUS_MESSAGE:
      return { ...state, statusMessage: action.payload };
    case ActionTypes.SET_TOOL_CALLS:
      return { ...state, toolCalls: action.payload };
    case ActionTypes.SET_CONFIRM_TEXT:
      return { ...state, confirmText: action.payload };
    case ActionTypes.SET_RESULT:
      return { ...state, result: action.payload };
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    case ActionTypes.RESET:
      return { ...initialState, sessionId: state.sessionId };
    default:
      return state;
  }
}

// 创建上下文
const SessionContext = createContext();

// 会话提供者组件
export function SessionProvider({ children }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);
  
  // 封装 dispatch 操作
  const setSessionId = (sessionId) => dispatch({ type: ActionTypes.SET_SESSION_ID, payload: sessionId });
  const setStage = (stage) => dispatch({ type: ActionTypes.SET_STAGE, payload: stage });
  const setStatusMessage = (message) => dispatch({ type: ActionTypes.SET_STATUS_MESSAGE, payload: message });
  const setToolCalls = (toolCalls) => dispatch({ type: ActionTypes.SET_TOOL_CALLS, payload: toolCalls });
  const setConfirmText = (text) => dispatch({ type: ActionTypes.SET_CONFIRM_TEXT, payload: text });
  const setResult = (result) => dispatch({ type: ActionTypes.SET_RESULT, payload: result });
  const setError = (error) => dispatch({ type: ActionTypes.SET_ERROR, payload: error });
  const reset = () => dispatch({ type: ActionTypes.RESET });
  
  const value = {
    ...state,
    setSessionId,
    setStage,
    setStatusMessage,
    setToolCalls,
    setConfirmText,
    setResult,
    setError,
    reset
  };
  
  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

// 自定义 Hook
export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession 必须在 SessionProvider 内部使用');
  }
  return context;
}