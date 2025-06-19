import React, { useState } from 'react';
import { Form, Input, Button, Card, Toast } from 'antd-mobile';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    console.log('🔐 Login attempt:', { username: values.username, password: '***' });
    setLoading(true);
    
    try {
      console.log('📡 Calling login API...');
      const result = await login(values.username, values.password);
      console.log('✅ Login successful:', result);
      
      Toast.show({
        content: '登录成功',
        icon: 'success'
      });
      navigate('/', { replace: true });
    } catch (error) {
      console.error('❌ Login failed:', error);
      Toast.show({
        content: error.message || '登录失败',
        icon: 'fail'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Solana Earphone</h1>
          <p>语音智能助手</p>
        </div>

        <Card className={styles.loginCard}>
          <Form
            onFinish={handleSubmit}
            footer={
              <Button 
                block 
                type="submit" 
                color="primary" 
                size="large"
                loading={loading}
                data-testid="login-button"
              >
                登录
              </Button>
            }
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' }
              ]}
            >
              <Input 
                placeholder="请输入用户名"
                data-testid="username-input"
              />
            </Form.Item>
            
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
            >
              <Input 
                type="password"
                placeholder="请输入密码"
                data-testid="password-input"
              />
            </Form.Item>
          </Form>
        </Card>

        <div className={styles.footer}>
          <p>首次使用？请联系管理员获取账号</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;