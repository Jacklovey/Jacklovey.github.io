import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider } from './contexts/SessionContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import MainPage from './pages/MainPage/MainPage';
import LoginPage from './pages/user/LoginPage';
import './styles/global.css';

// 受保护的路由组件
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  console.log('🔒 ProtectedRoute check:', { isAuthenticated, loading });
  
  if (loading) {
    return <div>加载中...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// 应用路由组件 (不包含Router，用于测试)
export function AppRoutes() {
  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <MainPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

// 应用程序提供者包装器 (不包含Router，用于测试)
export function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SessionProvider>
          {children}
        </SessionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <Router>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </Router>
  );
}

export default App;