import React from 'react';
import { Form, Input, Button, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { motion, Variants } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const { Title, Text } = Typography;

const Illustration = () => (
  <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480">
    <defs>
      <style>{`.cls-1{fill:#f1f3f9;}.cls-2{fill:#2b74f8;}.cls-3{fill:#a6bffd;}.cls-4{fill:#d3e2ff;}.cls-5{fill:#fff;}`}</style>
    </defs>
    <path className="cls-1" d="M128,128H448a32,32,0,0,1,32,32V448a32,32,0,0,1-32,32H128a32,32,0,0,1-32-32V160A32,32,0,0,1,128,128Z"/>
    <path className="cls-2" d="M384,160a32,32,0,0,1,32,32V416a0,0,0,0,1,0,0H160a0,0,0,0,1,0,0V192A32,32,0,0,1,192,160Z"/>
    <rect className="cls-3" x="192" y="320" width="32" height="64" rx="16"/>
    <rect className="cls-4" x="256" y="256" width="32" height="128" rx="16"/>
    <rect className="cls-3" x="320" y="288" width="32" height="96" rx="16"/>
    <path className="cls-5" d="M128,96H32a32,32,0,0,0-32,32V416a32,32,0,0,0,32,32h96a32,32,0,0,0,32-32V128A32,32,0,0,0,128,96Z"/>
    <path className="cls-2" d="M96,96a32,32,0,0,1,32,32V416a0,0,0,0,1,0,0H32a0,0,0,0,1,0,0V128A32,32,0,0,1,64,96Z"/>
    <path className="cls-5" d="M128,128H32a0,0,0,0,0,0,0V416a0,0,0,0,0,0,0h96a0,0,0,0,0,0,0V128A0,0,0,0,0,128,128Z"/>
    <path d="M416,64H32A32,32,0,0,0,0,96V416a32,32,0,0,0,32,32H416a32,32,0,0,0,32-32V96A32,32,0,0,0,416,64Zm0,352H32V96H416Z"/>
  </svg>
);

const Login: React.FC = () => {
  const { login, isLoading, error } = useAuth();

  const onFinish = async (values: { email: string; password: string }) => {
    await login(values);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
        when: 'beforeChildren',
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };
  
  const formVariants: Variants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 }
  }

  return (
    <motion.div 
      className="login-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div 
        className="login-container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="illustration-panel" variants={itemVariants}>
          <Illustration />
        </motion.div>
        <motion.div className="form-panel" variants={formVariants}>
          <div style={{ marginBottom: '32px' }}>
            <Title level={2}>Inventory System</Title>
            <Text type="secondary">Welcome back! Please sign in to continue.</Text>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginBottom: '24px' }}
            />
          )}

          <Form name="login" onFinish={onFinish} layout="vertical" size="large">
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please input your email.' },
                { type: 'email', message: 'Please enter a valid email.' }
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="email@example.com" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please input your password.' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Password" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isLoading} style={{ width: '100%', fontWeight: 'bold' }}>
                Sign In
              </Button>
            </Form.Item>
          </Form>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Login; 