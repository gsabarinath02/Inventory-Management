import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [form] = Form.useForm();
  const { login, isLoading } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      setLoginError(null);
      await login(values);
      // No navigation here! App.tsx will handle it.
    } catch (err) {
      if (err instanceof Error) {
        setLoginError(err.message);
      } else {
        setLoginError('An unexpected error occurred.');
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ color: '#1890ff', marginBottom: '8px' }}>
            <LoginOutlined style={{ marginRight: '8px' }} />
            Inventory Management
          </Title>
          <Text type="secondary">Sign in to your account</Text>
        </div>

        {(loginError) && (
          <Alert
            message="Login Error"
            description={loginError}
            type="error"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter your email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={isLoading}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Space direction="vertical" size="small">
            <Text type="secondary">Demo Credentials:</Text>
            <Text code>admin@example.com / admin123</Text>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default Login; 